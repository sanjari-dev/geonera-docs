---
title: Service List
sidebar_label: Service List
description: Detailed description of each Geonera microservice with purpose, configuration, and key interfaces.
---

## Purpose

This page provides a deep-dive into each individual service — its sole responsibility, key configuration options, and health check behavior.

## Overview

Geonera runs 10 services. Each section covers what the service does, what it consumes and produces, and the key configuration environment variables.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Per-service config | Environment variables | Docker secrets | Credentials and runtime parameters |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Domain events | RabbitMQ | Downstream services | Results of processing |

## Rules

- Each service section describes one and only one service.
- All listed environment variables are mandatory unless marked optional.

## Flow

See [Service Communication](./service-communication) for the full message flow between services.

## Example

### JForexClient (Java 17)

Connects to Dukascopy broker, streams live ticks, submits orders on command.

| Env Variable | Description |
|---|---|
| `DUKASCOPY_USERNAME` | Dukascopy account username |
| `DUKASCOPY_PASSWORD` | Dukascopy account password |
| `DUKASCOPY_SERVER` | Server URL (live or demo) |
| `SYMBOLS` | Comma-separated symbol list |
| `RABBITMQ_URI` | RabbitMQ connection string |

### TickProcessor (Rust)

Validates, deduplicates, and normalizes raw ticks from JForexClient.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `MAX_STALENESS_SECS` | Reject ticks older than N seconds (default: 5) |
| `BLOOM_CAPACITY` | Bloom filter capacity (default: 100000) |

### CandleEngine (Rust)

Aggregates normalized ticks into OHLCV candles for M1 through D1.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `TIMEFRAMES` | Timeframes to aggregate (default: M1,M5,M15,H1,H4,D1) |
| `SYMBOLS` | Comma-separated symbol list |

### IndicatorService (C# .NET 8)

Computes RSI, EMA, ATR, Bollinger Bands on closed candles and caches in Redis.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `REDIS_CONNECTION` | Redis connection string |
| `RSI_PERIOD` | RSI lookback period (default: 14) |
| `ATR_PERIOD` | ATR lookback period (default: 14) |
| `BB_SIGMA` | Bollinger Band standard deviations (default: 2.0) |

### FeaturePipeline (Python 3.11)

Queries BigQuery for lookback window and assembles normalized feature tensors.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `BIGQUERY_DATASET` | BigQuery dataset (default: geonera) |
| `FEATURE_LOOKBACK_M1` | M1 candles in lookback (default: 60) |

### AIPredictor (Python 3.11)

Calls Vertex AI TFT endpoint, applies confidence filter, publishes predictions.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `VERTEX_ENDPOINT_XAUUSD` | Vertex AI endpoint ID for XAUUSD |
| `CONFIDENCE_THRESHOLD` | Min confidence to forward (default: 0.60) |
| `REDIS_CONNECTION` | Redis for prediction dedup |

### SignalGenerator (C# .NET 8)

Evaluates multi-timeframe confluence, computes SL/TP, generates trading signals.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `REDIS_CONNECTION` | Redis for confluence cache |
| `SL_ATR_MULTIPLIER` | Stop-loss ATR multiplier (default: 1.5) |
| `TP_ATR_MULTIPLIER` | Take-profit ATR multiplier (default: 2.5) |
| `SIGNAL_COOLDOWN_MINUTES` | Per-symbol cooldown (default: 5) |

### RiskManager (C# .NET 8)

Validates signals against all risk rules before approving for execution.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `REDIS_CONNECTION` | Redis for exposure tracking |
| `MAX_DRAWDOWN_PCT` | Drawdown circuit breaker (default: 10.0) |
| `MAX_EXPOSURE_PCT` | Max total exposure (default: 20.0) |
| `RISK_PER_TRADE_PCT` | Risk per trade as % of equity (default: 1.0) |

### TradeExecutor (C# .NET 8)

Submits approved signals as market orders via JForex gateway.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `SLIPPAGE_ALERT_PIPS` | Slippage alert threshold (default: 3) |

### TradeTracker (C# .NET 8)

Manages order state machine in PostgreSQL and streams trade events to BigQuery.

| Env Variable | Description |
|---|---|
| `RABBITMQ_URI` | RabbitMQ connection string |
| `POSTGRES_CONNECTION` | PostgreSQL connection string |
| `GOOGLE_CLOUD_PROJECT` | GCP project for BigQuery |
| `STUCK_ORDER_ALERT_SECONDS` | Alert threshold for stuck orders (default: 10) |
