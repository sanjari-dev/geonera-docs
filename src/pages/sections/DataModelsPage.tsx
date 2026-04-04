import { DocPage, Section, Table, CodeBlock, InfoBox, CardGrid, Card } from '@/components/ui/DocPage'

export function DataModelsPage() {
  return (
    <DocPage
      icon="database"
      title="Data Models"
      subtitle="Skema data lengkap mulai dari format raw bi5 Dukascopy, struktur multi-timeframe OHLCV, feature matrix, hingga model sinyal dan posisi trading."
      badge="Schema"
      badgeColor="teal"
    >
      <Section title="Format Sumber: Dukascopy bi5">
        <CardGrid>
          <Card icon="folder_zip" title="bi5 Format">
            File <strong>.bi5</strong> adalah format biner yang dikompresi menggunakan LZMA. Setiap file mencakup
            data tick <strong>per jam</strong> untuk satu instrumen. Nama file mengikuti pola:
            <br /><code className="text-xs bg-slate-100 px-1 rounded">YYYY/MM/DD/HH_ticks.bi5</code>
          </Card>
          <Card icon="data_object" title="Struktur Tick (20 bytes)">
            Setiap record tick berukuran <strong>20 bytes</strong> dalam format big-endian:
            timestamp (4B), ask (4B), bid (4B), ask_vol (4B), bid_vol (4B).
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="go">{`// Deserialisasi bi5 tick (Go)
type RawTick struct {
    TimestampMs uint32  // ms dari awal jam (offset)
    Ask         uint32  // harga * 100000 (5 desimal)
    Bid         uint32  // harga * 100000
    AskVolume   float32 // volume dalam lot
    BidVolume   float32
}

// Konversi ke tick aktual
func toTick(raw RawTick, hourBase time.Time) Tick {
    return Tick{
        Time: hourBase.Add(time.Duration(raw.TimestampMs) * time.Millisecond),
        Ask:  float64(raw.Ask) / 100000.0,
        Bid:  float64(raw.Bid) / 100000.0,
    }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Multi-Timeframe OHLCV">
        <Table
          headers={['Timeframe', 'Kode', 'Durasi Candle', 'Candle per Hari', 'Penggunaan']}
          rows={[
            ['1 Minute',   'M1',  '1 menit',   '1,440', 'Input utama TFT & feature engineering'],
            ['5 Minutes',  'M5',  '5 menit',   '288',   'Konfirmasi sinyal medium-term'],
            ['15 Minutes', 'M15', '15 menit',  '96',    'Analisis struktur market'],
            ['30 Minutes', 'M30', '30 menit',  '48',    'Swing trading reference'],
            ['1 Hour',     'H1',  '1 jam',     '24',    'Trend utama dan bias arah'],
            ['4 Hours',    'H4',  '4 jam',     '6',     'Higher timeframe context'],
            ['Daily',      'D1',  '1 hari',    '1',     'Support/resistance makro'],
          ]}
        />
      </Section>

      <Section title="Feature Matrix Schema">
        <InfoBox type="info">
          Feature matrix adalah output dari Rust preprocessing, siap dikonsumsi langsung oleh model TFT.
          Setiap baris merepresentasikan satu candle M1 untuk satu simbol.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Feature Group', 'Kolom', 'Tipe', 'Keterangan']}
            rows={[
              ['Price',       'open, high, low, close, spread',    'Float64', 'OHLC dan rata-rata spread'],
              ['Volume',      'ask_vol, bid_vol, net_vol',          'Float32', 'Volume beli/jual'],
              ['Returns',     'return_1, return_5, return_15',      'Float64', 'Log return multi-period'],
              ['Trend',       'ema_9, ema_21, ema_50, ema_200',     'Float64', 'Exponential moving averages'],
              ['Momentum',    'rsi_14, macd, macd_signal, macd_hist','Float64','Osilator momentum'],
              ['Volatility',  'atr_14, bb_upper, bb_lower, bb_pct', 'Float64', 'Volatilitas dan Bollinger Bands'],
              ['Time',        'hour_sin, hour_cos, dow_sin, dow_cos','Float32','Encoding siklus waktu'],
              ['Label',       'future_close_N (N=1..7200)',          'Float64', 'Target untuk training TFT'],
            ]}
          />
        </div>
      </Section>

      <Section title="Signal Model (PostgreSQL)">
        <CodeBlock lang="sql">{`CREATE TYPE signal_direction AS ENUM ('BUY', 'SELL');
CREATE TYPE signal_status AS ENUM (
    'PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'FILLED', 'CLOSED', 'EXPIRED'
);

CREATE TABLE signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id     UUID NOT NULL REFERENCES strategies(id),
    model_id        UUID NOT NULL REFERENCES models(id),
    symbol          VARCHAR(20) NOT NULL,
    direction       signal_direction NOT NULL,
    -- Entry & levels
    entry_price     NUMERIC(18, 6) NOT NULL,
    stop_loss       NUMERIC(18, 6) NOT NULL,
    take_profit     NUMERIC(18, 6) NOT NULL,
    risk_pips       NUMERIC(10, 2),
    reward_pips     NUMERIC(10, 2),
    risk_reward     NUMERIC(6, 3),
    -- AI output
    prob_profit     NUMERIC(5, 4),   -- [0.0, 1.0]
    tft_p50_return  NUMERIC(10, 6),  -- prediksi return median
    tft_confidence  NUMERIC(5, 4),   -- (P90-P10)/P50
    horizon_minutes INTEGER,
    -- Lifecycle
    status          signal_status NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evaluated_at    TIMESTAMPTZ,
    executed_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    -- Result
    pnl_pips        NUMERIC(10, 2),
    pnl_usd         NUMERIC(12, 4)
);`}</CodeBlock>
      </Section>

      <Section title="Strategy & Risk Config Model">
        <CodeBlock lang="sql">{`CREATE TABLE strategies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    symbol          VARCHAR(20) NOT NULL,
    timeframe       VARCHAR(5) NOT NULL DEFAULT 'M1',
    -- Signal parameters
    rr_ratio        NUMERIC(4, 2) NOT NULL,   -- Risk-Reward ratio
    target_pips     NUMERIC(10, 2),           -- Target pergerakan harga
    horizon_minutes INTEGER NOT NULL,          -- Horizon prediksi
    min_prob_profit NUMERIC(4, 3) DEFAULT 0.60, -- Min prob threshold
    -- Risk limits
    max_lot_size    NUMERIC(8, 4) DEFAULT 0.01,
    max_drawdown_pct NUMERIC(5, 2) DEFAULT 10.0,
    max_daily_loss  NUMERIC(12, 4),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);`}</CodeBlock>
      </Section>
    </DocPage>
  )
}
