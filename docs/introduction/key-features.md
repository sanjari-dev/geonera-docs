---
title: Key Features
sidebar_label: Key Features
description: Comprehensive feature list of the Geonera AI-driven trading system with descriptions of each capability.
---

## Purpose

This page catalogs every major capability of Geonera. It serves as a feature reference for engineers evaluating the system, onboarding to a specific component, or planning integration work.

## Overview

Geonera combines real-time market data processing, AI-based forecasting, and automated trade execution into a single cohesive system. Features span the full trading lifecycle: data acquisition, feature engineering, model inference, signal evaluation, risk control, and order management.

Each feature below is implemented as a production capability — not a planned or experimental feature. Where a feature depends on external services (Vertex AI, Dukascopy, BigQuery), the dependency is noted.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Feature requests | Product decisions | Engineering / trading team | New capabilities to add to the system |
| Performance feedback | Analytics | BigQuery post-trade tables | Which features are delivering value |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Documented feature set | This page | Engineers and operators | Reference for system capabilities |

## Rules

- A feature is only listed here once it is implemented and deployed to production or staging.
- Each feature must have a corresponding unit or integration test.
- Experimental features are tracked in GitHub Issues and not listed here until promoted.

## Flow

Features are grouped by domain. Click through to each section's documentation for implementation details.

## Example

### Data Acquisition

| Feature | Description | Tech |
|---------|-------------|------|
| Live tick streaming | Real-time bid/ask tick feed from Dukascopy JForex | Java, RabbitMQ |
| Historical data import | Bulk OHLCV import from Dukascopy historical API into BigQuery | Python |
| Multi-symbol support | Simultaneous processing of EURUSD, GBPUSD, XAUUSD, USDJPY | Rust |
| Tick normalization | Timestamp alignment, spread validation, duplicate filtering | Rust |
| Feed health monitoring | Detects stale feed and triggers reconnect within 5 seconds | C# |

### Data Processing

| Feature | Description | Tech |
|---------|-------------|------|
| M1 candle aggregation | Assembles OHLCV candles from raw ticks with microsecond precision | Rust |
| Multi-timeframe aggregation | M1 → M5 → M15 → H1 → H4 → D1 cascade aggregation | Rust |
| RSI computation | Wilder's RSI with configurable period (default: 14) | C# |
| EMA computation | Exponential Moving Average with configurable period | C# |
| ATR computation | Average True Range for volatility-based SL/TP | C# |
| Bollinger Bands | Upper/lower bands with configurable sigma | C# |
| Indicator caching | Computed indicators stored in Redis for fast feature assembly | C# |

### AI & Forecasting

| Feature | Description | Tech |
|---------|-------------|------|
| TFT model inference | Temporal Fusion Transformer for multi-horizon price direction | Python, Vertex AI |
| Confidence scoring | Per-prediction confidence score (0.0–1.0) used as signal filter | Python |
| Multi-horizon prediction | Simultaneous 1-min, 5-min, 15-min forecasts per symbol | Vertex AI |
| Feature store | Structured feature vectors stored in BigQuery for training and inference | Python, BigQuery |
| Model versioning | Each deployed model has a unique version ID logged with every prediction | Vertex AI |
| Shadow testing | New model versions run in parallel without affecting live trades | Python |

### Trading Engine

| Feature | Description | Tech |
|---------|-------------|------|
| Signal generation | Converts AI predictions to directional signals (LONG/SHORT/FLAT) | C# |
| Multi-timeframe confluence | Signal only activates when M1, M15, H1 agree on direction | C# |
| ATR-based SL/TP | Stop-loss = entry ± 1.5×ATR; take-profit = entry ± 2.5×ATR | C# |
| Signal filtering | Confidence threshold (default: 0.70) gates signal generation | C# |
| Duplicate signal suppression | Prevents duplicate orders when same signal fires within cooldown window | C# |

### Risk Management

| Feature | Description | Tech |
|---------|-------------|------|
| Per-symbol position limit | Maximum lot size per symbol configurable independently | C# |
| Portfolio exposure limit | Total open exposure capped at configurable % of account equity | C# |
| Max drawdown circuit breaker | Halts new orders if portfolio drawdown exceeds threshold (default: 10%) | C# |
| Kelly-based position sizing | Position size computed from prediction confidence and historical win rate | C# |
| Volatility-adjusted sizing | Position size reduced during high-ATR regimes | C# |

### Order Execution

| Feature | Description | Tech |
|---------|-------------|------|
| Market order submission | Submits instant market orders via JForex API | Java |
| SL/TP attachment | Stop-loss and take-profit set at order creation | Java |
| Order state tracking | Pending → Filled → Closed lifecycle tracked in PostgreSQL | C# |
| Partial fill handling | Handles partial fills and adjusts tracking accordingly | Java, C# |
| Manual override | Operators can halt execution per symbol or globally via REST API | C# |

### Observability

| Feature | Description | Tech |
|---------|-------------|------|
| Structured logging | JSON logs with correlation IDs across all services | C#, Python, Rust |
| Distributed tracing | OpenTelemetry trace IDs link tick → candle → prediction → order | All services |
| BigQuery analytics | All events streamed to BigQuery for post-trade analysis | Python |
| Alerting | PagerDuty integration for service health and drawdown breaches | Infrastructure |
| Dashboard | Grafana dashboards for tick latency, signal rate, equity curve | Grafana, BigQuery |
