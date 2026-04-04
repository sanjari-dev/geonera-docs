import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function AnalyticsPage() {
  return (
    <DocPage
      icon="analytics"
      title="Analytics & Performance"
      subtitle="Framework analitik komprehensif untuk mengukur performa trading, kualitas sinyal, akurasi model, dan kesehatan portofolio secara real-time maupun historis."
      badge="Analytics"
      badgeColor="blue"
    >
      <Section title="Dimensi Analitik">
        <CardGrid>
          <Card icon="candlestick_chart" title="Trading Performance">
            Metrik performa trading: win rate, profit factor, expectancy per trade, rata-rata
            durasi posisi, distribusi PnL, dan equity curve dari waktu ke waktu.
          </Card>
          <Card icon="model_training" title="Model Quality">
            Metrik kualitas model AI: MAE prediksi TFT, akurasi klasifikasi meta-model,
            AUC-ROC, precision/recall, dan drift detection untuk degradasi model.
          </Card>
          <Card icon="manage_accounts" title="Signal Analytics">
            Analisis per strategi: jumlah sinyal generated vs executed, rejection rate,
            performa per simbol, per timeframe, dan per kondisi pasar.
          </Card>
          <Card icon="waterfall_chart" title="Risk Analytics">
            Monitoring drawdown historis, distribusi kerugian, correlation antar posisi,
            Value at Risk (VaR), dan stress testing skenario pasar ekstrem.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Key Performance Indicators (KPI)">
        <Table
          headers={['KPI', 'Formula / Definisi', 'Target', 'Frekuensi Update']}
          rows={[
            ['Win Rate',         'Profitable signals / Total signals × 100',                '> 55%',   'Real-time'],
            ['Profit Factor',    'Gross Profit / Gross Loss',                               '> 1.5',   'Real-time'],
            ['Expectancy',       '(Win Rate × Avg Win) − (Loss Rate × Avg Loss)',           '> 0',     'Harian'],
            ['Sharpe Ratio',     'Avg Daily Return / Std Dev (annualized)',                 '> 1.0',   'Harian'],
            ['Calmar Ratio',     'Annual Return / Max Drawdown',                            '> 0.5',   'Bulanan'],
            ['Max Drawdown',     'Peak equity − Trough equity / Peak equity × 100',        '< 15%',   'Real-time'],
            ['Recovery Factor',  'Net Profit / Max Drawdown',                               '> 2.0',   'Bulanan'],
            ['Avg Trade Duration','Mean menit dari entry hingga close',                     '< 480m',  'Harian'],
          ]}
        />
      </Section>

      <Section title="Model Drift Detection">
        <InfoBox type="warning">
          Model drift adalah penurunan performa model seiring waktu karena perubahan karakteristik pasar
          (regime change). Geonera memonitor drift secara aktif dan memicu retraining otomatis jika
          metrik degradasi melewati threshold.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Metrik Drift', 'Baseline', 'Warning Threshold', 'Critical Threshold', 'Aksi']}
            rows={[
              ['TFT MAE (7d rolling)',     '< 0.0010',  '> 0.0015',   '> 0.0020',   'Alert / Retrain'],
              ['Meta-model Accuracy (7d)', '> 0.70',    '< 0.62',     '< 0.55',     'Alert / Retrain'],
              ['Win Rate (7d rolling)',    '> 55%',     '< 50%',      '< 45%',      'Alert / Throttle'],
              ['Prediction Bias',         '≈ 0.0',     '|bias| > 0.0005','|bias| > 0.001','Alert / Recalibrate'],
            ]}
          />
        </div>
      </Section>

      <Section title="Analytics Queries — ClickHouse">
        <CodeBlock lang="sql">{`-- Win rate per simbol dalam 30 hari terakhir
SELECT
    symbol,
    countIf(pnl_pips > 0)  AS wins,
    countIf(pnl_pips <= 0) AS losses,
    round(wins / (wins + losses) * 100, 2) AS win_rate_pct,
    round(sum(pnl_pips), 2) AS total_pips,
    round(avg(pnl_pips), 4) AS avg_pips_per_trade
FROM signals
WHERE closed_at >= now() - INTERVAL 30 DAY
  AND status = 'CLOSED'
GROUP BY symbol
ORDER BY total_pips DESC;

-- Equity curve harian
SELECT
    toDate(closed_at) AS trade_date,
    sum(pnl_usd)       AS daily_pnl,
    cumSum(pnl_usd)    OVER (ORDER BY trade_date) AS equity_curve
FROM signals
WHERE status = 'CLOSED'
GROUP BY trade_date
ORDER BY trade_date;`}</CodeBlock>
      </Section>

      <Section title="Reporting">
        <Table
          headers={['Report', 'Isi', 'Frekuensi', 'Distribusi']}
          rows={[
            ['Daily Trading Summary',  'Sinyal hari ini, PnL, win rate, posisi terbuka',         'Harian 08:00',   'Email + Slack'],
            ['Weekly Performance',     'KPI mingguan, equity curve, top/bottom performers',       'Senin 09:00',    'Email'],
            ['Model Health Report',    'Akurasi model, drift score, retraining history',           'Mingguan',       'Admin dashboard'],
            ['Monthly Risk Report',    'Drawdown analysis, VaR, stress test results',             'Bulanan',        'Email PDF'],
            ['Signal Quality Report',  'Rejection rate, strategy comparison, symbol analysis',    'Mingguan',       'Admin dashboard'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
