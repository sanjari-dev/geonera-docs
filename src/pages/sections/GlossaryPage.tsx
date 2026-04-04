import { DocPage, Section, InfoBox } from '@/components/ui/DocPage'

interface TermProps {
  term: string
  category: string
  categoryColor: string
  definition: string
  seeAlso?: string[]
}

function Term({ term, category, categoryColor, definition, seeAlso }: TermProps) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3 mb-1">
        <span className="font-mono font-bold text-slate-900 text-sm">{term}</span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shrink-0 mt-0.5 ${categoryColor}`}>
          {category}
        </span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{definition}</p>
      {seeAlso && seeAlso.length > 0 && (
        <p className="text-xs text-slate-400 mt-1">
          Lihat juga: {seeAlso.map((s, i) => (
            <span key={s}><span className="font-mono text-primary">{s}</span>{i < seeAlso.length - 1 ? ', ' : ''}</span>
          ))}
        </p>
      )}
    </div>
  )
}

export function GlossaryPage() {
  return (
    <DocPage
      icon="menu_book"
      title="Glossary"
      subtitle="Referensi terminologi teknikal dan trading yang digunakan di seluruh dokumentasi Geonera — dari istilah AI/ML, format data, hingga konsep trading finansial."
      badge="Reference"
      badgeColor="slate"
    >
      <InfoBox type="info">
        Istilah dikelompokkan berdasarkan domain. Klik referensi halaman di tiap term untuk membaca konteks lengkapnya.
      </InfoBox>

      <Section title="AI / Machine Learning">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <Term term="TFT — Temporal Fusion Transformer" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Model deep learning untuk prediksi time-series yang dikembangkan Google Research. Menggabungkan LSTM, multi-head attention, dan gating mechanism untuk menangani fitur statis, time-varying known (jam, kalender), dan time-varying unknown (harga, indikator) secara simultan. Menghasilkan distribusi kuantil (P10/P50/P90) per langkah waktu."
            seeAlso={['Walk-Forward Validation', 'Quantile Prediction', 'Feature Engineering']} />
          <Term term="Meta-Model" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Model machine learning tahap kedua yang mengklasifikasikan output prediksi tahap pertama (TFT). Di Geonera, meta-model XGBoost atau LightGBM menerima fitur dari prediksi TFT + kondisi pasar saat ini untuk menghasilkan prob_profit — probabilitas bahwa sinyal akan profit."
            seeAlso={['XGBoost', 'LightGBM', 'Signal Generation']} />
          <Term term="XGBoost" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Extreme Gradient Boosting — algoritma ensemble gradient boosting tree yang sangat performan. Digunakan sebagai salah satu kandidat meta-model Geonera karena kecepatan inferensi tinggi dan robustness terhadap outlier." />
          <Term term="LightGBM" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Light Gradient Boosting Machine dari Microsoft. Alternatiif XGBoost dengan kecepatan training lebih cepat (leaf-wise tree growth) dan memory footprint lebih kecil, cocok untuk dataset dengan banyak fitur seperti feature matrix Geonera." />
          <Term term="SHAP — SHapley Additive exPlanations" category="XAI" categoryColor="bg-indigo-100 text-indigo-700"
            definition="Framework interpretabilitas model berbasis game theory. SHAP values menunjukkan kontribusi masing-masing fitur terhadap prediksi individual. Di Geonera digunakan untuk menjelaskan mengapa meta-model memberikan prob_profit tertentu ke setiap sinyal."
            seeAlso={['Meta-Model', 'Model Interpretability']} />
          <Term term="Walk-Forward Validation" category="ML Ops" categoryColor="bg-slate-100 text-slate-700"
            definition="Teknik validasi model time-series yang mencegah data leakage. Model ditraining pada window data historis N, kemudian dievaluasi pada window N+1 yang belum pernah dilihat, lalu window digeser maju. Menghasilkan estimasi performa yang lebih realistis dibanding cross-validation biasa untuk data time-series."
            seeAlso={['Backtesting']} />
          <Term term="Quantile Prediction" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Prediksi yang menghasilkan distribusi probabilistik, bukan satu nilai tunggal. TFT Geonera menghasilkan P10 (batas bawah 10%), P50 (median), dan P90 (batas atas 90%) untuk setiap langkah prediksi. Interval P10-P90 mencerminkan ketidakpastian model." />
          <Term term="Model Drift" category="ML Ops" categoryColor="bg-slate-100 text-slate-700"
            definition="Degradasi performa model seiring waktu akibat perubahan distribusi data input (concept drift) atau target (label drift). Di Geonera dimonitor via metrik MAE rolling 7 hari dan win rate. Trigger retraining otomatis jika melewati threshold." />
          <Term term="Feature Engineering" category="AI/ML" categoryColor="bg-purple-100 text-purple-700"
            definition="Proses mengubah data mentah (OHLCV, tick) menjadi representasi numerik yang bermakna untuk model ML. Di Geonera dilakukan oleh Rust preprocessing engine: kalkulasi indikator teknikal (RSI, MACD, ATR), normalisasi statistik, dan encoding waktu siklikal (sin/cos)."
            seeAlso={['Rust', 'OHLCV', 'Technical Indicators']} />
        </div>
      </Section>

      <Section title="Trading & Pasar Finansial">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <Term term="bi5" category="Data Format" categoryColor="bg-teal-100 text-teal-700"
            definition="Format file biner milik Dukascopy untuk menyimpan data tick. Setiap file mencakup data satu jam untuk satu instrumen, dikompresi menggunakan algoritma LZMA. Setiap record berukuran 20 bytes: timestamp (4B), ask (4B), bid (4B), ask volume (4B), bid volume (4B). Nama file mengikuti pola YYYY/MM/DD/HH_ticks.bi5."
            seeAlso={['Dukascopy', 'Tick Data', 'OHLCV']} />
          <Term term="OHLCV" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Open, High, Low, Close, Volume — representasi agregat data harga dalam periode tertentu (candlestick/bar). Di Geonera, data tick bi5 diagregasi menjadi OHLCV pada timeframe M1, M5, M15, M30, H1, H4, dan D1 kemudian disimpan di ClickHouse." />
          <Term term="Pip" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Percentage In Point — unit pergerakan harga terkecil yang bermakna di pasar forex. Untuk pair seperti EURUSD (5 desimal), 1 pip = 0.00010. Untuk USDJPY (3 desimal), 1 pip = 0.010. Digunakan untuk mengukur jarak stop loss, take profit, dan pergerakan harga." />
          <Term term="Risk-Reward Ratio (RR)" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Rasio antara potensi keuntungan dan risiko pada satu trade. RR 1:2 berarti potensi profit dua kali lipat risiko yang diambil. Di Geonera, RR adalah parameter strategi yang menentukan jarak take profit relatif terhadap stop loss. RR lebih tinggi berarti TP lebih jauh dari entry."
            seeAlso={['Stop Loss', 'Take Profit', 'Signal Generation']} />
          <Term term="Stop Loss (SL)" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Level harga di mana posisi trading otomatis ditutup untuk membatasi kerugian jika harga bergerak berlawanan dengan prediksi. Di Geonera, SL dikalkulasi berdasarkan target pergerakan harga dibagi RR ratio." />
          <Term term="Take Profit (TP)" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Level harga target di mana posisi trading ditutup secara otomatis untuk mengambil profit. Di Geonera, TP dikalkulasi dari prediksi pergerakan TFT pada horizon yang ditentukan strategi." />
          <Term term="Drawdown" category="Risk Management" categoryColor="bg-red-100 text-red-700"
            definition="Penurunan nilai equity dari titik puncak (high watermark) ke titik terendah berikutnya, dinyatakan dalam persentase. Max drawdown adalah drawdown terbesar yang pernah terjadi. Geonera membatasi max drawdown di 15% sebagai hard stop untuk melindungi modal." />
          <Term term="Profit Factor" category="Analytics" categoryColor="bg-blue-100 text-blue-700"
            definition="Rasio gross profit terhadap gross loss: Profit Factor = Total Profit / Total Loss. PF > 1.0 berarti sistem menghasilkan lebih banyak dari yang hilang. Geonera menargetkan PF > 1.5 sebagai threshold kualitas strategi." />
          <Term term="Spread" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Selisih antara harga ask (jual broker) dan bid (beli broker). Merepresentasikan biaya implicit setiap transaksi. Geonera memonitor spread real-time dan menunda eksekusi jika spread melebihi 2× rata-rata untuk menghindari entry di kondisi likuiditas buruk." />
          <Term term="Lot Size" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Ukuran volume posisi trading. 1 standard lot forex = 100.000 unit base currency. Geonera menggunakan model fixed fractional untuk menghitung lot size: Lot = (Equity × Risk%) / (SL_pips × PipValue)." />
          <Term term="Backtesting" category="Analytics" categoryColor="bg-blue-100 text-blue-700"
            definition="Simulasi strategi trading menggunakan data historis untuk mengevaluasi performa hipotetis. Di Geonera menggunakan walk-forward validation untuk mencegah overfitting dan lookahead bias. Metrik yang dievaluasi: win rate, profit factor, max drawdown, Sharpe ratio."
            seeAlso={['Walk-Forward Validation', 'Sharpe Ratio']} />
          <Term term="Sharpe Ratio" category="Analytics" categoryColor="bg-blue-100 text-blue-700"
            definition="Ukuran risk-adjusted return: (Rata-rata return - Risk-free rate) / Standar deviasi return. Semakin tinggi semakin baik. Geonera menargetkan Sharpe Ratio > 1.0 pada backtesting sebagai threshold kualitas strategi." />
        </div>
      </Section>

      <Section title="Teknologi & Infrastruktur">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <Term term="Dukascopy" category="Broker" categoryColor="bg-slate-100 text-slate-700"
            definition="Bank dan broker Swiss yang menyediakan akses ke liquidity provider forex. Geonera menggunakan Dukascopy dalam dua kapasitas: (1) sumber data historis tick dalam format bi5, dan (2) platform trading JForex untuk eksekusi order ke pasar." />
          <Term term="JForex" category="Platform" categoryColor="bg-slate-100 text-slate-700"
            definition="Platform trading Dukascopy yang dilengkapi Java SDK untuk pengembangan strategi algoritma. Geonera menggunakan JForex SDK secara eksklusif untuk mengeksekusi order trading karena ini adalah satu-satunya SDK resmi yang mendukung akses programatik ke liquidity provider Dukascopy."
            seeAlso={['Dukascopy', 'Java']} />
          <Term term="ClickHouse" category="Database" categoryColor="bg-teal-100 text-teal-700"
            definition="Database kolumnar OLAP (Online Analytical Processing) dari Yandex, dioptimalkan untuk query analitik pada data time-series skala besar. Geonera menggunakannya untuk menyimpan seluruh data tick, OHLCV, feature matrix, dan output prediksi TFT. Mendukung kompresi data yang sangat baik dan query paralel yang cepat." />
          <Term term="RabbitMQ" category="Infrastructure" categoryColor="bg-slate-100 text-slate-700"
            definition="Message broker open-source yang mengimplementasikan protokol AMQP. Di Geonera digunakan untuk komunikasi asynchronous antar semua microservices. Mendukung berbagai exchange pattern (Fanout, Direct, Topic) untuk routing pesan yang fleksibel. Dikonfigurasi dengan quorum queues untuk high availability." />
          <Term term="Polyglot Programming" category="Architecture" categoryColor="bg-blue-100 text-blue-700"
            definition="Pendekatan pengembangan software di mana berbagai bahasa pemrograman digunakan untuk komponen berbeda berdasarkan keunggulan masing-masing, bukan memilih satu bahasa untuk semua. Geonera menggunakan 6 bahasa: Go (ingest), Rust (compute), Python (AI), C# (API), Java (trading), TypeScript (UI)." />
          <Term term="mTLS — Mutual TLS" category="Security" categoryColor="bg-red-100 text-red-700"
            definition="Versi TLS di mana kedua pihak (klien dan server) saling mengautentikasi menggunakan sertifikat. Di Geonera digunakan untuk komunikasi antar microservices dalam cluster, memastikan tidak ada service palsu yang bisa menyisip ke dalam komunikasi internal." />
          <Term term="Multi-Timeframe (MTF)" category="Trading" categoryColor="bg-green-100 text-green-700"
            definition="Analisis harga pada lebih dari satu timeframe sekaligus. Geonera mengolah data dalam 7 timeframe (M1 hingga D1) untuk memberikan konteks yang lebih lengkap kepada model AI — sinyal searah tren di timeframe lebih tinggi biasanya memiliki kualitas lebih baik." />
        </div>
      </Section>

      <Section title="Indikator Teknikal">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4">
          <Term term="RSI — Relative Strength Index" category="Indicator" categoryColor="bg-amber-100 text-amber-700"
            definition="Osilator momentum (0-100) yang mengukur kecepatan dan besarnya perubahan harga. RSI > 70 = overbought (potensi reversal turun), RSI < 30 = oversold (potensi reversal naik). Geonera menggunakan RSI periode 14 sebagai salah satu fitur meta-model." />
          <Term term="MACD — Moving Average Convergence Divergence" category="Indicator" categoryColor="bg-amber-100 text-amber-700"
            definition="Indikator trend-following momentum yang menunjukkan hubungan antara dua EMA (biasanya EMA 12 dan EMA 26). Komponen: MACD line, Signal line (EMA 9 dari MACD), dan Histogram. Di Geonera semua tiga komponen digunakan sebagai fitur terpisah." />
          <Term term="ATR — Average True Range" category="Indicator" categoryColor="bg-amber-100 text-amber-700"
            definition="Ukuran volatilitas pasar yang menghitung rata-rata jangkauan harga True Range selama N periode. ATR tinggi = volatilitas tinggi = risiko stop loss terkena noise lebih besar. Geonera menggunakan ATR 14 sebagai fitur meta-model dan untuk kalkulasi dinamis stop loss adaptif." />
          <Term term="EMA — Exponential Moving Average" category="Indicator" categoryColor="bg-amber-100 text-amber-700"
            definition="Rata-rata bergerak yang memberikan bobot eksponensial lebih besar pada data terbaru dibanding SMA. Geonera menggunakan EMA 9, 21, 50, dan 200 sebagai fitur trend. Posisi harga relatif terhadap EMA 200 sering menjadi filter arah sinyal." />
          <Term term="Bollinger Bands" category="Indicator" categoryColor="bg-amber-100 text-amber-700"
            definition="Tiga band volatilitas di sekitar SMA 20: upper band (SMA + 2×std), middle band (SMA 20), lower band (SMA - 2×std). BB Position (%) menunjukkan posisi harga dalam band — digunakan Geonera sebagai fitur untuk mengidentifikasi kondisi overbought/oversold dan breakout potensial." />
        </div>
      </Section>
    </DocPage>
  )
}
