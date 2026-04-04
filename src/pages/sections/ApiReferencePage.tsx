import { DocPage, Section, Table, InfoBox, CodeBlock, CardGrid, Card } from '@/components/ui/DocPage'

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
}

const methodColors: Record<string, string> = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-green-100 text-green-700',
  PUT:    'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH:  'bg-purple-100 text-purple-700',
}

function Endpoint({ method, path, description }: EndpointProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 mt-0.5 ${methodColors[method]}`}>
        {method}
      </span>
      <div>
        <code className="text-sm font-mono text-slate-800">{path}</code>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function ApiReferencePage() {
  return (
    <DocPage
      icon="api"
      title="API Reference"
      subtitle="REST API Geonera dibangun menggunakan C# ASP.NET Core sebagai microservices backend. Semua endpoint menggunakan JSON dan autentikasi berbasis JWT Bearer token."
      badge="Backend"
      badgeColor="purple"
    >
      <Section title="Base URL & Autentikasi">
        <CodeBlock lang="http">{`Base URL:  https://api.geonera.io/v1

Authorization: Bearer <jwt_token>
Content-Type: application/json`}</CodeBlock>
        <div className="mt-4">
          <InfoBox type="info">
            Semua request ke API harus menyertakan header <strong>Authorization: Bearer &lt;token&gt;</strong>.
            Token diperoleh melalui endpoint <code>/auth/token</code> menggunakan API Key.
          </InfoBox>
        </div>
      </Section>

      <Section title="Signals API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"    path="/v1/signals"              description="List semua sinyal trading dengan filter status, simbol, dan tanggal" />
          <Endpoint method="GET"    path="/v1/signals/{id}"         description="Detail sinyal spesifik beserta hasil evaluasi meta-model" />
          <Endpoint method="POST"   path="/v1/signals/generate"     description="Trigger pipeline generasi sinyal untuk simbol dan strategi tertentu" />
          <Endpoint method="PATCH"  path="/v1/signals/{id}/status"  description="Update status sinyal (PENDING → APPROVED / REJECTED)" />
          <Endpoint method="DELETE" path="/v1/signals/{id}"         description="Hapus sinyal yang belum dieksekusi" />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// GET /v1/signals/{id} — Response
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "symbol": "EURUSD",
  "direction": "BUY",
  "entry_price": 1.08542,
  "stop_loss": 1.08200,
  "take_profit": 1.09226,
  "risk_reward": 2.0,
  "prob_profit": 0.723,
  "horizon_minutes": 240,
  "status": "PENDING",
  "model_version": "tft-v3.2.1",
  "created_at": "2025-01-15T08:30:00Z"
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Predictions API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"  path="/v1/predictions"                  description="List prediksi harga terbaru per simbol" />
          <Endpoint method="GET"  path="/v1/predictions/{symbol}/latest"  description="Ambil prediksi 7200-step terbaru untuk simbol tertentu" />
          <Endpoint method="POST" path="/v1/predictions/run"              description="Trigger inferensi TFT untuk simbol tertentu secara on-demand" />
        </div>
      </Section>

      <Section title="Models API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"   path="/v1/models"              description="List semua versi model yang terdaftar (TFT dan meta-model)" />
          <Endpoint method="GET"   path="/v1/models/{id}/metrics" description="Performa model: win rate, profit factor, Sharpe ratio" />
          <Endpoint method="POST"  path="/v1/models/{id}/promote" description="Promosikan versi model ke production" />
          <Endpoint method="PUT"   path="/v1/models/{id}/config"  description="Update konfigurasi threshold dan parameter model" />
        </div>
      </Section>

      <Section title="Risk Management API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"   path="/v1/risk/exposure"       description="Current exposure per simbol dan total portfolio" />
          <Endpoint method="GET"   path="/v1/risk/drawdown"       description="Drawdown aktual vs batas yang dikonfigurasi" />
          <Endpoint method="PUT"   path="/v1/risk/limits"         description="Update batas risiko: max drawdown, max exposure, lot size" />
          <Endpoint method="POST"  path="/v1/risk/emergency-stop" description="Tutup semua posisi aktif secara darurat" />
        </div>
      </Section>

      <Section title="Strategies API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"    path="/v1/strategies"         description="List semua konfigurasi strategi" />
          <Endpoint method="POST"   path="/v1/strategies"         description="Buat strategi baru dengan parameter RR, target, horizon" />
          <Endpoint method="PUT"    path="/v1/strategies/{id}"    description="Update parameter strategi" />
          <Endpoint method="DELETE" path="/v1/strategies/{id}"    description="Nonaktifkan strategi" />
        </div>
      </Section>

      <Section title="Error Codes">
        <Table
          headers={['HTTP Code', 'Error Code', 'Keterangan']}
          rows={[
            ['400', 'INVALID_PARAMS',      'Parameter request tidak valid'],
            ['401', 'UNAUTHORIZED',        'Token tidak ada atau kadaluarsa'],
            ['403', 'FORBIDDEN',           'Tidak memiliki izin untuk resource ini'],
            ['404', 'NOT_FOUND',           'Resource tidak ditemukan'],
            ['409', 'CONFLICT',            'Konflik state, misal sinyal sudah dieksekusi'],
            ['422', 'VALIDATION_ERROR',    'Validasi business logic gagal'],
            ['429', 'RATE_LIMITED',        'Terlalu banyak request'],
            ['500', 'INTERNAL_ERROR',      'Kesalahan server internal'],
            ['503', 'SERVICE_UNAVAILABLE', 'Service sedang tidak tersedia'],
          ]}
        />
      </Section>

      <Section title="Rate Limiting">
        <CardGrid>
          <Card icon="speed" title="Default Limits">
            <strong>100 req/menit</strong> per API key untuk endpoint read (GET).<br />
            <strong>20 req/menit</strong> per API key untuk endpoint write (POST/PUT/DELETE).
          </Card>
          <Card icon="warning" title="Response Headers">
            Setiap response menyertakan: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,
            dan <code>X-RateLimit-Reset</code> untuk monitoring quota.
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
