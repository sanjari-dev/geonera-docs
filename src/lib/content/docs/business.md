# Business Model

This document describes Geonera's current operational model, its planned evolution toward a Software-as-a-Service (SaaS) platform and trading signal marketplace, and the technical implications of each business model on system architecture.

---

## Table of Contents

- [Current Phase: Internal Intelligence Engine](#current-phase-internal-intelligence-engine)
- [Planned Phase: SaaS Platform](#planned-phase-saas-platform)
- [Planned Phase: Signal Marketplace](#planned-phase-signal-marketplace)
- [Multi-Tenancy Technical Requirements](#multi-tenancy-technical-requirements)
- [Subscription and Access Model](#subscription-and-access-model)
- [Data Commercialization Boundaries](#data-commercialization-boundaries)
- [Regulatory and Compliance Considerations](#regulatory-and-compliance-considerations)
- [Technical Dependencies for SaaS Transition](#technical-dependencies-for-saas-transition)
- [Revenue-Critical System Properties](#revenue-critical-system-properties)

---

## Current Phase: Internal Intelligence Engine

**Status:** Active (production target)

Geonera in its current phase operates as a **closed, internal system**:
- Signals are generated, evaluated, and executed for a single trading account
- The Admin UI is accessible only to internal team members
- No external users, subscriptions, or API consumers
- Revenue model: proprietary trading (profits from executed signals)

### Operational Scope
- Instruments: configurable set of Dukascopy-supported FX pairs
- Accounts: single JForex trading account
- Users: internal team only (engineers, data scientists, trading ops)

### Technical Characteristics of This Phase
- No multi-tenancy requirements
- Single-account position management
- All secrets and configs are team-managed
- No external SLA commitments beyond internal uptime targets

---

## Planned Phase: SaaS Platform

**Status:** Planned (future roadmap)

Geonera is architecturally designed to evolve into a **Software-as-a-Service** offering where external users can subscribe to access Geonera's trading signals.

### SaaS Delivery Model
- Subscribers receive approved signals (NOT the AI model itself)
- Signals delivered via:
  - REST API (pull-based: subscriber fetches signals on demand)
  - WebSocket (push-based: real-time signal stream)
  - Webhook (event-driven: Geonera POSTs to subscriber's endpoint)
  - Admin UI (web dashboard for non-technical subscribers)
- Subscribers configure their own trade execution (Geonera does NOT execute on behalf of subscribers in SaaS phase v1)

### Subscription Tiers (Draft)

| Tier | Signal Latency | Instruments | API Access | Price |
|---|---|---|---|---|
| Free | Delayed 1 hour | 1 major pair | No | $0 |
| Basic | 5 minutes | 3 pairs | REST (100 req/day) | $X/month |
| Pro | Real-time | All pairs | REST + WebSocket | $XX/month |
| Enterprise | Real-time | All pairs + custom | Full API + Webhook + SLA | $XXX/month |

Signal latency delay is enforced at the API Gateway level — a timestamp-based filter prevents subscribers below Pro tier from seeing signals until the delay window passes.

---

## Planned Phase: Signal Marketplace

**Status:** Planned (post-SaaS)

Beyond Geonera's own signals, the marketplace model allows **third-party signal providers** to publish their signals through the Geonera platform.

### Marketplace Architecture Additions Required
- **Signal provider onboarding:** Verified providers can publish signals via a provider API
- **Signal validation:** All third-party signals pass through the same meta-model scoring and risk framework before being surfaced to subscribers
- **Revenue sharing:** Platform takes a % of subscription fees attributable to each provider's signals
- **Subscriber customization:** Subscribers can select which providers' signals to follow
- **Performance tracking:** All provider signals tracked against actual market outcomes (transparent win rate, RR, etc.)

This adds significant complexity to the multi-tenancy model (provider isolation, billing attribution, performance auditing) and is a separate architectural phase.

---

## Multi-Tenancy Technical Requirements

The SaaS transition introduces multi-tenancy concerns currently absent from the system:

### Tenant Isolation Levels Required

| Resource | Isolation Approach |
|---|---|
| User data (subscriptions, preferences) | Row-level isolation in PostgreSQL via `tenant_id` column + Row Level Security (RLS) |
| Signal access | API Gateway enforces tier-based filters per authenticated user |
| API rate limits | Per-API-key rate limiting at Nginx/API Gateway layer |
| Webhook delivery | Per-subscriber queue in RabbitMQ (fan-out from approved signal event) |
| Billing | Separate billing service (Stripe integration); not part of current architecture |

### Database Changes for Multi-Tenancy

```sql
-- New tables required for SaaS phase
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200),
    tier        VARCHAR(20) CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
    api_key     VARCHAR(100) UNIQUE,
    webhook_url TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_signal_access (
    tenant_id   UUID REFERENCES tenants(id),
    signal_id   UUID REFERENCES signals(id),
    released_at TIMESTAMP,  -- when this tenant's tier unlocks this signal
    PRIMARY KEY (tenant_id, signal_id)
);

CREATE TABLE api_usage_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id),
    endpoint    VARCHAR(200),
    request_at  TIMESTAMP DEFAULT NOW(),
    response_ms INT
);
```

### API Authentication for SaaS
- API Key authentication (header: `X-API-Key: <key>`)
- JWT OAuth2 (for web dashboard users)
- API keys scoped to tenant; rate-limited per tier
- No change to internal service auth (remains internal JWT)

---

## Subscription and Access Model

### Signal Availability Windows

```
Signal generated at: T=0 (signal.approved event)

Enterprise subscribers: T=0 (immediate)
Pro subscribers:        T=0 (immediate)
Basic subscribers:      T=300s (5 minute delay)
Free subscribers:       T=3600s (1 hour delay)
```

Implementation: API Gateway adds a `WHERE released_at <= NOW()` clause to signal queries based on the authenticated tenant's tier.

### Instrument Access Matrix

| Tier | Available Instruments |
|---|---|
| Free | EURUSD (1 major pair) |
| Basic | EURUSD, GBPUSD, USDJPY (3 majors) |
| Pro | All supported instruments |
| Enterprise | All supported + early access to new instruments |

---

## Data Commercialization Boundaries

### What Can Be Commercialized
- Approved trading signals (direction, entry, target, stop, horizon)
- Signal performance statistics (aggregate win rate, RR, drawdown metrics)
- General market insights derived from model outputs

### What CANNOT Be Commercialized
- The TFT model weights (proprietary asset)
- The meta model weights (proprietary asset)
- Raw Dukascopy bi5 data (Dukascopy data terms prohibit redistribution)
- Individual tick data or OHLCV data (Dukascopy license restrictions)

### Key Licensing Risk
Dukascopy's data use terms must be reviewed before commercializing signals derived from their data. If the terms prohibit using their data to create a commercial signal service, alternative data sources must be evaluated. This is a **critical legal dependency** before SaaS launch.

---

## Regulatory and Compliance Considerations

Trading signal services may be subject to financial regulation depending on jurisdiction:

| Jurisdiction | Potential Regulation | Implication |
|---|---|---|
| EU | MiFID II — investment advice regulations | Signal service may constitute investment advice; requires authorization |
| UK | FCA — Financial Promotions Order | Marketing signals to UK residents may require FCA authorization |
| US | SEC / CFTC — investment advisor rules | Providing trading signals for compensation may require RIA registration |
| Singapore | MAS — Capital Markets Services license | May be required for signal subscription services |

**Engineering implication:** The system must be able to:
- Store subscriber jurisdiction (country code) and apply access restrictions per jurisdiction
- Log all signals provided to each subscriber with timestamps (audit trail for compliance)
- Support GDPR data deletion requests (subscriber data purge without affecting signal history)
- Provide subscriber data export (GDPR right of portability)

These requirements drive schema additions and API endpoints that are NOT present in the internal-only phase.

---

## Technical Dependencies for SaaS Transition

Before SaaS launch, the following must be implemented:

| Dependency | Priority | Notes |
|---|---|---|
| Multi-tenant database schema | Critical | Row-level security + tenant_id indexing |
| API key management service | Critical | Issuance, rotation, rate limiting |
| Webhook delivery system | High | Per-subscriber outbound HTTP delivery with retry |
| Billing integration (Stripe) | High | Subscription lifecycle, payment processing |
| Signal delay enforcement | High | Tier-based access window at API layer |
| GDPR data management | High | Delete + export endpoints |
| Subscriber-facing UI (not Admin UI) | High | New SvelteKit application; separate from Admin UI |
| Legal review (data licensing) | Critical | Must precede any commercialization |
| SLA monitoring | Medium | Uptime and latency guarantees per tier |

---

## Revenue-Critical System Properties

The following system properties are revenue-critical in SaaS phase and must be treated as highest-priority reliability requirements:

| Property | Revenue Impact | Current Status |
|---|---|---|
| Signal delivery latency (Pro/Enterprise) | Delayed signals = refund claims | Monitored via Prometheus; alert < 10s |
| Signal accuracy (win rate, RR) | Poor performance = churn | Monitored; model retraining on drift |
| API availability (uptime) | Downtime = SLA breach + credits | 99.9% target; HA architecture |
| Webhook delivery reliability | Missed webhooks = missed trades | Retry queue with DLQ; at-least-once delivery |
| Data accuracy | Wrong signal data = potential losses for subscribers | Validated at each pipeline stage |
| JForex execution (for managed accounts) | Execution failure = subscriber losses | Active-standby; DLQ for order retries |
