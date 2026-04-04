import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function AnalyticsPage() {
  return (
    <DocPage
      icon="analytics"
      title="Analytics & Performance"
      subtitle="Framework analitik komprehensif untuk mengukur performa trading, kualitas sinyal, akurasi model, dan kesehatan portofolio — dari metrik real-time Prometheus hingga query analitik historis ClickHouse dan dashboard Grafana."
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
            ['Signal Quality',   'Executed signals / Generated signals × 100',             '> 40%',   'Harian'],
            ['Meta-model AUC',   'Area Under ROC Curve dari klasifikasi meta-model',       '> 0.70',  '7-day rolling'],
          ]}
        />
      </Section>

      <Section title="Prometheus Metrics — per Service">
        <InfoBox type="info">
          Setiap microservice mengekspos endpoint <code>/metrics</code> dalam format Prometheus text.
          Prometheus scrape setiap <strong>15 detik</strong>. Metrik berikut adalah metrik
          custom yang didefinisikan Geonera selain metrik default runtime.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Metric Name', 'Type', 'Service', 'Keterangan']}
            rows={[
              ['geonera_signals_generated_total',    'Counter',   'C# Signal',    'Total sinyal yang di-generate (label: symbol, strategy)'],
              ['geonera_signals_executed_total',     'Counter',   'Java JForex',  'Total sinyal yang dieksekusi ke broker'],
              ['geonera_signal_prob_profit',         'Histogram', 'C# Signal',    'Distribusi prob_profit dari meta-model'],
              ['geonera_tft_inference_duration_ms',  'Histogram', 'Python TFT',   'Latency inferensi TFT per prediksi'],
              ['geonera_tft_mae_rolling_7d',         'Gauge',     'Python TFT',   'MAE rolling 7 hari untuk drift detection'],
              ['geonera_portfolio_drawdown_pct',     'Gauge',     'C# Risk',      'Drawdown portofolio aktual (0-100)'],
              ['geonera_ingest_tick_lag_seconds',    'Gauge',     'Go Ingest',    'Selisih waktu tick terbaru vs now()'],
              ['geonera_feature_compute_duration_ms','Histogram', 'Rust Preproc', 'Waktu komputasi feature per M1 candle'],
              ['geonera_order_execution_ms',         'Histogram', 'Java JForex',  'Latency eksekusi order ke Dukascopy'],
              ['geonera_rabbitmq_queue_depth',       'Gauge',     'C# Monitor',   'Kedalaman queue RabbitMQ per exchange'],
            ]}
          />
        </div>
        <div className="mt-4">
          <CodeBlock lang="csharp">{`// C# — Mendefinisikan custom Prometheus metrics
using Prometheus;

public class SignalMetrics
{
    private static readonly Counter SignalsGenerated = Metrics
        .CreateCounter("geonera_signals_generated_total",
            "Total signals generated",
            new[] { "symbol", "strategy", "direction" });

    private static readonly Histogram ProbProfitDist = Metrics
        .CreateHistogram("geonera_signal_prob_profit",
            "Distribution of prob_profit from meta-model",
            new HistogramConfiguration {
                Buckets = new[] { 0.5, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.90, 1.0 }
            });

    private static readonly Gauge DrawdownPct = Metrics
        .CreateGauge("geonera_portfolio_drawdown_pct",
            "Current portfolio drawdown percentage");

    public static void RecordSignal(Signal signal) {
        SignalsGenerated.WithLabels(signal.Symbol, signal.StrategyId, signal.Direction).Inc()
        ProbProfitDist.Observe(signal.ProbProfit);
    }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="PromQL — Alert & Dashboard Queries">
        <CodeBlock lang="promql">{`# Win rate 7-hari rolling (persentase sinyal profit)
# Dihitung dari counter yang direkam saat sinyal ditutup
(
  increase(geonera_signals_closed_total{result="profit"}[7d])
  /
  increase(geonera_signals_closed_total[7d])
) * 100

# Alert: Drawdown melebihi 15%
geonera_portfolio_drawdown_pct > 15

# Alert: TFT inference latency P95 > 10 detik
histogram_quantile(0.95, rate(geonera_tft_inference_duration_ms_bucket[5m])) > 10000

# Alert: Data ingest tertinggal lebih dari 60 detik
geonera_ingest_tick_lag_seconds > 60

# Alert: Meta-model AUC degradasi
geonera_tft_mae_rolling_7d > 0.0015

# RabbitMQ queue depth per exchange
geonera_rabbitmq_queue_depth{exchange="geonera.signals"}

# Throughput sinyal per menit (rate dari 5m window)
rate(geonera_signals_generated_total[5m]) * 60

# API error rate 5xx
(
  rate(http_requests_total{status=~"5.."}[5m])
  /
  rate(http_requests_total[5m])
) * 100`}</CodeBlock>
      </Section>

      <Section title="Model Drift Detection">
        <InfoBox type="warning">
          Model drift adalah penurunan performa model seiring waktu karena perubahan karakteristik pasar
          (regime change). Geonera memonitor drift secara aktif dan memicu retraining otomatis jika
          metrik degradasi melewati threshold yang dikonfigurasi.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Metrik Drift', 'Baseline', 'Warning', 'Critical', 'Aksi Otomatis']}
            rows={[
              ['TFT MAE (7d rolling)',      '< 0.0010',  '> 0.0015',   '> 0.0020',   'Alert → Retrain trigger'],
              ['Meta-model AUC (7d)',       '> 0.70',    '< 0.62',     '< 0.55',     'Alert → Retrain trigger'],
              ['Win Rate (7d rolling)',     '> 55%',     '< 50%',      '< 45%',      'Alert → Throttle lot size'],
              ['Prediction Bias',          '≈ 0.0',     '|b| > 0.0005','|b| > 0.001','Alert → Recalibrate'],
              ['Feature Distribution KL',  '< 0.05',    '> 0.10',     '> 0.20',     'Alert (regime change signal)'],
            ]}
          />
        </div>
        <div className="mt-4">
          <CodeBlock lang="python">{`# Drift detection menggunakan rolling MAE dan statistical test
import numpy as np
from scipy.stats import ks_2samp

def detect_drift(recent_predictions: np.ndarray,
                 recent_actuals: np.ndarray,
                 baseline_features: np.ndarray,
                 current_features: np.ndarray) -> dict:

    # 1. Performa drift: rolling MAE
    mae_recent = np.mean(np.abs(recent_predictions - recent_actuals))

    # 2. Data drift: KL divergence proxy via KS test
    ks_stats = {}
    for feat_idx in range(current_features.shape[1]):
        stat, p_val = ks_2samp(
            baseline_features[:, feat_idx],
            current_features[:, feat_idx]
        )
        ks_stats[f"feature_{feat_idx}"] = {"ks_stat": stat, "p_value": p_val}

    max_ks = max(v["ks_stat"] for v in ks_stats.values())

    return {
        "mae":          mae_recent,
        "max_ks_stat":  max_ks,
        "needs_retrain": mae_recent > 0.0015 or max_ks > 0.10,
        "feature_drift": {k: v for k, v in ks_stats.items() if v["ks_stat"] > 0.10}
    }`}</CodeBlock>
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
FROM signal_metrics
WHERE evaluated_at >= now() - INTERVAL 30 DAY
  AND status = 'CLOSED'
GROUP BY symbol
ORDER BY total_pips DESC;

-- Equity curve harian (PostgreSQL)
SELECT
    toDate(closed_at) AS trade_date,
    sum(pnl_usd)       AS daily_pnl,
    sum(sum(pnl_usd)) OVER (ORDER BY toDate(closed_at)) AS equity_curve
FROM signal_metrics
WHERE status = 'CLOSED'
GROUP BY trade_date
ORDER BY trade_date;

-- Distribusi prob_profit vs hasil aktual (kalibrasi model)
SELECT
    round(prob_profit, 1)              AS prob_bucket,
    count()                             AS total,
    countIf(pnl_pips > 0)              AS actual_wins,
    round(countIf(pnl_pips > 0) / count() * 100, 2) AS actual_win_rate_pct
FROM signal_metrics
WHERE status = 'CLOSED'
GROUP BY prob_bucket
ORDER BY prob_bucket;

-- Performance per jam hari (untuk deteksi session pattern)
SELECT
    toHour(created_at)                  AS hour_utc,
    count()                             AS signals,
    round(countIf(pnl_pips > 0) / count() * 100, 2) AS win_rate
FROM signal_metrics
WHERE status = 'CLOSED' AND created_at >= now() - INTERVAL 90 DAY
GROUP BY hour_utc ORDER BY win_rate DESC;`}</CodeBlock>
      </Section>

      <Section title="Reporting">
        <Table
          headers={['Report', 'Isi', 'Frekuensi', 'Distribusi']}
          rows={[
            ['Daily Trading Summary',  'Sinyal hari ini, PnL, win rate, posisi terbuka, drawdown',  'Harian 08:00 UTC', 'Email + Slack'],
            ['Weekly Performance',     'KPI mingguan, equity curve, top/bottom performers, drift',   'Senin 09:00 UTC',  'Email'],
            ['Model Health Report',    'Akurasi model, MAE trend, drift score, retraining history',  'Mingguan',         'Admin dashboard'],
            ['Monthly Risk Report',    'Drawdown analysis, VaR, stress test results, Sharpe',        'Bulanan',          'Email PDF'],
            ['Signal Quality Report',  'Rejection rate, strategy comparison, meta-model calibration','Mingguan',         'Admin dashboard'],
            ['Quarterly Review',       'Full performance attribution, model version comparison',     'Triwulanan',       'Email PDF'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
