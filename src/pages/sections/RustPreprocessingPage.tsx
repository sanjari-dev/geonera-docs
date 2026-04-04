import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function RustPreprocessingPage() {
  return (
    <DocPage
      icon="memory"
      title="Rust Preprocessing Engine"
      subtitle="Engine berperforma tinggi yang mengubah data OHLCV mentah menjadi feature matrix siap pakai untuk model TFT. Menghitung 40+ indikator teknikal, normalisasi statistik, encoding waktu siklikal, dan pembentukan dataset training dengan zero-copy memory management."
      badge="Rust"
      badgeColor="orange"
    >
      <Section title="Tanggung Jawab Engine">
        <InfoBox type="info">
          Rust dipilih bukan hanya karena kecepatan — tapi karena memory safety yang dijamin compiler. Kalkulasi indikator teknikal yang salah karena buffer overflow atau race condition bisa menghasilkan sinyal trading yang salah. Rust mencegah kelas bug ini sepenuhnya.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="calculate" title="Kalkulasi Indikator">
              Menghitung 40+ indikator teknikal dari OHLCV multi-timeframe: RSI, MACD, EMA (9/21/50/200), ATR, Bollinger Bands, dan log returns. Semua kalkulasi menggunakan sliding window O(n) — bukan O(n&sup2;).
            </Card>
            <Card icon="bar_chart" title="Normalisasi Statistik">
              Setiap fitur dinormalisasi menggunakan z-score rolling window (mean dan std dari 500 candle terakhir) untuk memastikan model TFT menerima input yang stabil dan terdistribusi.
            </Card>
            <Card icon="schedule" title="Encoding Waktu Siklikal">
              Jam, hari minggu, dan bulan diencoding sebagai pasangan sin/cos untuk merepresentasikan sifat siklikalnya. Jam 23 dan jam 0 harus "dekat" secara numerik — encoding linear tidak bisa melakukan ini.
            </Card>
            <Card icon="dataset" title="Pembentukan Dataset">
              Menghasilkan feature matrix berbentuk [T &times; F] di mana T = jumlah timestep dan F = jumlah fitur. Label target adalah future_close_N untuk N = 1 hingga 7200.
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="Kalkulasi RSI">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          RSI (Relative Strength Index) mengukur kecepatan dan besarnya perubahan harga. Implementasi Rust menggunakan metode Wilder's smoothing (EMA dengan &alpha; = 1/period) yang merupakan definisi RSI asli.
        </p>
        <CodeBlock lang="rust">{`/// Menghitung RSI menggunakan metode Wilder's smoothing.
/// Menerima slice harga close dan mengembalikan slice RSI dengan panjang sama.
/// Nilai pertama \`period-1\` akan None (insufficient data).
pub fn calculate_rsi(closes: &[f64], period: usize) -> Vec<Option<f64>> {
    assert!(period >= 2, "RSI period harus >= 2");
    let mut result = vec![None; closes.len()];

    if closes.len() < period + 1 {
        return result;
    }

    // Hitung gains dan losses awal untuk seed Wilder's EMA
    let mut avg_gain = 0.0_f64;
    let mut avg_loss = 0.0_f64;

    for i in 1..=period {
        let change = closes[i] - closes[i - 1];
        if change > 0.0 {
            avg_gain += change;
        } else {
            avg_loss += change.abs();
        }
    }

    avg_gain /= period as f64;
    avg_loss /= period as f64;

    // RSI pertama yang valid
    let alpha = 1.0 / period as f64;
    result[period] = Some(rsi_from_avg(avg_gain, avg_loss));

    // Wilder's smoothing untuk sisa data
    for i in (period + 1)..closes.len() {
        let change = closes[i] - closes[i - 1];
        let gain = if change > 0.0 { change } else { 0.0 };
        let loss = if change < 0.0 { change.abs() } else { 0.0 };

        // Exponential smoothing: avg_new = avg_old * (1 - alpha) + value * alpha
        avg_gain = avg_gain * (1.0 - alpha) + gain * alpha;
        avg_loss = avg_loss * (1.0 - alpha) + loss * alpha;

        result[i] = Some(rsi_from_avg(avg_gain, avg_loss));
    }

    result
}

#[inline]
fn rsi_from_avg(avg_gain: f64, avg_loss: f64) -> f64 {
    if avg_loss == 0.0 {
        return 100.0; // semua gerakan ke atas
    }
    let rs = avg_gain / avg_loss;
    100.0 - (100.0 / (1.0 + rs))
}`}</CodeBlock>
      </Section>

      <Section title="Kalkulasi MACD dan EMA">
        <CodeBlock lang="rust">{`/// Exponential Moving Average dengan faktor smoothing alpha = 2/(period+1)
pub fn calculate_ema(prices: &[f64], period: usize) -> Vec<Option<f64>> {
    let mut result = vec![None; prices.len()];
    if prices.len() < period {
        return result;
    }

    let alpha = 2.0 / (period as f64 + 1.0);

    // Seed EMA pertama dengan SMA dari \`period\` candle pertama
    let seed: f64 = prices[..period].iter().sum::<f64>() / period as f64;
    result[period - 1] = Some(seed);
    let mut prev_ema = seed;

    for i in period..prices.len() {
        let ema = prices[i] * alpha + prev_ema * (1.0 - alpha);
        result[i] = Some(ema);
        prev_ema = ema;
    }

    result
}

/// MACD = EMA(12) - EMA(26). Signal = EMA(9) dari MACD. Histogram = MACD - Signal.
pub struct MacdResult {
    pub macd:      Vec<Option<f64>>,
    pub signal:    Vec<Option<f64>>,
    pub histogram: Vec<Option<f64>>,
}

pub fn calculate_macd(closes: &[f64]) -> MacdResult {
    let ema12 = calculate_ema(closes, 12);
    let ema26 = calculate_ema(closes, 26);

    // MACD line = EMA12 - EMA26 (valid hanya di mana keduanya Some)
    let macd_line: Vec<Option<f64>> = ema12.iter().zip(ema26.iter())
        .map(|(e12, e26)| match (e12, e26) {
            (Some(a), Some(b)) => Some(a - b),
            _ => None,
        })
        .collect();

    // Ambil nilai-nilai MACD yang valid untuk menghitung Signal EMA(9)
    // Kemudian project kembali ke index original
    let valid_macd: Vec<f64> = macd_line.iter().flatten().copied().collect();
    let signal_values = calculate_ema(&valid_macd, 9);

    // Map signal kembali ke posisi original
    let mut signal = vec![None; closes.len()];
    let mut valid_idx = 0;
    for (i, m) in macd_line.iter().enumerate() {
        if m.is_some() {
            signal[i] = signal_values[valid_idx];
            valid_idx += 1;
        }
    }

    let histogram: Vec<Option<f64>> = macd_line.iter().zip(signal.iter())
        .map(|(m, s)| match (m, s) {
            (Some(a), Some(b)) => Some(a - b),
            _ => None,
        })
        .collect();

    MacdResult { macd: macd_line, signal, histogram }
}`}</CodeBlock>
      </Section>

      <Section title="Encoding Waktu Siklikal">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Waktu bersifat siklikal — jam 23 dan jam 0 seharusnya "dekat" secara numerik karena hanya selisih 1 jam. Encoding linear (0–23) gagal merepresentasikan ini. Solusinya: encoding sin/cos yang memetakan siklus ke lingkaran unit.
        </p>
        <CodeBlock lang="rust">{`use std::f64::consts::PI;

/// Menghasilkan pasangan (sin, cos) untuk nilai siklikal.
/// \`value\` adalah nilai saat ini, \`period\` adalah total periode siklus.
/// Contoh: encode_cyclic(10, 24) untuk jam 10 dari 24 jam.
#[inline]
pub fn encode_cyclic(value: f64, period: f64) -> (f64, f64) {
    let angle = 2.0 * PI * value / period;
    (angle.sin(), angle.cos())
}

/// Ekstrak semua fitur waktu dari timestamp UTC.
pub struct TimeFeatures {
    pub hour_sin:    f64,
    pub hour_cos:    f64,
    pub dow_sin:     f64, // day of week
    pub dow_cos:     f64,
    pub month_sin:   f64,
    pub month_cos:   f64,
    pub is_london:   f64, // 1.0 jika dalam sesi London (07:00–16:00 UTC)
    pub is_ny:       f64, // 1.0 jika dalam sesi New York (13:00–22:00 UTC)
    pub is_overlap:  f64, // 1.0 jika London+NY overlap (13:00–16:00 UTC)
}

pub fn extract_time_features(ts: chrono::DateTime<chrono::Utc>) -> TimeFeatures {
    let hour = ts.hour() as f64;
    let dow  = ts.weekday().num_days_from_monday() as f64; // 0=Senin, 6=Minggu
    let month = ts.month0() as f64; // 0–11

    let (hour_sin, hour_cos)   = encode_cyclic(hour,  24.0);
    let (dow_sin,  dow_cos)    = encode_cyclic(dow,    7.0);
    let (month_sin, month_cos) = encode_cyclic(month, 12.0);

    let is_london  = if hour >= 7.0  && hour < 16.0 { 1.0 } else { 0.0 };
    let is_ny      = if hour >= 13.0 && hour < 22.0 { 1.0 } else { 0.0 };
    let is_overlap = if hour >= 13.0 && hour < 16.0 { 1.0 } else { 0.0 };

    TimeFeatures { hour_sin, hour_cos, dow_sin, dow_cos, month_sin, month_cos,
                   is_london, is_ny, is_overlap }
}`}</CodeBlock>
      </Section>

      <Section title="Feature Matrix — Skema Lengkap">
        <InfoBox type="info">
          Feature matrix adalah output final Rust engine — setiap baris adalah satu candle M1, setiap kolom adalah satu fitur. Matrix ini langsung dikonsumsi TFT tanpa transformasi tambahan.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Grup', 'Fitur', 'Dimensi', 'Keterangan']}
            rows={[
              ['Price',      'open, high, low, close, spread_avg',                              '5',    'OHLC raw + rata-rata spread per candle'],
              ['Volume',     'ask_vol, bid_vol, net_vol',                                        '3',    'net_vol = ask_vol - bid_vol (imbalance)'],
              ['Returns',    'ret_1, ret_5, ret_15, ret_60',                                     '4',    'Log return: ln(close_t / close_t-n)'],
              ['Trend EMA',  'ema_9, ema_21, ema_50, ema_200',                                  '4',    'EMA periode 9/21/50/200'],
              ['Momentum',   'rsi_14, macd, macd_signal, macd_hist',                            '4',    'Osilator momentum'],
              ['Volatility', 'atr_14, bb_upper, bb_lower, bb_pct, bb_width',                   '5',    'ATR dan Bollinger Bands'],
              ['Time',       'hour_sin, hour_cos, dow_sin, dow_cos, month_sin, month_cos',      '6',    'Encoding siklikal'],
              ['Session',    'is_london, is_ny, is_overlap',                                    '3',    'Indikator sesi trading aktif'],
              ['Normalized', 'z_{feature} untuk semua numerik',                                 '+19',  'Z-score rolling 500 candle'],
              ['Labels',     'future_close_1 .. future_close_7200',                             '7200', 'Target supervised learning TFT'],
            ]}
          />
        </div>
      </Section>
    </DocPage>
  )
}
