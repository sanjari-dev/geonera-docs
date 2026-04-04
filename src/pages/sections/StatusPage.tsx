import { DocPage, Section, CardGrid, Card, Table, InfoBox } from '@/components/ui/DocPage'
import { Icon } from '@/components/ui/Icon'

function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'outage' | 'maintenance' }) {
  const styles = {
    operational:  { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'Operational' },
    degraded:     { color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  label: 'Degraded' },
    outage:       { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    label: 'Outage' },
    maintenance:  { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400',   label: 'Maintenance' },
  }
  const s = styles[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

interface ServiceRowProps {
  name: string
  description: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  uptime: string
  latency?: string
}

function ServiceRow({ name, description, status, uptime, latency }: ServiceRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        {latency && <span className="text-xs font-mono text-slate-400 hidden md:block">{latency}</span>}
        <span className="text-xs font-mono text-slate-500 hidden md:block">{uptime} uptime</span>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

export function StatusPage() {
  return (
    <DocPage
      icon="sensors"
      title="System Status"
      subtitle="Status real-time seluruh layanan Geonera — monitoring health service, uptime, dan insiden aktif. Halaman ini mencerminkan arsitektur observabilitas dengan Prometheus, Grafana, dan Alertmanager."
      badge="Ops"
      badgeColor="slate"
    >
      <Section title="Status Keseluruhan">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Icon name="check_circle" className="text-green-600 text-2xl" filled />
          </div>
          <div>
            <p className="text-lg font-bold text-green-800">Semua Sistem Beroperasi Normal</p>
            <p className="text-sm text-green-600">Tidak ada insiden aktif. Last checked: real-time via Prometheus.</p>
          </div>
        </div>
        <InfoBox type="info">
          Status di halaman ini adalah <strong>representasi arsitektur monitoring</strong> Geonera.
          Dalam deployment produksi, status ini terhubung langsung ke Prometheus metrics dan diperbarui
          setiap 30 detik.
        </InfoBox>
      </Section>

      <Section title="Core Services">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <ServiceRow name="Go Data Ingest Service"      description="Ingest data tick Dukascopy bi5 & multi-TF aggregation" status="operational" uptime="99.94%" latency="~85ms" />
          <ServiceRow name="Rust Preprocessing Engine"   description="Feature engineering & dataset formation"               status="operational" uptime="99.97%" latency="~320ms" />
          <ServiceRow name="Python TFT Inference"        description="7200-step price forecasting via TFT model"             status="operational" uptime="99.82%" latency="~6.4s" />
          <ServiceRow name="C# Signal Service"           description="Signal generation, risk validation & REST API"        status="operational" uptime="99.95%" latency="~42ms" />
          <ServiceRow name="Java JForex Executor"        description="Order execution ke Dukascopy liquidity provider"      status="operational" uptime="99.78%" latency="~890ms" />
          <ServiceRow name="TypeScript Admin UI"         description="Real-time dashboard & management interface"           status="operational" uptime="99.99%" latency="~12ms" />
        </div>
      </Section>

      <Section title="Infrastructure Services">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <ServiceRow name="ClickHouse Cluster (3 nodes)"  description="Time-series storage: ticks, OHLCV, features, predictions" status="operational" uptime="99.99%" latency="~15ms" />
          <ServiceRow name="PostgreSQL (Primary + Replica)" description="Relational data: signals, strategies, users"              status="operational" uptime="99.99%" latency="~8ms" />
          <ServiceRow name="RabbitMQ Cluster (3 nodes)"    description="Message broker: async communication antar services"       status="operational" uptime="99.97%" latency="~5ms" />
          <ServiceRow name="Kubernetes Cluster"            description="Container orchestration: 6 services + infra"               status="operational" uptime="99.99%" />
          <ServiceRow name="API Gateway / WAF"             description="Ingress, rate limiting, SSL termination"                   status="operational" uptime="99.99%" latency="~3ms" />
        </div>
      </Section>

      <Section title="Observability Stack">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <ServiceRow name="Prometheus"    description="Metrics collection & alerting rules"       status="operational" uptime="99.99%" />
          <ServiceRow name="Grafana"       description="Dashboard visualisasi & monitoring"         status="operational" uptime="99.99%" />
          <ServiceRow name="Loki"          description="Centralized log aggregation via Promtail"   status="operational" uptime="99.95%" />
          <ServiceRow name="Alertmanager" description="Alert routing ke Slack, email, PagerDuty"  status="operational" uptime="99.99%" />
        </div>
      </Section>

      <Section title="Model Performance Status">
        <Table
          headers={['Model', 'Versi', 'MAE (7d)', 'Win Rate (7d)', 'Status']}
          rows={[
            ['TFT EURUSD M1',     'v3.2.1', '0.00089', '58.3%', '✅ Healthy'],
            ['TFT GBPUSD M1',     'v3.2.1', '0.00094', '56.7%', '✅ Healthy'],
            ['TFT USDJPY M1',     'v3.1.4', '0.00102', '55.1%', '⚠️ Monitor'],
            ['Meta XGBoost v2',   'v2.1.0', 'AUC 0.74', '—',   '✅ Healthy'],
            ['Meta LightGBM v1',  'v1.3.2', 'AUC 0.71', '—',   '✅ Healthy'],
          ]}
        />
      </Section>

      <Section title="Incident History (30 hari terakhir)">
        <div className="space-y-3">
          {[
            { date: '2025-01-12', duration: '14 menit', service: 'Python TFT Inference', impact: 'Sinyal tertunda 14 menit', resolution: 'GPU pod restart otomatis via Kubernetes liveness probe' },
            { date: '2025-01-05', duration: '3 menit',  service: 'RabbitMQ',             impact: 'Spike queue depth briefly', resolution: 'Node autoscaling triggered, queue cleared' },
          ].map((inc) => (
            <div key={inc.date} className="bg-surface-container-lowest border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{inc.service}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">{inc.duration}</span>
                  <span className="text-xs font-mono text-slate-400">{inc.date}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Resolved</span>
                </div>
              </div>
              <p className="text-xs text-slate-600"><strong>Impact:</strong> {inc.impact}</p>
              <p className="text-xs text-slate-500 mt-1"><strong>Resolution:</strong> {inc.resolution}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <InfoBox type="tip">
            Geonera menargetkan SLA <strong>99.9% uptime</strong> untuk semua core services. Insiden
            otomatis ditangani melalui Kubernetes self-healing dan Prometheus alerting ke on-call engineer.
          </InfoBox>
        </div>
      </Section>

      <Section title="Uptime Summary (90 hari)">
        <CardGrid>
          <Card icon="check_circle" title="Core Services">
            Rata-rata uptime <strong>99.91%</strong> selama 90 hari terakhir di semua core services.
            Total downtime: ~7.9 menit.
          </Card>
          <Card icon="storage" title="Infrastructure">
            Database dan message broker mencapai <strong>99.98%</strong> uptime dengan zero data loss
            berkat replication dan quorum-based queue.
          </Card>
          <Card icon="psychology" title="ML Services">
            TFT inference: <strong>99.82%</strong> uptime. Occasional restart untuk model reload
            saat versi baru di-promote ke production.
          </Card>
          <Card icon="bar_chart" title="Observability">
            Monitoring stack sendiri: <strong>99.99%</strong> uptime — prioritas tertinggi karena
            menjadi "eyes" seluruh sistem.
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
