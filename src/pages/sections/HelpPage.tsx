import { DocPage, Section, CardGrid, Card, Table, InfoBox } from '@/components/ui/DocPage'

export function HelpPage() {
  return (
    <DocPage
      icon="rocket_launch"
      title="Getting Started"
      subtitle="Panduan onboarding lengkap untuk developer dan trader baru di platform Geonera — dari setup environment lokal hingga memahami alur sinyal trading pertama Anda."
      badge="Guide"
      badgeColor="green"
    >
      <Section title="Apa itu Geonera?">
        <InfoBox type="tip">
          Geonera adalah platform <strong>AI-driven trading intelligence</strong> yang memprediksi pergerakan
          harga pasar finansial secara presisi menggunakan model deep learning Temporal Fusion Transformer (TFT),
          diperkuat meta-model XGBoost/LightGBM untuk klasifikasi sinyal, dan dieksekusi ke broker Dukascopy
          via JForex SDK.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="psychology" title="Untuk ML Engineer">
              Fokus pada ML Pipeline, Model Interpretability, dan Data Models. Pipeline dimulai dari
              data bi5 Dukascopy → feature engineering Rust → training TFT di Python → meta-model classifier.
            </Card>
            <Card icon="code" title="Untuk Backend Developer">
              Mulai dari Core Architecture dan API Reference. Backend utama C# ASP.NET Core menyediakan
              REST API dan mengorkestrasikan semua service via RabbitMQ.
            </Card>
            <Card icon="candlestick_chart" title="Untuk Trader / Risk Manager">
              Mulai dari Signal Generation dan Security (risk management). Pahami bagaimana sistem
              menghasilkan, memvalidasi, dan mengeksekusi sinyal trading.
            </Card>
            <Card icon="settings_input_component" title="Untuk DevOps Engineer">
              Mulai dari Infrastructure dan DevOps. Sistem berjalan di Kubernetes dengan observabilitas
              Prometheus + Grafana + Loki dan CI/CD berbasis GitHub Actions + ArgoCD.
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="Arsitektur Sekilas">
        <Table
          headers={['Komponen', 'Bahasa', 'Fungsi']}
          rows={[
            ['Data Ingest',       'Go',         'Ambil & parsing data tick Dukascopy bi5'],
            ['Preprocessing',     'Rust',       'Feature engineering berperforma tinggi'],
            ['AI Model',          'Python',     'Training & serving TFT + XGBoost meta-model'],
            ['Backend API',       'C#',         'REST API microservices, orchestration'],
            ['Trading Execution', 'Java',       'Integrasi JForex SDK ke Dukascopy broker'],
            ['Admin UI',          'TypeScript', 'Dashboard monitoring & manajemen sinyal'],
            ['Time-Series DB',    'ClickHouse', 'Penyimpanan tick, OHLCV, dan prediksi'],
            ['Relational DB',     'PostgreSQL', 'Sinyal, strategi, pengguna, audit log'],
            ['Message Broker',    'RabbitMQ',  'Komunikasi async antar microservices'],
          ]}
        />
      </Section>

      <Section title="Prerequisite untuk Developer">
        <Table
          headers={['Tools', 'Versi Minimum', 'Digunakan Untuk']}
          rows={[
            ['Docker + Docker Compose', '24.x',    'Menjalankan stack lokal'],
            ['Go',                      '1.22+',   'Service ingest'],
            ['Rust',                    '1.77+',   'Service preprocessing'],
            ['Python',                  '3.11+',   'ML pipeline'],
            ['Node.js / Bun',           'Bun 1.x', 'Admin UI'],
            ['.NET SDK',                '8.0+',    'C# backend services'],
            ['JDK',                     '21+',     'Java JForex integration'],
            ['kubectl + Helm',          'v1.29+',  'Deployment ke Kubernetes'],
          ]}
        />
      </Section>

      <Section title="Alur Kerja Utama">
        <CardGrid>
          <Card icon="looks_one" title="1. Setup Environment">
            Clone repo masing-masing service. Jalankan <code>docker-compose up</code> di repo
            <code>geonera-infra</code> untuk spin up ClickHouse, PostgreSQL, dan RabbitMQ secara lokal.
          </Card>
          <Card icon="looks_two" title="2. Ingest Data Historis">
            Jalankan Go ingest service untuk mengunduh data bi5 dari Dukascopy. Mulai dengan pair
            EURUSD dan periode 3 bulan terakhir untuk development/testing.
          </Card>
          <Card icon="looks_3" title="3. Jalankan Preprocessing">
            Rust service mengolah data mentah menjadi feature matrix. Output disimpan ke ClickHouse
            tabel <code>features</code>.
          </Card>
          <Card icon="looks_4" title="4. Training Model">
            Jalankan training script Python untuk TFT dan meta-model. Gunakan data minimal 6 bulan
            untuk hasil yang representatif.
          </Card>
          <Card icon="looks_5" title="5. Jalankan Backend">
            Start C# microservices (signal-service, risk-service, model-service). Verifikasi endpoint
            <code>GET /healthz</code> pada port 5000.
          </Card>
          <Card icon="looks_6" title="6. Buka Admin UI">
            Jalankan <code>bun run dev</code> di repo admin-ui. Dashboard tersedia di
            <code>http://localhost:3000</code>. Login dengan credential developer default.
          </Card>
        </CardGrid>
      </Section>

      <Section title="FAQ — Pertanyaan Umum">
        <div className="space-y-4">
          {[
            {
              q: 'Mengapa menggunakan TFT dan bukan LSTM atau Transformer biasa?',
              a: 'TFT dirancang khusus untuk time-series multi-variate dengan dukungan native untuk fitur statis, time-varying known (jam trading, kalender), dan time-varying unknown (indikator teknikal). Selain itu TFT menghasilkan distribusi kuantil (P10/P50/P90) yang esensial untuk estimasi risiko.',
            },
            {
              q: 'Mengapa Go untuk ingest dan bukan Python?',
              a: 'Go memiliki concurrency native (goroutine) yang jauh lebih efisien untuk I/O-bound tasks seperti parsing banyak file bi5 secara paralel dan streaming ke database. Python akan bottleneck di GIL untuk workload ini.',
            },
            {
              q: 'Kenapa Rust untuk preprocessing dan bukan C++?',
              a: 'Rust memberikan performa setara C++ namun dengan memory safety yang dijamin compiler — tidak ada buffer overflow atau use-after-free yang bisa merusak perhitungan feature. Ini kritis untuk komputasi finansial yang memerlukan akurasi tinggi.',
            },
            {
              q: 'Bagaimana cara menambah instrumen baru (misal GBPUSD)?',
              a: 'Tambahkan entry di tabel symbols di PostgreSQL, konfigurasi ingest service untuk simbol baru, tunggu data terkumpul minimal 6 bulan, kemudian jalankan training pipeline untuk simbol tersebut.',
            },
            {
              q: 'Apakah sinyal Geonera bisa dipakai di broker selain Dukascopy?',
              a: 'Saat ini eksekusi otomatis hanya mendukung Dukascopy via JForex SDK. Namun sinyal bisa diakses via API untuk eksekusi manual di broker lain atau integrasi dengan platform lain.',
            },
          ].map((item) => (
            <div key={item.q} className="bg-surface-container-lowest rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900 mb-2">Q: {item.q}</p>
              <p className="text-sm text-slate-600 leading-relaxed">A: {item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Kontak & Support">
        <Table
          headers={['Saluran', 'Untuk', 'Response Time']}
          rows={[
            ['Internal Slack #geonera-dev',   'Bug, pertanyaan teknis antar tim',          '< 4 jam'],
            ['GitHub Issues (repo spesifik)', 'Bug report dengan repro steps',              '< 2 hari kerja'],
            ['Confluence / Notion',           'Dokumentasi tambahan, ADR (Architecture Decision Records)', 'Async'],
            ['Weekly Sync Meeting',           'Diskusi arsitektur dan roadmap',             'Mingguan'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
