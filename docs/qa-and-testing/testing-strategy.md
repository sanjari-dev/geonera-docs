---
title: Testing Strategy
sidebar_label: Testing Strategy
description: Unit, integration, and end-to-end testing approach across C#, Python, and Rust in Geonera.
---

## Purpose

This page defines the testing philosophy, coverage expectations, and tooling used to validate each layer of the Geonera system across all three primary languages.

## Overview

Geonera uses a three-tier testing strategy: **unit tests** (isolated logic, no I/O), **integration tests** (real RabbitMQ and Redis via testcontainers), and **end-to-end tests** (full pipeline against a sandboxed Dukascopy demo account). Each language has its own tooling but the expectations are consistent.

The guiding principle: a test that relies on mocked infrastructure is only as good as the mock. Integration tests use real containers for RabbitMQ and Redis to catch contract mismatches that mocks would miss.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Source code | Git | Repository | Code under test |
| Test containers | Docker | Testcontainers library | Real RabbitMQ, Redis, PostgreSQL for integration tests |
| Dukascopy demo account | Credentials | CI secrets | For E2E trade execution tests |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Test results | JUnit/TRX XML | CI pipeline | Pass/fail counts per test suite |
| Coverage report | HTML/LCOV | CI artifacts | Line and branch coverage per service |

## Rules

- Unit test coverage must be >= 80% for all business logic classes.
- Integration tests must not use mocks for RabbitMQ, Redis, or PostgreSQL — use Testcontainers.
- No test may hardcode credentials or external URLs.
- Tests must be deterministic — flaky tests are treated as bugs and fixed before the next release.
- E2E tests run against Dukascopy demo account only, never live account.

## Flow

```
Unit Tests (per PR)
  → fast, isolated, no I/O
  → C#: xUnit, Rust: cargo test, Python: pytest

Integration Tests (per PR)
  → real RabbitMQ + Redis via Testcontainers
  → validates message contracts end-to-end within a service

E2E Tests (nightly on staging)
  → full pipeline on demo account
  → validates tick → candle → prediction → signal → order flow
```

## Example

### C# Unit Test (IndicatorComputer)

```csharp
// IndicatorService.Tests/IndicatorComputerTests.cs
public class IndicatorComputerTests
{
    private readonly IndicatorComputer _computer = new();

    [Fact]
    public void ComputeRsi_WithSufficientData_ReturnsExpectedValue()
    {
        var closes = Enumerable.Range(1, 15)
            .Select(i => i % 2 == 0 ? 100.0 + i : 100.0 - i)
            .ToArray();
        var candles = closes.Select(c => new Candle { Close = c }).ToList();

        var result = _computer.Compute(candles);

        Assert.NotNull(result.Rsi14);
        Assert.InRange(result.Rsi14!.Value, 0, 100);
    }

    [Fact]
    public void ComputeRsi_WithInsufficientData_ReturnsNull()
    {
        var candles = Enumerable.Range(1, 5)
            .Select(i => new Candle { Close = i * 10.0 }).ToList();

        var result = _computer.Compute(candles);

        Assert.Null(result.Rsi14);
    }
}
```

### Rust Unit Test (TickProcessor)

```rust
// tick_processor/src/processor.rs (tests module)
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn make_processor() -> TickProcessor {
        TickProcessor {
            bloom: Bloom::new_for_fp_rate(10000, 0.01),
            max_staleness_secs: 5,
        }
    }

    #[test]
    fn valid_tick_is_normalized() {
        let mut p = make_processor();
        let raw = RawTick {
            symbol: "XAUUSD".to_string(),
            bid: 2345.12, ask: 2345.45, volume: 1.0,
            timestamp: Utc::now().timestamp_millis(),
        };
        let result = p.process(raw);
        assert!(result.is_ok());
        let tick = result.unwrap();
        assert!((tick.mid - 2345.285).abs() < 0.001);
    }

    #[test]
    fn stale_tick_is_rejected() {
        let mut p = make_processor();
        let raw = RawTick {
            symbol: "EURUSD".to_string(),
            bid: 1.1000, ask: 1.1002, volume: 1.0,
            timestamp: Utc::now().timestamp_millis() - 10_000, // 10 seconds ago
        };
        assert_eq!(p.process(raw), Err("stale_tick"));
    }
}
```

### Python Integration Test (FeaturePipeline)

```python
# tests/integration/test_feature_pipeline.py
import pytest
from feature_pipeline.assembler import assemble_features
from unittest.mock import patch, MagicMock
import numpy as np

@pytest.fixture
def mock_bq_rows():
    return [
        MagicMock(
            open=2344.0, high=2345.5, low=2343.8, close=2345.1, volume=1200,
            rsi_14=58.3, ema_20=2344.1, ema_50=2341.8, atr_14=1.85,
            bb_upper=2347.2, bb_middle=2344.1, bb_lower=2341.0,
            hour_of_day=12, day_of_week=2, spread=0.33, returns_1=0.0003
        )
    ] * 60  # 60 identical rows for simplicity

def test_assemble_features_returns_correct_shape(mock_bq_rows):
    with patch("feature_pipeline.assembler.BQ_CLIENT") as mock_bq:
        mock_bq.query.return_value.result.return_value = mock_bq_rows
        with patch("feature_pipeline.assembler.load_feature_stats") as mock_stats:
            mock_stats.return_value = {k: {"mean": 0, "std": 1} for k in range(20)}
            tensor = assemble_features("XAUUSD", lookback=60)
    assert tensor.shape[0] == 60
    assert tensor.dtype == np.float32
```
