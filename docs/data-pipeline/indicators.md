---
title: Indicators
sidebar_label: Indicators
description: Technical indicator computation in the C# IndicatorService — RSI, EMA, ATR, Bollinger Bands.
---

## Purpose

The IndicatorService computes technical indicators on closed candles and caches results in Redis for fast retrieval by the FeaturePipeline. Indicators are the primary derived features used by the AI model.

## Overview

IndicatorService is a C# (.NET 8) service that consumes `candles.closed.*` events and computes a fixed set of indicators for each candle. Results are stored in Redis with a TTL of 24 hours and also published to RabbitMQ for downstream consumers. All indicator computation is stateful — lookback windows require the N previous candles to compute correctly, retrieved from Redis.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Closed candle | RabbitMQ `candles.closed.*` | CandleEngine | OHLCV candle per symbol per timeframe |
| Historical candles | Redis cache | IndicatorService itself | Previous N candles for lookback computation |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Indicator record | RabbitMQ `indicators.computed.*` | FeaturePipeline | RSI, EMA, ATR, BB per candle |
| Indicator cache | Redis `indicators:{symbol}:{timeframe}` | FeaturePipeline | Latest indicator values for fast retrieval |

## Rules

- RSI period: 14 (configurable). Requires 14 prior closes to compute.
- EMA periods: 20, 50 (configurable). Warm-up period = EMA period.
- ATR period: 14. Requires 14 prior candles.
- Bollinger Bands: 20-period SMA ± 2 standard deviations (configurable sigma).
- If fewer than the required lookback candles exist, the indicator value is `null` — it is never extrapolated.
- Indicators are computed per timeframe independently (M1 RSI is separate from H1 RSI).

## Flow

1. Consume `candles.closed.{symbol}` from `candles.closed.indicator-service` queue.
2. Retrieve last N candles for the symbol/timeframe from Redis.
3. Append the new candle to the lookback window.
4. Compute RSI(14), EMA(20), EMA(50), ATR(14), Bollinger Bands(20).
5. Store updated indicator values in Redis.
6. Publish `IndicatorRecord` to `indicators.exchange`.
7. ACK the candle message.

## Example

```csharp
// IndicatorService/Computation/IndicatorComputer.cs
public class IndicatorComputer : IIndicatorComputer
{
    public IndicatorRecord Compute(IReadOnlyList<Candle> candles)
    {
        var latest = candles[^1];
        var closes = candles.Select(c => c.Close).ToArray();
        var highs  = candles.Select(c => c.High).ToArray();
        var lows   = candles.Select(c => c.Low).ToArray();

        return new IndicatorRecord
        {
            Symbol    = latest.Symbol,
            Timeframe = latest.Timeframe,
            Timestamp = latest.CloseTime,
            Rsi14     = ComputeRsi(closes, period: 14),
            Ema20     = ComputeEma(closes, period: 20),
            Ema50     = ComputeEma(closes, period: 50),
            Atr14     = ComputeAtr(highs, lows, closes, period: 14),
            BbUpper   = ComputeBbUpper(closes, period: 20, sigma: 2.0),
            BbMiddle  = ComputeSma(closes, period: 20),
            BbLower   = ComputeBbLower(closes, period: 20, sigma: 2.0),
        };
    }

    private double? ComputeRsi(double[] closes, int period)
    {
        if (closes.Length < period + 1) return null;

        double avgGain = 0, avgLoss = 0;
        for (int i = closes.Length - period; i < closes.Length; i++)
        {
            double change = closes[i] - closes[i - 1];
            if (change > 0) avgGain += change;
            else avgLoss += Math.Abs(change);
        }
        avgGain /= period;
        avgLoss /= period;

        if (avgLoss == 0) return 100.0;
        double rs = avgGain / avgLoss;
        return 100.0 - (100.0 / (1.0 + rs));
    }

    private double? ComputeEma(double[] closes, int period)
    {
        if (closes.Length < period) return null;

        double multiplier = 2.0 / (period + 1);
        double ema = closes.Take(period).Average();

        for (int i = period; i < closes.Length; i++)
            ema = (closes[i] - ema) * multiplier + ema;

        return ema;
    }

    private double? ComputeAtr(double[] highs, double[] lows, double[] closes, int period)
    {
        if (closes.Length < period + 1) return null;

        var trValues = new double[closes.Length - 1];
        for (int i = 1; i < closes.Length; i++)
        {
            double tr = Math.Max(highs[i] - lows[i],
                        Math.Max(Math.Abs(highs[i] - closes[i - 1]),
                                 Math.Abs(lows[i]  - closes[i - 1])));
            trValues[i - 1] = tr;
        }
        return trValues.TakeLast(period).Average();
    }
}
```
