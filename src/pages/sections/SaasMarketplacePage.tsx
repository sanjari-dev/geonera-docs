import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function SaasMarketplacePage() {
  return (
    <DocPage
      icon="store"
      title="SaaS & Marketplace"
      subtitle="Visi strategis Geonera sebagai platform Software-as-a-Service dan marketplace sinyal trading — memungkinkan pengguna berlangganan, mengakses, dan memanfaatkan sinyal AI secara fleksibel dalam ekosistem yang terintegrasi."
      badge="Product"
      badgeColor="orange"
    >
      <Section title="Visi Platform">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Geonera dirancang dari awal untuk berkembang melampaui deployment internal menjadi platform
          yang dapat diakses oleh trader eksternal. Dua model bisnis utama yang dirancang:
        </p>
        <CardGrid>
          <Card icon="cloud_done" title="SaaS — Subscription Based">
            Trader dan institusi berlangganan akses ke sinyal Geonera. Berbagai tier berdasarkan
            jumlah sinyal per hari, instrumen yang dicakup, level detail transparency, dan
            frekuensi update model.
          </Card>
          <Card icon="storefront" title="Signal Marketplace">
            Platform multi-provider di mana signal provider independen (quantitative analysts, algo traders)
            dapat mempublikasikan strategi mereka. Geonera menyediakan infrastruktur, verifikasi performa,
            dan distribusi sinyal ke subscriber.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Model SaaS — Subscription Tiers">
        <Table
          headers={['Tier', 'Harga/Bulan', 'Sinyal/Hari', 'Instrumen', 'Fitur']}
          rows={[
            ['Starter',      '$49',    'Maks 5',     '1 pair major',    'Sinyal + probabilitas'],
            ['Professional', '$149',   'Maks 20',    '5 pair',          '+ SHAP explanation + TFT chart'],
            ['Advanced',     '$349',   'Maks 50',    '15 pair',         '+ API akses + custom threshold'],
            ['Institutional','Custom', 'Unlimited',  'Semua instrumen', '+ White-label + dedicated support'],
          ]}
        />
        <div className="mt-4">
          <InfoBox type="info">
            Harga adalah ilustrasi untuk keperluan perencanaan produk. Model pricing aktual akan disesuaikan
            berdasarkan riset pasar, biaya infrastruktur, dan positioning kompetitif.
          </InfoBox>
        </div>
      </Section>

      <Section title="Signal Marketplace — Ekosistem Provider">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Marketplace memungkinkan <strong>signal provider</strong> independen untuk mendistribusikan
          strategi mereka menggunakan infrastruktur Geonera:
        </p>
        <CardGrid>
          <Card icon="person_add" title="Provider Onboarding">
            Signal provider mendaftar, submit strategi (parameter RR, instrumen, horizon), dan
            Geonera menjalankan <strong>backtesting wajib</strong> selama minimum 6 bulan data historis
            sebelum strategi dipublikasikan ke marketplace.
          </Card>
          <Card icon="verified_user" title="Performa Verification">
            Setiap provider memiliki verified performance track record: win rate, profit factor,
            max drawdown, dan Sharpe ratio — dihitung secara independen oleh sistem Geonera,
            bukan self-reported.
          </Card>
          <Card icon="payments" title="Revenue Sharing">
            Provider mendapat persentase dari subscription fee subscriber mereka. Semakin tinggi
            performa verified, semakin tinggi revenue share yang dapat di-negotiate.
          </Card>
          <Card icon="star_rate" title="Rating & Review">
            Subscriber dapat memberikan rating dan komentar. Sistem ranking provider berdasarkan
            kombinasi metrik performa objektif (60%) dan rating pengguna (40%).
          </Card>
        </CardGrid>
      </Section>

      <Section title="Arsitektur Multi-Tenant">
        <InfoBox type="info">
          Untuk mendukung multi-tenant SaaS, setiap layer sistem Geonera dirancang dengan tenant isolation
          yang ketat. Data, konfigurasi, dan sinyal setiap tenant tidak dapat diakses oleh tenant lain.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Layer', 'Isolasi Strategy', 'Implementasi']}
            rows={[
              ['Database',        'Row-level security',          'PostgreSQL RLS per tenant_id'],
              ['API',             'JWT claims tenant_id',        'Middleware filter per request'],
              ['Signal Queue',    'Virtual host per tenant',     'RabbitMQ multi-vhost'],
              ['Storage',         'Prefix per tenant',           'ClickHouse: WHERE tenant_id = ?'],
              ['Rate Limiting',   'Per-tenant quota',            'Redis counter per tenant + tier'],
              ['Billing',         'Usage metering',              'ClickHouse event tracking per tenant'],
            ]}
          />
        </div>
      </Section>

      <Section title="API untuk Integrasi Eksternal">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Subscriber tier Advanced dan Institutional mendapat akses API untuk mengintegrasikan sinyal
          Geonera langsung ke platform trading atau sistem manajemen mereka sendiri:
        </p>
        <CodeBlock lang="http">{`# Subscription signal webhook (push model)
POST https://your-server.com/webhook/geonera
X-Geonera-Signature: sha256=abc123...

{
  "event":   "signal.created",
  "tenant":  "acme-capital",
  "signal": {
    "id":          "3fa85f64-...",
    "symbol":      "EURUSD",
    "direction":   "BUY",
    "entry_price": 1.08542,
    "stop_loss":   1.08200,
    "take_profit": 1.09226,
    "prob_profit": 0.73,
    "expires_at":  "2025-01-15T12:00:00Z",
    "transparency": { ... }
  }
}

# Pull model — polling sinyal terbaru
GET https://api.geonera.io/v1/signals?status=APPROVED&limit=10
X-API-Key: geonera_live_abc123...`}</CodeBlock>
      </Section>

      <Section title="Roadmap Pengembangan SaaS">
        <Table
          headers={['Fase', 'Target', 'Fitur Utama']}
          rows={[
            ['Phase 1 — Internal', 'Q1 2025', 'Core platform live trading, internal monitoring, backtesting UI'],
            ['Phase 2 — Beta SaaS', 'Q3 2025', 'Multi-tenant infrastructure, subscription management, API access'],
            ['Phase 3 — Marketplace', 'Q1 2026', 'Provider onboarding, verified performance tracking, revenue sharing'],
            ['Phase 4 — Scale', 'Q3 2026', 'White-label solution, institutional API, additional asset classes'],
          ]}
        />
      </Section>

      <Section title="Compliance & Regulasi">
        <InfoBox type="warning">
          Platform sinyal trading berpotensi memerlukan lisensi regulasi tergantung yurisdiksi operasional.
          Pemberian sinyal trading kepada pihak ketiga dapat dikategorikan sebagai layanan advisory
          investasi di beberapa negara.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="gavel" title="Disclaimer Wajib">
              Setiap sinyal disertai disclaimer bahwa sinyal bukan saran investasi. Past performance
              tidak menjamin hasil di masa depan. Pengguna bertanggung jawab penuh atas keputusan trading.
            </Card>
            <Card icon="privacy_tip" title="Data Privacy">
              Platform mematuhi GDPR dan regulasi data lokal. Data trading pengguna tidak dibagikan
              antar tenant. Audit log lengkap untuk semua akses data sensitif.
            </Card>
          </CardGrid>
        </div>
      </Section>
    </DocPage>
  )
}
