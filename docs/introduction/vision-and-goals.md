---
title: Vision & Goals
sidebar_label: Vision & Goals
description: Long-term vision, design principles, and engineering goals driving the Geonera trading system.
---

## Purpose

This page defines why Geonera is built the way it is — the guiding principles that shape every architectural and engineering decision. Understanding these goals helps contributors and operators make consistent decisions when extending the system.

## Overview

The vision for Geonera is to build a fully autonomous trading system that is as reliable, explainable, and risk-aware as a professional trading desk — but operating at machine speed with zero emotional bias.

Geonera is not a "black box" system. Every prediction, signal, and order is logged, traceable, and auditable. The goal is not just to make money, but to make money in a way that is reproducible, measurable, and improvable over time.

The system is designed to operate continuously (24/5 for Forex, extended hours for Gold) with no manual intervention under normal conditions. Human oversight is reserved for configuration changes, model retraining approvals, and incident response.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Market conditions | Observed data | Live markets | Price action, volatility regime, spread |
| Business constraints | Configuration | Risk manager | Max drawdown, max position size, allowed symbols |
| Model performance metrics | BigQuery analytics | Post-trade logs | Win rate, Sharpe ratio, max drawdown per model version |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| System design decisions | Architecture | Engineering team | Service boundaries, protocols, data contracts |
| Operational constraints | Configuration templates | DevOps | Risk parameters, circuit breaker thresholds |
| Performance benchmarks | Reports | Stakeholders | Monthly P&L, model accuracy, system uptime |

## Rules

- **Reliability over performance**: A missed trade is better than a corrupted one. All services must implement idempotent message processing.
- **Explainability is mandatory**: Every trade must be traceable back to a specific model prediction, feature set, and signal rule.
- **Risk is the primary constraint**: No optimization of returns is acceptable if it increases the probability of catastrophic drawdown.
- **Services must fail safely**: Any service failure must trigger graceful degradation (e.g., halt new orders) rather than undefined behavior.
- **Model versions are immutable**: Once a model version is promoted to production, it is never modified in place. New versions go through a shadow-testing phase first.

## Flow

### Design Principles Applied to Architecture

1. **Single Responsibility** — Each microservice owns exactly one domain. CandleEngine only aggregates candles. RiskManager only enforces risk rules.
2. **Async-First** — Services communicate through RabbitMQ messages. Synchronous HTTP is only used for external APIs (Vertex AI, JForex).
3. **Data-Driven Iteration** — Model performance is continuously measured in BigQuery. Retraining is triggered by performance degradation thresholds, not by calendar.
4. **Infrastructure as Code** — All environments (dev, staging, prod) are defined in Docker Compose and Terraform. No manual server configuration.
5. **Observability by Default** — Structured JSON logs, distributed trace IDs, and BigQuery event tables are not optional — they are part of the definition of "done".

### Long-Term Goals

| Goal | Target | Metric |
|------|--------|--------|
| Live trading stability | 99.9% uptime during market hours | PagerDuty alert rate |
| Model accuracy | >55% directional accuracy on 5-min horizon | BigQuery evaluation table |
| Risk control | Max drawdown ≤ 10% at portfolio level | Daily equity curve |
| Latency | Tick-to-signal ≤ 1 second (p99) | OpenTelemetry traces |
| Automation | Zero manual trades per month | Trade log audit |

## Example

```yaml
# geonera-principles.yaml — used as a reference checklist during code reviews

principles:
  - name: Fail Safe
    check: "Does this change halt new orders if the service crashes?"

  - name: Explainability
    check: "Is every trade decision logged with its prediction ID and feature snapshot?"

  - name: Idempotency
    check: "Can this message handler process the same message twice without side effects?"

  - name: Risk First
    check: "Does this change bypass or weaken any risk rule? If yes, requires risk team approval."

  - name: Immutable Models
    check: "Is a new model version being shadow-tested before traffic is shifted?"
```
