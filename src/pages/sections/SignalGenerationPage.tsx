import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function SignalGenerationPage() {
  return (
    <DocPage
      icon="bolt"
      title="Signal Generation"
      subtitle="Alur end-to-end bagaimana Geonera mengubah prediksi harga TFT menjadi kandidat sinyal trading yang tervalidasi — dari parameter strategi, pembentukan kandidat, hingga klasifikasi meta-model dan keputusan eksekusi."
      badge="Trading"
      badgeColor="green"
    >
      <Section title="Overview Alur Signal Generation">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto mb-4">
          <div className="text-slate-500 mb-3">{'// End-to-end signal generation flow'}</div>
          <div><span className="text-blue-400">[TFT Output]</span>         <span className="text-slate-500">──►</span> <span className="text-slate-300">7200 predicted close prices (P10/P50/P90)</span></div>
          <div className="ml-6 text-slate-600">│</div>
          <div><span className="text-yellow-400">[Strategy Params]</span>   <span className="text-slate-500">──►</span> <span className="text-slate-300">RR ratio + target move + time horizon</span></div>
          <div className="ml-6 text-slate-600">│ (kombinasi)</div>
          <div><span className="text-green-400">[Candidate Builder]</span>  <span className="text-slate-500">──►</span> <span className="text-slate-300">BUY/SELL candidates: entry, SL, TP per kombinasi</span></div>
          <div className="ml-6 text-slate-600">│</div>
          <div><span className="text-orange-400">[Risk Validator]</span>    <span className="text-slate-500">──►</span> <span className="text-slate-300">Filter: exposure limit, lot size, drawdown check</span></div>
          <div className="ml-6 text-slate-600">│</div>
          <div><span className="text-purple-400">[Meta-Model]</span>        <span className="text-slate-500">──►</span> <span className="text-slate-300">XGBoost/LightGBM → prob_profit per kandidat</span></div>
          <div className="ml-6 text-slate-600">│</div>
          <div><span className="text-red-400">[Threshold Filter]</span>    <span className="text-slate-500">──►</span> <span className="text-slate-300">prob_profit ≥ min_threshold → APPROVED signal</span></div>
          <div className="ml-6 text-slate-600">│</div>
          <div><span className="text-teal-400">[JForex Executor]</span>     <span className="text-slate-500">──►</span> <span className="text-slate-300">Order submission ke Dukascopy broker</span></div>
        </div>
        <InfoBox type="info">
          Satu prediksi TFT dapat menghasilkan <strong>banyak kandidat sinyal</strong> dari berbagai kombinasi
          parameter strategi. Meta-model kemudian menyeleksi hanya kandidat dengan probabilitas profit tertinggi
          yang melewati threshold.
        </InfoBox>
      </Section>

      <Section title="Step 1 — Output TFT sebagai Basis Sinyal">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          TFT menghasilkan distribusi prediksi harga close M1 untuk 7200 langkah ke depan (5 hari trading).
          Setiap langkah menghasilkan tiga nilai kuantil yang menjadi dasar pembentukan level sinyal:
        </p>
        <Table
          headers={['Kuantil', 'Nilai', 'Penggunaan dalam Sinyal']}
          rows={[
            ['P10 (pessimistic)', 'Harga terendah yang mungkin', 'Referensi worst-case untuk stop loss'],
            ['P50 (median)',      'Prediksi harga paling likely', 'Basis kalkulasi entry dan target'],
            ['P90 (optimistic)', 'Harga tertinggi yang mungkin', 'Referensi best-case untuk take profit'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="python">{`# Output TFT per prediksi run
prediction = {
    "symbol":      "EURUSD",
    "run_at":      "2025-01-15T08:00:00Z",
    "horizon":     7200,          # langkah ke depan (M1)
    "prices": {
        "p10": [...],             # array 7200 nilai (pessimistic)
        "p50": [...],             # array 7200 nilai (median)
        "p90": [...],             # array 7200 nilai (optimistic)
    },
    "entry_price": 1.08542,       # harga saat prediksi dibuat
}

# Kalkulasi return pada horizon tertentu (misal 240 menit)
horizon_idx    = 240
predicted_move = prediction["prices"]["p50"][horizon_idx] - prediction["entry_price"]
confidence     = (prediction["prices"]["p90"][horizon_idx]
                  - prediction["prices"]["p10"][horizon_idx]) / prediction["prices"]["p50"][horizon_idx]`}</CodeBlock>
        </div>
      </Section>

      <Section title="Step 2 — Parameter Strategi">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Setiap strategi yang aktif mendefinisikan parameter untuk menginterpretasikan output TFT menjadi level trading konkret:
        </p>
        <CardGrid>
          <Card icon="balance" title="Risk-Reward Ratio (RR)">
            Rasio antara potensi profit dan risiko. RR 1:2 berarti untuk setiap 1 pip risiko (stop loss),
            target profit adalah 2 pip. Parameter ini menentukan jarak TP relatif terhadap SL.
          </Card>
          <Card icon="straighten" title="Target Price Move">
            Pergerakan harga minimum (dalam pip atau poin) yang harus diprediksi TFT agar sinyal layak dibentuk.
            Mencegah sinyal dari prediksi pergerakan yang terlalu kecil untuk menutup spread dan komisi.
          </Card>
          <Card icon="schedule" title="Time Horizon">
            Berapa langkah M1 ke depan yang dijadikan referensi. Misal horizon 240 = prediksi 4 jam ke depan.
            Beberapa strategi bisa memiliki horizon berbeda dari prediksi TFT yang sama.
          </Card>
          <Card icon="filter_alt" title="Min Probability Threshold">
            Nilai minimum prob_profit dari meta-model agar sinyal dieksekusi. Default 0.60 (60%).
            Bisa dikonfigurasi per strategi sesuai toleransi risiko.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <Table
            headers={['Parameter', 'Tipe', 'Contoh Nilai', 'Keterangan']}
            rows={[
              ['rr_ratio',         'Float',   '2.0',    'Risk-reward 1:2'],
              ['target_pips',      'Float',   '30.0',   'Minimum pergerakan 30 pip'],
              ['horizon_minutes',  'Integer', '240',    'Referensi 240 menit ke depan'],
              ['min_prob_profit',  'Float',   '0.65',   'Min 65% probabilitas profit'],
              ['symbol',           'String',  'EURUSD', 'Instrumen yang dipantau'],
              ['max_lot_size',     'Float',   '0.10',   'Maksimum ukuran posisi'],
            ]}
          />
        </div>
      </Section>

      <Section title="Step 3 — Pembentukan Kandidat Sinyal">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Kandidat sinyal dibentuk untuk setiap kombinasi arah (BUY/SELL) dan parameter strategi aktif
          yang memenuhi syarat minimum pergerakan harga:
        </p>
        <CodeBlock lang="csharp">{`// C# Signal Candidate Builder
public class SignalCandidateBuilder
{
    public IEnumerable<SignalCandidate> Build(
        TftPrediction prediction,
        IEnumerable<Strategy> strategies)
    {
        foreach (var strategy in strategies)
        {
            var horizonPrice = prediction.P50[strategy.HorizonMinutes];
            var predictedMove = horizonPrice - prediction.EntryPrice;
            var absMoveInPips = Math.Abs(predictedMove) / pipSize;

            // Cek apakah pergerakan memenuhi minimum
            if (absMoveInPips < strategy.TargetPips) continue;

            var direction = predictedMove > 0 ? Direction.Buy : Direction.Sell;
            var sl = direction == Direction.Buy
                ? prediction.EntryPrice - (absMoveInPips / strategy.RrRatio) * pipSize
                : prediction.EntryPrice + (absMoveInPips / strategy.RrRatio) * pipSize;
            var tp = direction == Direction.Buy
                ? prediction.EntryPrice + absMoveInPips * pipSize
                : prediction.EntryPrice - absMoveInPips * pipSize;

            yield return new SignalCandidate
            {
                Symbol      = prediction.Symbol,
                Direction   = direction,
                EntryPrice  = prediction.EntryPrice,
                StopLoss    = sl,
                TakeProfit  = tp,
                RiskReward  = strategy.RrRatio,
                HorizonMin  = strategy.HorizonMinutes,
                StrategyId  = strategy.Id,
            };
        }
    }
}`}</CodeBlock>
      </Section>

      <Section title="Step 4 — Validasi Risiko">
        <InfoBox type="warning">
          Setiap kandidat sinyal harus melewati validasi risiko sebelum dikirim ke meta-model.
          Ini mencegah sinyal yang secara teknikal valid namun berbahaya secara risiko portofolio.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Validasi', 'Kondisi Lolos', 'Aksi jika Gagal']}
            rows={[
              ['Drawdown check',       'Current drawdown < max_drawdown',        'Tolak semua sinyal baru'],
              ['Daily loss limit',     'Today PnL > -max_daily_loss',            'Tolak sinyal hari ini'],
              ['Exposure per symbol',  'Open exposure < max_exposure_symbol',    'Tolak sinyal simbol ini'],
              ['Total exposure',       'Total exposure < max_exposure_total',    'Tolak semua sinyal baru'],
              ['Max open positions',   'Open count < max_open_positions',        'Tunda hingga ada posisi tutup'],
              ['News blackout',        'Tidak ada high-impact news ± 30 menit',  'Tunda hingga periode aman'],
              ['Spread check',         'Current spread ≤ 2× average spread',     'Tunda eksekusi'],
              ['Lot size validation',  'Calculated lot ≤ max_lot_size',          'Cap ke max_lot_size'],
            ]}
          />
        </div>
      </Section>

      <Section title="Step 5 — Klasifikasi Meta-Model">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Kandidat yang lolos validasi risiko dikirim ke meta-model XGBoost/LightGBM untuk mendapat
          skor probabilitas profit. Fitur yang digunakan menggabungkan output TFT dengan kondisi pasar saat ini:
        </p>
        <CodeBlock lang="python">{`def build_meta_features(candidate, prediction, market_state):
    return {
        # Dari TFT
        "tft_p50_return":    (prediction.p50[candidate.horizon] - prediction.entry) / prediction.entry,
        "tft_p10_return":    (prediction.p10[candidate.horizon] - prediction.entry) / prediction.entry,
        "tft_p90_return":    (prediction.p90[candidate.horizon] - prediction.entry) / prediction.entry,
        "tft_confidence":    1 - (prediction.p90[candidate.horizon]
                             - prediction.p10[candidate.horizon]) / prediction.p50[candidate.horizon],

        # Dari parameter sinyal
        "rr_ratio":          candidate.risk_reward,
        "horizon_minutes":   candidate.horizon_minutes,
        "sl_pips":           candidate.sl_pips,
        "tp_pips":           candidate.tp_pips,
        "direction_buy":     1 if candidate.direction == "BUY" else 0,

        # Kondisi pasar saat entry
        "entry_rsi_14":      market_state.rsi_14,
        "entry_atr_14":      market_state.atr_14,
        "entry_spread":      market_state.current_spread,
        "bb_position":       market_state.bb_pct,         # posisi dalam Bollinger Band
        "trend_alignment":   market_state.ema_trend,      # 1=aligned, -1=counter-trend

        # Waktu
        "hour_of_day":       candidate.entry_time.hour,
        "day_of_week":       candidate.entry_time.weekday(),
        "session":           market_state.trading_session, # LONDON/NY/TOKYO/OVERLAP
    }

# Klasifikasi
prob_profit = meta_model.predict_proba([features])[0][1]
signal.prob_profit   = prob_profit
signal.is_executable = prob_profit >= strategy.min_prob_profit`}</CodeBlock>
      </Section>

      <Section title="Step 6 — Siklus Hidup Sinyal">
        <Table
          headers={['Status', 'Deskripsi', 'Transisi Berikutnya']}
          rows={[
            ['PENDING',    'Sinyal dibuat, menunggu review atau auto-approve',           'APPROVED / REJECTED'],
            ['APPROVED',   'Sinyal disetujui, antri untuk eksekusi ke JForex',           'EXECUTING'],
            ['REJECTED',   'Ditolak manual oleh trader atau risk engine',                '— (terminal)'],
            ['EXECUTING',  'Order dikirim ke JForex, menunggu konfirmasi fill',          'FILLED / FAILED'],
            ['FILLED',     'Order berhasil dieksekusi oleh broker, posisi terbuka',      'CLOSED / EXPIRED'],
            ['CLOSED',     'Posisi ditutup (TP hit, SL hit, atau manual close)',         '— (terminal)'],
            ['EXPIRED',    'Sinyal tidak tereksekusi dalam time window yang ditentukan', '— (terminal)'],
          ]}
        />
      </Section>

      <Section title="Latency Target">
        <InfoBox type="tip">
          Seluruh pipeline signal generation dirancang untuk berjalan dalam <strong>kurang dari 30 detik</strong>
          setelah candle M1 baru ditutup — memastikan sinyal masih relevan dengan kondisi pasar saat dieksekusi.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Stage', 'Target Latency', 'Bottleneck Potensial']}
            rows={[
              ['M1 candle close → ingest',    '< 100ms',  'Network latency ke Dukascopy'],
              ['Ingest → feature compute',    '< 2s',     'Rust preprocessing (CPU-bound)'],
              ['Feature → TFT inference',     '< 10s',    'GPU availability, model size'],
              ['TFT → candidate build',       '< 200ms',  'Jumlah strategi aktif'],
              ['Candidate → risk validate',   '< 100ms',  'Database query exposure'],
              ['Risk → meta-model classify',  '< 300ms',  'Jumlah kandidat'],
              ['Meta → JForex submit',        '< 1s',     'Broker response time'],
              ['Total end-to-end',            '< 30s',    'Akumulasi semua stage'],
            ]}
          />
        </div>
      </Section>
    </DocPage>
  )
}
