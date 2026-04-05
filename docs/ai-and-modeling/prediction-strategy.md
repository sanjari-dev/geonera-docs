---
title: Prediction Strategy
sidebar_label: Prediction Strategy
description: How Geonera generates, scores, filters, and routes AI predictions to the trading signal pipeline.
---

## Purpose

This page defines the rules that govern how raw TFT model outputs are interpreted, filtered, and forwarded as actionable predictions. Not every model output becomes a signal — the prediction strategy determines which predictions are worth acting on.

## Overview

The AIPredictor service calls the Vertex AI TFT endpoint and receives quantile predictions for three horizons (1-min, 5-min, 15-min). It then applies a confidence filter, selects the primary horizon, and publishes a structured prediction event to RabbitMQ. Low-confidence predictions are logged to BigQuery for model evaluation but are not forwarded to SignalGenerator.

Multi-horizon predictions are evaluated independently. A prediction is only forwarded if at least one horizon meets the minimum confidence threshold. The SignalGenerator layer applies additional confluence logic (requiring multiple timeframes to agree) before generating a trade signal.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Raw TFT output | Vertex AI response | AIPredictor | Quantile predictions per horizon |
| Confidence threshold | Config | Environment variable | Minimum confidence to forward (default: 0.60) |
| Symbol config | YAML | Config service | Per-symbol prediction horizon preferences |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Prediction event | RabbitMQ `predictions.ready` | SignalGenerator | Filtered prediction with direction + confidence per horizon |
| Prediction log | BigQuery `geonera.predictions` | Analytics | All predictions including suppressed ones |

## Rules

- A prediction is forwarded only if at least one horizon has confidence >= 0.60.
- The primary horizon for signal generation is 5-min (configurable per symbol).
- If the 5-min horizon direction is FLAT, the prediction is suppressed regardless of confidence.
- Predictions are deduplicated: if the same direction is predicted for the same symbol within 30 seconds, the duplicate is dropped.
- All predictions (including suppressed) are logged to BigQuery with reason code.
- Model version ID is included in every prediction event for traceability.

## Flow

1. Receive assembled feature tensor from FeaturePipeline.
2. Call Vertex AI endpoint for the configured model version.
3. Parse quantile outputs into direction + confidence per horizon.
4. Apply confidence filter — drop horizons below threshold.
5. Apply FLAT suppression — if primary horizon is FLAT, suppress the entire prediction.
6. Apply deduplication check using Redis TTL key `pred:{symbol}:{direction}`.
7. Publish filtered prediction to `predictions.exchange`.
8. Log full prediction (including suppressed) to BigQuery.

## Example

```python
# ai_predictor/prediction_strategy.py
import redis
import structlog
from dataclasses import dataclass
from typing import Optional

log = structlog.get_logger()
redis_client = redis.Redis()

CONFIDENCE_THRESHOLD = 0.60
DEDUP_TTL_SECONDS = 30
PRIMARY_HORIZON_MINUTES = 5

@dataclass
class HorizonPrediction:
    minutes: int
    direction: str  # LONG | SHORT | FLAT
    confidence: float

@dataclass
class PredictionEvent:
    symbol: str
    model_version: str
    horizons: list[HorizonPrediction]
    primary_direction: str
    primary_confidence: float
    suppressed: bool
    suppress_reason: Optional[str]

def process_prediction(symbol: str, model_version: str, raw_horizons: list) -> PredictionEvent:
    horizons = [
        HorizonPrediction(
            minutes=h["minutes"],
            direction=h["direction"],
            confidence=h["confidence"]
        )
        for h in raw_horizons
    ]

    # Apply confidence filter
    passing = [h for h in horizons if h.confidence >= CONFIDENCE_THRESHOLD]
    if not passing:
        return PredictionEvent(
            symbol=symbol, model_version=model_version,
            horizons=horizons, primary_direction="FLAT",
            primary_confidence=0.0, suppressed=True,
            suppress_reason="all_horizons_below_threshold"
        )

    # Find primary horizon
    primary = next(
        (h for h in horizons if h.minutes == PRIMARY_HORIZON_MINUTES),
        horizons[0]
    )

    # FLAT suppression
    if primary.direction == "FLAT":
        return PredictionEvent(
            symbol=symbol, model_version=model_version,
            horizons=horizons, primary_direction="FLAT",
            primary_confidence=primary.confidence, suppressed=True,
            suppress_reason="primary_horizon_flat"
        )

    # Deduplication check
    dedup_key = f"pred:{symbol}:{primary.direction}"
    if redis_client.exists(dedup_key):
        log.info("prediction_deduplicated", symbol=symbol, direction=primary.direction)
        return PredictionEvent(
            symbol=symbol, model_version=model_version,
            horizons=horizons, primary_direction=primary.direction,
            primary_confidence=primary.confidence, suppressed=True,
            suppress_reason="duplicate_within_cooldown"
        )

    redis_client.setex(dedup_key, DEDUP_TTL_SECONDS, "1")

    return PredictionEvent(
        symbol=symbol, model_version=model_version,
        horizons=horizons, primary_direction=primary.direction,
        primary_confidence=primary.confidence,
        suppressed=False, suppress_reason=None
    )
```
