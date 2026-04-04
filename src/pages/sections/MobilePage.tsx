import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function MobilePage() {
  return (
    <DocPage
      icon="smartphone"
      title="Mobile"
      subtitle="Aplikasi mobile Geonera memungkinkan trader memantau sinyal, posisi, dan performa portofolio secara real-time dari perangkat iOS maupun Android dengan arsitektur yang aman, responsif, dan mendukung offline."
      badge="Mobile"
      badgeColor="blue"
    >
      <Section title="Platform & Tech Stack">
        <CardGrid>
          <Card icon="devices" title="Cross-Platform Framework">
            Dikembangkan menggunakan pendekatan <strong>cross-platform</strong> (React Native atau Flutter)
            untuk mendukung iOS dan Android dari satu codebase, mengurangi duplikasi dan mempercepat
            siklus rilis tanpa mengorbankan native performance.
          </Card>
          <Card icon="notifications" title="Push Notifications">
            Notifikasi real-time untuk sinyal baru, status eksekusi order, dan alert risiko
            menggunakan layanan push notification native: <strong>APNs</strong> untuk iOS,
            <strong>FCM</strong> (Firebase Cloud Messaging) untuk Android.
          </Card>
          <Card icon="fingerprint" title="Biometric Auth">
            Autentikasi menggunakan Face ID / Touch ID sebagai lapisan keamanan tambahan
            sebelum mengakses data sensitif atau melakukan aksi trading. Menggunakan
            Keychain (iOS) / Keystore (Android) untuk penyimpanan token.
          </Card>
          <Card icon="wifi_off" title="Offline Support">
            Data sinyal dan posisi terakhir di-cache secara lokal menggunakan SQLite (via
            WatermelonDB atau Drift) sehingga tetap dapat dilihat meskipun koneksi internet
            terputus sementara.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Arsitektur Aplikasi Mobile">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto mb-4">
          <div className="text-slate-500 mb-3">{'// Mobile architecture layers'}</div>
          <div><span className="text-yellow-400">UI Layer</span>        <span className="text-slate-600">  ──</span>  <span className="text-slate-300">Screens, Components, Navigation (React Navigation / GoRouter)</span></div>
          <div><span className="text-green-400">State Layer</span>     <span className="text-slate-600">  ──</span>  <span className="text-slate-300">Zustand / Riverpod — local state + cache management</span></div>
          <div><span className="text-blue-400">Service Layer</span>    <span className="text-slate-600">  ──</span>  <span className="text-slate-300">API Client (REST), WebSocket Client, Push Handler</span></div>
          <div><span className="text-orange-400">Storage Layer</span>  <span className="text-slate-600">  ──</span>  <span className="text-slate-300">SQLite local cache + Keychain/Keystore (tokens)</span></div>
          <div><span className="text-purple-400">Network Layer</span>  <span className="text-slate-600">  ──</span>  <span className="text-slate-300">Axios / Dio — HTTP dengan interceptor JWT refresh</span></div>
          <div className="mt-2 text-slate-600">{'                    ▼'}</div>
          <div><span className="text-teal-400">Geonera REST API</span> <span className="text-slate-600">  ──</span>  <span className="text-slate-300">C# ASP.NET Core (HTTPS)</span></div>
          <div><span className="text-teal-400">Geonera WebSocket</span><span className="text-slate-600">  ──</span>  <span className="text-slate-300">wss://api.geonera.io/ws/signals</span></div>
        </div>
        <InfoBox type="info">
          Aplikasi mobile berperan sebagai <strong>consumer-only</strong> — tidak melakukan eksekusi order langsung.
          Semua aksi (approve sinyal, update risk config) dikirim ke C# backend via REST API dan diproses
          oleh sistem backend sebelum diteruskan ke Java JForex executor.
        </InfoBox>
      </Section>

      <Section title="Fitur Utama Aplikasi">
        <Table
          headers={['Fitur', 'Deskripsi', 'Update Mode']}
          rows={[
            ['Signal Feed',         'List sinyal terbaru dengan probabilitas, arah, dan confidence level', 'Push / WebSocket'],
            ['Position Monitor',    'Posisi aktif dengan PnL floating, progress bar TP/SL real-time',      'WebSocket live'],
            ['Portfolio Summary',   'Ringkasan equity, drawdown aktual, win rate mingguan, PnL harian',    'Polling 5m'],
            ['Alert Center',        'Notifikasi sinyal baru, risk alert, system events, emergency stop',   'APNs / FCM Push'],
            ['Signal Detail',       'Detail sinyal: prediksi TFT chart, SHAP card, entry/SL/TP levels',   'On-demand REST'],
            ['Risk Status',         'Gauge drawdown real-time, status tiap limit risiko, daily loss',      'WebSocket live'],
            ['Performance History', 'Chart equity curve, metrik historis per periode (7d/30d/90d)',        'On-demand REST'],
            ['Strategy Config',     'Lihat konfigurasi strategi aktif, ajukan perubahan untuk approval',  'On-demand REST'],
          ]}
        />
      </Section>

      <Section title="Koneksi ke Backend: REST + WebSocket">
        <CardGrid>
          <Card icon="http" title="REST API Client">
            Semua operasi non-real-time (list sinyal, detail model, history, konfigurasi) menggunakan
            REST API Geonera via HTTPS. Client dikonfigurasi dengan <strong>JWT interceptor otomatis</strong>
            yang memperbarui access token dari refresh token jika expired, tanpa interaksi pengguna.
          </Card>
          <Card icon="bolt" title="WebSocket Real-Time">
            Koneksi persistent WebSocket ke endpoint <code>/ws/signals</code> dan <code>/ws/positions</code>
            untuk update live. Reconnect otomatis dengan exponential backoff jika koneksi terputus.
            Menggunakan heartbeat ping setiap 30 detik untuk mendeteksi stale connection.
          </Card>
        </CardGrid>
        <div className="mt-4">
          <CodeBlock lang="typescript">{`// JWT Auto-Refresh Interceptor (Axios/Dio pattern)
const apiClient = axios.create({
  baseURL: 'https://api.geonera.io/v1',
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (isExpired(token)) {
    const newToken = await refreshAccessToken()
    await saveAccessToken(newToken)
    config.headers.Authorization = \`Bearer \${newToken}\`
  } else {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// WebSocket dengan auto-reconnect
function createSignalStream(onMessage: (update: SignalUpdate) => void) {
  let ws: WebSocket
  let retryDelay = 1000

  function connect() {
    ws = new WebSocket('wss://api.geonera.io/ws/signals', {
      headers: { Authorization: \`Bearer \${getAccessToken()}\` }
    })
    ws.onmessage = (e) => onMessage(JSON.parse(e.data))
    ws.onclose   = () => setTimeout(connect, retryDelay *= 2)  // backoff
    ws.onopen    = () => { retryDelay = 1000 }                 // reset
  }
  connect()
  return () => ws.close()
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Offline Cache Architecture">
        <InfoBox type="tip">
          Offline support menggunakan strategi <strong>Cache-First</strong> dengan stale-while-revalidate:
          data selalu dibaca dari cache lokal terlebih dahulu untuk tampilan instan, kemudian background
          fetch memperbarui cache jika koneksi tersedia.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Data', 'Cache Strategy', 'TTL', 'Storage']}
            rows={[
              ['Sinyal aktif (PENDING)',   'Cache-first + WS updates',  'Seumur session', 'SQLite'],
              ['Sinyal historical',        'Cache-first + background refresh', '24 jam',  'SQLite'],
              ['Posisi terbuka',           'WebSocket live → cache',    'Seumur session', 'SQLite'],
              ['Portfolio summary',        'Cache-first + 5m polling',  '5 menit',       'In-memory'],
              ['Detail sinyal + SHAP',     'On-demand, cache setelah fetch', '1 jam',    'SQLite'],
              ['JWT access token',         'Tidak dicache di disk',      '15 menit',     'Memory only'],
              ['JWT refresh token',        'Encrypted storage',          '30 hari',      'Keychain/Keystore'],
            ]}
          />
        </div>
      </Section>

      <Section title="Push Notification Schema">
        <InfoBox type="info">
          Notifikasi dikirim dari C# backend melalui layanan push notification setelah sinyal melewati
          semua validasi (meta-model threshold + risk check). Pengguna dapat mengatur preferensi
          notifikasi per simbol dan jenis alert di halaman Settings aplikasi.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Tipe Notifikasi', 'Trigger', 'Prioritas', 'Aksi Deep Link']}
            rows={[
              ['New Signal',        'Sinyal baru lolos semua validasi',             'Normal',   'Buka signal detail'],
              ['Signal Approved',   'Sinyal disetujui untuk eksekusi',              'High',     'Buka signal detail'],
              ['Position Filled',   'Order berhasil dieksekusi oleh JForex',        'High',     'Buka position monitor'],
              ['Take Profit Hit',   'Posisi mencapai target profit',                'High',     'Buka performance'],
              ['Stop Loss Hit',     'Posisi mencapai batas kerugian',               'Critical', 'Buka position monitor'],
              ['Risk Warning',      'Drawdown mendekati batas warning',             'High',     'Buka risk status'],
              ['Emergency Stop',    'Hard stop diaktifkan, trading dihentikan',     'Critical', 'Buka risk dashboard'],
              ['System Alert',      'Service down atau anomali terdeteksi',         'Normal',   'Buka alert center'],
              ['Model Drift',       'Performa model turun signifikan',              'Normal',   'Buka model insights'],
            ]}
          />
        </div>
        <div className="mt-4">
          <CodeBlock lang="json">{`// Payload notifikasi APNs / FCM
{
  "notification": {
    "title": "🟢 BUY EURUSD — Sinyal Baru",
    "body":  "Prob. profit: 73% | TP: +35 pip | RR: 2.0"
  },
  "data": {
    "type":       "SIGNAL_CREATED",
    "signal_id":  "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "symbol":     "EURUSD",
    "direction":  "BUY",
    "deep_link":  "geonera://signals/3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "apns": {
    "aps": { "sound": "signal_new.caf", "badge": 1 }
  }
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Deep Linking & Navigation">
        <CardGrid>
          <Card icon="link" title="Universal Links / App Links">
            Mendukung deep link dari notifikasi push dan tautan eksternal (email, Slack) langsung
            ke layar yang tepat. Skema: <code>geonera://signals/{'{id}'}</code>,
            <code>geonera://positions</code>, <code>geonera://risk</code>.
          </Card>
          <Card icon="navigation" title="Stack Navigation">
            Arsitektur navigasi menggunakan Stack + Tab navigator. Tab utama:
            <strong>Signals, Positions, Performance, Alerts, Settings</strong>.
            Deep link dari notifikasi push langsung menavigasi ke screen yang relevan.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Security Mobile">
        <Table
          headers={['Aspek', 'iOS', 'Android']}
          rows={[
            ['Token storage',       'Keychain (AES-256 encrypted)',         'Keystore (hardware-backed)'],
            ['Certificate pinning', 'NSURLSession + TrustKit',              'OkHttp CertificatePinner'],
            ['Screen masking',      'UIApplicationWillResignActive hook',   'FLAG_SECURE on sensitive screens'],
            ['Biometric auth',      'LocalAuthentication framework (FaceID/TouchID)', 'BiometricPrompt API'],
            ['Root/Jailbreak detect','jailbreak-detection library',          'RootBeer library'],
            ['Session timeout',     'Background timer + AppState listener', 'AppState lifecycle'],
            ['Code obfuscation',    'Bitcode strip + symbol stripping',      'R8/ProGuard minification'],
          ]}
        />
        <div className="mt-4">
          <CodeBlock lang="typescript">{`// Screen masking saat app ke background
import { AppState, AppStateStatus } from 'react-native'

function useSensitiveScreenGuard() {
  const [masked, setMasked] = useState(false)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      setMasked(state === 'background' || state === 'inactive')
    })
    return () => sub.remove()
  }, [])

  return masked
}

// Otomatis timeout session setelah 15 menit inaktivitas
function useSessionTimeout(onTimeout: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const reset  = () => { clearTimeout(timer.current); timer.current = setTimeout(onTimeout, 15 * 60_000) }
  useEffect(() => { reset(); return () => clearTimeout(timer.current) }, [])
  return reset
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Build & Release">
        <Table
          headers={['Perintah / Aksi', 'Platform', 'Keterangan']}
          rows={[
            ['bun install / flutter pub get',       'Keduanya',  'Install dependencies'],
            ['bun run dev / flutter run',            'Dev',       'Jalankan di simulator/emulator'],
            ['bun run android / flutter build apk', 'Android',   'Build APK debug'],
            ['bun run ios / flutter build ios',      'iOS',       'Build untuk simulator'],
            ['Fastlane beta',                         'Keduanya',  'Build + upload ke TestFlight / Firebase App Distribution'],
            ['Fastlane release',                      'Keduanya',  'Build + submit ke App Store / Play Store'],
            ['CI: GitHub Actions + Fastlane',         'Keduanya',  'Otomatis build & distribute setiap merge ke main'],
          ]}
        />
        <div className="mt-4">
          <InfoBox type="info">
            Versi iOS dan Android dirilis secara bersamaan menggunakan Fastlane lane <code>release_all</code>.
            Setiap rilis production melalui minimal 48 jam di beta testing (TestFlight / Firebase App Distribution)
            sebelum di-promote ke store publik.
          </InfoBox>
        </div>
      </Section>

      <Section title="Performance & UX Considerations">
        <CardGrid>
          <Card icon="speed" title="List Virtualization">
            Signal feed menggunakan <strong>FlatList / ListView.builder</strong> dengan windowing
            untuk merender hanya item yang terlihat. Mencegah jank di daftar sinyal panjang
            dan menjaga memory footprint tetap kecil.
          </Card>
          <Card icon="image" title="Chart Rendering">
            Chart prediksi TFT dan equity curve menggunakan library native chart (Recharts Mobile /
            fl_chart) dengan downsampling otomatis — 7200 data point disampling ke ~200 titik
            untuk rendering yang smooth.
          </Card>
          <Card icon="network_check" title="Network Optimization">
            Request API menggunakan HTTP/2 untuk multiplexing. Response JSON menggunakan field
            aliasing singkat. WebSocket message di-batching per 500ms untuk menghindari
            terlalu banyak render cycle.
          </Card>
          <Card icon="battery_charging_full" title="Battery & Background">
            WebSocket dimatikan saat app di background lebih dari 5 menit untuk menghemat
            baterai. Digantikan oleh push notification sebagai mekanisme wake-up. Data
            di-sync ulang saat app kembali ke foreground.
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
