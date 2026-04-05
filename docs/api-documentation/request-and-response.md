---
title: Request & Response
sidebar_label: Request & Response
description: Example request/response payloads, schemas, and error codes for the Geonera REST API.
---

## Purpose

This page provides concrete request and response examples for the most commonly used API endpoints, along with the full error code catalog.

## Overview

All Geonera API responses follow a consistent envelope structure. Success responses include `requestId`, `data` (or top-level fields for lists), and optional pagination metadata. Error responses always include `requestId`, `error.code`, and `error.message`.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| HTTP request | REST | API client | Method, path, headers, optional body |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Success response | JSON | API client | Requested resource or operation result |
| Error response | JSON | API client | Structured error with code and message |

## Rules

- All dates in responses are UTC ISO 8601 (`2026-04-05T12:00:00.000Z`).
- Numeric prices use `float64` precision — do not round when consuming.
- `null` fields are included explicitly (not omitted) so clients can rely on consistent schema.
- The `requestId` field is always present and can be used to correlate with server logs.

## Flow

### Response Envelope Pattern

```
Success (single resource):
{
  "requestId": "string",
  "data": { ... }
}

Success (list):
{
  "requestId": "string",
  "page": int,
  "pageSize": int,
  "total": int,
  "data": [ ... ]
}

Error:
{
  "requestId": "string",
  "error": {
    "code": "string",
    "message": "string",
    "details": { ... }  // optional
  }
}
```

## Example

### GET /v1/system/status

```json
{
  "requestId": "req-status-001",
  "data": {
    "status": "healthy",
    "tradingActive": true,
    "emergencyStopActive": false,
    "openPositions": 2,
    "services": {
      "jforexClient": "healthy",
      "tickProcessor": "healthy",
      "candleEngine": "healthy",
      "indicatorService": "healthy",
      "featurePipeline": "healthy",
      "aiPredictor": "healthy",
      "signalGenerator": "healthy",
      "riskManager": "healthy",
      "tradeExecutor": "healthy",
      "tradeTracker": "healthy"
    },
    "checkedAt": "2026-04-05T12:00:00.000Z"
  }
}
```

### GET /v1/signals/&#123;signalId&#125;

```json
{
  "requestId": "req-signal-001",
  "data": {
    "signalId": "sig-20260405-xauusd-001",
    "symbol": "XAUUSD",
    "direction": "LONG",
    "confidence": 0.81,
    "entryPrice": 2345.45,
    "stopLoss": 2343.60,
    "takeProfit": 2349.07,
    "atrUsed": 1.85,
    "confluenceTimeframes": ["M1", "M15", "H1"],
    "predictionId": "pred-20260405-xauusd-001",
    "state": "EXECUTED",
    "generatedAt": "2026-04-05T12:00:00.760Z",
    "executedAt": "2026-04-05T12:00:00.800Z",
    "ticket": "10042381"
  }
}
```

### PUT /v1/admin/config — Update Risk Config

**Request:**
```json
{
  "maxDrawdownPct": 8.0,
  "maxExposurePct": 15.0,
  "riskPerTradePct": 0.5,
  "symbols": {
    "XAUUSD": { "maxLotSize": 0.5, "enabled": true },
    "EURUSD": { "maxLotSize": 1.0, "enabled": true }
  }
}
```

**Response:**
```json
{
  "requestId": "req-config-001",
  "data": {
    "updated": true,
    "effectiveAt": "2026-04-05T12:05:00.000Z",
    "previousConfig": {
      "maxDrawdownPct": 10.0,
      "maxExposurePct": 20.0,
      "riskPerTradePct": 1.0
    }
  }
}
```

### Error Code Catalog

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_PARAMETER` | Query parameter is missing or has invalid format |
| 400 | `INVALID_BODY` | Request body fails schema validation |
| 401 | `MISSING_API_KEY` | `X-Api-Key` header not present |
| 401 | `INVALID_API_KEY` | Key not found or hash mismatch |
| 403 | `INSUFFICIENT_SCOPE` | Key scope does not permit this operation |
| 404 | `NOT_FOUND` | Requested resource does not exist |
| 409 | `CONFLICT` | Operation conflicts with current state (e.g., halt already active) |
| 429 | `RATE_LIMITED` | Too many failed auth attempts — temporary lockout |
| 500 | `INTERNAL_ERROR` | Unexpected server error — check `requestId` in logs |
| 503 | `SERVICE_UNAVAILABLE` | Dependency (PostgreSQL, BigQuery) temporarily unavailable |

### Error Response Example

```json
{
  "requestId": "req-err-001",
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Query parameter 'from' must be a valid ISO 8601 date string",
    "details": {
      "parameter": "from",
      "received": "2026-13-01",
      "expected": "ISO 8601 UTC datetime"
    }
  }
}
```
