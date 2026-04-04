import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function SecurityPage() {
  return (
    <DocPage
      icon="security"
      title="Security & Risk Management"
      subtitle="Keamanan sistem berlapis mencakup autentikasi, otorisasi berbasis peran, serta mekanisme manajemen risiko trading yang komprehensif: position sizing, exposure limits, dan drawdown control."
      badge="Security"
      badgeColor="red"
    >
      <Section title="Trading Risk Management">
        <InfoBox type="warning">
          Risk management adalah garis pertahanan terakhir sebelum eksekusi order. Semua sinyal yang melewati
          klasifikasi meta-model tetap harus lulus validasi risk sebelum dikirim ke JForex untuk eksekusi.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="balance" title="Position Sizing">
              Ukuran lot setiap trade dihitung menggunakan model <strong>fixed fractional</strong> — persentase
              fixed dari equity akun dibagi dengan jarak stop loss dalam pip.
              Formula: <code>Lot = (Equity × Risk%) / (SL_pips × PipValue)</code>
            </Card>
            <Card icon="shield" title="Exposure Limits">
              Batasan eksposur per simbol dan total portfolio untuk mencegah konsentrasi risiko.
              Sistem menolak sinyal baru jika batas sudah tercapai.
            </Card>
            <Card icon="trending_down" title="Drawdown Control">
              Monitoring drawdown secara real-time. Tiga level proteksi: <strong>Warning</strong> (notifikasi),
              <strong>Throttle</strong> (kurangi lot size), <strong>Hard Stop</strong> (hentikan semua trading).
            </Card>
            <Card icon="access_time" title="Time-Based Restrictions">
              Pembatasan trading pada periode berisiko tinggi: rilis berita ekonomi berdampak tinggi (NFP, FOMC),
              sesi overlap volatilitas ekstrem, dan akhir pekan (Jumat sore).
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="Risk Parameters">
        <Table
          headers={['Parameter', 'Default', 'Deskripsi', 'Level Konfigurasi']}
          rows={[
            ['max_risk_per_trade',   '1.0%',    'Risiko maksimum per posisi dari equity',       'Strategy'],
            ['max_daily_loss',       '3.0%',    'Kerugian harian maksimum dari equity',          'Global'],
            ['max_drawdown',         '15.0%',   'Drawdown maksimum dari high watermark',         'Global'],
            ['max_open_positions',   '5',       'Jumlah maksimum posisi terbuka bersamaan',      'Strategy'],
            ['max_exposure_symbol',  '5.0%',    'Eksposur maksimum per instrumen',               'Strategy'],
            ['max_exposure_total',   '20.0%',   'Total eksposur dari seluruh posisi terbuka',    'Global'],
            ['min_prob_profit',      '0.60',    'Minimum probabilitas profit dari meta-model',   'Strategy'],
            ['news_blackout_min',    '30',      'Menit sebelum/sesudah news untuk blackout',     'Global'],
          ]}
        />
      </Section>

      <Section title="Drawdown Control Levels">
        <CodeBlock lang="csharp">{`// C# Risk Engine — Drawdown Guard
public class DrawdownGuard
{
    private readonly RiskConfig _config;

    public RiskDecision Evaluate(PortfolioState state)
    {
        var drawdown = state.CurrentDrawdownPct;

        if (drawdown >= _config.HardStopPct)
        {
            // Level 3: Hentikan semua trading, tutup posisi
            return new RiskDecision(RiskAction.EmergencyStop,
                $"Hard stop: drawdown {drawdown:F2}% melebihi {_config.HardStopPct}%");
        }

        if (drawdown >= _config.ThrottlePct)
        {
            // Level 2: Kurangi lot size 50%
            return new RiskDecision(RiskAction.ReduceSize,
                lotMultiplier: 0.5m);
        }

        if (drawdown >= _config.WarningPct)
        {
            // Level 1: Notifikasi saja
            return new RiskDecision(RiskAction.Alert,
                $"Warning: drawdown {drawdown:F2}%");
        }

        return RiskDecision.Allow;
    }
}`}</CodeBlock>
      </Section>

      <Section title="Authentication & Authorization">
        <CardGrid>
          <Card icon="key" title="JWT Bearer Token">
            API menggunakan <strong>JWT (JSON Web Token)</strong> dengan algoritma RS256.
            Token berisi claims: user ID, role, izin, dan expiry. Refresh token disimpan di
            PostgreSQL dengan rotasi otomatis.
          </Card>
          <Card icon="vpn_key" title="API Key Management">
            Pengguna dapat membuat API key untuk akses programatik. Key di-hash menggunakan
            bcrypt sebelum disimpan. Mendukung scoping: read-only, trading, atau admin.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Role-Based Access Control (RBAC)">
        <Table
          headers={['Role', 'Sinyal', 'Model', 'Risk Config', 'Execution', 'Admin']}
          rows={[
            ['Viewer',       '✓ Read', '✓ Read', '✗',      '✗',       '✗'],
            ['Analyst',      '✓ Read', '✓ Read', '✗',      '✗',       '✗'],
            ['Trader',       '✓ Read', '✓ Read', '✗',      '✓ Execute','✗'],
            ['Risk Manager', '✓ Full', '✓ Read', '✓ Write', '✓ Stop',  '✗'],
            ['Admin',        '✓ Full', '✓ Full', '✓ Full',  '✓ Full',  '✓ Full'],
          ]}
        />
      </Section>

      <Section title="Security Hardening">
        <Table
          headers={['Aspek', 'Implementasi']}
          rows={[
            ['Transport',      'TLS 1.3 mandatory untuk semua koneksi internal dan eksternal'],
            ['Secret Management', 'HashiCorp Vault atau Kubernetes Secrets untuk API keys, DB credentials'],
            ['Network',        'Service mesh (mTLS) antar microservices, ingress dengan WAF'],
            ['Audit Log',      'Semua aksi sensitif dicatat: login, perubahan config risk, eksekusi order'],
            ['Rate Limiting',  'Per-user rate limit di API Gateway untuk mencegah abuse'],
            ['Input Validation','Validasi ketat semua input user sebelum diproses'],
          ]}
        />
      </Section>
    </DocPage>
  )
}
