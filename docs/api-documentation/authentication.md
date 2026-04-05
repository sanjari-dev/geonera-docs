---
title: Authentication
sidebar_label: Authentication
description: API authentication mechanism, API key management, and token usage for the Geonera REST API.
---

## Purpose

This page documents how external clients authenticate to the Geonera REST API — used by dashboards, monitoring tools, and operator scripts to query system state and trigger administrative actions.

## Overview

The Geonera API uses **API Key authentication** via the `X-Api-Key` HTTP header. API keys are generated per client, stored as bcrypt hashes in PostgreSQL, and validated on every request by the API Gateway service. There is no session state — every request is independently authenticated.

For internal service-to-service communication, RabbitMQ is used and no HTTP authentication is required. The REST API is exclusively for external operator access.

## Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| API key | HTTP header `X-Api-Key` | API client | 64-character hex key issued at provisioning |
| Request path | HTTP URL | API client | The resource being accessed |

## Outputs

| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| 200 OK | HTTP response | API client | Request authenticated and processed |
| 401 Unauthorized | HTTP response | API client | Missing or invalid API key |
| 403 Forbidden | HTTP response | API client | Valid key but insufficient permissions |

## Rules

- All API requests must include the `X-Api-Key` header. Requests without it receive `401`.
- API keys have scopes: `read` (query state), `write` (trigger actions), `admin` (manage keys).
- Keys are 64-character hex strings generated using a cryptographically secure random source.
- Keys are never stored in plaintext — only bcrypt hash is stored.
- Failed authentication attempts are rate-limited: 5 failures per minute per IP triggers a 60-second lockout.
- Keys can be revoked immediately via the admin API or directly in PostgreSQL.
- All authenticated requests are logged with key ID, path, method, and response code.

## Flow

1. Client sends HTTP request with `X-Api-Key: <key>` header.
2. API Gateway extracts the key and computes bcrypt hash.
3. Hash is compared against `api_keys` table in PostgreSQL.
4. If no match: return `401 Unauthorized`.
5. If match: check key scope against required permission for the route.
6. If scope insufficient: return `403 Forbidden`.
7. If authorized: forward request to handler and log the access.

## Example

### Request with API Key

```bash
curl -H "X-Api-Key: a3f7c291e2b14d10b3a19f4e2c7d8b5a..." \
     https://api.geonera.internal/v1/system/status
```

### C# API Key Validation Middleware

```csharp
// ApiGateway/Middleware/ApiKeyMiddleware.cs
public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IApiKeyRepository _keyRepo;

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue("X-Api-Key", out var keyValue))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Missing X-Api-Key header");
            return;
        }

        var apiKey = await _keyRepo.ValidateAsync(keyValue.ToString());
        if (apiKey == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Invalid API key");
            return;
        }

        // Attach key context to request for downstream handlers
        context.Items["ApiKey"] = apiKey;
        context.Items["ApiKeyScopes"] = apiKey.Scopes;

        await _next(context);
    }
}

// ApiGateway/Repositories/ApiKeyRepository.cs
public class ApiKeyRepository : IApiKeyRepository
{
    private readonly IDbConnection _db;

    public async Task<ApiKey?> ValidateAsync(string rawKey)
    {
        var keyId = rawKey[..8]; // First 8 chars identify the key record
        var record = await _db.QuerySingleOrDefaultAsync<ApiKeyRecord>(
            "SELECT * FROM api_keys WHERE key_id = @keyId AND is_active = true",
            new { keyId }
        );

        if (record == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(rawKey, record.KeyHash)) return null;

        return new ApiKey(record.KeyId, record.ClientName, record.Scopes.Split(','));
    }
}
```

### Generate a New API Key (Admin)

```bash
# POST /v1/admin/api-keys
curl -X POST \
     -H "X-Api-Key: <admin-key>" \
     -H "Content-Type: application/json" \
     -d '{"clientName": "grafana-dashboard", "scopes": ["read"]}' \
     https://api.geonera.internal/v1/admin/api-keys

# Response
{
  "keyId": "a3f7c291",
  "apiKey": "a3f7c291e2b14d10b3a19f4e2c7d8b5a9c6f1d2e...",
  "scopes": ["read"],
  "createdAt": "2026-04-05T12:00:00Z"
}
```
