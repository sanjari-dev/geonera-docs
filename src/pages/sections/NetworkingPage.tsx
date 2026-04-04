import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function NetworkingPage() {
  return (
    <DocPage
      icon="lan"
      title="Networking"
      subtitle="Arsitektur komunikasi asynchronous berbasis RabbitMQ sebagai message broker utama, dengan REST API untuk akses eksternal dan integrasi JForex untuk eksekusi ke broker Dukascopy."
      badge="Cloud"
      badgeColor="teal"
    >
      <Section title="Topology Komunikasi">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto">
          <div className="text-slate-500 mb-3">{'// Service communication topology'}</div>
          <div><span className="text-slate-500">Internet</span> <span className="text-slate-600">──► </span><span className="text-yellow-400">[API Gateway / WAF]</span> <span className="text-slate-600">──►</span> <span className="text-purple-400">[C# Microservices]</span></div>
          <div className="ml-32 text-slate-600">│</div>
          <div className="ml-32 text-slate-600">▼</div>
          <div className="ml-20"><span className="text-orange-400">[RabbitMQ]</span> <span className="text-slate-600">◄──────────────────────────────►</span> <span className="text-slate-300">semua services</span></div>
          <div className="ml-32 text-slate-600">│</div>
          <div className="flex gap-16 ml-6 mt-1">
            <div><span className="text-teal-400">[Go Ingest]</span></div>
            <div><span className="text-orange-400">[Rust HPC]</span></div>
            <div><span className="text-blue-400">[Python AI]</span></div>
            <div><span className="text-red-400">[Java JForex]</span></div>
          </div>
          <div className="ml-32 text-slate-600 mt-1">│</div>
          <div className="ml-20 mt-1"><span className="text-slate-400">[ClickHouse]</span>  <span className="text-slate-600">+</span>  <span className="text-slate-400">[PostgreSQL]</span></div>
        </div>
      </Section>

      <Section title="RabbitMQ — Message Broker">
        <InfoBox type="info">
          RabbitMQ dipilih karena mendukung berbagai exchange pattern, mature, dan memiliki management UI yang
          memudahkan monitoring. Semua queue dikonfigurasi dengan <strong>durable: true</strong> dan
          <strong>message persistence</strong> untuk mencegah kehilangan data saat restart.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Exchange', 'Type', 'Binding', 'Producer', 'Consumer']}
            rows={[
              ['geonera.ticks',       'Fanout', '—',                   'Go Ingest',        'Rust Preprocess, C# Monitor'],
              ['geonera.features',    'Direct', 'routing_key=symbol',  'Rust Preprocess',  'Python TFT Trainer'],
              ['geonera.predictions', 'Topic',  'symbol.timeframe',    'Python TFT',       'C# Signal Engine'],
              ['geonera.signals',     'Fanout', '—',                   'C# Signal Engine', 'Java JForex, C# Notify'],
              ['geonera.execution',   'Direct', 'routing_key=priority','C# Signal Engine', 'Java JForex Executor'],
              ['geonera.events',      'Topic',  'service.event.level', 'Semua service',    'C# Event Handler'],
            ]}
          />
        </div>
      </Section>

      <Section title="Queue Configuration">
        <CodeBlock lang="json">{`// RabbitMQ queue definition (geonera.signals.processing)
{
  "name": "geonera.signals.processing",
  "durable": true,
  "auto_delete": false,
  "arguments": {
    "x-message-ttl": 3600000,      // 1 jam TTL
    "x-max-length": 10000,          // max 10k pesan
    "x-dead-letter-exchange": "geonera.dlx",
    "x-dead-letter-routing-key": "signals.failed",
    "x-queue-type": "quorum"        // high availability
  }
}`}</CodeBlock>
      </Section>

      <Section title="API Gateway">
        <CardGrid>
          <Card icon="router" title="Routing & Load Balancing">
            API Gateway (NGINX / Kong) bertindak sebagai single entry point untuk semua request eksternal.
            Melakukan routing ke microservice yang tepat berdasarkan path prefix:
            <code>/v1/signals/*</code>, <code>/v1/models/*</code>, dll.
          </Card>
          <Card icon="security" title="WAF & Rate Limiting">
            Web Application Firewall untuk filter traffic berbahaya. Rate limiting per IP dan per API key
            diterapkan di layer gateway sebelum mencapai microservices.
          </Card>
        </CardGrid>
      </Section>

      <Section title="JForex Integration (Java)">
        <InfoBox type="warning">
          JForex SDK dari Dukascopy hanya tersedia di Java/JVM. Service ini berkomunikasi dengan
          C# melalui RabbitMQ dan tidak mengekspos REST API publik — hanya sebagai consumer/executor.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Fungsi', 'Protocol', 'Keterangan']}
            rows={[
              ['Terima sinyal baru',   'RabbitMQ consumer',    'Consume dari queue geonera.execution'],
              ['Eksekusi order',       'JForex SDK (WebSocket)','Submit order ke Dukascopy liquidity provider'],
              ['Update posisi',        'JForex event handler', 'Fill, modify, close events dari broker'],
              ['Kirim hasil eksekusi', 'RabbitMQ publisher',   'Publish ke geonera.events dengan detail fill'],
              ['Data pasar real-time', 'JForex feed',          'Streaming harga live untuk monitoring posisi'],
            ]}
          />
        </div>
      </Section>

      <Section title="Network Security">
        <Table
          headers={['Layer', 'Implementasi']}
          rows={[
            ['Transport',    'TLS 1.3 untuk semua koneksi; mTLS untuk komunikasi antar-service'],
            ['Network',      'VPC private subnet untuk service internal; hanya API Gateway yang public'],
            ['Firewall',     'Security group: setiap service hanya menerima traffic dari service yang perlu'],
            ['DNS',          'Internal DNS resolusi via Kubernetes CoreDNS; tidak ada direct IP routing'],
            ['Broker Auth',  'RabbitMQ virtual host per environment (prod/staging); user per service'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
