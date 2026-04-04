import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function MlPipelinePage() {
  return (
    <DocPage
      icon="psychology"
      title="ML Pipeline"
      subtitle="Pipeline end-to-end dari ingesti data Dukascopy bi5, feature engineering berbasis indikator teknikal, training model TFT, hingga klasifikasi sinyal menggunakan meta-model XGBoost/LightGBM dengan validasi walk-forward dan registry model."
      badge="AI/ML"
      badgeColor="purple"
    >
      <Section title="Pipeline Overview">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto mb-4">
          <div className="text-slate-500 mb-2">{'// 4-stage ML pipeline — real-time & batch'}</div>
          <div><span className="text-yellow-400">Stage 1</span>  <span className="text-slate-500">►</span>  <span className="text-green-300">Data Ingestion</span>       <span className="text-slate-600">  Dukascopy bi5 → ClickHouse (Go service)</span></div>
          <div><span className="text-yellow-400">Stage 2</span>  <span className="text-slate-500">►</span>  <span className="text-orange-300">Feature Engineering</span>  <span className="text-slate-600">  OHLCV + Indicators → Feature Matrix (Rust service)</span></div>
          <div><span className="text-yellow-400">Stage 3</span>  <span className="text-slate-500">►</span>  <span className="text-blue-300">Forecasting (TFT)</span>    <span className="text-slate-600">  7200-step close price prediction (Python, GPU)</span></div>
          <div><span className="text-yellow-400">Stage 4</span>  <span className="text-slate-500">►</span>  <span className="text-purple-300">Signal Classification</span><span className="text-slate-600">  XGBoost/LightGBM profit/loss meta-model (Python)</span></div>
          <div className="mt-2 text-slate-500">{'// Diorkestrasikan via RabbitMQ event chain antar service'}</div>
        </div>
        <InfoBox type="info">
          Pipeline dijalankan secara <strong>real-time</strong> mengikuti update data pasar M1 baru.
          Setiap candle M1 yang ditutup memicu chain event: ingest → feature compute → TFT inference → signal generation.
          Target end-to-end latency: <strong>&lt; 30 detik</strong> dari M1 candle close hingga sinyal tersedia.
        </InfoBox>
      </Section>

      <Section title="Stage 1 — Data Ingestion (Go)">
        <CardGrid>
          <Card icon="source" title="Format Sumber: Dukascopy bi5">
            Data tick historis dari Dukascopy dalam format <strong>bi5</strong> — binary LZMA-compressed
            per jam. Setiap file berisi timestamp (ms offset), ask, bid, ask volume, bid volume.
            Go service mengunduh dan mem-parsing file ini secara paralel menggunakan goroutine pool.
          </Card>
          <Card icon="transform" title="Transformasi Multi-Timeframe">
            Raw ticks diagregasi menjadi OHLCV pada timeframe: <strong>M1, M5, M15, M30, H1, H4, D1</strong>.
            Hasilnya disimpan ke ClickHouse dengan partisi per simbol dan timeframe.
            Real-time streaming menggunakan WebSocket feed Dukascopy untuk update live.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="go">{`// Struktur tick dari bi5 (20 bytes per record, big-endian)
type RawTick struct {
    TimestampMs uint32  // ms dari awal jam (offset)
    Ask         uint32  // harga × 100000 (5 desimal)
    Bid         uint32  // harga × 100000
    AskVolume   float32 // volume dalam lot
    BidVolume   float32
}

// Parsing file bi5 secara paralel (goroutine pool)
func IngestBi5Files(files []string, workers int) {
    sem  := make(chan struct{}, workers)
    done := make(chan struct{})

    for _, f := range files {
        sem <- struct{}{}
        go func(path string) {
            defer func() { <-sem }()
            ticks, _ := ParseBi5File(path)
            BatchInsertClickHouse(ticks)
            done <- struct{}{}
        }(f)
    }
}

// Agregasi ke OHLCV M1
func AggregateToOHLCV(ticks []Tick, tf Timeframe) []Candle {
    buckets := make(map[int64]*Candle)
    for _, t := range ticks {
        bucket := t.Time.Truncate(tf.Duration()).Unix()
        if c, exists := buckets[bucket]; exists {
            c.High  = max(c.High, t.Mid())
            c.Low   = min(c.Low,  t.Mid())
            c.Close = t.Mid()
        } else {
            buckets[bucket] = &Candle{
                Open: t.Mid(), High: t.Mid(),
                Low:  t.Mid(), Close: t.Mid(),
            }
        }
    }
    return sortedCandles(buckets)
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Stage 2 — Feature Engineering (Rust)">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Preprocessing dilakukan di Rust untuk performa maksimum. Fitur dibangun dari tiga kategori utama
          dan dihitung secara inkremental untuk setiap candle M1 baru — tanpa perlu recompute seluruh window.
        </p>
        <Table
          headers={['Kategori', 'Fitur', 'Keterangan']}
          rows={[
            ['Price Action',    'OHLCV, Returns (1/5/15), Log Returns',       'Harga mentah dan transformasinya'],
            ['Trend',           'EMA 9/21/50/200, SMA 20/50, DEMA, TEMA',     'Indikator arah tren multi-period'],
            ['Momentum',        'RSI 14, MACD (12,26,9), Stochastic (14,3)',  'Kecepatan dan kekuatan pergerakan'],
            ['Volatility',      'Bollinger Bands (20,2), ATR 14, Keltner',    'Ukuran volatilitas dan range'],
            ['Volume',          'OBV, VWAP, Volume Z-score (20-period)',       'Tekanan beli/jual relatif'],
            ['Market Stats',    'Autocorrelation (1,5,10), Rolling Std, Skew','Karakteristik statistik distribusi'],
            ['Time Encoding',   'Hour sin/cos, Day-of-week sin/cos, Month',   'Siklus waktu untuk TFT attention'],
            ['Multi-TF Context','H1 close, H1 EMA50, H4 close, D1 close',    'Konteks timeframe lebih tinggi'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="rust">{`// Rust — Inkremental feature computation
pub struct FeatureEngine {
    ema_9:   EmaIndicator,
    ema_50:  EmaIndicator,
    rsi_14:  RsiIndicator,
    macd:    MacdIndicator,
    atr_14:  AtrIndicator,
    bb:      BollingerBands,
}

impl FeatureEngine {
    pub fn update(&mut self, candle: &Candle) -> FeatureRow {
        FeatureRow {
            open:          candle.open,
            high:          candle.high,
            low:           candle.low,
            close:         candle.close,
            log_return:    (candle.close / self.prev_close).ln(),
            ema_9:         self.ema_9.next(candle.close),
            ema_50:        self.ema_50.next(candle.close),
            rsi_14:        self.rsi_14.next(candle.close),
            macd_line:     self.macd.line(),
            macd_signal:   self.macd.signal(),
            macd_hist:     self.macd.histogram(),
            atr_14:        self.atr_14.next(candle),
            bb_pct:        self.bb.percent_b(candle.close),
            // time encoding
            hour_sin:      (candle.time.hour() as f32 * PI / 12.0).sin(),
            hour_cos:      (candle.time.hour() as f32 * PI / 12.0).cos(),
        }
    }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Stage 3 — Forecasting Model: TFT (Python)">
        <CardGrid>
          <Card icon="model_training" title="Temporal Fusion Transformer">
            Model <strong>TFT (Temporal Fusion Transformer)</strong> dari Google Research dipilih karena
            kemampuannya menggabungkan fitur statis (simbol), time-varying known (jam, kalender), dan
            time-varying unknown (harga, indikator) dalam satu arsitektur attention-based yang interpretable.
          </Card>
          <Card icon="timeline" title="Multi-Step Prediction: 7200 Langkah">
            Memprediksi harga <strong>close M1</strong> hingga <strong>7200 langkah ke depan</strong>
            (setara ≈ 5 hari trading aktif), menghasilkan distribusi kuantil
            (P10, P50, P90) untuk setiap titik waktu.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <Table
            headers={['Parameter Model', 'Nilai', 'Keterangan']}
            rows={[
              ['Framework',          'PyTorch + pytorch-forecasting / Darts', 'Library TFT'],
              ['Input Sequence',     '1440 steps (1 hari M1)',                'Lookback window (encoder)'],
              ['Forecast Horizon',   '7200 steps (≈5 hari M1)',               'Prediction horizon (decoder)'],
              ['Target',             'Close price (M1)',                       'Variabel yang diprediksi'],
              ['Output',             'Quantile: P10, P50, P90',               'Distribusi probabilistik'],
              ['Training Loss',      'Quantile Loss (Pinball)',                'Fungsi loss utama'],
              ['Hidden Size',        '128 – 256',                             'Dimensi hidden state TFT'],
              ['Attention Heads',    '4 – 8',                                 'Multi-head self-attention'],
              ['Hardware',           'GPU (CUDA, min 8GB VRAM)',               'Akselerasi training & inferensi'],
              ['Batch Size',         '64 – 128 (training)',                   'Per GPU batch'],
            ]}
          />
        </div>
        <div className="mt-4">
          <CodeBlock lang="python">{`# TFT training configuration (pytorch-forecasting)
from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet
from pytorch_forecasting.metrics import QuantileLoss

training = TimeSeriesDataSet(
    df,
    time_idx="time_idx",
    target="close",
    group_ids=["symbol"],
    max_encoder_length=1440,      # 1 hari lookback
    max_prediction_length=7200,   # 5 hari forecast
    static_categoricals=["symbol"],
    time_varying_known_reals=["hour_sin", "hour_cos", "dow_sin", "dow_cos"],
    time_varying_unknown_reals=[
        "close", "returns", "ema_9", "ema_50",
        "rsi_14", "macd_hist", "atr_14", "bb_pct"
    ],
    target_normalizer=TorchNormalizer(method="robust"),
)

model = TemporalFusionTransformer.from_dataset(
    training,
    learning_rate=1e-3,
    hidden_size=128,
    attention_head_size=4,
    dropout=0.1,
    hidden_continuous_size=64,
    loss=QuantileLoss(quantiles=[0.1, 0.5, 0.9]),
)`}</CodeBlock>
        </div>
      </Section>

      <Section title="Stage 4 — Signal Classification: Meta-Model">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Output prediksi TFT diolah menggunakan parameter strategi untuk membentuk
          <strong> kandidat sinyal trading</strong>, kemudian dievaluasi oleh meta-model untuk
          memprediksi probabilitas profit.
        </p>
        <CardGrid>
          <Card icon="settings_suggest" title="Parameter Strategi">
            Setiap kandidat sinyal dihasilkan dari kombinasi: <strong>Risk-Reward Ratio</strong> (misal 1:2, 1:3),
            <strong> Target Move</strong> (pip/point target), dan <strong>Time Horizon</strong>
            (berapa langkah M1 ke depan untuk evaluasi TP/SL).
          </Card>
          <Card icon="account_tree" title="XGBoost / LightGBM Classifier">
            Meta-model <strong>gradient boosting</strong> mengklasifikasikan setiap sinyal kandidat ke label:
            <strong> profit</strong> atau <strong>loss</strong>, dengan output probabilitas untuk threshold
            filtering. Kedua model di-ensemble untuk stabilitas lebih baik.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="python">{`# Feature set untuk meta-model
def build_signal_features(tft_output, market_state, strategy_params):
    p10, p50, p90 = tft_output.p10, tft_output.p50, tft_output.p90
    return {
        # TFT prediction features
        "tft_p50_return":       p50[strategy_params.horizon] / market_state.close - 1,
        "tft_confidence":       (p90[strategy_params.horizon] - p10[strategy_params.horizon]) / abs(p50[strategy_params.horizon]),
        "tft_trend_slope":      np.polyfit(range(len(p50)), p50, 1)[0],
        # Market state features
        "entry_rsi_14":         market_state.rsi_14,
        "entry_atr_14":         market_state.atr_14,
        "entry_bb_pct":         market_state.bb_pct,
        "entry_macd_hist":      market_state.macd_hist,
        "trend_alignment_h1":   market_state.h1_trend_score,
        # Strategy features
        "rr_ratio":             strategy_params.rr_ratio,
        "horizon_steps":        strategy_params.horizon,
        "target_pips":          strategy_params.target_pips,
        # Time features
        "hour_of_day":          market_state.hour_utc,
        "day_of_week":          market_state.day_of_week,
        "is_london_session":    int(8 <= market_state.hour_utc <= 17),
        "is_ny_session":        int(13 <= market_state.hour_utc <= 22),
    }

# Training meta-model dengan labeled historical signals
xgb_model = XGBClassifier(
    n_estimators=500, max_depth=6,
    learning_rate=0.05, subsample=0.8,
    eval_metric="auc", early_stopping_rounds=50,
)
prob_profit = xgb_model.predict_proba(signal_features)[:, 1]
signal.is_valid = prob_profit >= strategy.min_prob_profit  # default 0.60`}</CodeBlock>
        </div>
      </Section>

      <Section title="Model Registry & Versioning">
        <InfoBox type="tip">
          Setiap versi model di-track di tabel <code>models</code> PostgreSQL. Hanya satu versi
          yang berstatus <strong>PRODUCTION</strong> per simbol pada satu waktu. Promosi versi baru
          memerlukan persetujuan manual dari role Admin atau ML Engineer.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Status Model', 'Artinya', 'Aksi Selanjutnya']}
            rows={[
              ['TRAINING',    'Sedang di-train di GPU',                     'Tunggu selesai'],
              ['VALIDATING',  'Walk-forward validation berjalan',            'Review metrik otomatis'],
              ['STAGED',      'Lulus validasi, siap promote ke production',  'Manual approval'],
              ['PRODUCTION',  'Aktif melayani prediksi live',                'Monitor drift'],
              ['DEPRECATED',  'Digantikan versi baru, tidak menerima request','Arsip artifact'],
              ['FAILED',      'Gagal validasi (metrik di bawah threshold)',   'Investigasi, retrain'],
            ]}
          />
        </div>
      </Section>

      <Section title="Retraining Trigger">
        <Table
          headers={['Trigger', 'Kondisi', 'Jenis Retraining']}
          rows={[
            ['Scheduled',         'Setiap Minggu (Sabtu 02:00 UTC)',               'Full retraining dengan data terbaru'],
            ['Drift Alert',       'TFT MAE 7d > 0.0015 selama 30 menit',          'Full retraining'],
            ['Win Rate Drop',     'Win rate 7d < 50% selama 2 hari',              'Meta-model fine-tuning'],
            ['Data Volume',       'Setiap 30.000 candle M1 baru terkumpul',       'Incremental fine-tuning'],
            ['Manual',            'Trigger via API POST /v1/models/retrain',       'Full atau fine-tune (pilihan)'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="python">{`# Retraining pipeline orchestrator
def trigger_retraining(symbol: str, reason: str, mode: str = "full"):
    """
    mode: "full"     — train dari awal dengan semua data historis
          "finetune" — continue training dari checkpoint terbaru
    """
    job = ModelTrainingJob(
        symbol=symbol,
        trigger_reason=reason,
        mode=mode,
        train_start=get_train_start(mode),
        train_end=datetime.utcnow(),
        min_metrics={
            "mae":        0.0015,
            "win_rate":   0.50,
            "profit_factor": 1.2,
        }
    )

    # Publish ke RabbitMQ untuk diproses Python training service
    rabbitmq.publish("geonera.training.jobs", job.to_dict())

    # Update model status ke TRAINING di PostgreSQL
    db.update_model_status(symbol, "TRAINING")
    logger.info(f"Retraining triggered: {symbol} | {reason} | {mode}")`}</CodeBlock>
        </div>
      </Section>

      <Section title="Backtesting & Validasi">
        <InfoBox type="tip">
          Seluruh pipeline divalidasi menggunakan teknik <strong>walk-forward validation</strong> —
          model ditraining pada data historis window N, lalu dievaluasi pada window N+1 yang belum
          pernah dilihat, mencegah data leakage dan overfitting.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Metrik', 'Target Minimum', 'Target Ideal', 'Keterangan']}
            rows={[
              ['Win Rate',          '> 52%',    '> 57%',  'Persentase sinyal yang profit'],
              ['Profit Factor',     '> 1.3',    '> 1.7',  'Gross profit / gross loss'],
              ['Max Drawdown',      '< 20%',    '< 12%',  'Penurunan equity maksimum dari high'],
              ['Sharpe Ratio',      '> 0.8',    '> 1.2',  'Risk-adjusted return annualized'],
              ['Calmar Ratio',      '> 0.3',    '> 0.6',  'Annual return / max drawdown'],
              ['TFT MAE (P50)',     '< 0.0015', '< 0.0008','MAE median prediction vs actual'],
              ['Meta-model AUC',   '> 0.65',   '> 0.72', 'AUC-ROC klasifikasi profit/loss'],
            ]}
          />
        </div>
      </Section>
    </DocPage>
  )
}
