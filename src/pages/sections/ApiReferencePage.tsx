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
      subtitle="REST API Geonera dibangun menggunakan C# ASP.NET Core sebagai microservices backend. Semua endpoint menggunakan JSON, autentikasi JWT Bearer token, dan mengikuti konvensi RESTful dengan versioning via URL prefix /v1."
      badge="Backend"
      badgeColor="purple"
    >
      <Section title="Base URL & Autentikasi">
        <CodeBlock lang="http">{`Base URL:  https://api.geonera.io/v1

# JWT Bearer — untuk akses user/session
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

# API Key — untuk akses programatik/server-to-server
X-API-Key: geonera_live_abc123xyz...
Content-Type: application/json`}</CodeBlock>
        <div className="mt-4">
          <InfoBox type="info">
            Semua request ke API harus menyertakan header autentikasi. JWT token diperoleh via
            endpoint <code>/auth/token</code>. API key dibuat via dashboard admin atau
            endpoint <code>/auth/api-keys</code>. JWT access token berlaku <strong>15 menit</strong>;
            gunakan refresh token untuk memperbarui tanpa login ulang.
          </InfoBox>
        </div>
      </Section>

      <Section title="Auth API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="POST"   path="/v1/auth/token"             description="Login dengan email+password, return access + refresh token" />
          <Endpoint method="POST"   path="/v1/auth/refresh"           description="Tukar refresh token dengan access token baru (rotation)" />
          <Endpoint method="POST"   path="/v1/auth/logout"            description="Invalidate refresh token saat ini" />
          <Endpoint method="GET"    path="/v1/auth/api-keys"          description="List semua API key milik user yang sedang login" />
          <Endpoint method="POST"   path="/v1/auth/api-keys"          description="Buat API key baru dengan scope dan expiry tertentu" />
          <Endpoint method="DELETE" path="/v1/auth/api-keys/{key_id}" description="Revoke API key tertentu" />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// POST /v1/auth/token — Request
{ "email": "trader@geonera.io", "password": "••••••••" }

