---
title: Docker
sidebar_label: Docker
description: Dockerfiles, docker-compose configuration, multi-stage builds, and container registry for Geonera services.
---

## Purpose

This page documents how every Geonera service is containerized — Dockerfile patterns, docker-compose structure, multi-stage build strategy, and how images are tagged and pushed to the container registry.

## Overview

Every Geonera service is packaged as a Docker image. Images are built using multi-stage Dockerfiles to minimize final image size and avoid shipping build tooling into production. The `docker-compose.yml` file at the repo root defines the complete local development and staging environment. Production uses the same images deployed to Kubernetes.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Source code | Git repository | CI pipeline | Service source to build |
| Environment variables | `.env` file / secrets | Docker Compose / K8s | Runtime configuration |
| Base images | Docker Hub / GCR | Docker pull | Runtime base images |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Docker image | OCI image | Google Artifact Registry | Tagged service image |
| Running container | Docker process | Local / Kubernetes | Live service instance |

## Rules

- All images use non-root users in the final stage.
- Final image must not contain build tools (compilers, SDKs) — multi-stage only.
- Images are tagged with both `git-sha` and `latest` on main branch pushes.
- No secrets are baked into images — all credentials via environment variables.
- Health check is defined in every Dockerfile (`HEALTHCHECK CMD curl /health`).

## Flow

```mermaid
graph LR
    SRC[Source Code] -->|docker build| BUILD[Build Stage\ncompiler/SDK]
    BUILD -->|copy artifact| FINAL[Final Stage\nruntime only]
    FINAL -->|docker push| REG[Artifact Registry\ngcr.io/geonera]
    REG -->|docker pull| K8S[Kubernetes / Compose]
```

## Example

### C# Service Dockerfile (IndicatorService)

```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY IndicatorService/IndicatorService.csproj ./
RUN dotnet restore
COPY IndicatorService/ ./
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
EXPOSE 8080
ENTRYPOINT ["dotnet", "IndicatorService.dll"]
```

### Rust Service Dockerfile (TickProcessor)

```dockerfile
# Stage 1: Build
FROM rust:1.75 AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/
RUN cargo build --release

# Stage 2: Runtime (minimal)
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*
RUN adduser --disabled-password --gecos "" appuser
USER appuser
WORKDIR /app
COPY --from=build /app/target/release/tick-processor .
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
EXPOSE 8080
ENTRYPOINT ["./tick-processor"]
```

### docker-compose.yml (excerpt)

```yaml
version: "3.9"

services:
  rabbitmq:
    image: rabbitmq:3.13-management
    ports: ["5672:5672", "15672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: geonera
      RABBITMQ_DEFAULT_PASS: secret
      RABBITMQ_DEFAULT_VHOST: geonera
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: geonera
      POSTGRES_USER: geonera
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]

  tick-processor:
    image: gcr.io/geonera/tick-processor:latest
    environment:
      RABBITMQ_URI: amqp://geonera:secret@rabbitmq:5672/geonera
      MAX_STALENESS_SECS: "5"
    depends_on:
      rabbitmq:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 256M

  indicator-service:
    image: gcr.io/geonera/indicator-service:latest
    environment:
      RABBITMQ_URI: amqp://geonera:secret@rabbitmq:5672/geonera
      REDIS_CONNECTION: redis:6379
      RSI_PERIOD: "14"
      ATR_PERIOD: "14"
    depends_on:
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 256M
```
