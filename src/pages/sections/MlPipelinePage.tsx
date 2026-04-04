import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function MlPipelinePage() {
  return (
    <DocPage
      icon="psychology"
      title="ML Pipeline"
      subtitle="Pipeline end-to-end dari ingesti data Dukascopy bi5, feature engineering berbasis indikator teknikal, training model TFT, hingga klasifikasi sinyal menggunakan meta-model XGBoost/LightGBM."
      badge="AI/ML"
      badgeColor="purple"
    >
      <Section title="Pipeline Overview">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto mb-4">
          <div className="text-slate-500 mb-2">{'// 4-stage ML pipeline'}</div>
          <div><span className="text-yellow-400">Stage 1</span>  <span className="text-slate-500">►</span>  <span className="text-green-300">Data Ingestion</span>       <span className="text-slate-600">  Dukascopy bi5 → ClickHouse (Go)</span></div>
          <div><span className="text-yellow-400">Stage 2</span>  <span className="text-slate-500">►</span>  <span className="text-orange-300">Feature Engineering</span>  <span className="text-slate-600">  OHLCV + Indicators → Feature Matrix (Rust)</span></div>
          <div><span className="text-yellow-400">Stage 3</span>  <span className="text-slate-500">►</span>  <span className="text-blue-300">Forecasting (TFT)</span>    <span className="text-slate-600">  7200-step close price prediction (Python)</span></div>
          <div><span className="text-yellow-400">Stage 4</span>  <span className="text-slate-500">►</span>  <span className="text-purple-300">Signal Classification</span><span className="text-slate-600">  XGBoost/LightGBM profit/loss meta-model</span></div>
        </div>
        <InfoBox type="info">
          Pipeline dijalankan secara <strong>real-time</strong> mengikuti update data pasar M1 baru, dan diorkestrasikan
          via RabbitMQ event chain antar service.
        </InfoBox>
      </Section>

      <Section title="Stage 1 — Data Ingestion (Go)">
        <CardGrid>
          <Card icon="source" title="Format Sumber: Dukascopy bi5">
            Data tick historis dari Dukascopy dalam format <strong>bi5</strong> — binary LZMA-compressed per jam.
            Setiap file berisi timestamp (ms), ask, bid, ask volume, bid volume.
          </Card>
          <Card icon="transform" title="Transformasi Multi-Timeframe">
            Raw ticks diagregasi menjadi OHLCV pada timeframe: <strong>M1, M5, M15, M30, H1, H4, D1</strong>.
            Hasilnya disimpan ke ClickHouse dengan partisi per simbol dan timeframe.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="go">{`// Struktur tick dari bi5
type Tick struct {
    TimestampMs int64
    Ask         float64
    Bid         float64
    AskVol      float32
    BidVol      float32
}

// Agregasi ke OHLCV M1
func aggregateToOHLCV(ticks []Tick, tf Timeframe) []Candle {
    // group ticks by timeframe bucket → OHLCV
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Stage 2 — Feature Engineering (Rust)">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Preprocessing dilakukan di Rust untuk performa maksimum. Fitur dibangun dari tiga kategori utama:
        </p>
        <Table
          headers={['Kategori', 'Fitur', 'Keterangan']}
          rows={[
            ['Price Action',    'OHLCV, Returns, Log Returns',           'Harga mentah dan transformasinya'],
            ['Trend',           'EMA 9/21/50/200, SMA, DEMA, TEMA',      'Indikator arah tren'],
            ['Momentum',        'RSI 14, MACD (12,26,9), Stochastic',    'Kecepatan pergerakan harga'],
            ['Volatility',      'Bollinger Bands, ATR 14, Keltner',      'Ukuran volatilitas pasar'],
            ['Volume',          'OBV, VWAP, Volume Z-score',             'Tekanan beli/jual'],
            ['Market Stats',    'Autocorrelation, Rolling Std, Skew',    'Karakteristik statistik pasar'],
            ['Time Encoding',   'Hour sin/cos, Day sin/cos, Month',      'Siklus waktu untuk TFT'],
          ]}
        />
      </Section>

      <Section title="Stage 3 — Forecasting Model: TFT (Python)">
        <CardGrid>
          <Card icon="model_training" title="Temporal Fusion Transformer">
            Model <strong>TFT (Temporal Fusion Transformer)</strong> dari Google Research dipilih karena kemampuannya
            menggabungkan fitur statis, time-varying known, dan time-varying unknown dalam satu arsitektur attention-based.
          </Card>
          <Card icon="timeline" title="Multi-Step Prediction: 7200 Langkah">
            Memprediksi harga <strong>close M1</strong> hingga <strong>7200 langkah ke depan</strong> (setara 5 hari trading),
            menghasilkan distribusi kuantil (P10, P50, P90) untuk setiap titik waktu.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <Table
            headers={['Parameter Model', 'Nilai', 'Keterangan']}
            rows={[
              ['Framework',         'PyTorch + Darts / pytorch-forecasting', 'Library TFT'],
              ['Input Sequence',    '1440 steps (1 hari M1)',                 'Lookback window'],
              ['Forecast Horizon',  '7200 steps (5 hari M1)',                 'Prediction horizon'],
              ['Target',            'Close price (M1)',                        'Variabel yang diprediksi'],
              ['Output',            'Quantile: P10, P50, P90',                'Distribusi prediksi'],
              ['Training Loss',     'Quantile Loss (Pinball)',                 'Fungsi loss'],
              ['Hardware',          'GPU (CUDA)',                              'Akselerasi training'],
            ]}
          />
        </div>
      </Section>

      <Section title="Stage 4 — Signal Classification: Meta-Model">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Output prediksi TFT diolah menggunakan parameter strategi untuk membentuk <strong>kandidat sinyal trading</strong>,
          kemudian dievaluasi oleh meta-model untuk memprediksi probabilitas profit.
        </p>
        <CardGrid>
          <Card icon="settings_suggest" title="Parameter Strategi">
            Setiap kandidat sinyal dihasilkan dari kombinasi: <strong>Risk-Reward Ratio</strong> (misal 1:2, 1:3),
            <strong>Target Move</strong> (pip/point), dan <strong>Time Horizon</strong> (berapa langkah ke depan).
          </Card>
          <Card icon="account_tree" title="XGBoost / LightGBM Classifier">
            Meta-model <strong>gradient boosting</strong> mengklasifikasikan setiap sinyal kandidat ke label:
            <strong>profit</strong> atau <strong>loss</strong>, dengan output probabilitas untuk threshold filtering.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="python">{`# Contoh feature untuk meta-model
signal_features = {
    "tft_p50_return":     predicted_return_p50,
    "tft_confidence":     (p90 - p10) / p50,      # spread kuantil
    "rr_ratio":           risk_reward_ratio,
    "time_horizon":       horizon_steps,
    "entry_rsi":          current_rsi_14,
    "volatility_atr":     current_atr_14,
    "hour_of_day":        entry_hour,
    "day_of_week":        entry_dow,
}

# Klasifikasi
prob_profit = meta_model.predict_proba([signal_features])[0][1]
signal.is_valid = prob_profit >= THRESHOLD  # misal 0.65`}</CodeBlock>
        </div>
      </Section>

      <Section title="Backtesting & Validasi">
        <InfoBox type="tip">
          Seluruh pipeline divalidasi menggunakan teknik <strong>walk-forward validation</strong> — model ditraining pada
          data historis window N, lalu dievaluasi pada window N+1 yang belum pernah dilihat, mencegah data leakage.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Metrik', 'Target', 'Keterangan']}
            rows={[
              ['Win Rate',          '> 55%',    'Persentase sinyal yang profit'],
              ['Profit Factor',     '> 1.5',    'Gross profit / gross loss'],
              ['Max Drawdown',      '< 15%',    'Penurunan equity maksimum'],
              ['Sharpe Ratio',      '> 1.0',    'Risk-adjusted return'],
              ['Calmar Ratio',      '> 0.5',    'Annual return / max drawdown'],
            ]}
          />
        </div>
      </Section>
    </DocPage>
  )
}