// Response
{
  "access_token":  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_live_7f3k9mXXX...",
  "token_type":    "Bearer",
  "expires_in":    900,          // 15 menit
  "user": {
    "id":    "user-uuid",
    "email": "trader@geonera.io",
    "role":  "trader",
    "permissions": ["signals:read", "signals:execute"]
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Signals API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"    path="/v1/signals"               description="List sinyal trading dengan filter: status, symbol, direction, dari tanggal" />
          <Endpoint method="GET"    path="/v1/signals/{id}"          description="Detail sinyal spesifik beserta SHAP explanation dan TFT confidence" />
          <Endpoint method="POST"   path="/v1/signals/generate"      description="Trigger pipeline generasi sinyal on-demand untuk simbol dan strategi tertentu" />
          <Endpoint method="PATCH"  path="/v1/signals/{id}/status"   description="Update status sinyal: PENDING → APPROVED atau REJECTED (manual override)" />
          <Endpoint method="DELETE" path="/v1/signals/{id}"          description="Hapus sinyal yang masih PENDING dan belum dieksekusi" />
          <Endpoint method="GET"    path="/v1/signals/{id}/shap"     description="SHAP explanation detail untuk sinyal: kontribusi per fitur terhadap prob_profit" />
          <Endpoint method="GET"    path="/v1/signals/history"       description="Riwayat sinyal yang sudah CLOSED dengan PnL aktual untuk analisis performa" />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// GET /v1/signals/{id} — Response
{
  "id":               "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "symbol":           "EURUSD",
  "direction":        "BUY",
  "entry_price":      1.08542,
  "stop_loss":        1.08200,
  "take_profit":      1.09226,
  "risk_pips":        34.2,
  "reward_pips":      68.4,
  "risk_reward":      2.0,
  "prob_profit":      0.723,
  "tft_p50_return":   0.00063,
  "tft_confidence":   0.312,       // spread P90-P10 / |P50| (lower = lebih yakin)
  "horizon_minutes":  240,
  "model_version":    "tft-v3.2.1",
  "strategy_id":      "strat-uuid",
  "status":           "PENDING",
  "created_at":       "2025-01-15T08:30:00Z",
  "transparency": {
    "confidence_level": "HIGH",
    "summary": "Model memprediksi EURUSD naik ~35 pip dalam 4 jam",
    "key_reasons":  ["Strong TFT median return", "RSI non-overbought", "H1 trend alignment"],
    "key_risks":    ["ATR elevated", "Spread above average"]
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Predictions API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"  path="/v1/predictions"                  description="List prediksi harga terbaru per simbol dengan metadata model" />
          <Endpoint method="GET"  path="/v1/predictions/{symbol}/latest"  description="Ambil prediksi 7200-step terbaru (P10/P50/P90) untuk simbol tertentu" />
          <Endpoint method="GET"  path="/v1/predictions/{id}/chart-data"  description="Data series P10/P50/P90 siap diplot (downsampled ke 200 poin untuk UI)" />
          <Endpoint method="POST" path="/v1/predictions/run"              description="Trigger inferensi TFT on-demand untuk simbol tertentu (async, returns job_id)" />
          <Endpoint method="GET"  path="/v1/predictions/jobs/{job_id}"    description="Cek status job inferensi on-demand: QUEUED / RUNNING / DONE / FAILED" />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// GET /v1/predictions/{symbol}/latest — Response (disingkat)
{
  "symbol":      "EURUSD",
  "model_id":    "tft-v3.2.1",
  "created_at":  "2025-01-15T08:29:55Z",
  "horizon":     7200,
  "current_price": 1.08542,
  "forecast": {
    "p10": [1.08490, 1.08451, ...],  // 7200 values
    "p50": [1.08555, 1.08568, ...],  // median prediction
    "p90": [1.08621, 1.08685, ...]   // upper bound
  },
  "summary": {
    "p50_at_1h":  1.08610,   // P50 prediction 60 steps ahead
    "p50_at_4h":  1.09226,   // P50 prediction 240 steps ahead
    "p50_at_1d":  1.09455,   // P50 prediction 1440 steps ahead
    "trend_slope": 0.000042   // pip/step direction
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Models API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"   path="/v1/models"               description="List semua versi model yang terdaftar beserta status (TFT dan meta-model)" />
          <Endpoint method="GET"   path="/v1/models/{id}"          description="Detail model: hyperparameter, training config, file path artifact" />
          <Endpoint method="GET"   path="/v1/models/{id}/metrics"  description="Performa model: win rate, profit factor, Sharpe, MAE, AUC dari backtesting" />
          <Endpoint method="POST"  path="/v1/models/{id}/promote"  description="Promosikan versi model ke PRODUCTION (requires role: Admin)" />
          <Endpoint method="PUT"   path="/v1/models/{id}/config"   description="Update konfigurasi threshold dan inference parameter model aktif" />
          <Endpoint method="POST"  path="/v1/models/retrain"       description="Trigger retraining manual untuk simbol tertentu (async)" />
        </div>
      </Section>

      <Section title="Risk Management API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"   path="/v1/risk/exposure"        description="Current exposure per simbol (lot, notional) dan total portfolio exposure %" />
          <Endpoint method="GET"   path="/v1/risk/drawdown"        description="Drawdown aktual (current, max today, max all-time) vs batas yang dikonfigurasi" />
          <Endpoint method="GET"   path="/v1/risk/status"          description="Status kesehatan risk engine: limit tercapai, blackout aktif, throttle aktif" />
          <Endpoint method="PUT"   path="/v1/risk/limits"          description="Update batas risiko: max_drawdown, max_exposure, max_lot_size, dll" />
          <Endpoint method="POST"  path="/v1/risk/emergency-stop"  description="Tutup semua posisi aktif secara darurat via JForex (requires role: Risk Manager)" />
          <Endpoint method="POST"  path="/v1/risk/resume"          description="Resume trading setelah emergency stop selesai diverifikasi" />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// GET /v1/risk/drawdown — Response
{
  "current_equity":      10543.20,
  "high_watermark":      10820.50,
  "current_drawdown_pct": 2.56,
  "max_drawdown_today_pct": 2.56,
  "max_drawdown_alltime_pct": 8.31,
  "limits": {
    "warning_pct":    5.0,
    "throttle_pct":   10.0,
    "hard_stop_pct":  15.0
  },
  "current_level":  "NORMAL",    // NORMAL / WARNING / THROTTLE / HARD_STOP
  "daily_pnl_usd":  -278.30,
  "open_positions": 2,
  "total_exposure_pct": 4.2
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Positions API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"   path="/v1/positions"            description="List semua posisi aktif (OPEN) beserta PnL floating real-time" />
          <Endpoint method="GET"   path="/v1/positions/{id}"       description="Detail posisi: entry, SL, TP, lot size, PnL, elapsed time" />
          <Endpoint method="POST"  path="/v1/positions/{id}/close" description="Request manual close posisi via JForex (async)" />
          <Endpoint method="PUT"   path="/v1/positions/{id}/modify" description="Modifikasi SL atau TP posisi terbuka via JForex" />
          <Endpoint method="GET"   path="/v1/positions/history"    description="Riwayat posisi yang sudah ditutup dengan PnL final" />
        </div>
      </Section>

      <Section title="Strategies API">
        <div className="bg-surface-container-lowest rounded-lg border border-slate-200 px-4 divide-y divide-slate-100">
          <Endpoint method="GET"    path="/v1/strategies"           description="List semua konfigurasi strategi (aktif dan nonaktif)" />
          <Endpoint method="GET"    path="/v1/strategies/{id}"      description="Detail strategi: parameter RR, target, horizon, risk limits" />
          <Endpoint method="POST"   path="/v1/strategies"           description="Buat strategi baru dengan parameter rr_ratio, target_pips, horizon_minutes" />
          <Endpoint method="PUT"    path="/v1/strategies/{id}"      description="Update parameter strategi yang ada" />
          <Endpoint method="DELETE" path="/v1/strategies/{id}"      description="Nonaktifkan strategi (is_active = false)" />
          <Endpoint method="GET"    path="/v1/strategies/{id}/perf" description="Performa historis strategi: win rate, PnL, sinyal yang dihasilkan" />
        </div>
      </Section>

      <Section title="WebSocket API">
        <InfoBox type="info">
          WebSocket endpoint tersedia untuk update real-time. Client harus mengirim JWT Bearer token
          sebagai query parameter atau header saat koneksi. Semua message menggunakan format JSON.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Endpoint', 'Event Types', 'Keterangan']}
            rows={[
              ['/ws/signals',   'SIGNAL_CREATED, SIGNAL_UPDATED, SIGNAL_CLOSED',   'Update sinyal real-time untuk dashboard'],
              ['/ws/positions', 'POSITION_OPENED, POSITION_UPDATED, POSITION_CLOSED','PnL floating dan status posisi'],
              ['/ws/risk',      'DRAWDOWN_UPDATED, LIMIT_REACHED, EMERGENCY_STOP',  'Update risk dashboard'],
              ['/ws/system',    'SERVICE_UP, SERVICE_DOWN, MODEL_PROMOTED',          'Event sistem untuk admin'],
            ]}
          />
          <div className="mt-4">
            <CodeBlock lang="json">{`// WebSocket message format
{
  "type":      "SIGNAL_CREATED",
  "timestamp": "2025-01-15T08:30:00.123Z",
  "payload": {
    "id":         "3fa85f64-...",
    "symbol":     "EURUSD",
    "direction":  "BUY",
    "prob_profit": 0.723,
    "status":     "PENDING"
  }
}

// Connection: wss://api.geonera.io/ws/signals?token=<jwt_access_token>
// Heartbeat: server mengirim {"type":"PING"} setiap 30 detik
// Response:  client harus balas {"type":"PONG"}`}</CodeBlock>
          </div>
        </div>
      </Section>

      <Section title="Error Codes">
        <Table
          headers={['HTTP Code', 'Error Code', 'Keterangan']}
          rows={[
            ['400', 'INVALID_PARAMS',       'Parameter request tidak valid atau field wajib kosong'],
            ['401', 'UNAUTHORIZED',         'Token tidak ada, kadaluarsa, atau format salah'],
            ['403', 'FORBIDDEN',            'Token valid, tapi role tidak memiliki izin ke resource ini'],
            ['404', 'NOT_FOUND',            'Resource (signal/model/strategy) tidak ditemukan'],
            ['409', 'CONFLICT',             'Konflik state, misal sinyal sudah dieksekusi tidak bisa dihapus'],
            ['422', 'VALIDATION_ERROR',     'Validasi business logic gagal (misal RR ratio < 1)'],
            ['429', 'RATE_LIMITED',         'Terlalu banyak request — lihat header X-RateLimit-*'],
            ['500', 'INTERNAL_ERROR',       'Kesalahan server internal, cek correlation ID di response'],
            ['503', 'SERVICE_UNAVAILABLE',  'Service sedang tidak tersedia atau dalam maintenance'],
            ['504', 'GATEWAY_TIMEOUT',      'Upstream service (Python TFT, Java JForex) tidak merespons'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="json">{`// Error response body standar
{
  "error": {
    "code":           "VALIDATION_ERROR",
    "message":        "rr_ratio must be >= 1.0, got 0.5",
    "details":        { "field": "rr_ratio", "min_value": 1.0, "received": 0.5 },
    "correlation_id": "req_abc123xyz",   // untuk tracing di logs
    "timestamp":      "2025-01-15T08:30:00Z"
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Rate Limiting">
        <CardGrid>
          <Card icon="speed" title="Default Limits">
            <strong>100 req/menit</strong> per API key untuk endpoint read (GET).<br />
            <strong>20 req/menit</strong> per API key untuk endpoint write (POST/PUT/PATCH/DELETE).<br />
            <strong>5 req/menit</strong> untuk endpoint heavy (generate signal, run prediction, retrain).
          </Card>
          <Card icon="warning" title="Response Headers">
            Setiap response menyertakan header rate limit:
            <code>X-RateLimit-Limit</code> (quota total),
            <code>X-RateLimit-Remaining</code> (sisa), dan
            <code>X-RateLimit-Reset</code> (Unix timestamp kapan reset).
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
