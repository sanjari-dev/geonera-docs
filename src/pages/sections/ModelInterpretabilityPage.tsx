import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function ModelInterpretabilityPage() {
  return (
    <DocPage
      icon="insights"
      title="Model Interpretability"
      subtitle="Geonera mendukung transparansi penuh dalam setiap keputusan sinyal trading melalui SHAP values, visualisasi prediksi TFT dengan interval kepercayaan, dan explainability dashboard untuk memahami faktor pendorong setiap prediksi."
      badge="XAI"
      badgeColor="purple"
    >
      <Section title="Mengapa Interpretabilitas Penting di Trading AI">
        <InfoBox type="info">
          Di lingkungan trading finansial, keputusan tidak bisa sepenuhnya diserahkan ke black-box model.
          Trader, risk manager, dan auditor perlu memahami <strong>mengapa</strong> model menghasilkan sinyal
          tertentu — untuk validasi, debugging, dan akuntabilitas regulasi.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="gavel" title="Akuntabilitas Keputusan">
              Setiap sinyal trading yang dieksekusi harus dapat dijelaskan: fitur pasar apa yang mendorong
              prediksi bullish/bearish, dan mengapa meta-model mengklasifikasikannya sebagai high-probability.
            </Card>
            <Card icon="bug_report" title="Debugging Model Degradasi">
              Ketika win rate turun, interpretabilitas membantu mengidentifikasi apakah ada regime change
              di pasar yang membuat fitur tertentu tidak lagi relevan atau bahkan misleading.
            </Card>
            <Card icon="trending_up" title="Continuous Improvement">
              Analisis feature importance dari waktu ke waktu mengungkap pattern mana yang konsisten
              prediktif vs. mana yang hanya kebetulan berkorelasi di periode training.
            </Card>
            <Card icon="verified" title="Kepercayaan Pengguna">
              Untuk platform SaaS dan marketplace sinyal, subscriber perlu melihat reasoning di balik
              setiap sinyal — bukan hanya label BUY/SELL dengan angka probabilitas.
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="SHAP Values — Meta-Model Explainability">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          <strong>SHAP (SHapley Additive exPlanations)</strong> digunakan untuk menjelaskan output
          XGBoost/LightGBM meta-model. Setiap sinyal mendapat SHAP breakdown yang menunjukkan kontribusi
          positif/negatif masing-masing fitur terhadap prediksi prob_profit.
        </p>
        <CodeBlock lang="python">{`import shap

# Hitung SHAP values untuk sinyal spesifik
explainer  = shap.TreeExplainer(meta_model)
shap_values = explainer.shap_values(signal_features)

# Contoh output SHAP untuk 1 sinyal (prob_profit = 0.73)
shap_breakdown = {
    "base_value":         0.500,   # baseline probabilitas
    "tft_p50_return":    +0.142,   # prediksi return median → kontribusi positif besar
    "tft_confidence":    +0.068,   # TFT sangat confident → positif
    "entry_rsi_14":      +0.031,   # RSI 42 (tidak overbought) → sedikit positif
    "trend_alignment":   +0.028,   # sinyal searah tren H1 → positif
    "hour_of_day":       +0.015,   # jam 10 London session → positif
    "entry_atr_14":      -0.024,   # volatilitas tinggi → sedikit negatif
    "entry_spread":      -0.010,   # spread agak lebar → negatif kecil
    "final_prediction":   0.750,   # 0.500 + sum(shap_values)
}

# Output ke API untuk ditampilkan di dashboard
signal.shap_explanation = shap_breakdown
signal.top_positive_factors = ["tft_p50_return", "tft_confidence", "entry_rsi_14"]
signal.top_negative_factors = ["entry_atr_14", "entry_spread"]`}</CodeBlock>
        <div className="mt-4">
          <Table
            headers={['Fitur', 'SHAP Tipikal', 'Interpretasi']}
            rows={[
              ['tft_p50_return',    '± 0.05 – 0.20', 'Kekuatan prediksi return TFT — faktor dominan'],
              ['tft_confidence',    '± 0.03 – 0.10', 'Seberapa "yakin" TFT (spread P90-P10 kecil = yakin)'],
              ['trend_alignment',   '± 0.02 – 0.08', 'Apakah sinyal searah tren H1/H4'],
              ['entry_rsi_14',      '± 0.01 – 0.05', 'RSI di zona overbought/oversold mempengaruhi kualitas entry'],
              ['entry_atr_14',      '± 0.01 – 0.06', 'Volatilitas tinggi meningkatkan risiko SL terkena noise'],
              ['session',           '± 0.01 – 0.04', 'London/NY overlap biasanya lebih prediktif'],
              ['rr_ratio',          '± 0.01 – 0.03', 'RR lebih tinggi lebih selektif, bisa positif atau negatif'],
              ['entry_spread',      '± 0.00 – 0.03', 'Spread lebar memperburuk probabilitas profit'],
            ]}
          />
        </div>
      </Section>

      <Section title="TFT Prediction Visualization">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Selain SHAP untuk meta-model, dashboard juga menampilkan visualisasi output TFT secara langsung —
          kurva prediksi harga dengan tiga band kepercayaan:
        </p>
        <CardGrid>
          <Card icon="show_chart" title="Quantile Band Chart">
            Chart interaktif menampilkan kurva P10 (batas bawah), P50 (prediksi median), dan P90 (batas atas)
            selama 7200 langkah ke depan. Trader bisa melihat rentang ketidakpastian dan di mana level SL/TP
            berada relatif terhadap distribusi prediksi.
          </Card>
          <Card icon="candlestick_chart" title="Entry Level Overlay">
            Level entry, stop loss, dan take profit di-overlay di atas kurva prediksi TFT, sehingga
            trader bisa secara intuitif menilai apakah TP berada di area P50 prediksi atau hanya P10.
          </Card>
          <Card icon="timeline" title="Historical Accuracy Overlay">
            Untuk sinyal yang sudah closed, tampilkan prediksi TFT vs. harga aktual. Visualisasi ini
            membantu mengkalibrasi kepercayaan pengguna terhadap model seiring waktu.
          </Card>
          <Card icon="waterfall_chart" title="Attention Weights (TFT)">
            TFT secara native menghasilkan attention weights yang menunjukkan langkah-langkah historis
            mana yang paling diperhatikan model saat membuat prediksi — berguna untuk analisis pattern.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Interpretability di Admin Dashboard">
        <Table
          headers={['Fitur Dashboard', 'Data yang Ditampilkan', 'Tujuan']}
          rows={[
            ['Signal SHAP Breakdown',     'Waterfall chart kontribusi fitur per sinyal',         'Jelaskan mengapa sinyal ini di-generate'],
            ['TFT Forecast Chart',        'Kurva P10/P50/P90 + level SL/TP overlay',            'Konteks prediksi vs. risk level'],
            ['Feature Importance (Global)','Bar chart SHAP mean |value| per fitur',             'Fitur apa yang paling konsisten penting'],
            ['Drift Detection Chart',     'Perubahan feature importance dari waktu ke waktu',    'Deteksi regime change pasar'],
            ['Prediction vs Actual',      'Scatter: predicted return vs actual return',          'Kalibrasi akurasi model'],
            ['Confusion Matrix',          'TP/FP/TN/FN dari meta-model per periode',            'Evaluasi kualitas klasifikasi'],
            ['Signal Rejection Analysis', 'Mengapa sinyal ditolak (fitur mana yang rendah)',    'Optimasi parameter strategi'],
          ]}
        />
      </Section>

      <Section title="Model Transparency untuk SaaS/Subscriber">
        <InfoBox type="tip">
          Untuk pengguna platform SaaS, setiap sinyal yang mereka terima dilengkapi dengan
          <strong> Transparency Card</strong> — ringkasan non-teknis yang menjelaskan reasoning sinyal
          dalam bahasa yang dapat dimengerti trader tanpa background ML.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="json">{`// Transparency Card per sinyal (untuk subscriber non-technical)
{
  "signal_id":    "3fa85f64-...",
  "symbol":       "EURUSD",
  "direction":    "BUY",
  "prob_profit":  0.73,
  "transparency": {
    "summary": "Model memprediksi EURUSD naik 35 pip dalam 4 jam ke depan",
    "confidence_level": "HIGH",      // HIGH/MEDIUM/LOW berdasarkan tft_confidence
    "key_reasons": [
      "Prediksi AI kuat: median return +0.032% dengan spread kuantil kecil",
      "RSI 42 menunjukkan ruang gerak ke atas sebelum overbought",
      "Sinyal searah dengan tren H1 bullish"
    ],
    "key_risks": [
      "Volatilitas (ATR) sedang tinggi, potensi noise lebih besar",
      "Spread saat ini sedikit lebih lebar dari rata-rata"
    ],
    "similar_historical_signals": {
      "count": 142,
      "win_rate": 0.71,
      "avg_pips": 28.4
    }
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Implementasi Teknis">
        <Table
          headers={['Komponen', 'Library/Tool', 'Bahasa']}
          rows={[
            ['SHAP computation',         'shap (TreeExplainer)',          'Python'],
            ['TFT attention weights',    'pytorch-forecasting built-in',  'Python'],
            ['SHAP API endpoint',        'C# REST + Python RPC',          'C# / Python'],
            ['Chart rendering',          'Recharts / D3.js',              'TypeScript'],
            ['SHAP storage',             'PostgreSQL JSONB column',        'SQL'],
            ['Quantile prediction store','ClickHouse (predictions table)', 'SQL'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
