---
title: Signal Generation
sidebar_label: Signal Generation
description: How Geonera converts AI predictions into trading signals using multi-timeframe confluence logic.
---

## Purpose

SignalGenerator converts AI predictions into structured trading signals with specific entry parameters, stop-loss, and take-profit levels. It is the bridge between AI forecasting and trade execution.

## Overview

The SignalGenerator is a C# service consuming `predictions.ready` events. A prediction alone is not sufficient to generate a signal — the service additionally checks multi-timeframe confluence (M1, M15, and H1 must agree on direction) before producing a signal. This confluence requirement filters out noise and low-quality setups.

Once confluence is confirmed, the signal is constructed with ATR-based stop-loss and take-profit levels, tagged with a unique signal ID, and published to `signals.exchange`. The signal then proceeds to RiskManager for validation.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Prediction event | RabbitMQ `predictions.ready` | AIPredictor | Direction + confidence per horizon |
| Current ATR | Redis | IndicatorService cache | ATR(14) for SL/TP calculation |
| Confluence cache | Redis | SignalGenerator itself | Last known prediction direction per timeframe |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Trading signal | RabbitMQ `signals.generated` | RiskManager | Direction, entry, SL, TP, confidence |

## Rules

- Confluence requires M1, M15, and H1 predictions to all show the same non-FLAT direction.
- If any timeframe shows FLAT or contradicts the primary direction, the signal is suppressed.
- Stop-loss = `entry_price ± 1.5 × ATR(14)` (negative for LONG, positive for SHORT).
- Take-profit = `entry_price ± 2.5 × ATR(14)`.
- A cooldown of 5 minutes is enforced per symbol — no new signal is generated while a signal for that symbol is awaiting execution or within the cooldown window.
- Signal confidence = minimum confidence across all confluent timeframes.
- Each signal is assigned a unique UUID (`signalId`) used for tracing through execution.

## Flow

1. Receive `predictions.ready` event for `XAUUSD M1`.
2. Store M1 prediction direction in Redis `confluence:XAUUSD:M1` with 10-minute TTL.
3. Check Redis for M15 and H1 directions for XAUUSD.
4. If all three match and are non-FLAT → confluence confirmed.
5. Retrieve current ATR(14) for XAUUSD M1 from Redis indicator cache.
6. Compute entry (current ask/bid), SL, and TP.
7. Check symbol cooldown — if active, suppress signal.
8. Publish signal to `signals.exchange` with routing key `signals.generated`.
9. Set cooldown key `cooldown:XAUUSD` in Redis with 5-minute TTL.

## Example

```csharp
// SignalGenerator/Services/SignalGeneratorService.cs
public class SignalGeneratorService : ISignalGeneratorService
{
    private readonly IRedisCache _cache;
    private readonly IRabbitMqPublisher _publisher;

    private const double SL_ATR_MULTIPLIER = 1.5;
    private const double TP_ATR_MULTIPLIER = 2.5;
    private static readonly string[] CONFLUENCE_TIMEFRAMES = ["M1", "M15", "H1"];

    public async Task ProcessPredictionAsync(PredictionEvent prediction)
    {
        var symbol = prediction.Symbol;

        // Store this prediction in confluence cache
        await _cache.SetAsync(
            $"confluence:{symbol}:{prediction.Timeframe}",
            prediction.PrimaryDirection,
            TimeSpan.FromMinutes(10));

        // Check confluence across all required timeframes
        var directions = new Dictionary<string, string>();
        foreach (var tf in CONFLUENCE_TIMEFRAMES)
        {
            var dir = await _cache.GetAsync($"confluence:{symbol}:{tf}");
            if (dir == null) return; // missing timeframe data
            directions[tf] = dir;
        }

        var uniqueDirections = directions.Values.Distinct().ToList();
        if (uniqueDirections.Count != 1 || uniqueDirections[0] == "FLAT")
        {
            _logger.LogDebug("Confluence not met for {Symbol}: {@Directions}", symbol, directions);
            return;
        }

        // Check cooldown
        if (await _cache.ExistsAsync($"cooldown:{symbol}")) return;

        // Build signal
        var direction = uniqueDirections[0];
        var atr = await _cache.GetDoubleAsync($"indicators:{symbol}:M1:atr14");
        if (atr == null) return;

        double entry = direction == "LONG" ? prediction.CurrentAsk : prediction.CurrentBid;
        double sl = direction == "LONG" ? entry - (SL_ATR_MULTIPLIER * atr.Value)
                                        : entry + (SL_ATR_MULTIPLIER * atr.Value);
        double tp = direction == "LONG" ? entry + (TP_ATR_MULTIPLIER * atr.Value)
                                        : entry - (TP_ATR_MULTIPLIER * atr.Value);

        var signal = new TradingSignal
        {
            SignalId      = Guid.NewGuid().ToString(),
            Symbol        = symbol,
            Direction     = direction,
            EntryPrice    = entry,
            StopLoss      = Math.Round(sl, 5),
            TakeProfit    = Math.Round(tp, 5),
            Confidence    = directions.Keys.Min(tf =>
                                prediction.Horizons.FirstOrDefault(h => h.Timeframe == tf)?.Confidence ?? 0),
            GeneratedAt   = DateTime.UtcNow,
            SourcePredictionId = prediction.PredictionId,
        };

        _publisher.Publish("signals.exchange", "signals.generated", signal);
        await _cache.SetAsync($"cooldown:{symbol}", "1", TimeSpan.FromMinutes(5));
    }
}
```
