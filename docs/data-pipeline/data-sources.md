---
title: Data Sources
sidebar_label: Data Sources
description: Dukascopy tick feed, historical OHLCV data, and external data sources used by Geonera.
---

## Purpose

This page documents every data source Geonera consumes — the live tick feed, historical candle data for training, and how each source is connected, authenticated, and monitored for health.

## Overview

Geonera has two primary market data sources: the **live Dukascopy JForex tick stream** for real-time processing, and the **Dukascopy historical API** for bulk OHLCV backfill used in model training. Both are accessed through the JForex Java client — the single gateway to Dukascopy's network.

The live feed delivers bid/ask ticks for each configured symbol over a persistent TCP connection managed by the JForex SDK. The connection auto-reconnects with exponential backoff on failure. Historical data is fetched via JForex's `IHistory` interface and bulk-inserted into BigQuery for training and feature store backfill.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| JForex credentials | Environment secrets | Dukascopy | Username, password, and server URL |
| Symbol list | YAML config | Config service | Instruments to subscribe (EURUSD, XAUUSD, etc.) |
| Timeframe config | YAML config | Config service | Which timeframes to aggregate (M1 through D1) |
| Backfill range | Job parameter | Backfill job | Start and end date for historical fetch |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Raw ticks | RabbitMQ `ticks.raw` | TickProcessor | Live bid/ask with timestamp |
| Historical candles | BigQuery `geonera.candles` | Training pipeline | OHLCV rows per symbol/timeframe |
| Feed health event | RabbitMQ `feed.health` | Monitoring | Connectivity and staleness status |

## Rules

- Only symbols in the configured symbol registry are subscribed.
- If no tick is received for a symbol within 10 seconds during market hours, a stale feed alert is raised.
- Historical backfill must not run during live trading hours (Mon 00:00 – Fri 22:00 UTC).
- Duplicate ticks (same symbol + timestamp) are filtered by TickProcessor, not JForexClient.
- The JForex connection must reconnect within 30 seconds. After 3 failed attempts, a PagerDuty alert fires.

## Flow

1. JForexClient authenticates to Dukascopy using credentials from environment variables.
2. For each symbol in the registry, `subscribeFeedData()` is called.
3. Each tick arrives on `onTick()` callback — immediately serialized and published to `ticks.exchange`.
4. A watchdog timer checks per-symbol tick frequency every 10 seconds.
5. On disconnect, `onConnectionLost()` fires — client retries with exponential backoff.

## Example

```java
// GeoneraTradingStrategy.java
public class GeoneraTradingStrategy implements IStrategy {

    @Override
    public void onStart(IContext context) throws JFException {
        List<String> symbols = SymbolConfig.getConfiguredSymbols();
        for (String symbolName : symbols) {
            Instrument instrument = Instrument.fromString(symbolName);
            context.setSubscribedInstruments(Set.of(instrument), true);
            log.info("Subscribed to {}", symbolName);
        }
    }

    @Override
    public void onTick(Instrument instrument, ITick tick) throws JFException {
        RawTick rawTick = RawTick.builder()
            .symbol(instrument.name())
            .bid(tick.getBid())
            .ask(tick.getAsk())
            .volume(tick.getBidVolume() + tick.getAskVolume())
            .timestamp(tick.getTime())
            .build();
        rabbitPublisher.publish("ticks.exchange", "ticks.raw", rawTick);
    }

    @Override
    public void onConnectionLost() {
        log.warn("JForex connection lost — scheduling reconnect");
        scheduler.schedule(this::reconnect, 5, TimeUnit.SECONDS);
    }
}
```
