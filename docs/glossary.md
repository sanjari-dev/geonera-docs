---
title: Glossary
sidebar_label: Glossary
description: Trading, AI, and system terminology in Geonera.
---

## Purpose
Defines every domain-specific term used in Geonera documentation.

## Overview
Terms grouped by domain, listed alphabetically.

## Inputs
Not applicable.

## Outputs
Not applicable.

## Rules
- Terms defined as used within Geonera specifically.

## Flow
Not applicable.

## Example
See definitions below.

---

## Trading Terms

**Ask** - Price at which the broker sells. A buyer pays the ask.

**ATR (Average True Range)** - Volatility measure over N periods (default: 14). Geonera: SL = entry +/- 1.5xATR, TP = entry +/- 2.5xATR.

**Bid** - Price at which the broker buys. A seller receives the bid.

**Bollinger Bands** - Upper/lower bands at N standard deviations around a moving average. Geonera: 20-period SMA +/- 2 sigma.

**Candle / OHLCV** - Price bar with Open, High, Low, Close, Volume for a fixed time period.

**Circuit Breaker** - Automatic trading halt when drawdown exceeds threshold. Requires manual operator reset.

**Confluence** - Agreement across M1, M15, H1 predictions required before signal generation.

**Contract Size** - Units per standard lot. Forex: 100,000 units. XAUUSD: 100 troy ounces.

**Drawdown** - (peak - current) / peak x 100.

**EMA (Exponential Moving Average)** - Moving average weighting recent data more. Geonera: EMA(20) and EMA(50).

**Entry Price** - Price at which a trade opens. Market orders fill at ask (LONG) or bid (SHORT).

**Equity** - Total account value including unrealized PnL.

**JForex** - Dukascopy Java trading platform used as Geonera broker integration layer.

**Kelly Criterion** - Position sizing formula capped at 0.25 in Geonera.

**Lot Size** - Trade volume. Standard lot = 100,000 units. Minimum: 0.01 lots.

**M1, M5, M15, H1, H4, D1** - Timeframe codes. M=minutes, H=hours, D=days.

**Market Order** - Immediate execution at current price. Only order type used by Geonera.

**Mid Price** - (bid + ask) / 2. Used for tick normalization.

**PnL** - Profit and Loss of a closed trade.

**Position** - Open trade in a symbol. One allowed per symbol at a time.

**RSI (Relative Strength Index)** - Momentum oscillator 0-100. Geonera: RSI(14) Wilder method.

**Sharpe Ratio** - mean(PnL) / std(PnL). Minimum target: 1.0.

**Signal** - Trade instruction (LONG/SHORT/FLAT) with entry, SL, TP, lot size, confidence.

**Slippage** - Difference between expected and actual fill price.

**Spread** - ask - bid. Broker transaction cost.

**Stop-Loss (SL)** - Price at which a losing trade closes automatically.

**Take-Profit (TP)** - Price at which a winning trade closes automatically.

**Tick** - Single bid/ask quote at a millisecond timestamp from the broker.

**Win Rate** - wins / totalTrades.

**XAUUSD** - Gold in US Dollars. 1 lot = 100 troy ounces.

---

## AI and ML Terms

**BigQuery** - Google serverless data warehouse. Geonera feature store, prediction log, trade event database.

**Confidence Score** - Model output (0.0-1.0) for directional certainty. Derived from quantile interval width.

**Feature Engineering** - Transforming raw OHLCV and indicators into normalized input tensors.

**Feature Store** - geonera.feature_log BigQuery table of precomputed model features.

**Horizon** - Future period for prediction. Geonera: 1-min, 5-min, 15-min.

**Hyperparameter Tuning** - Searching optimal training params via Vertex AI Vizier (50 trials max).

**Lookback Window** - Historical timesteps fed to model. Default: 60 M1 candles.

**Quantile Prediction** - Model outputs for 10th, 50th, 90th percentiles of distribution.

**Shadow Testing** - Running new model in parallel without affecting live trades. Min 48h before promotion.

**TFT (Temporal Fusion Transformer)** - Deep learning architecture for multi-horizon time series forecasting.

**Vertex AI** - Google Cloud ML platform hosting Geonera TFT endpoints and training jobs.

**Walk-Forward Validation** - Backtesting with rolling train/test windows simulating real deployment.

**Z-Score Normalization** - (value - mean) / std. Applied to all continuous features before model input.

---

## System Terms

**ACK** - RabbitMQ acknowledgment confirming successful message processing.

**Consumer** - Service reading messages from a RabbitMQ queue.

**Dead Letter Queue (DLQ)** - Receives failed messages. Every queue has a .dlq counterpart.

**Exchange** - RabbitMQ routing component distributing messages via routing key patterns.

**Idempotency** - Processing a message multiple times produces the same result. Required for all consumers.

**NACK** - Negative acknowledgment. With requeue=false routes message to DLQ.

**OpenTelemetry** - Observability framework for distributed traces and metrics across all services.

**Producer** - Service publishing messages to a RabbitMQ exchange.

**Routing Key** - String routing messages to matching queues (e.g., candles.closed.m1).

**StatefulSet** - Kubernetes workload for stateful apps (RabbitMQ, Redis) with stable identities.

**TTL (Time-to-Live)** - Max message/cache lifetime. RabbitMQ messages: 60s. Redis indicator cache: 24h.
