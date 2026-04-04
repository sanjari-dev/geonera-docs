import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function StoragePage() {
  return (
    <DocPage
      icon="storage"
      title="Storage"
      subtitle="Strategi penyimpanan data dual-database: ClickHouse untuk data time-series berperforma tinggi dan PostgreSQL untuk data relasional transaksional."
      badge="Data"
      badgeColor="teal"
    >
      <Section title="Database Strategy">
        <CardGrid>
          <Card icon="speed" title="ClickHouse — Time-Series Store">
            Database kolumnar OLAP yang dioptimalkan untuk query analitik pada data time-series skala besar.
            Digunakan untuk menyimpan seluruh data tick, OHLCV multi-timeframe, dan hasil prediksi model.
          </Card>
          <Card icon="table_chart" title="PostgreSQL — Relational Store">
            Database relasional ACID-compliant untuk data operasional: definisi sinyal, konfigurasi strategi,
            manajemen pengguna, audit log, dan metadata model.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <InfoBox type="info">
            Pemilihan dual-database mengikuti prinsip <strong>polyglot persistence</strong> — setiap jenis data
            disimpan di sistem yang paling optimal untuk akses pattern-nya.
          </InfoBox>
        </div>
      </Section>

      <Section title="ClickHouse Schema">
        <Table
          headers={['Table', 'Engine', 'Partisi', 'Kegunaan']}
          rows={[
            ['ticks',           'MergeTree',          'toYYYYMM(timestamp)',      'Raw tick data dari Dukascopy bi5'],
            ['ohlcv_m1',        'MergeTree',          'toYYYYMM(open_time)',      'Candlestick M1 per simbol'],
            ['ohlcv_m5',        'MergeTree',          'toYYYYMM(open_time)',      'Candlestick M5 per simbol'],
            ['ohlcv_h1',        'MergeTree',          'toYYYYMM(open_time)',      'Candlestick H1 per simbol'],
            ['features',        'MergeTree',          'toYYYYMM(timestamp)',      'Feature matrix hasil preprocessing Rust'],
            ['predictions',     'MergeTree',          'toYYYYMM(created_at)',     'Output TFT: 7200 step per prediksi'],
            ['signal_metrics',  'AggregatingMergeTree','toYYYYMM(evaluated_at)', 'Agregat performa sinyal harian'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="sql">{`-- Tabel utama OHLCV M1
CREATE TABLE ohlcv_m1 (
    symbol      LowCardinality(String),
    open_time   DateTime64(3, 'UTC'),
    open        Float64,
    high        Float64,
    low         Float64,
    close       Float64,
    ask_vol     Float32,
    bid_vol     Float32,
    spread_avg  Float32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(open_time)
ORDER BY (symbol, open_time)
TTL open_time + INTERVAL 5 YEAR;`}</CodeBlock>
        </div>
      </Section>

      <Section title="PostgreSQL Schema">
        <Table
          headers={['Table', 'Kegunaan', 'Relasi Utama']}
          rows={[
            ['symbols',         'Daftar instrumen yang dipantau',           '—'],
            ['strategies',      'Konfigurasi strategi (RR, target, horizon)','symbols'],
            ['models',          'Registry model AI (versi, path, metrics)', 'symbols'],
            ['signals',         'Sinyal trading yang dihasilkan',            'strategies, models'],
            ['positions',       'Posisi trading yang dieksekusi',            'signals'],
            ['users',           'Pengguna dan otorisasi',                    '—'],
            ['subscriptions',   'Langganan sinyal per pengguna (SaaS)',      'users, strategies'],
            ['audit_logs',      'Catatan semua aksi sistem',                 'users'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="sql">{`-- Tabel sinyal trading
CREATE TABLE signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id     UUID NOT NULL REFERENCES strategies(id),
    model_id        UUID NOT NULL REFERENCES models(id),
    symbol          VARCHAR(20) NOT NULL,
    direction       VARCHAR(4) CHECK (direction IN ('BUY','SELL')),
    entry_price     NUMERIC(18,6),
    stop_loss       NUMERIC(18,6),
    take_profit     NUMERIC(18,6),
    prob_profit     NUMERIC(5,4),    -- output meta-model [0.0-1.0]
    status          VARCHAR(20) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at    TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ
);`}</CodeBlock>
        </div>
      </Section>

      <Section title="Data Retention & Performance">
        <Table
          headers={['Data', 'Retensi', 'Strategi']}
          rows={[
            ['Raw ticks (bi5)',     '5 tahun',  'ClickHouse TTL + cold storage S3'],
            ['OHLCV M1',           '5 tahun',  'ClickHouse partisi per bulan'],
            ['Feature matrix',     '2 tahun',  'ClickHouse, hanya window aktif'],
            ['Predictions',        '1 tahun',  'ClickHouse, pruning otomatis'],
            ['Signals & Positions','Selamanya','PostgreSQL + archive tahunan'],
            ['Audit logs',         '3 tahun',  'PostgreSQL + Loki untuk raw logs'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
