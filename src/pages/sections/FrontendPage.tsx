import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function FrontendPage() {
  return (
    <DocPage
      icon="web"
      title="Frontend & Admin Interface"
      subtitle="Dashboard admin dibangun dengan TypeScript menggunakan runtime Bun, memungkinkan monitoring real-time, evaluasi sinyal, dan pengelolaan konfigurasi trading dalam antarmuka yang responsif."
      badge="Frontend"
      badgeColor="purple"
    >
      <Section title="Tech Stack">
        <CardGrid>
          <Card icon="code" title="TypeScript + Bun">
            Seluruh admin interface dikembangkan menggunakan <strong>TypeScript</strong> untuk type safety.
            Runtime <strong>Bun</strong> dipilih karena startup time yang jauh lebih cepat dari Node.js
            dan built-in bundler yang optimal untuk development loop.
          </Card>
          <Card icon="dashboard_customize" title="Real-Time Dashboard">
            Dashboard terhubung ke backend via <strong>WebSocket</strong> untuk update sinyal, posisi,
            dan metrik sistem secara live tanpa perlu refresh manual.
          </Card>
          <Card icon="palette" title="UI Framework">
            Komponen UI dibangun menggunakan framework modern dengan Tailwind CSS untuk styling.
            Design system internal memastikan konsistensi visual di seluruh halaman admin.
          </Card>
          <Card icon="lock_person" title="Role-Based Views">
            Tampilan UI disesuaikan berdasarkan role pengguna: Viewer hanya melihat sinyal,
            Trader bisa approve/reject, Risk Manager bisa update parameter risiko.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Dashboard Modules">
        <Table
          headers={['Module', 'Fungsi', 'Update Mode']}
          rows={[
            ['Signal Monitor',   'List sinyal aktif, pending, dan historical dengan filter',     'WebSocket live'],
            ['Position Tracker', 'Posisi terbuka, PnL floating, drawdown per posisi',           'WebSocket live'],
            ['Model Insights',   'Performa TFT dan meta-model, confusion matrix, drift chart',  'Polling 1 menit'],
            ['Risk Dashboard',   'Exposure gauge, drawdown chart, daily PnL, limit status',     'WebSocket live'],
            ['Strategy Config',  'CRUD konfigurasi strategi: RR ratio, horizon, threshold',     'On-demand'],
            ['Backtesting UI',   'Jalankan backtest, lihat equity curve, dan metrik validasi',  'On-demand'],
            ['Audit Log',        'History semua aksi: siapa mengubah apa dan kapan',             'Polling 5 menit'],
          ]}
        />
      </Section>

      <Section title="Signal Monitor — Detail View">
        <CodeBlock lang="typescript">{`// Tipe data sinyal untuk UI
interface Signal {
  id:             string
  symbol:         string          // e.g. "EURUSD"
  direction:      'BUY' | 'SELL'
  entryPrice:     number
  stopLoss:       number
  takeProfit:     number
  riskReward:     number
  probProfit:     number          // 0.0 - 1.0 dari meta-model
  tftConfidence:  number          // spread kuantil TFT
  horizonMinutes: number
  status:         SignalStatus
  createdAt:      string          // ISO 8601
  modelVersion:   string
}

// WebSocket message dari backend
interface SignalUpdate {
  type:    'SIGNAL_CREATED' | 'SIGNAL_UPDATED' | 'SIGNAL_CLOSED'
  payload: Signal
}

// Hook untuk live update
function useSignalStream() {
  const [signals, setSignals] = useState<Signal[]>([])
  useEffect(() => {
    const ws = new WebSocket('wss://api.geonera.io/ws/signals')
    ws.onmessage = (e) => {
      const update: SignalUpdate = JSON.parse(e.data)
      setSignals(prev => applyUpdate(prev, update))
    }
    return () => ws.close()
  }, [])
  return signals
}`}</CodeBlock>
      </Section>

      <Section title="Interpretabilitas Model (XAI)">
        <InfoBox type="tip">
          Untuk mendukung transparansi keputusan AI, admin interface menampilkan penjelasan berbasis
          <strong> SHAP values</strong> — menunjukkan fitur mana yang paling mempengaruhi keputusan
          meta-model untuk setiap sinyal.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="insights" title="SHAP Feature Importance">
              Setiap sinyal dilengkapi dengan chart SHAP yang menunjukkan kontribusi positif/negatif
              dari fitur seperti RSI, ATR, probabilitas TFT, dan kondisi pasar saat itu.
            </Card>
            <Card icon="query_stats" title="TFT Quantile Visualization">
              Tampilkan kurva prediksi harga TFT (P10, P50, P90) dalam chart interaktif, sehingga
              trader bisa melihat rentang ketidakpastian prediksi sebelum mengambil keputusan.
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="Build & Development">
        <Table
          headers={['Perintah', 'Fungsi']}
          rows={[
            ['bun install',         'Install semua dependencies'],
            ['bun run dev',         'Start development server dengan hot reload'],
            ['bun run build',       'Build untuk production (output ke /dist)'],
            ['bun run type-check',  'Validasi TypeScript tanpa build'],
            ['bun run lint',        'Jalankan ESLint + Prettier check'],
            ['bun run test',        'Unit test komponen UI'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
