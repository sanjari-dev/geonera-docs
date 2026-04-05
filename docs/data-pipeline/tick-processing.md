---
title: Tick Processing
sidebar_label: Tick Processing
description: Real-time tick ingestion, normalization, deduplication, and validation in the Rust TickProcessor service.
---

## Purpose

The TickProcessor transforms raw, unvalidated ticks from JForex into clean, normalized tick records ready for candle aggregation. It is the first quality gate in the data pipeline.

## Overview

TickProcessor is a Rust service consuming messages from the `ticks.raw` queue. It runs as a high-throughput pipeline capable of processing over 10,000 ticks per second per symbol. The service performs three operations on each tick: **validation** (reject malformed or stale ticks), **normalization** (add mid-price, spread, standardized timestamp), and **deduplication** (discard ticks with a timestamp already seen within the last 1 second).

Rust is used here for its zero-cost abstractions and predictable latency. The service uses async I/O via Tokio and a Bloom filter for deduplication.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Raw tick message | RabbitMQ `ticks.raw` | JForexClient | Bid, ask, volume, symbol, timestamp (epoch ms) |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Normalized tick | RabbitMQ `ticks.normalized` | CandleEngine | Validated tick with mid, spread, UTC timestamp |
| Dropped tick log | Structured log | Log aggregator | Reason for rejection (stale, duplicate, invalid) |

## Rules

- Ticks with `bid <= 0` or `ask <= 0` are rejected.
- Ticks with `ask < bid` (negative spread) are rejected.
- Ticks older than 5 seconds relative to system clock are rejected as stale.
- Duplicate ticks (same symbol + same millisecond timestamp) are discarded using a Bloom filter.
- Spread greater than 500 pips triggers a warning log but does not reject the tick.
- Processing must complete within 2ms per tick (p99).

## Flow

1. Consume message from `ticks.raw.tick-processor` queue.
2. Deserialize JSON payload into `RawTick` struct.
3. Validate: check bid/ask > 0, ask >= bid, timestamp within 5s of now.
4. Deduplication: check Bloom filter for `symbol:timestamp` key.
5. Normalize: compute `mid = (bid + ask) / 2`, `spread = ask - bid`, convert timestamp to RFC3339.
6. Publish `NormalizedTick` to `ticks.exchange` with routing key `ticks.normalized`.
7. ACK the original message.

## Example

```rust
// tick_processor/src/processor.rs
use chrono::{DateTime, Utc, Duration};
use bloomfilter::Bloom;

#[derive(Debug, serde::Deserialize)]
pub struct RawTick {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub volume: f64,
    pub timestamp: i64, // epoch milliseconds
}

#[derive(Debug, serde::Serialize)]
pub struct NormalizedTick {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub mid: f64,
    pub spread: f64,
    pub volume: f64,
    pub utc_timestamp: DateTime<Utc>,
    pub source: String,
}

pub struct TickProcessor {
    bloom: Bloom<String>,
    max_staleness_secs: i64,
}

impl TickProcessor {
    pub fn process(&mut self, raw: RawTick) -> Result<NormalizedTick, &'static str> {
        // Validate prices
        if raw.bid <= 0.0 || raw.ask <= 0.0 {
            return Err("invalid_price");
        }
        if raw.ask < raw.bid {
            return Err("negative_spread");
        }

        // Validate staleness
        let tick_time = DateTime::<Utc>::from_timestamp_millis(raw.timestamp)
            .ok_or("invalid_timestamp")?;
        let age = Utc::now() - tick_time;
        if age > Duration::seconds(self.max_staleness_secs) {
            return Err("stale_tick");
        }

        // Deduplication
        let dedup_key = format!("{}:{}", raw.symbol, raw.timestamp);
        if self.bloom.check(&dedup_key) {
            return Err("duplicate_tick");
        }
        self.bloom.set(&dedup_key);

        Ok(NormalizedTick {
            mid: (raw.bid + raw.ask) / 2.0,
            spread: raw.ask - raw.bid,
            utc_timestamp: tick_time,
            source: "dukascopy".to_string(),
            symbol: raw.symbol,
            bid: raw.bid,
            ask: raw.ask,
            volume: raw.volume,
        })
    }
}
```
