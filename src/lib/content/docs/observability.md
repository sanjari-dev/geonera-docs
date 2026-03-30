# Observability

Geonera's observability stack provides full visibility into system health, model performance, signal pipeline throughput, and trade execution quality. It combines centralized logging, metrics collection, distributed tracing, and alerting to enable rapid detection and resolution of issues in production.

---

## Table of Contents

- [Observability Strategy](#observability-strategy)
- [Metrics: Prometheus and Grafana](#metrics-prometheus-and-grafana)
- [Logging: Loki and Elasticsearch](#logging-loki-and-elasticsearch)
- [Alerting and Notification](#alerting-and-notification)
- [Dashboards](#dashboards)
- [ML Model Performance Monitoring](#ml-model-performance-monitoring)
- [Business Metrics Monitoring](#business-metrics-monitoring)
- [Health Checks](#health-checks)
- [Failure Scenarios](#failure-scenarios)
- [Performance Considerations](#performance-considerations)

---

## Observability Strategy

Geonera uses three pillars of observability:

1. **Metrics:** Quantitative time-series data for system health and performance (Prometheus + Grafana)
2. **Logs:** Structured event records for debugging and audit (Loki or Elasticsearch)
3. **Traces:** (Planned) Distributed request tracing across service boundaries (OpenTelemetry + Jaeger/Tempo)

The choice between **Loki and Elasticsearch** is deployment-context dependent:
- **Loki:** Lower resource cost, native Grafana integration, log aggregation without full-text indexing — preferred for smaller deployments
- **Elasticsearch:** Full-text search, complex query support, richer log analytics — preferred when advanced log querying is required

Both are viable; the architecture supports either via a log shipper abstraction (Promtail for Loki, Filebeat/Logstash for Elasticsearch).

---

## Metrics: Prometheus and Grafana

### Prometheus Architecture

```
[All Services] → [Prometheus Exporters / /metrics endpoints]
                          ↓ scrape (15s interval)
                    [Prometheus Server]
                          ↓ query
                    [Grafana Dashboards]
                          ↓ alert rules
                    [Alertmanager]
                          ↓ route
              [PagerDuty / Slack / Email]
```

### Service Metrics Instrumentation

Each service exposes a `/metrics` endpoint (Prometheus format):

#### Go Ingestor
```
# Counter
geonera_ticks_ingested_total{instrument="EURUSD"} 1234567

# Histogram
geonera_tick_insert_duration_seconds{instrument="EURUSD", quantile="0.99"} 0.045

# Gauge
geonera_ingestor_queue_depth{instrument="EURUSD"} 12

# Counter
geonera_bi5_files_downloaded_total{instrument="EURUSD", status="success"} 8760
geonera_bi5_files_downloaded_total{instrument="EURUSD", status="error"} 3
```

#### Rust Preprocessor
```
geonera_preprocessing_bars_processed_total{instrument="EURUSD", timeframe="M1"} 2628000
geonera_preprocessing_duration_seconds{stage="feature_computation"} 3.2
geonera_feature_nan_count_total{instrument="EURUSD", feature="rsi_14"} 0
```

#### Python TFT Inference Worker
```
geonera_inference_requests_total{instrument="EURUSD", status="success"} 8760
geonera_inference_duration_seconds{instrument="EURUSD", quantile="0.5"} 0.312
geonera_inference_duration_seconds{instrument="EURUSD", quantile="0.99"} 0.850
geonera_model_version{instrument="EURUSD", version="v2024.01.10"} 1
geonera_forecast_horizon_bars 7200
```

#### C# Signal Service
```
geonera_signals_generated_total{instrument="EURUSD", direction="LONG"} 4521
geonera_signals_filtered_total{instrument="EURUSD", reason="min_rr"} 1203
geonera_signal_generation_duration_seconds{quantile="0.99"} 0.008
```

#### Python Meta Model
```
geonera_meta_score_histogram_bucket{instrument="EURUSD", le="0.3"} 1200
geonera_meta_score_histogram_bucket{instrument="EURUSD", le="0.5"} 2800
geonera_meta_score_histogram_bucket{instrument="EURUSD", le="0.7"} 4200
geonera_meta_scoring_duration_seconds{quantile="0.99"} 0.092
geonera_signals_approved_by_meta_total{instrument="EURUSD"} 2100
```

#### C# Risk Service
```
geonera_signals_risk_approved_total{instrument="EURUSD"} 1800
geonera_signals_risk_rejected_total{instrument="EURUSD", reason="daily_drawdown"} 12
geonera_signals_risk_rejected_total{instrument="EURUSD", reason="max_positions"} 87
geonera_open_positions_count{instrument="EURUSD"} 3
geonera_account_equity_usd 10450.23
geonera_daily_pnl_usd -120.50
```

#### Java JForex Engine
```
geonera_orders_submitted_total{instrument="EURUSD", direction="LONG"} 1800
geonera_orders_filled_total{instrument="EURUSD"} 1795
geonera_orders_rejected_total{instrument="EURUSD", reason="insufficient_margin"} 5
geonera_jforex_connection_status{status="connected"} 1
geonera_order_submission_duration_seconds{quantile="0.99"} 0.450
```

### RabbitMQ Metrics
- Scraped via RabbitMQ Prometheus plugin
- Key metrics:
  - `rabbitmq_queue_messages{queue="..."}` — queue depth
  - `rabbitmq_queue_messages_unacknowledged{queue="..."}` — in-flight
  - `rabbitmq_channel_consumers{queue="..."}` — consumer count
  - `rabbitmq_connections` — total connections

### ClickHouse Metrics
- Scraped via `clickhouse_exporter`
- Key metrics:
  - `clickhouse_async_insert_rows` — insert buffer fill rate
  - `clickhouse_query_duration_ms_histogram` — query latency
  - `clickhouse_merge_tree_parts_count` — part fragmentation
  - `clickhouse_disk_data_bytes` — storage usage

---

## Logging: Loki and Elasticsearch

### Log Format
All services emit structured JSON logs:

```json
{
  "timestamp": "2024-01-15T14:01:23.456Z",
  "level": "INFO",
  "service": "signal-generator",
  "instance": "signal-generator-5d84f-xkp9z",
  "trace_id": "abc123def456",
  "instrument": "EURUSD",
  "signal_id": "uuid",
  "message": "Signal generated successfully",
  "direction": "LONG",
  "rr_ratio": 2.1,
  "duration_ms": 6
}
```

### Log Levels Policy

| Level | Usage |
|---|---|
| DEBUG | Per-tick computation details; disabled in production by default |
| INFO | Normal operation events (signal generated, order submitted, bar closed) |
| WARN | Non-fatal anomalies (NaN feature detected, DLQ message, slow query) |
| ERROR | Failures requiring investigation (DB connection failed, inference error) |
| FATAL | System-stopping conditions (cannot connect to broker at startup) |

### Log Shipping (Loki path)
- **Agent:** Promtail deployed as DaemonSet on each Kubernetes node
- **Collection:** Tails pod logs from `/var/log/containers/`
- **Parsing:** Regex or JSON parsing to extract structured fields
- **Labels:** `{service="...", namespace="...", level="...", instrument="..."}`
- **Retention:** 30 days hot, 90 days cold (Loki object storage backend: S3)

### Log Shipping (Elasticsearch path)
- **Agent:** Filebeat DaemonSet
- **Pipeline:** Filebeat → Logstash (enrichment) → Elasticsearch
- **Index pattern:** `geonera-logs-YYYY.MM.DD`
- **Retention:** ILM (Index Lifecycle Management): hot 7d, warm 30d, cold 90d, delete
- **Kibana:** For log search, visualization, and dashboard

---

## Alerting and Notification

### Alertmanager Configuration

```yaml
# Alert routing tree
route:
  receiver: 'slack-trading'
  routes:
  - match:
      severity: 'critical'
    receiver: 'pagerduty'
  - match:
      service: 'jforex-engine'
    receiver: 'pagerduty'   # execution issues always page
  - match:
      alertname: 'ModelDrift'
    receiver: 'slack-ml-team'
```

### Alert Rules (Prometheus)

```yaml
groups:
- name: geonera.pipeline
  rules:
  - alert: InferenceWorkerDown
    expr: up{job="tft-inference"} == 0
    for: 2m
    labels: { severity: critical }
    annotations:
      summary: "TFT inference worker is down"

  - alert: RabbitMQQueueDepthHigh
    expr: rabbitmq_queue_messages{queue=~".*inference.*"} > 20
    for: 5m
    labels: { severity: warning }
    annotations:
      summary: "Inference request queue is backing up"

  - alert: DailyDrawdownBreached
    expr: geonera_daily_pnl_usd < -(geonera_account_equity_usd * 0.03)
    for: 0m
    labels: { severity: critical }
    annotations:
      summary: "Daily drawdown limit reached — signal approvals halted"

  - alert: JForexDisconnected
    expr: geonera_jforex_connection_status{status="connected"} == 0
    for: 1m
    labels: { severity: critical }
    annotations:
      summary: "JForex connection lost — no order execution possible"

  - alert: ModelDriftDetected
    expr: geonera_meta_model_recent_accuracy < 0.48
    for: 30m
    labels: { severity: warning }
    annotations:
      summary: "Meta model accuracy below baseline — check model performance"

  - alert: ClickHouseSlowInsert
    expr: histogram_quantile(0.99, geonera_tick_insert_duration_seconds_bucket) > 0.5
    for: 10m
    labels: { severity: warning }
    annotations:
      summary: "ClickHouse insert latency high — check disk I/O"
```

### Notification Channels

| Channel | Use Case | Priority |
|---|---|---|
| PagerDuty | On-call escalation for critical issues (JForex down, drawdown breach) | Critical |
| Slack #trading-alerts | Real-time trading events (signal approved, order filled, drawdown warning) | High |
| Slack #ml-alerts | Model drift, training job completion, validation results | Medium |
| Slack #infra-alerts | Infrastructure health (pod restarts, storage, CPU) | Medium |
| Email | Weekly summary report, backtest completion | Low |

---

## Dashboards

### Dashboard: Trading Overview
- Current open positions (count, direction, unrealized PnL)
- Today's realized PnL (absolute and % of equity)
- Signal pipeline throughput (signals generated / scored / approved / rejected per hour)
- Account equity chart (intraday)
- Active drawdown state (green / yellow / red)

### Dashboard: Signal Pipeline
- Forecasts generated per instrument per hour
- Signal candidates generated → meta score distribution → approval rate
- Meta model score histogram (real-time)
- Rejection reason breakdown (risk service)
- End-to-end signal latency (bar close → order submitted)

### Dashboard: ML Model Health
- TFT inference latency histogram (p50, p95, p99)
- Meta model score entropy (low entropy = model not discriminating)
- Recent signal outcomes (profit vs loss rate; last 50 closed trades)
- Model version in use per instrument
- Training job status

### Dashboard: Infrastructure
- CPU and memory utilization per service pod
- ClickHouse query latency and insert throughput
- RabbitMQ queue depths and consumer counts
- PostgreSQL active connections, replication lag
- GPU utilization (Python inference workers)

### Dashboard: Data Pipeline
- Ticks ingested per minute per instrument
- bi5 download success/failure rate
- Feature store update latency (M1 close → features written)
- Data gap alerts (missing M1 bars)
- ClickHouse storage usage trend

---

## ML Model Performance Monitoring

ML models degrade over time as market regimes change. Monitoring ensures degradation is detected before it impacts trading performance.

### Metrics Monitored

| Metric | Collection Method | Alert Threshold |
|---|---|---|
| Recent signal win rate | Count closed positions in last 50 trades | < 40% |
| Meta model score distribution shift | KL divergence vs training distribution | > 0.1 |
| TFT directional accuracy | Compare Q50 direction vs actual bar direction (last 100 inferences) | < 48% |
| Meta model calibration | Compare meta_score deciles vs actual win rates | Deviation > 15% in any decile |
| Feature distribution shift | Z-score of recent features vs training mean/std | Mean z-score > 2.0 |

### Data Drift Detection
- Feature distributions compared against training-time statistics (stored in PostgreSQL `model_registry`)
- Z-score computed per feature; flagged features trigger WARN log
- Population Stability Index (PSI) computed monthly; PSI > 0.2 triggers model retraining

---

## Business Metrics Monitoring

| Metric | Description | Dashboard Location |
|---|---|---|
| Account equity | Current account balance (USD) | Trading Overview |
| Daily PnL | Realized profit/loss for the day | Trading Overview |
| Weekly PnL | Rolling 7-day realized PnL | Trading Overview |
| Win rate (rolling 30d) | % of closed positions that were profitable | Trading Overview |
| Avg R:R realized | Average actual risk-reward of closed trades | Signal Pipeline |
| Total open exposure | Notional value of all open positions | Trading Overview |
| Signal yield | % of forecasts → at least one approved signal | Signal Pipeline |
| Model version active | Currently serving TFT and meta model versions | ML Model Health |

---

## Health Checks

Each service exposes:
- **`/health/live`** — liveness check (responds if process is running; failure = restart)
- **`/health/ready`** — readiness check (responds if service can handle traffic; failure = remove from load balancer)

### Readiness Check Conditions Per Service

| Service | Readiness Conditions |
|---|---|
| Go Ingestor | ClickHouse connection OK; RabbitMQ connection OK |
| Python TFT Inference | Model loaded in memory; ClickHouse connection OK; RabbitMQ connection OK |
| C# Signal Service | PostgreSQL connection OK; RabbitMQ connection OK |
| C# Risk Service | PostgreSQL connection OK; RabbitMQ connection OK; account state loaded |
| Java JForex Engine | JForex API connected; authenticated; subscribed to instruments |
| Admin UI | Bun server running; API gateway reachable |

---

## Failure Scenarios

| Scenario | Detection | Response |
|---|---|---|
| Prometheus scrape failure | `up{job="..."} == 0` alert | Investigate service /metrics endpoint; check network policy |
| Grafana data source unavailable | Grafana shows "no data" | Check Prometheus server health; check datasource URL |
| Alertmanager misconfiguration | Alerts fire but notifications not received | Test with `amtool alert add`; verify receiver config |
| Log shipper down | Loki/Elasticsearch shows no new logs | Check Promtail/Filebeat pod health; verify log file paths |
| Alert fatigue | Too many non-critical alerts suppressed | Review alert thresholds; add inhibit rules for cascading alerts |
| Model metrics not updating | Score distribution frozen | Check meta model worker; verify PostgreSQL signal outcome updates |

---

## Performance Considerations

- **Prometheus scrape interval:** 15s is the default. Reducing to 5s increases metric resolution but triples storage and CPU load on Prometheus. 15s is sufficient for Geonera's latency requirements.
- **Metrics cardinality:** Avoid high-cardinality labels (e.g., `signal_id` as a Prometheus label). Use signal IDs in logs, not metrics.
- **Loki query performance:** Log queries with time range + service label filter are fast. Full-text scan across all services is slow. Encourage developers to use labels for filtering.
- **Grafana dashboard load:** Each dashboard panel issues a Prometheus/Loki query on load. Limit dashboards to < 20 panels; use time range selectors to limit data volume.
- **Log volume estimate:** At 50,000 ticks/sec across 10 instruments, Go ingestor produces ~1 INFO log per batch (every 100ms) = ~600 log lines/min. Total system log volume: ~5,000-10,000 lines/min. Loki handles this efficiently with label-based indexing.
