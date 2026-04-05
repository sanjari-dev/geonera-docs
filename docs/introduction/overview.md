---
title: Overview
sidebar_label: Overview
description: What Geonera is, who it's for, and how the AI-driven trading system works at a high level.
---

## Purpose

Geonera exists to automate trading decisions in Forex and Gold (XAUUSD) markets using AI forecasting. It eliminates emotional and manual trading by replacing human discretion with a deterministic, data-driven pipeline — from raw tick ingestion to order execution.

## Overview

Geonera is a production-grade, AI-driven algorithmic trading system built on a microservices architecture. It is designed for quantitative traders, algorithmic trading firms, and fintech engineers who need a reliable, high-performance system capable of operating continuously in live Forex and commodity markets.

The system ingests real-time tick data from Dukascopy JForex, processes it through a high-performance Rust engine, aggregates ticks into OHLCV candles across multiple timeframes (M1 through D1), computes technical indicators, and feeds structured features into a Temporal Fusion Transformer (TFT) model hosted on Google Vertex AI. Predictions are evaluated by the Trading Engine, validated against risk rules, and submitted as orders back through JForex.

All services communicate asynchronously via RabbitMQ, ensuring no single service is a synchronous bottleneck. The backend is written in C# (.NET 8), the AI pipeline in Python, and the performance-critical data processing layer in Rust. The broker integration uses the Dukascopy JForex Java API.

Geonera is not a backtesting tool — it is a live trading system. Backtesting capabilities exist as a validation layer, not as the primary purpose.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Tick feed | Real-time stream | Dukascopy JForex | Bid/ask price and volume for each symbol |
| Historical candles | REST / BigQuery | Dukascopy historical API | OHLCV data for model training and backtest |
| AI predictions | JSON message | Vertex AI endpoint | Multi-horizon price direction and confidence |
| Risk configuration | YAML / environment | Config service | Position limits, drawdown thresholds, symbol rules |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Market orders | JForex API call | Dukascopy broker | Buy/sell orders with SL and TP |
| Candle records | RabbitMQ message | CandleEngine → downstream | Aggregated OHLCV candles per timeframe |
| Trade signals | RabbitMQ message | TradeExecutor | Directional signal with confidence score |
| Prediction logs | BigQuery rows | Analytics dataset | Model input features and output predictions |

## Rules

- The system only trades instruments explicitly configured in the symbol registry (default: EURUSD, GBPUSD, XAUUSD).
- No order is submitted unless it passes all risk rules in the RiskManager service.
- All services are stateless; state is persisted in external stores (PostgreSQL, Redis, BigQuery).
- The system must be capable of processing at least 10,000 ticks/second per symbol without dropping data.
- If the AI prediction service is unavailable, the system enters a safe mode and closes open positions within the configured grace period.

## Flow

1. **Tick Ingestion** — JForex Java client streams live ticks → publishes to RabbitMQ `ticks.raw` exchange.
2. **Tick Processing** — Rust service consumes ticks, normalizes, validates, and publishes to `ticks.normalized`.
3. **Candle Aggregation** — CandleEngine (Rust) builds OHLCV candles for each timeframe (M1, M5, M15, H1, H4, D1).
4. **Indicator Computation** — C# IndicatorService computes RSI, EMA, ATR, Bollinger Bands on closed candles.
5. **Feature Assembly** — Python feature pipeline queries BigQuery and assembles model input tensors.
6. **AI Prediction** — Vertex AI TFT model returns multi-horizon forecasts with confidence scores.
7. **Signal Generation** — C# TradingEngine evaluates predictions against multi-timeframe confluence rules.
8. **Risk Validation** — RiskManager checks position limits, drawdown, and symbol-level exposure.
9. **Order Execution** — TradeExecutor submits the order via JForex API with SL/TP calculated from ATR.
10. **Logging & Analytics** — All events are logged to BigQuery for post-trade analysis.

## Example

A typical end-to-end event for XAUUSD:

```
[12:00:00.001] Tick received:  XAUUSD  BID=2345.12  ASK=2345.45
[12:00:00.002] Tick normalized and published to ticks.normalized
[12:00:00.500] M1 candle closed: O=2344.80 H=2345.50 L=2344.20 C=2345.12 V=1420
[12:00:00.510] Indicators computed: RSI=58.3  EMA20=2344.10  ATR=1.85
[12:00:00.600] Features assembled and sent to Vertex AI
[12:00:00.750] Prediction: direction=LONG  confidence=0.81  horizon=5min
[12:00:00.760] Signal generated: BUY XAUUSD  SL=2343.50  TP=2347.00
[12:00:00.770] Risk check passed: exposure=1.2%  drawdown=3.1%
[12:00:00.800] Order submitted via JForex: ticket=10042381
```
