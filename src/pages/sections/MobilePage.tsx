import { DocPage, Section, CardGrid, Card, Table, InfoBox } from '@/components/ui/DocPage'

export function MobilePage() {
  return (
    <DocPage
      icon="smartphone"
      title="Mobile"
      subtitle="Aplikasi mobile Geonera memungkinkan trader memantau sinyal, posisi, dan performa portofolio secara real-time dari perangkat iOS maupun Android."
      badge="Mobile"
      badgeColor="blue"
    >
      <Section title="Platform & Tech Stack">
        <CardGrid>
          <Card icon="devices" title="Cross-Platform">
            Dikembangkan menggunakan pendekatan <strong>cross-platform</strong> untuk mendukung
            iOS dan Android dari satu codebase, mengurangi duplikasi dan mempercepat siklus rilis.
          </Card>
          <Card icon="notifications" title="Push Notifications">
            Notifikasi real-time untuk sinyal baru, status eksekusi order, dan alert risiko
            menggunakan layanan push notification native (APNs untuk iOS, FCM untuk Android).
          </Card>
          <Card icon="fingerprint" title="Biometric Auth">
            Autentikasi menggunakan Face ID / Touch ID sebagai lapisan keamanan tambahan
            sebelum mengakses data sensitif atau melakukan aksi trading.
          </Card>
          <Card icon="wifi_off" title="Offline Support">
            Data sinyal dan posisi terakhir di-cache secara lokal sehingga tetap dapat dilihat
            meskipun koneksi internet terputus sementara.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Fitur Utama Aplikasi">
        <Table
          headers={['Fitur', 'Deskripsi', 'Update Mode']}
          rows={[
            ['Signal Feed',         'List sinyal terbaru dengan probabilitas dan arah trading',     'Push / Pull'],
            ['Position Monitor',    'Posisi aktif dengan PnL floating dan progress TP/SL',         'WebSocket'],
            ['Portfolio Summary',   'Ringkasan equity, drawdown, win rate mingguan',                'Polling 5m'],
            ['Alert Center',        'Notifikasi sinyal baru, risk alert, dan system events',        'Push (APNs/FCM)'],
            ['Signal Detail',       'Detail sinyal: prediksi TFT, SHAP chart, entry levels',       'On-demand'],
            ['Risk Status',         'Gauge drawdown real-time dan status limit risiko',             'WebSocket'],
            ['Performance History', 'Chart equity curve dan metrik historis per periode',           'On-demand'],
          ]}
        />
      </Section>

      <Section title="Push Notification Schema">
        <InfoBox type="info">
          Notifikasi dikirim dari C# backend melalui layanan push notification setelah sinyal melewati
          semua validasi (meta-model threshold + risk check). Pengguna dapat mengatur preferensi
          notifikasi per simbol dan jenis alert.
        </InfoBox>
        <div className="mt-4">
          <Table
            headers={['Tipe Notifikasi', 'Trigger', 'Prioritas']}
            rows={[
              ['New Signal',           'Sinyal baru lolos semua validasi',                'Normal'],
              ['Signal Approved',      'Sinyal disetujui untuk eksekusi',                 'High'],
              ['Position Filled',      'Order berhasil dieksekusi oleh JForex',           'High'],
              ['Take Profit Hit',      'Posisi mencapai target profit',                   'High'],
              ['Stop Loss Hit',        'Posisi mencapai batas kerugian',                  'High (Critical)'],
              ['Risk Warning',         'Drawdown mendekati batas warning',                'High'],
              ['Emergency Stop',       'Hard stop diaktifkan, semua trading dihentikan', 'Critical'],
              ['System Alert',         'Service down atau anomali terdeteksi',            'Normal'],
            ]}
          />
        </div>
      </Section>

      <Section title="Security Mobile">
        <CardGrid>
          <Card icon="lock" title="Token Storage">
            JWT token disimpan di <strong>Keychain (iOS)</strong> / <strong>Keystore (Android)</strong>
            — penyimpanan terenkripsi di level OS, tidak dapat diakses oleh aplikasi lain.
          </Card>
          <Card icon="phonelink_lock" title="Certificate Pinning">
            Implementasi SSL certificate pinning mencegah serangan man-in-the-middle (MITM)
            meskipun device terhubung ke jaringan yang tidak dipercaya.
          </Card>
          <Card icon="visibility_off" title="Screen Masking">
            Data sensitif (harga, PnL, lot size) otomatis disembunyikan ketika aplikasi
            berpindah ke background untuk mencegah data terlihat di app switcher.
          </Card>
          <Card icon="timer" title="Session Timeout">
            Session otomatis berakhir setelah periode inaktivitas yang dapat dikonfigurasi,
            memerlukan autentikasi ulang (biometric atau PIN).
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
