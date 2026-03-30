# Admin UI

The Geonera Admin UI is an internal web application for real-time monitoring, evaluation, and management of the trading signal pipeline. Built with TypeScript running on the Bun runtime, it provides operations engineers and technical analysts with a unified interface to observe system health, inspect individual signals, manage configurations, and intervene in the trading pipeline.

---

## Table of Contents

- [Purpose and Scope](#purpose-and-scope)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Feature Modules](#feature-modules)
- [Real-Time Data Flow](#real-time-data-flow)
- [Backend API Consumption](#backend-api-consumption)
- [Authentication and Authorization](#authentication-and-authorization)
- [UI Component Design](#ui-component-design)
- [Deployment](#deployment)
- [Failure Scenarios](#failure-scenarios)
- [Performance Considerations](#performance-considerations)

---

## Purpose and Scope

The Admin UI is an **internal tool only** — not a user-facing product. Its audience:

- **DevOps / SRE:** Monitor pipeline health, view alerts, diagnose failures
- **AI/ML Engineers:** Monitor model performance, trigger retraining, promote models
- **System Architects / Technical PMs:** Review signal statistics, backtest results, strategy configuration
- **Trading Operations:** Manually approve/reject signals, override risk limits (emergency only), view open positions

It is NOT:
- A public trading dashboard
- A user subscription portal (reserved for future SaaS layer)
- A charting terminal for manual trading analysis

---

## Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| Runtime | Bun 1.x | Fast TypeScript runtime; native bundler; faster startup than Node.js |
| Framework | SvelteKit (TypeScript) | Compiled components, minimal JS bundle, excellent SSR/CSR flexibility |
| UI styling | Tailwind CSS | Utility-first; consistent design without custom CSS overhead |
| Charts | Lightweight-charts (TradingView) | Financial-grade candlestick and line charts; highly performant for time-series |
| SHAP visualization | D3.js (custom waterfall component) | Flexible enough for custom financial visualization needs |
| Real-time updates | WebSocket (native browser API) | Subscribe to signal events, position updates, and system alerts |
| HTTP client | `fetch` (native in Bun) | No extra dependency needed |
| State management | Svelte stores + reactive context | Lightweight; no Redux/Zustand overhead needed |

---

## Architecture Overview

```mermaid
flowchart LR
    subgraph Browser
        A[Admin UI\nSvelteKit SPA]
    end

    subgraph Bun Server
        B[SvelteKit Server\nSSR + API routes]
        C[WebSocket Handler\nRabbitMQ relay]
    end

    subgraph Backend Services
        D[C# API Gateway\nREST endpoints]
        E[RabbitMQ\nSignal events]
    end

    subgraph Databases
        F[(PostgreSQL)]
        G[(ClickHouse)]
    end

    A -->|REST via fetch| B
    A -->|WebSocket| C
    B -->|REST| D
    C -->|AMQP consumer| E
    D -->|SQL query| F
    D -->|SQL query| G
    E -->|events| C
    C -->|push| A
```

The Bun/SvelteKit server acts as a **Backend-for-Frontend (BFF)**:
- Serves the SvelteKit application (SSR on first load, SPA thereafter)
- Proxies REST requests to the C# API Gateway (hides internal service topology from the browser)
- Maintains a WebSocket connection to the browser and a RabbitMQ consumer subscription to push real-time events

---

## Feature Modules

### 1. Dashboard (Home)
- **Live trading summary:** Account equity, daily PnL, open positions count, win rate (rolling 30d)
- **Signal pipeline metrics:** Forecasts/hr, signals generated/hr, approval rate
- **System health status:** Per-service health indicators (green/yellow/red)
- **Active alerts:** List of firing Prometheus alerts from Alertmanager API
- **Recent activity feed:** Last 20 events (signal approved, order filled, model reloaded)

### 2. Signal Explorer
- **Signal table:** Paginated list of all signals with status filter (candidate/scored/approved/rejected/filled/stopped)
- **Columns:** Instrument, Direction, Entry, Target, Stop, RR Ratio, Meta Score, Status, Created At
- **Signal detail page:**
  - Signal parameters
  - TFT explanation (attention heatmap + feature importance chart)
  - Meta model explanation (SHAP waterfall chart)
  - Position outcome (if closed: PnL, exit reason)
  - Manual override buttons (approve/reject — restricted to authorized users)
- **Filters:** Instrument, direction, date range, meta score range, status, strategy config

### 3. Open Positions
- **Live position table:** All currently open positions with real-time unrealized PnL
- **Position detail:** Entry time, entry price, current price, distance to target/stop (in pips), elapsed bars
- **Manual close:** Emergency position close button (routes through Risk Manager → JForex)
- **Position timeline:** Chart showing entry price, target, stop, and current price on M1 OHLCV chart

### 4. Backtesting Reports
- **Backtest run list:** All historical backtest runs with key metrics (Sharpe, max drawdown, CAGR, win rate)
- **Backtest detail:**
  - Equity curve chart
  - Monthly return heatmap
  - Trade distribution (scatter: entry time vs PnL)
  - Parameter comparison (vs current production config)
- **Trigger backtest:** Form to configure and launch a new backtest run (async; progress via WebSocket)

### 5. Model Management
- **Model registry table:** All registered TFT and meta model versions with metrics (AUC, MAE, training period)
- **Active model per instrument:** Show which model is currently in use
- **Promote model:** Button to promote a candidate model to production (triggers RabbitMQ model.reload event)
- **Rollback:** Revert to previous production model version
- **Training job trigger:** Launch a new training job (configurable training period)

### 6. Strategy & Risk Configuration
- **Strategy config editor:** View and edit `strategy_configs` entries (min RR, min pips, horizon, smoothing)
- **Risk config editor:** View and edit `risk_configs` entries (drawdown limits, position limits, sizing params)
- **Change history:** Audit log of all config changes with timestamp and user
- **Activation toggle:** Enable/disable specific strategy or risk configs without deletion

### 7. Observability
- **Grafana embed:** Embedded Grafana dashboards within the Admin UI (iframe with auth token)
- **Alert viewer:** List of active Alertmanager alerts with severity, service, and description
- **Log viewer:** Live log stream (tailed via WebSocket relay from Loki/Elasticsearch) with service and level filters
- **Queue inspector:** RabbitMQ queue depths, consumer counts, and DLQ messages with manual requeue action

### 8. System Administration
- **Service health:** Per-service health status with last check timestamp
- **Manual pipeline trigger:** Force-trigger an inference request for a specific instrument
- **DLQ management:** View DLQ messages, inspect payload, requeue or discard
- **Drawdown override:** Emergency resume of halted signal approvals (requires 2-person authorization)

---

## Real-Time Data Flow

### WebSocket Events (Server → Browser)

The Bun server relays RabbitMQ events to the browser via WebSocket:

```typescript
// Server-side WebSocket handler (Bun)
const rabbitChannel = await rabbitMQ.connect();
await rabbitChannel.consume('admin-ui.events', (msg) => {
  const event = JSON.parse(msg.content.toString());
  broadcastToAllClients(event);
  rabbitChannel.ack(msg);
});

// Event types pushed to browser:
type UIEvent =
  | { type: 'signal.generated'; payload: Signal }
  | { type: 'signal.approved'; payload: ApprovedSignal }
  | { type: 'signal.rejected'; payload: RejectedSignal }
  | { type: 'order.filled'; payload: OrderFill }
  | { type: 'position.closed'; payload: ClosedPosition }
  | { type: 'drawdown.alert'; payload: DrawdownAlert }
  | { type: 'model.promoted'; payload: ModelPromotion }
  | { type: 'system.alert'; payload: SystemAlert };
```

### Client-Side Reactive Updates (Svelte)

```typescript
// Svelte store: live signal feed
import { writable } from 'svelte/store';

export const liveSignals = writable<Signal[]>([]);

const ws = new WebSocket('/ws/events');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'signal.generated') {
    liveSignals.update(signals => [msg.payload, ...signals].slice(0, 100));
  }
};
```

---

## Backend API Consumption

The Admin UI consumes the C# API Gateway REST endpoints:

### Key Endpoints

```
GET    /api/signals?status=approved&instrument=EURUSD&limit=50&offset=0
GET    /api/signals/{id}
GET    /api/signals/{id}/explanation
POST   /api/signals/{id}/approve     (manual override; restricted)
POST   /api/signals/{id}/reject      (manual override; restricted)

GET    /api/positions?status=open
POST   /api/positions/{id}/close     (emergency close)

GET    /api/backtest-runs
GET    /api/backtest-runs/{id}
POST   /api/backtest-runs            (trigger new backtest)

GET    /api/models?instrument=EURUSD
POST   /api/models/{id}/promote
POST   /api/models/{id}/rollback

GET    /api/strategy-configs
PUT    /api/strategy-configs/{id}
GET    /api/risk-configs
PUT    /api/risk-configs/{id}

GET    /api/account/state
GET    /api/health
```

### BFF API Routes (Bun/SvelteKit server)
All `/api/` calls from the browser are proxied through the Bun server to the C# Gateway. The Bun server:
- Validates session/auth before forwarding
- Adds internal service auth headers (Bearer token or mTLS)
- Hides the internal C# service address from the browser

---

## Authentication and Authorization

### Authentication
- Internal auth only: username + password login
- Session-based auth: Bun server issues a signed JWT cookie on successful login
- JWT TTL: 8 hours; refresh on activity
- No OAuth/SSO integration in v1 (planned for SaaS phase)

### Authorization Roles

| Role | Permissions |
|---|---|
| `viewer` | Read-only access to all dashboards and signal explorer |
| `operator` | Viewer + manual signal override + DLQ management |
| `admin` | Operator + config editing + model promotion + drawdown override |
| `superadmin` | Admin + system administration + user management |

### Authorization Enforcement
- Role checked server-side in Bun API route handlers before forwarding to C# Gateway
- C# Gateway also validates the internal service token (defense in depth)
- All actions logged with user identity and timestamp in PostgreSQL `audit_log` table

---

## UI Component Design

### Financial Chart Component
- Uses Lightweight-charts (TradingView library) for candlestick rendering
- M1 OHLCV data fetched from C# Gateway (which queries ClickHouse)
- Overlays: entry price line, target line, stop line, signal generation time marker
- Performance: Lightweight-charts renders 10,000+ bars at 60fps without virtualization

### Attention Heatmap
- Custom D3.js component
- X-axis: time (1440 M1 bars lookback)
- Y-axis: attention weight (0.0 – 1.0)
- Color encoding: heat map (blue → red) for weight intensity
- Interactive: hover to see bar timestamp and exact weight

### SHAP Waterfall Chart
- Custom D3.js component
- Shows cumulative contribution of each feature from base value to final prediction
- Sorted by absolute SHAP value (most impactful first)
- Color: positive contribution = green, negative = red

---

## Deployment

### Container

```dockerfile
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.1-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "./build/index.js"]
```

### Environment Variables

```bash
API_GATEWAY_URL=http://api-gateway:8080
RABBITMQ_URL=amqps://user:pass@rabbitmq-1:5671/geonera
JWT_SECRET=<strong-random-secret>
SESSION_TTL_HOURS=8
LOG_LEVEL=info
```

### Kubernetes Deployment
- `replicas: 2` (for availability; Bun is stateless with JWT)
- HPA: not needed unless admin user count grows significantly (internal tool)
- Ingress: HTTPS via Nginx/Traefik; redirect HTTP → HTTPS; restrict to VPN IP range

---

## Failure Scenarios

| Scenario | Impact | Mitigation |
|---|---|---|
| Bun server crashes | Admin UI unavailable | Kubernetes restarts pod; < 10s recovery |
| C# API Gateway unavailable | All data reads fail; UI shows error state | UI displays "service unavailable" per section; retries with backoff |
| WebSocket disconnection | Real-time updates stop | Client auto-reconnects with exponential backoff; shows "reconnecting" indicator |
| RabbitMQ consumer disconnects | Events not relayed to browser | Bun server reconnects; may miss events during gap (non-critical; data visible via polling) |
| PostgreSQL query slow | Signal table loads slowly | Pagination + indexes prevent full table scans; timeout after 10s with error message |
| JWT expired during session | User actions fail with 401 | Auto-redirect to login page; preserve pre-login navigation intent |

---

## Performance Considerations

- **Bun startup time:** ~50ms (vs Node.js ~200ms); important for container restarts
- **SvelteKit SSR:** First page load renders server-side (fast initial paint); subsequent navigation is SPA (instant)
- **WebSocket connection pooling:** Bun server maintains one RabbitMQ consumer connection shared across all WebSocket clients (not one per client)
- **Signal table pagination:** Signal table never loads all records; server-side pagination with `LIMIT` + `OFFSET` + indexed query
- **Chart data volume:** Fetching 1440 M1 bars for a position chart = ~1440 × 5 fields = ~7KB JSON; acceptable for UI
- **SHAP chart rendering:** D3.js renders 20-30 SHAP bars synchronously; < 5ms render time per chart
