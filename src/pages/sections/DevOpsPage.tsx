import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function DevOpsPage() {
  return (
    <DocPage
      icon="terminal"
      title="DevOps & Observability"
      subtitle="Stack observabilitas lengkap: logging terpusat dengan Loki, metrik real-time dengan Prometheus, visualisasi Grafana, dan sistem alerting untuk anomali dan degradasi performa."
      badge="DevOps"
      badgeColor="slate"
    >
      <Section title="Observability Stack">
        <CardGrid>
          <Card icon="article" title="Logging — Loki / Elasticsearch">
            Semua service mengirim log terstruktur (JSON) ke <strong>Grafana Loki</strong> via Promtail agent.
            Loki memungkinkan query log dengan LogQL tanpa indexing penuh, cost-efficient untuk volume tinggi.
            Alternatif: <strong>Elasticsearch + Kibana</strong> untuk full-text search yang lebih powerful.
          </Card>
          <Card icon="monitoring" title="Metrics — Prometheus">
            Setiap microservice mengekspos endpoint <code>/metrics</code> dalam format Prometheus.
            Prometheus melakukan scrape setiap 15 detik dan menyimpan time-series metrik untuk
            query dan alerting.
          </Card>
          <Card icon="bar_chart" title="Visualization — Grafana">
            Dashboard Grafana untuk monitoring seluruh aspek sistem: trading performance,
            model accuracy, system health, latency, throughput, dan resource utilization.
          </Card>
          <Card icon="notifications_active" title="Alerting — Alertmanager">
            Prometheus Alertmanager mengirim notifikasi via <strong>Slack, email, atau PagerDuty</strong>
            ketika alert rule terpicu: anomali performa model, kegagalan service, atau drawdown melebihi batas.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Key Metrics per Service">
        <Table
          headers={['Service', 'Metrik Utama', 'Alert Threshold']}
          rows={[
            ['Go Ingest',       'ingest_lag_seconds, ticks_per_second, bi5_parse_errors',       'lag > 30s'],
            ['Rust Preprocess', 'feature_compute_ms, dataset_rows_per_sec, memory_usage_mb',    'compute > 500ms'],
            ['Python TFT',      'inference_latency_ms, model_mae, prediction_drift_score',       'latency > 5s'],
            ['C# API',          'http_request_duration, error_rate_5xx, active_signals',         'error_rate > 1%'],
            ['Java JForex',     'order_execution_ms, broker_connection_status, slippage_pips',   'exec > 2s'],
            ['RabbitMQ',        'queue_depth, consumer_lag, message_publish_rate',               'depth > 10k'],
            ['ClickHouse',      'query_duration_ms, insert_rate_rows_per_sec, disk_usage',       'query > 10s'],
          ]}
        />
      </Section>

      <Section title="Grafana Dashboards">
        <Table
          headers={['Dashboard', 'Panel Utama', 'Refresh Rate']}
          rows={[
            ['Trading Overview',    'Active signals, Win rate (7d), PnL chart, Drawdown gauge',   '1m'],
            ['ML Model Health',     'TFT MAE trend, meta-model accuracy, prediction drift',        '5m'],
            ['System Health',       'CPU, Memory, Disk per service, Pod restart count',            '30s'],
            ['Data Pipeline',       'Ingest lag, preprocessing throughput, feature lag',           '15s'],
            ['API Performance',     'P50/P95/P99 latency, RPS, error rate heatmap',               '30s'],
            ['Risk Dashboard',      'Exposure per symbol, drawdown vs limit, daily PnL',           '1m'],
          ]}
        />
      </Section>

      <Section title="Logging Structure">
        <InfoBox type="tip">
          Semua log menggunakan format JSON terstruktur dengan field standar agar mudah di-query di Loki maupun Elasticsearch.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="json">{`// Contoh log terstruktur dari C# Signal Service
{
  "timestamp": "2025-01-15T08:30:01.234Z",
  "level": "INFO",
  "service": "signal-service",
  "version": "2.1.0",
  "trace_id": "abc123def456",
  "span_id": "789xyz",
  "event": "signal.generated",
  "signal_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "symbol": "EURUSD",
  "direction": "BUY",
  "prob_profit": 0.723,
  "duration_ms": 45
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Alert Rules">
        <CodeBlock lang="yaml">{`# prometheus/alerts.yml
groups:
  - name: geonera.trading
    rules:
      - alert: ModelAccuracyDegraded
        expr: tft_mae_7d > 0.0015
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Model MAE melebihi threshold selama 30 menit"

      - alert: MaxDrawdownBreached
        expr: portfolio_drawdown_pct > 15
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Drawdown melebihi batas maksimum 15%"
          action: "Emergency stop direkomendasikan"

      - alert: IngestLagHigh
        expr: data_ingest_lag_seconds > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Data ingest tertinggal lebih dari 60 detik"`}</CodeBlock>
      </Section>

      <Section title="CI/CD Pipeline">
        <Table
          headers={['Stage', 'Tool', 'Trigger', 'Aksi']}
          rows={[
            ['Lint & Format',  'golangci-lint, rustfmt, ruff, dotnet format', 'PR open',         'Cek kualitas kode'],
            ['Unit Tests',     'Go test, Rust test, pytest, xUnit',           'PR open',         'Jalankan unit tests'],
            ['Build',          'Docker buildx multi-arch',                     'Merge to main',   'Build image per service'],
            ['Integration',    'docker-compose test env',                      'Merge to main',   'Test antar service'],
            ['Model Validate', 'pytest + backtesting framework',               'Model PR',        'Validasi model baru'],
            ['Deploy Staging', 'Kubernetes (kubectl / Helm)',                   'Merge to main',   'Deploy ke staging'],
            ['Deploy Prod',    'Kubernetes + ArgoCD',                          'Manual approve',  'Canary deploy ke prod'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
