---
title: Feature Engineering
sidebar_label: Feature Engineering
description: Input features, normalization, windowing, and BigQuery feature store for the Geonera TFT model.
---

## Purpose

Feature engineering transforms raw indicator records into normalized tensors that the TFT model can consume. This page defines every feature, its computation, normalization method, and how the feature store is queried.

## Overview

The FeaturePipeline is a Python service that assembles feature tensors on-demand when an `indicators.computed` event arrives. It queries BigQuery for the last N closed candles per symbol per timeframe, joins indicator data, applies per-feature normalization, and sends the assembled tensor to AIPredictor.

Features are grouped into three categories: **price/candle features** (OHLCV and derived returns), **indicator features** (RSI, EMA, ATR, Bollinger Bands), and **time features** (hour of day, day of week encoded cyclically). Static covariates (symbol metadata) are passed separately.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Indicator event | RabbitMQ `indicators.computed.*` | IndicatorService | Trigger to assemble features for this candle |
| Historical candles + indicators | BigQuery query | `geonera.candles` + `geonera.indicators` | Lookback window of 60 M1 + 20 H1 records |
| Normalization stats | BigQuery `geonera.feature_stats` | Precomputed job | Per-feature mean and std for z-score normalization |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Feature tensor | Python dict (JSON) | AIPredictor | Shape [60, 24] normalized feature array |
| Feature snapshot | BigQuery `geonera.feature_log` | Analytics | Raw+normalized features for model audit |

## Rules

- All continuous features are z-score normalized using stats computed over the last 30 days of training data.
- Time features (hour, day-of-week) are encoded cyclically: `sin(2π × value / period)` and `cos(...)`.
- If any indicator value is `null` (insufficient lookback), the entire feature tensor is rejected and no prediction is made.
- The lookback window is always exactly 60 M1 candles. Partial windows are not used.
- Feature normalization stats are recomputed weekly and stored in BigQuery.

## Flow

1. Receive `indicators.computed` event for symbol `XAUUSD` timeframe `M1`.
2. Query BigQuery for last 60 closed M1 candles + indicators for XAUUSD.
3. Query BigQuery for last 20 closed H1 candles + indicators for XAUUSD.
4. Validate no null indicator values exist in the window.
5. Apply z-score normalization using precomputed stats.
6. Encode time features cyclically.
7. Assemble tensor of shape `[60, 24]`.
8. Send to AIPredictor with static covariates.

## Example

```python
# feature_pipeline/assembler.py
import numpy as np
from google.cloud import bigquery

BQ_CLIENT = bigquery.Client()

FEATURE_STATS_QUERY = """
    SELECT feature_name, mean, std
    FROM `geonera.feature_stats`
    WHERE symbol = @symbol AND computed_at = (
        SELECT MAX(computed_at) FROM `geonera.feature_stats`
        WHERE symbol = @symbol
    )
"""

LOOKBACK_QUERY = """
    SELECT
        c.open, c.high, c.low, c.close, c.volume,
        i.rsi_14, i.ema_20, i.ema_50, i.atr_14,
        i.bb_upper, i.bb_middle, i.bb_lower,
        EXTRACT(HOUR FROM c.close_time) AS hour_of_day,
        EXTRACT(DAYOFWEEK FROM c.close_time) AS day_of_week,
        c.ask - c.bid AS spread,
        (c.close - LAG(c.close) OVER (ORDER BY c.close_time)) / LAG(c.close) OVER (ORDER BY c.close_time) AS returns_1
    FROM `geonera.candles` c
    JOIN `geonera.indicators` i
        ON c.symbol = i.symbol AND c.close_time = i.timestamp AND c.timeframe = i.timeframe
    WHERE c.symbol = @symbol AND c.timeframe = @timeframe
    ORDER BY c.close_time DESC
    LIMIT @lookback
"""

def assemble_features(symbol: str, lookback: int = 60) -> np.ndarray:
    stats = load_feature_stats(symbol)

    job_config = bigquery.QueryJobConfig(query_parameters=[
        bigquery.ScalarQueryParameter("symbol", "STRING", symbol),
        bigquery.ScalarQueryParameter("timeframe", "STRING", "M1"),
        bigquery.ScalarQueryParameter("lookback", "INT64", lookback),
    ])
    rows = list(BQ_CLIENT.query(LOOKBACK_QUERY, job_config=job_config).result())
    rows.reverse()  # chronological order

    tensor = []
    for row in rows:
        features = [
            zscore(row.open,      stats["open"]),
            zscore(row.high,      stats["high"]),
            zscore(row.low,       stats["low"]),
            zscore(row.close,     stats["close"]),
            zscore(row.volume,    stats["volume"]),
            zscore(row.rsi_14,    stats["rsi_14"]),
            zscore(row.ema_20,    stats["ema_20"]),
            zscore(row.ema_50,    stats["ema_50"]),
            zscore(row.atr_14,    stats["atr_14"]),
            zscore(row.bb_upper,  stats["bb_upper"]),
            zscore(row.bb_middle, stats["bb_middle"]),
            zscore(row.bb_lower,  stats["bb_lower"]),
            np.sin(2 * np.pi * row.hour_of_day / 24),
            np.cos(2 * np.pi * row.hour_of_day / 24),
            np.sin(2 * np.pi * row.day_of_week / 7),
            np.cos(2 * np.pi * row.day_of_week / 7),
            zscore(row.spread,    stats["spread"]),
            zscore(row.returns_1, stats["returns_1"]),
        ]
        tensor.append(features)

    return np.array(tensor, dtype=np.float32)  # shape [60, 18]

def zscore(value: float, stat: dict) -> float:
    if stat["std"] == 0:
        return 0.0
    return (value - stat["mean"]) / stat["std"]
```
