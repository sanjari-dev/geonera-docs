import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function AuthPage() {
  return (
    <DocPage
      icon="fingerprint"
      title="Auth & Identity"
      subtitle="Sistem autentikasi berbasis JWT dengan refresh token rotation, manajemen API key, dan RBAC untuk mengontrol akses ke sinyal, model, eksekusi, dan konfigurasi risiko."
      badge="Security"
      badgeColor="red"
    >
      <Section title="Authentication Flow">
        <CardGrid>
          <Card icon="key" title="JWT Access Token">
            Token akses berumur pendek (<strong>15 menit</strong>) yang dikirim pada setiap request
            API. Ditandatangani dengan algoritma <strong>RS256</strong> menggunakan private key
            yang disimpan di HashiCorp Vault.
          </Card>
          <Card icon="autorenew" title="Refresh Token Rotation">
            Refresh token berumur <strong>30 hari</strong>, disimpan di PostgreSQL. Setiap penggunaan
            refresh token menghasilkan token baru (rotation), membuat token lama invalid secara otomatis.
          </Card>
          <Card icon="vpn_key" title="API Key">
            Untuk akses programatik (sistem otomatis, integrasi), pengguna dapat membuat API key
            dengan scope terbatas. Key di-hash dengan <strong>bcrypt</strong> sebelum disimpan.
          </Card>
          <Card icon="smartphone" title="Biometric (Mobile)">
            Aplikasi mobile mendukung autentikasi biometrik (Face ID / Touch ID) sebagai shortcut
            untuk memperbarui session tanpa mengetik password, menggunakan Keychain/Keystore OS.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Token Structure (JWT)">
        <CodeBlock lang="json">{`// JWT Header
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "geonera-prod-2025-01"
}

// JWT Payload (Claims)
{
  "sub":   "user-uuid-here",
  "email": "trader@geonera.io",
  "role":  "trader",
  "permissions": ["signals:read", "signals:execute", "positions:read"],
  "iat":   1705296600,
  "exp":   1705297500,    // 15 menit
  "iss":   "https://auth.geonera.io",
  "aud":   "https://api.geonera.io"
}`}</CodeBlock>
      </Section>

      <Section title="RBAC — Permissions Matrix">
        <Table
          headers={['Permission', 'Viewer', 'Analyst', 'Trader', 'Risk Manager', 'Admin']}
          rows={[
            ['signals:read',          '✓', '✓', '✓', '✓', '✓'],
            ['signals:execute',       '✗', '✗', '✓', '✓', '✓'],
            ['signals:manage',        '✗', '✗', '✗', '✓', '✓'],
            ['models:read',           '✓', '✓', '✓', '✓', '✓'],
            ['models:manage',         '✗', '✓', '✗', '✗', '✓'],
            ['models:promote',        '✗', '✗', '✗', '✗', '✓'],
            ['risk:read',             '✓', '✓', '✓', '✓', '✓'],
            ['risk:config',           '✗', '✗', '✗', '✓', '✓'],
            ['risk:emergency_stop',   '✗', '✗', '✗', '✓', '✓'],
            ['strategies:read',       '✓', '✓', '✓', '✓', '✓'],
            ['strategies:manage',     '✗', '✗', '✗', '✓', '✓'],
            ['users:manage',          '✗', '✗', '✗', '✗', '✓'],
            ['audit:read',            '✗', '✗', '✗', '✓', '✓'],
          ]}
        />
      </Section>

      <Section title="API Key Management">
        <InfoBox type="info">
          API key direkomendasikan untuk integrasi server-to-server, bukan untuk akses human user.
          Setiap key memiliki <strong>scope</strong> yang dibatasi dan dapat di-revoke kapan saja.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="http">{`# Membuat API key baru
POST /v1/auth/api-keys
Authorization: Bearer <jwt_token>

{
  "name": "staging-bot",
  "scope": ["signals:read", "signals:execute"],
  "expires_at": "2026-01-01T00:00:00Z"
}

# Response — hanya tampil sekali, simpan dengan aman
{
  "key_id":    "ak_prod_7f3k9m...",
  "api_key":   "geonera_live_abc123xyz...",   // tunjukkan sekali saja
  "scope":     ["signals:read", "signals:execute"],
  "expires_at": "2026-01-01T00:00:00Z"
}

# Penggunaan di request berikutnya
X-API-Key: geonera_live_abc123xyz...`}</CodeBlock>
        </div>
      </Section>

      <Section title="Session Security">
        <Table
          headers={['Aspek', 'Implementasi']}
          rows={[
            ['Access token lifetime',   '15 menit (short-lived untuk minimasi risiko kebocoran)'],
            ['Refresh token lifetime',  '30 hari, single-use (rotation setiap penggunaan)'],
            ['Token storage (web)',     'Access token: memory only. Refresh token: HttpOnly cookie'],
            ['Token storage (mobile)',  'Keychain (iOS) / Keystore (Android) — encrypted by OS'],
            ['Concurrent sessions',     'Maksimum 5 device aktif per pengguna'],
            ['Force logout',            'Admin dapat invalidate semua session pengguna tertentu'],
            ['Suspicious login',        'Alert email jika login dari IP / lokasi baru yang tidak dikenal'],
            ['Brute force protection',  'Lockout 15 menit setelah 5 gagal login berturut-turut'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
