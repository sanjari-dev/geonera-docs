---
title: Service Overview
sidebar_label: Service Overview
description: Catalog of all Geonera microservices with purpose, tech stack, and runtime characteristics.
---

## Purpose

This page is the master catalog of all Geonera services. Use it to quickly understand what each service does, what language it is written in, and what infrastructure it depends on.

## Overview

Geonera consists of 10 services across three runtime languages: Java (broker integration), Rust (high-performance data processing), and C#/.NET 8 (business logic and execution). Python handles the AI pipeline as a short-lived consumer rather than a long-running service per se. Each service is containerized with Docker, configured via environment variables, and communicates exclusively through RabbitMQ.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Service discovery | Docker Compose / Kubernetes | Infrastructure | How services find RabbitMQ, Redis, PostgreSQL |
| Configuration | Environment variables | Secrets manager | Credentials, endpoints, thresholds |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Health status | HTTP `/health` | Docker health check | Ready/not-ready signal |
| Metrics | OpenTelemetry | Grafana | Latency histograms, message throughput |

## Rules

- Every service exposes `/health` on port 8080.
- Services must start within 30 seconds or Docker marks them unhealthy.
- No service stores credentials in its image — all secrets via environment variables.
- Each service has a dedicated Docker Compose service definition with explicit resource limits.

## Flow

Services are organized into three layers. Data flows left to right through them.

```mermaid
graph LR
    subgraph Data Layer
        J[JForexClient\nJava]
        TP[TickProcessor\nRust]
        CE[CandleEngine\nRust]
        IS[IndicatorService\nC#]
    end
    subgraph Intelligence Layer
        FP[FeaturePipeline\nPython]
        AP[AIPredictor\nPython]
        SG[SignalGenerator\nC#]
    end
    subgraph Execution Layer
        RM[RiskManager\nC#]
        TE[TradeExecutor\nC#]
        TT[TradeTracker\nC#]
    end
    J --> TP --> CE --> IS --> FP --> AP --> SG --> RM --> TE --> TT
```

## Example

### Full Service Catalog

| Service | Language | Image | CPU Limit | Memory Limit | Depends On |
|---------|----------|-------|-----------|--------------|------------|
| JForexClient | Java 17 | `geonera/jforex-client` | 1 CPU | 512 MB | RabbitMQ |
| TickProcessor | Rust | `geonera/tick-processor` | 2 CPU | 256 MB | RabbitMQ |
| CandleEngine | Rust | `geonera/candle-engine` | 2 CPU | 256 MB | RabbitMQ |
| IndicatorService | C# .NET 8 | `geonera/indicator-service` | 1 CPU | 256 MB | RabbitMQ, Redis |
| FeaturePipeline | Python 3.11 | `geonera/feature-pipeline` | 1 CPU | 512 MB | RabbitMQ, BigQuery |
| AIPredictor | Python 3.11 | `geonera/ai-predictor` | 1 CPU | 512 MB | RabbitMQ, Vertex AI |
| SignalGenerator | C# .NET 8 | `geonera/signal-generator` | 1 CPU | 256 MB | RabbitMQ, Redis |
| RiskManager | C# .NET 8 | `geonera/risk-manager` | 1 CPU | 256 MB | RabbitMQ, Redis |
| TradeExecutor | C# .NET 8 | `geonera/trade-executor` | 1 CPU | 256 MB | RabbitMQ, JForex |
| TradeTracker | C# .NET 8 | `geonera/trade-tracker` | 1 CPU | 512 MB | RabbitMQ, PostgreSQL, BigQuery |

### Environment Variables (Common to All Services)

```bash
RABBITMQ_URI=amqp://user:pass@rabbitmq:5672/geonera
REDIS_CONNECTION=redis:6379
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
LOG_LEVEL=Information
SERVICE_NAME=indicator-service
```
