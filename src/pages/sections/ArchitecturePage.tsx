import { DocPage, Section, CardGrid, Card, Table, InfoBox, TagList } from '@/components/ui/DocPage'

export function ArchitecturePage() {
  return (
    <DocPage
      icon="architecture"
      title="Core Architecture"
      subtitle="Arsitektur polyglot microservices yang dirancang untuk prediksi pasar finansial secara real-time dengan pendekatan sistem terdistribusi dan pemrosesan data berperforma tinggi."
      badge="Core"
      badgeColor="blue"
    >
      <Section title="Overview">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Geonera dibangun di atas arsitektur <strong>polyglot microservices</strong> — setiap bahasa dipilih berdasarkan
          keunggulan spesifiknya untuk domain tertentu. Sistem ini dirancang agar scalable, fault-tolerant, dan mampu
          merespons perubahan kondisi pasar secara real-time.
        </p>
        <TagList tags={[
          { label: 'Go',         color: 'bg-teal-100 text-teal-700' },
          { label: 'Rust',       color: 'bg-orange-100 text-orange-700' },
          { label: 'Python',     color: 'bg-blue-100 text-blue-700' },
          { label: 'C#',         color: 'bg-purple-100 text-purple-700' },
          { label: 'Java',       color: 'bg-red-100 text-red-700' },
          { label: 'TypeScript', color: 'bg-yellow-100 text-yellow-700' },
        ]} />
      </Section>

      <Section title="Language Stack">
        <Table
          headers={['Bahasa', 'Runtime / Framework', 'Domain', 'Alasan Pemilihan']}
          rows={[
            ['Go',         'Native binary',       'Data Ingest & Transform',        'Concurrency tinggi, latency rendah untuk stream data pasar'],
            ['Rust',       'Native binary',       'HPC Preprocessing & Dataset',    'Zero-cost abstraction, memory safety untuk komputasi intensif'],
            ['Python',     'CPython / CUDA',      'AI Model Dev & Training',         'Ekosistem ML terlengkap: PyTorch, Darts, scikit-learn'],
            ['C#',         '.NET / ASP.NET Core', 'Backend Microservices & REST API','Performa tinggi, typing kuat, mature ecosystem untuk enterprise'],
            ['Java',       'JVM / JForex SDK',    'JForex Trading Integration',     'Satu-satunya SDK resmi Dukascopy untuk eksekusi order ke broker'],
            ['TypeScript', 'Bun',                 'Admin UI & Monitoring',           'Type-safe frontend dengan runtime Bun yang lebih cepat dari Node'],
          ]}
        />
      </Section>

      <Section title="System Components">
        <CardGrid>
          <Card icon="download" title="Data Ingest Layer (Go)">
            Mengambil data historis granular dari Dukascopy dalam format <strong>bi5</strong> (tick data terkompresi)
            dan streaming data pasar real-time. Melakukan transformasi ke format multi-timeframe (M1, M5, M15, H1, dst).
          </Card>
          <Card icon="memory" title="Preprocessing Engine (Rust)">
            Komputasi berperforma tinggi untuk feature engineering: kalkulasi indikator teknikal (RSI, MACD, Bollinger Bands),
            normalisasi statistik, dan pembentukan dataset training untuk model AI.
          </Card>
          <Card icon="psychology" title="AI/ML Pipeline (Python)">
            Training dan serving <strong>Temporal Fusion Transformer (TFT)</strong> untuk prediksi multi-step 7200 menit ke depan.
            Meta-model <strong>XGBoost/LightGBM</strong> untuk klasifikasi probabilitas profit/loss setiap sinyal.
          </Card>
          <Card icon="api" title="Backend Services (C#)">
            Microservices berbasis ASP.NET Core yang menyediakan REST API untuk sinyal trading, manajemen model, evaluasi,
            dan risk management. Komunikasi internal melalui RabbitMQ.
          </Card>
          <Card icon="swap_horiz" title="Trading Execution (Java)">
            Integrasi eksklusif dengan <strong>JForex SDK</strong> dari Dukascopy untuk eksekusi transaksi ke liquidity
            provider. Menangani order management, position tracking, dan komunikasi dengan broker.
          </Card>
          <Card icon="monitor" title="Admin Interface (TypeScript/Bun)">
            Dashboard real-time untuk monitoring sinyal, evaluasi performa model, dan pengelolaan konfigurasi strategi
            trading. Berjalan di atas runtime Bun untuk performa optimal.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Data Flow">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto">
          <div className="text-slate-500 mb-3">{'// Alur data dari sumber ke eksekusi'}</div>
          <div><span className="text-teal-400">Dukascopy (bi5)</span> <span className="text-slate-500">──────►</span> <span className="text-green-400">[Go Ingest]</span> <span className="text-slate-500">──►</span> <span className="text-slate-400">ClickHouse (raw ticks)</span></div>
          <div className="ml-8 text-slate-500">│</div>
          <div className="ml-8"><span className="text-slate-500">▼</span></div>
          <div><span className="text-slate-400 ml-8">[Multi-TF OHLCV]</span> <span className="text-slate-500">──►</span> <span className="text-orange-400">[Rust Preprocess]</span> <span className="text-slate-500">──►</span> <span className="text-slate-400">Feature Matrix</span></div>
          <div className="ml-8 text-slate-500">│</div>
          <div className="ml-8"><span className="text-slate-500">▼</span></div>
          <div><span className="text-blue-400 ml-8">[Python TFT]</span> <span className="text-slate-500">──────────────►</span> <span className="text-slate-400">7200-step Price Forecast</span></div>
          <div className="ml-8 text-slate-500">│</div>
          <div className="ml-8"><span className="text-slate-500">▼</span></div>
          <div><span className="text-purple-400 ml-8">[C# Signal Engine]</span> <span className="text-slate-500">──►</span> <span className="text-blue-400">[XGBoost Meta]</span> <span className="text-slate-500">──►</span> <span className="text-slate-400">Signal Candidates</span></div>
          <div className="ml-8 text-slate-500">│</div>
          <div className="ml-8"><span className="text-slate-500">▼</span></div>
          <div><span className="text-red-400 ml-8">[Java JForex]</span> <span className="text-slate-500">────────────────────►</span> <span className="text-slate-400">Order Execution (Broker)</span></div>
        </div>
      </Section>

      <Section title="Communication Pattern">
        <InfoBox type="info">
          Semua komunikasi antar microservices dilakukan secara <strong>asynchronous</strong> melalui <strong>RabbitMQ</strong> sebagai
          message broker, memastikan loose coupling dan resiliensi sistem saat terjadi kegagalan layanan parsial.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Pattern', 'Digunakan Untuk', 'Teknologi']}
            rows={[
              ['Pub/Sub',           'Distribusi sinyal trading ke konsumer',    'RabbitMQ Fanout Exchange'],
              ['Work Queue',        'Task ingest & preprocessing antri',         'RabbitMQ Direct Exchange'],
              ['RPC over Queue',    'Request prediction dari C# ke Python',      'RabbitMQ + Correlation ID'],
              ['REST API',          'Antarmuka eksternal admin & klien',          'ASP.NET Core + OpenAPI'],
              ['Direct DB Access',  'Query analitik dan data relasional',         'ClickHouse + PostgreSQL'],
            ]}
          />
        </div>
      </Section>
    </DocPage>
  )
}
