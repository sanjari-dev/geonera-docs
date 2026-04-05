---
title: Validation
sidebar_label: Validation
description: Model validation, prediction accuracy tracking, and A/B testing methodology in Geonera.
---

## Purpose

This page defines how Geonera continuously validates that the AI model and trading strategy are performing as expected in production — and how degradation is detected and responded to.

## Overview

Validation in Geonera operates at two levels: **model validation** (is the AI predicting direction accurately?) and **strategy validation** (are profitable trades being generated?). Both are measured continuously against live production data using BigQuery analytics.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Prediction log | BigQuery `geonera.predictions` | AIPredictor | All predictions with model version and confidence |
| Trade log | BigQuery `geonera.trades` | TradeTracker | Closed trades with PnL and exit reason |
| Market data | BigQuery `geonera.candles` | CandleEngine | OHLCV for labeling prediction correctness |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Accuracy metrics | BigQuery `geonera.model_metrics` | Dashboard | Daily directional accuracy per model version |
| Strategy metrics | BigQuery `geonera.strategy_metrics` | Dashboard | Daily win rate, Sharpe, drawdown |
| Retraining trigger | PagerDuty alert | ML engineer | When accuracy drops below threshold |

## Rules

- Directional accuracy is computed daily for each symbol and model version.
- A prediction is "correct" if the price moved in the predicted direction within the prediction horizon.
- If 7-day rolling directional accuracy drops below 52%, a retraining trigger is fired.
- A/B testing runs shadow model alongside live model — shadow model never executes trades.
- Shadow model is promoted if it outperforms live model on accuracy AND Sharpe ratio over 48 hours.

## Flow

1. At end of each 5-minute window, query BigQuery for predictions made 5 minutes ago.
2. Compare predicted direction to actual price movement using `geonera.candles`.
3. Label each prediction as correct or incorrect.
4. Compute rolling 7-day accuracy per model version and symbol.
5. If accuracy < 52%: fire PagerDuty alert and publish retraining event.
6. Strategy metrics are computed nightly from `geonera.trades`.

## Example

```python
# validation/accuracy_tracker.py
from google.cloud import bigquery

BQ = bigquery.Client()

ACCURACY_QUERY = """
WITH labeled AS (
    SELECT
        p.prediction_id,
        p.symbol,
        p.model_version,
        p.primary_direction,
        p.primary_confidence,
        p.predicted_at,
        CASE
            WHEN p.primary_direction = 'LONG'
             AND c.close > c.open THEN TRUE
            WHEN p.primary_direction = 'SHORT'
             AND c.close < c.open THEN TRUE
            ELSE FALSE
        END AS is_correct
    FROM `geonera.predictions` p
    JOIN `geonera.candles` c
        ON p.symbol = c.symbol
        AND c.timeframe = 'M5'
        AND c.open_time = TIMESTAMP_TRUNC(p.predicted_at, MINUTE)
    WHERE p.predicted_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
      AND p.suppressed = FALSE
)
SELECT
    symbol,
    model_version,
    COUNT(*) AS total_predictions,
    COUNTIF(is_correct) AS correct_predictions,
    ROUND(COUNTIF(is_correct) / COUNT(*), 4) AS directional_accuracy,
    AVG(primary_confidence) AS avg_confidence
FROM labeled
GROUP BY symbol, model_version
ORDER BY directional_accuracy DESC
"""

def check_accuracy_and_alert():
    rows = list(BQ.query(ACCURACY_QUERY).result())
    for row in rows:
        print(f"{row.symbol} {row.model_version}: "
              f"{row.directional_accuracy:.1%} accuracy "
              f"({row.total_predictions} predictions)")

        if row.directional_accuracy < 0.52:
            send_pagerduty_alert(
                title=f"Model accuracy degraded: {row.symbol} {row.model_version}",
                body=f"7-day accuracy: {row.directional_accuracy:.1%} (threshold: 52%)",
                severity="high"
            )

if __name__ == "__main__":
    check_accuracy_and_alert()
```
