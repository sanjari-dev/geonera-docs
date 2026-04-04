import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function StoragePage() {
  return (
    <DocPage
      icon="storage"
      title="Storage"
      subtitle="Strategi penyimpanan data dual-database: ClickHouse untuk data time-series berperforma tinggi dan PostgreSQL untuk data relasional transaksional — dirancang untuk skalabilitas, durabilitas, dan performa query tinggi."
      badge="Data"
      badgeColor="teal"
    >
      <Section title="Database Strategy">
        <CardGrid>
          <Card icon="speed" title="ClickHouse — Time-Series Store">
            Database kolumnar OLAP yang dioptimalkan untuk query analitik pada data time-series skala besar.
            Digunakan untuk menyimpan seluruh data tick, OHLCV multi-timeframe, feature matrix, dan
            hasil prediksi TFT. Mendukung kompresi data sangat baik (rasio 10:1 vs raw) dan query
            analitik paralel yang cepat.
          </Card>
          <Card icon="table_chart" title="PostgreSQL — Relational Store">
            Database relasional ACID-compliant untuk data operasional: definisi sinyal, konfigurasi
            strategi, manajemen pengguna, audit log, dan metadata model. Mendukung row-level security
            untuk multi-tenant isolation di mode SaaS.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <InfoBox type="info">
            Pemilihan dual-database mengikuti prinsip <strong>polyglot persistence</strong> — setiap jenis data
            disimpan di sistem yang paling optimal untuk akses pattern-nya. Data time-series dengan insert
            rate jutaan baris per hari → ClickHouse. Data operasional dengan relasi kompleks dan ACID → PostgreSQL.
          </InfoBox>
        </div>
      </Section>

      <Section title="ClickHouse — Cluster Architecture">
        <InfoBox type="tip">
          Production menggunakan cluster <strong>3-node ClickHouse</strong> dengan ReplicatedMergeTree
          untuk high availability. Setiap shard memiliki 2 replica. ZooKeeper (atau ClickHouse Keeper)
          mengelola koordinasi replikasi antar node.
        </InfoBox>
        <div className="mt-4">
          <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto mb-4">
            <div className="text-slate-500 mb-2">{'// ClickHouse 3-node cluster topology'}</div>
            <div><span className="text-teal-400">Shard 1</span>  <span className="text-slate-600">──</span>  <span className="text-green-300">ch-node-1 (primary)</span>  <span className="text-slate-600">+ replica:</span>  <span className="text-green-300">ch-node-2</span></div>
            <div><span className="text-teal-400">Shard 2</span>  <span className="text-slate-600">──</span>  <span className="text-blue-300">ch-node-3 (primary)</span>  <span className="text-slate-600">+ replica:</span>  <span className="text-blue-300">ch-node-1</span></div>
            <div className="mt-2 text-slate-500">{'// ZooKeeper/CH-Keeper cluster (3 nodes) untuk koordinasi'}</div>
            <div><span className="text-yellow-400">Keeper-1</span>  <span className="text-slate-600">+</span>  <span className="text-yellow-400">Keeper-2</span>  <span className="text-slate-600">+</span>  <span className="text-yellow-400">Keeper-3</span>  <span className="text-slate-600">  (quorum-based)</span></div>
          </div>
          <Table
            headers={['Parameter', 'Nilai', 'Keterangan']}
            rows={[
              ['Cluster mode',       'ReplicatedMergeTree',     'Replikasi otomatis antar shard'],
              ['Replication factor', '2x per shard',            'Setiap data ada di 2 node berbeda'],
              ['Consistency',        'Eventual (async replication)', 'Trade-off: write latency rendah'],
              ['Read strategy',      'any / nearest replica',   'Baca dari replica terdekat'],
              ['Write strategy',     'quorum (minimum 2)',       'Tulis ke minimal 2 replica sebelum ACK'],
              ['ZooKeeper nodes',    '3 (quorum)',               'Toleransi 1 node failure'],
            ]}
          />
        </div>
      </Section>

      <Section title="ClickHouse Schema">
        <Table
          headers={['Table', 'Engine', 'Partisi', 'Kegunaan']}
          rows={[
            ['ticks',           'ReplicatedMergeTree', 'toYYYYMM(timestamp)',      'Raw tick data dari Dukascopy bi5'],
            ['ohlcv_m1',        'ReplicatedMergeTree', 'toYYYYMM(open_time)',      'Candlestick M1 per simbol'],
            ['ohlcv_m5',        'ReplicatedMergeTree', 'toYYYYMM(open_time)',      'Candlestick M5 per simbol'],
            ['ohlcv_h1',        'ReplicatedMergeTree', 'toYYYYMM(open_time)',      'Candlestick H1 per simbol'],
            ['features',        'ReplicatedMergeTree', 'toYYYYMM(timestamp)',      'Feature matrix hasil preprocessing Rust'],
            ['predictions',     'ReplicatedMergeTree', 'toYYYYMM(created_at)',     'Output TFT: 7200 step per prediksi'],
            ['signal_metrics',  'AggregatingMergeTree','toYYYYMM(evaluated_at)',   'Agregat performa sinyal harian'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="sql">{`-- Tabel utama OHLCV M1 (ReplicatedMergeTree untuk cluster)
CREATE TABLE ohlcv_m1 ON CLUSTER geonera_cluster (
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
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/ohlcv_m1', '{replica}')
PARTITION BY toYYYYMM(open_time)
ORDER BY (symbol, open_time)
TTL open_time + INTERVAL 5 YEAR
SETTINGS index_granularity = 8192;

-- Tabel prediksi TFT (7200 step per row → stored as array)
CREATE TABLE predictions ON CLUSTER geonera_cluster (
    id          UUID,
    symbol      LowCardinality(String),
    model_id    UUID,
    created_at  DateTime64(3, 'UTC'),
    horizon     UInt16,        -- jumlah step (7200)
    p10         Array(Float64),-- distribusi lower bound
    p50         Array(Float64),-- distribusi median
    p90         Array(Float64) -- distribusi upper bound
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/predictions', '{replica}')
PARTITION BY toYYYYMM(created_at)
ORDER BY (symbol, created_at)
TTL created_at + INTERVAL 1 YEAR;`}</CodeBlock>
        </div>
      </Section>

      <Section title="PostgreSQL Schema">
        <Table
          headers={['Table', 'Kegunaan', 'Relasi Utama']}
          rows={[
            ['symbols',         'Daftar instrumen yang dipantau',                    '—'],
            ['strategies',      'Konfigurasi strategi (RR, target, horizon)',         'symbols'],
            ['models',          'Registry model AI (versi, path, metrics, status)',   'symbols'],
            ['signals',         'Sinyal trading yang dihasilkan + hasil evaluasi',     'strategies, models'],
            ['positions',       'Posisi trading yang dieksekusi via JForex',           'signals'],
            ['users',           'Pengguna, role, dan otorisasi',                       '—'],
            ['subscriptions',   'Langganan sinyal per pengguna (SaaS multi-tenant)',   'users, strategies'],
            ['api_keys',        'API key untuk akses programatik',                     'users'],
            ['audit_logs',      'Catatan semua aksi sensitif sistem',                  'users'],
            ['risk_configs',    'Konfigurasi risk per strategi dan global',             'strategies'],
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
    risk_pips       NUMERIC(10,2),
    reward_pips     NUMERIC(10,2),
    risk_reward     NUMERIC(6,3),
    prob_profit     NUMERIC(5,4),     -- output meta-model [0.0-1.0]
    tft_p50_return  NUMERIC(10,6),    -- prediksi return median
    tft_confidence  NUMERIC(5,4),     -- (P90-P10)/P50
    horizon_minutes INTEGER,
    shap_data       JSONB,            -- SHAP breakdown per feature
    status          VARCHAR(20) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at    TIMESTAMPTZ,
    executed_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    pnl_pips        NUMERIC(10,2),
    pnl_usd         NUMERIC(12,4)
);

-- Index untuk query umum
CREATE INDEX idx_signals_symbol_status   ON signals(symbol, status);
CREATE INDEX idx_signals_created_at      ON signals(created_at DESC);
CREATE INDEX idx_signals_prob_profit     ON signals(prob_profit DESC)
    WHERE status = 'PENDING';`}</CodeBlock>
        </div>
      </Section>

      <Section title="PostgreSQL — High Availability">
        <CardGrid>
          <Card icon="sync_alt" title="Streaming Replication">
            PostgreSQL dikonfigurasi dengan <strong>primary + 1 read replica</strong> menggunakan
            streaming replication (WAL shipping). Replica digunakan untuk query read-heavy (analytics,
            reporting) untuk meringankan beban primary.
          </Card>
          <Card icon="settings_backup_restore" title="Automatic Failover">
            Failover otomatis menggunakan <strong>Patroni + etcd/ZooKeeper</strong>.
            Jika primary down, Patroni mempromosikan replica ke primary dalam waktu
            &lt;30 detik dan memperbarui DNS/HAProxy routing.
          </Card>
          <Card icon="dns" title="Connection Pooling">
            <strong>PgBouncer</strong> sebagai connection pooler di depan PostgreSQL.
            Mode transaction pooling untuk microservices C# yang membuka banyak koneksi singkat.
            Maksimum pool size: 100 koneksi ke database.
          </Card>
          <Card icon="storage" title="WAL Archiving">
            Write-Ahead Log (WAL) di-archive ke object storage (S3/MinIO) setiap 1 menit.
            Mendukung Point-in-Time Recovery (PITR) ke mana saja dalam 7 hari terakhir.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Backup & Disaster Recovery">
        <Table
          headers={['Database', 'Metode', 'Frekuensi', 'Retensi', 'RTO', 'RPO']}
          rows={[
            ['ClickHouse', 'clickhouse-backup ke S3',       'Harian (off-peak)', '30 hari',  '< 2 jam',  '< 24 jam'],
            ['ClickHouse', 'Replication (2x per shard)',    'Real-time',          'Selamanya','< 5 menit','< 1 detik'],
            ['PostgreSQL', 'pg_dump (logical backup)',      'Harian',             '30 hari',  '< 1 jam',  '< 24 jam'],
            ['PostgreSQL', 'WAL archiving ke S3',           'Setiap 1 menit',    '7 hari',   '< 30 menit','< 1 menit'],
            ['PostgreSQL', 'Streaming replica',             'Real-time',          '—',        '< 30 detik','< 1 detik'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="bash">{`# ClickHouse backup menggunakan clickhouse-backup
clickhouse-backup create --name "daily-$(date +%Y%m%d)"
clickhouse-backup upload  "daily-$(date +%Y%m%d)" --remote-storage s3

# PostgreSQL continuous archiving (postgresql.conf)
archive_mode = on
archive_command = 'aws s3 cp %p s3://geonera-pg-wal/%f'
archive_timeout = 60    # force WAL segment switch setiap 60 detik

# Point-in-Time Recovery ke timestamp tertentu
restore_command = 'aws s3 cp s3://geonera-pg-wal/%f %p'
recovery_target_time = '2025-01-15 08:30:00 UTC'`}</CodeBlock>
        </div>
      </Section>

      <Section title="Data Retention & Performance">
        <Table
          headers={['Data', 'Retensi', 'Strategi']}
          rows={[
            ['Raw ticks (bi5)',      '5 tahun',   'ClickHouse TTL + cold archive ke S3 Glacier'],
            ['OHLCV M1',            '5 tahun',   'ClickHouse partisi per bulan, kompresi ZSTD'],
            ['OHLCV M5-D1',         '5 tahun',   'ClickHouse partisi per bulan'],
            ['Feature matrix',      '2 tahun',   'ClickHouse TTL, hanya window yang aktif di-keep'],
            ['Predictions (7200p)', '1 tahun',   'ClickHouse pruning otomatis via TTL'],
            ['Signals & Positions', 'Selamanya', 'PostgreSQL + archive ke cold storage tahunan'],
            ['Audit logs',          '3 tahun',   'PostgreSQL + Loki untuk raw log stream'],
            ['Model artifacts',     'Selamanya', 'Object storage (S3/MinIO), versioned'],
          ]}
        />
      </Section>

      <Section title="Query Optimization — ClickHouse">
        <InfoBox type="tip">
          ClickHouse sangat bergantung pada <strong>PRIMARY KEY / ORDER BY</strong> untuk sparse index.
          Selalu sertakan kolom ORDER BY di WHERE clause (terutama <code>symbol</code> dan
          <code>open_time</code>) untuk memanfaatkan index granularity dan menghindari full scan.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="sql">{`-- ✅ OPTIMAL: Filter pada kolom ORDER BY (symbol, open_time)
SELECT symbol, open_time, close
FROM ohlcv_m1
WHERE symbol = 'EURUSD'
  AND open_time BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY open_time;

-- ✅ Query feature untuk training window (1440 candle = 1 hari M1)
SELECT *
FROM features
WHERE symbol = 'EURUSD'
  AND timestamp >= now() - INTERVAL 2 DAY
ORDER BY timestamp
LIMIT 1440;

-- ✅ Analitik win rate dengan prewhere (filter baris sebelum kolom dibaca)
SELECT
    symbol,
    countIf(pnl_pips > 0) / count() * 100 AS win_rate,
    sum(pnl_pips)                          AS total_pips
FROM signal_metrics
PREWHERE toYYYYMM(evaluated_at) BETWEEN 202501 AND 202512
WHERE status = 'CLOSED'
GROUP BY symbol;

-- ❌ HINDARI: Fungsi pada kolom index (menonaktifkan index scan)
-- WHERE toDate(open_time) = '2025-01-15'   -- gunakan BETWEEN sebagai gantinya`}</CodeBlock>
        </div>
      </Section>
    </DocPage>
  )
}
