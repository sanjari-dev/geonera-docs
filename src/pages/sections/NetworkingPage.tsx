import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function NetworkingPage() {
  return (
    <DocPage
      icon="lan"
      title="Networking"
      subtitle="Arsitektur komunikasi asynchronous berbasis RabbitMQ sebagai message broker utama, dengan REST API untuk akses eksternal, service mesh untuk keamanan internal, dan integrasi JForex untuk eksekusi ke broker Dukascopy."
      badge="Cloud"
      badgeColor="teal"
    >
      <Section title="Topology Komunikasi">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto">
          <div className="text-slate-500 mb-3">{'// Service communication topology'}</div>
          <div><span className="text-slate-500">Internet</span> <span className="text-slate-600">──► </span><span className="text-yellow-400">[API Gateway / WAF]</span> <span className="text-slate-600">──►</span> <span className="text-purple-400">[C# Microservices]</span></div>
          <div className="ml-32 text-slate-600">│</div>
          <div className="ml-32 text-slate-600">▼</div>
          <div className="ml-20"><span className="text-orange-400">[RabbitMQ Cluster]</span> <span className="text-slate-600">◄──────────────────────────────►</span> <span className="text-slate-300">semua services</span></div>
          <div className="ml-32 text-slate-600">│</div>
          <div className="flex gap-12 ml-6 mt-1">
            <div><span className="text-teal-400">[Go Ingest]</span></div>
            <div><span className="text-orange-400">[Rust HPC]</span></div>
            <div><span className="text-blue-400">[Python AI]</span></div>
            <div><span className="text-red-400">[Java JForex]</span></div>
          </div>
          <div className="ml-32 text-slate-600 mt-1">│</div>
          <div className="ml-20 mt-1"><span className="text-slate-400">[ClickHouse Cluster]</span>  <span className="text-slate-600">+</span>  <span className="text-slate-400">[PostgreSQL+Replica]</span></div>
          <div className="mt-3 text-slate-500">{'// mTLS antara semua service di private VPC subnet'}</div>
        </div>
      </Section>

      <Section title="RabbitMQ — Message Broker">
        <InfoBox type="info">
          RabbitMQ dipilih karena mendukung berbagai exchange pattern (Fanout, Direct, Topic), mature,
          memiliki management UI yang memudahkan monitoring, dan mendukung <strong>quorum queues</strong>
          untuk high availability. Semua queue dikonfigurasi dengan <strong>durable: true</strong> dan
          <strong> message persistence</strong> untuk mencegah kehilangan data saat restart.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Exchange', 'Type', 'Binding', 'Producer', 'Consumer']}
            rows={[
              ['geonera.ticks',       'Fanout', '—',                  'Go Ingest',        'Rust Preprocess, C# Monitor'],
              ['geonera.features',    'Direct', 'routing_key=symbol', 'Rust Preprocess',  'Python TFT Trainer'],
              ['geonera.predictions', 'Topic',  'symbol.timeframe',   'Python TFT',       'C# Signal Engine'],
              ['geonera.signals',     'Fanout', '—',                  'C# Signal Engine', 'Java JForex, C# Notify, Mobile Push'],
              ['geonera.execution',   'Direct', 'priority.symbol',    'C# Signal Engine', 'Java JForex Executor'],
              ['geonera.events',      'Topic',  'service.event.level','Semua service',    'C# Event Handler, Grafana'],
              ['geonera.dlx',         'Direct', 'failed.*',           '(Dead-letter)',     'C# Error Handler'],
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
    "x-queue-type":             "quorum",        // high availability (Raft consensus)
    "x-message-ttl":            3600000,          // 1 jam TTL
    "x-max-length":             10000,            // max 10k pesan antri
    "x-overflow":               "reject-publish", // tolak publisher jika penuh
    "x-dead-letter-exchange":   "geonera.dlx",
    "x-dead-letter-routing-key":"signals.failed"
  }
}

// Quorum queue untuk high availability
// - 3 node RabbitMQ, membutuhkan quorum (2 dari 3) untuk write
// - Toleransi 1 node failure tanpa kehilangan message`}</CodeBlock>
        <div className="mt-4">
          <Table
            headers={['Queue', 'Type', 'TTL', 'Max Length', 'DLX']}
            rows={[
              ['geonera.ticks.ingest',         'Quorum', '5 menit',  '50.000', 'geonera.dlx'],
              ['geonera.features.compute',      'Quorum', '30 menit', '1.000',  'geonera.dlx'],
              ['geonera.predictions.pending',   'Quorum', '1 jam',    '500',    'geonera.dlx'],
              ['geonera.signals.processing',    'Quorum', '1 jam',    '10.000', 'geonera.dlx'],
              ['geonera.execution.priority',    'Quorum', '15 menit', '100',    'geonera.dlx'],
              ['geonera.alerts.dispatch',       'Classic','10 menit', '5.000',  '—'],
            ]}
          />
        </div>
      </Section>

      <Section title="API Gateway">
        <CardGrid>
          <Card icon="router" title="Routing & Load Balancing">
            API Gateway (NGINX / Kong) bertindak sebagai single entry point untuk semua request eksternal.
            Melakukan routing ke microservice yang tepat berdasarkan path prefix:
            <code>/v1/signals/*</code>, <code>/v1/models/*</code>, <code>/v1/risk/*</code>.
            Load balancing menggunakan round-robin ke multiple C# replicas.
          </Card>
          <Card icon="security" title="WAF & Rate Limiting">
            Web Application Firewall untuk filter traffic berbahaya: SQL injection, XSS, path traversal.
            Rate limiting per IP dan per API key diterapkan di layer gateway sebelum mencapai microservices.
          </Card>
          <Card icon="lock" title="SSL Termination">
            TLS 1.3 terminated di API Gateway. Sertifikat dikelola menggunakan Let's Encrypt + cert-manager
            (Kubernetes) dengan auto-renewal. Upstream ke microservice menggunakan HTTP/2 over mTLS.
          </Card>
          <Card icon="compress" title="Response Compression">
            Gzip / Brotli compression untuk semua response JSON &gt; 1KB.
            HTTP/2 multiplexing untuk mengurangi overhead koneksi dari admin UI dan mobile client.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Service Mesh — Internal mTLS">
        <InfoBox type="info">
          Komunikasi antar microservice dalam cluster menggunakan <strong>mutual TLS (mTLS)</strong>
          via service mesh (Istio atau Linkerd). Setiap service memiliki sertifikat identity yang
          di-rotate secara otomatis setiap 24 jam. Ini memastikan tidak ada service palsu yang
          dapat mengikuti komunikasi internal.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Fitur Service Mesh', 'Implementasi', 'Manfaat']}
            rows={[
              ['mTLS otomatis',        'Sidecar proxy (Envoy)',             'Enkripsi + autentikasi antar service'],
              ['Certificate rotation', 'Cert-manager / SPIFFE/SPIRE',      'Auto-rotate setiap 24 jam, zero downtime'],
              ['Traffic policy',       'DestinationRule per service',       'Retry, timeout, circuit breaking per route'],
              ['Observability',        'Envoy metrics → Prometheus',        'Request trace, latency, error rate'],
              ['Authorization policy', 'PeerAuthentication + AuthorizationPolicy', 'Only Go can publish ke RabbitMQ ticks exchange'],
            ]}
          />
        </div>
      </Section>

      <Section title="Circuit Breaking & Resilience">
        <CardGrid>
          <Card icon="electric_bolt" title="Circuit Breaker">
            Setiap pemanggilan antar service menggunakan circuit breaker pattern. Jika error rate
            melewati threshold (misal 50% dalam 10 detik), circuit "terbuka" dan request langsung
            gagal tanpa menunggu timeout — melindungi service upstream dari kaskade failure.
          </Card>
          <Card icon="replay" title="Retry with Backoff">
            Retry otomatis dengan <strong>exponential backoff</strong> untuk transient error (HTTP 503,
            timeout). Maksimum 3 retry dengan jitter untuk menghindari thundering herd saat service
            pulih dari downtime singkat.
          </Card>
          <Card icon="timer" title="Timeout Policies">
            Setiap route memiliki timeout yang dikonfigurasi sesuai SLA-nya. TFT inference (10s),
            signal classification (2s), order execution (5s). Request yang melewati timeout
            di-cancel dan masuk dead-letter queue untuk analisis.
          </Card>
          <Card icon="health_and_safety" title="Health Checks">
            Liveness probe (<code>/healthz</code>) dan readiness probe (<code>/ready</code>) pada
            setiap service. Kubernetes tidak mengirim traffic ke pod yang readiness probe-nya gagal,
            memungkinkan deployment graceful tanpa downtime.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="yaml">{`# Istio DestinationRule — circuit breaker untuk Python TFT service
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: tft-inference-cb
spec:
  host: tft-inference-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 10
      http:
        http1MaxPendingRequests: 20
        maxRequestsPerConnection: 5
    outlierDetection:
      consecutiveGatewayErrors: 5     # buka circuit setelah 5 error berurutan
      interval: 10s                    # evaluasi setiap 10 detik
      baseEjectionTime: 30s            # eject selama 30 detik
      maxEjectionPercent: 50           # maksimum 50% pod di-eject
    loadBalancer:
      simple: LEAST_CONN              # pilih pod dengan koneksi paling sedikit`}</CodeBlock>
        </div>
      </Section>

      <Section title="JForex Integration (Java)">
        <InfoBox type="warning">
          JForex SDK dari Dukascopy hanya tersedia di Java/JVM. Service ini berkomunikasi dengan
          C# melalui RabbitMQ dan tidak mengekspos REST API publik — hanya sebagai consumer/executor
          yang menerima sinyal dan mengeksekusi order ke liquidity provider Dukascopy.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Fungsi', 'Protocol', 'Keterangan']}
            rows={[
              ['Terima sinyal baru',    'RabbitMQ consumer',      'Consume dari queue geonera.execution.priority'],
              ['Eksekusi order',        'JForex SDK (WebSocket)', 'Submit market/limit order ke Dukascopy LP'],
              ['Update posisi',         'JForex event handler',   'Fill, modify, close events dari broker'],
              ['Kirim hasil eksekusi',  'RabbitMQ publisher',     'Publish ke geonera.events dengan detail fill'],
              ['Data pasar real-time',  'JForex price feed',      'Streaming harga live untuk monitoring posisi'],
              ['Reconnect ke broker',   'JForex auto-reconnect',  'Reconnect otomatis jika koneksi WS ke Dukascopy putus'],
            ]}
          />
        </div>
        <div className="mt-4">
          <CodeBlock lang="java">{`// Java — Consume sinyal dari RabbitMQ dan eksekusi via JForex
public class SignalExecutor implements DeliverCallback {

    private final IEngine engine;    // JForex trading engine
    private final Channel  rmqChannel;

    @Override
    public void handle(String tag, Delivery delivery) {
        try {
            var signal = parseSignal(delivery.getBody());

            // Validasi ulang risk sebelum eksekusi
            if (!riskGuard.canExecute(signal)) {
                nack(delivery, false);
                return;
            }

            // Submit order ke Dukascopy liquidity provider
            IOrder order = engine.submitOrder(
                signal.getLabel(),
                Instrument.fromString(signal.getSymbol()),
                signal.isLong() ? OrderCommand.BUY : OrderCommand.SELL,
                signal.getLotSize(),
                0,                   // market order (price=0)
                signal.getSlippage(),
                signal.getStopLoss(),
                signal.getTakeProfit()
            );

            publishFillEvent(signal, order);
            ack(delivery);

        } catch (Exception e) {
            log.error("Execution failed for signal {}", signal.getId(), e);
            nack(delivery, true);   // requeue untuk retry
        }
    }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Network Security">
        <Table
          headers={['Layer', 'Implementasi']}
          rows={[
            ['Edge',          'TLS 1.3 di API Gateway; WAF (OWASP rule set); DDoS protection via CDN'],
            ['Transport',     'mTLS antar microservice via service mesh sidecar (Envoy/Linkerd proxy)'],
            ['Network',       'VPC private subnet untuk service internal; API Gateway satu-satunya public endpoint'],
            ['Firewall',      'Security group: setiap service hanya menerima traffic dari service yang berwenang'],
            ['DNS',           'Internal DNS via Kubernetes CoreDNS; service discovery via Kubernetes Service names'],
            ['Broker Auth',   'RabbitMQ: virtual host per environment; user per service dengan permission minimal'],
            ['Cert Rotation', 'mTLS certificates auto-rotate setiap 24 jam via cert-manager + SPIFFE'],
            ['Egress',        'Egress traffic keluar hanya diizinkan untuk Dukascopy endpoints (JForex WebSocket)'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
