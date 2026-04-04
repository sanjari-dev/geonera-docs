import { DocPage, Section, CardGrid, Card, InfoBox, CodeBlock, Table } from '@/components/ui/DocPage'

export function DataIngestionPage() {
  return (
    <DocPage
      icon="download"
      title="Data Ingestion — Go Service"
      subtitle="Mekanisme pengunduhan file bi5 dari Dukascopy: konstruksi URL deterministik, HTTP client yang tepat, klasifikasi error 404 vs gap pasar, retry dengan exponential backoff, dan worker pool berkonkurensi terkontrol."
      badge="Go"
      badgeColor="teal"
    >
      <InfoBox type="info">
        Pengunduhan bi5 adalah tanggung jawab pertama dan paling fundamental dari Go ingest service.
        Prosesnya lebih kompleks dari sekadar <code>http.Get</code> karena harus menangani jadwal pasar,
        gap yang diharapkan, retry yang cerdas, dan konkurensi yang terkontrol.
      </InfoBox>

      <Section title="1. Konstruksi URL">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          URL bi5 mengikuti pola deterministik yang dapat dihitung dari parameter waktu dan instrumen.
          Satu-satunya gotcha kritis: <strong>Dukascopy menggunakan bulan 0-indexed</strong> (Januari = 0,
          Desember = 11), sedangkan <code>time.Month</code> di Go dimulai dari 1.
        </p>
        <CodeBlock lang="go">{`// BaseURL adalah endpoint CDN Dukascopy
const BaseURL = "https://datafeed.dukascopy.com/datafeed"

// BuildBi5URL membangun URL untuk satu jam data instrumen tertentu.
// PENTING: Dukascopy menggunakan bulan 0-indexed (Januari = 0, Desember = 11)
func BuildBi5URL(instrument string, t time.Time) string {
    t = t.UTC().Truncate(time.Hour) // normalisasi ke awal jam
    return fmt.Sprintf(
        "%s/%s/%d/%02d/%02d/%02dh_ticks.bi5",
        BaseURL,
        instrument,
        t.Year(),
        t.Month()-1, // ← konversi: time.Month dimulai dari 1, Dukascopy dari 0
        t.Day(),
        t.Hour(),
    )
}`}</CodeBlock>
        <div className="mt-4 bg-surface-container-lowest border border-slate-200 rounded-lg p-4 font-mono text-xs space-y-1">
          <p className="text-slate-400 mb-2">{'// Contoh output'}</p>
          <p><span className="text-slate-500">BuildBi5URL("EURUSD", 2024-01-15 10:00 UTC)</span></p>
          <p className="text-teal-600 ml-4">→ .../EURUSD/2024/<strong>00</strong>/15/10h_ticks.bi5</p>
          <p className="mt-2"><span className="text-slate-500">BuildBi5URL("USDJPY", 2024-12-31 23:00 UTC)</span></p>
          <p className="text-teal-600 ml-4">→ .../USDJPY/2024/<strong>11</strong>/31/23h_ticks.bi5</p>
        </div>
      </Section>

      <Section title="2. HTTP Client — Konfigurasi yang Tepat">
        <InfoBox type="warning">
          Jangan gunakan <code>http.DefaultClient</code> — timeout default-nya tidak terbatas dan tidak
          aman untuk production. File bi5 bisa lambat diunduh saat CDN sedang sibuk.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="go">{`func NewDukascopyClient() *http.Client {
    transport := &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 20,        // Dukascopy toleran terhadap koneksi paralel
        IdleConnTimeout:     90 * time.Second,
        DisableCompression:  true,      // bi5 sudah dikompres LZMA — jangan dobel kompresi
        TLSHandshakeTimeout: 10 * time.Second,
    }

    return &http.Client{
        Timeout:   30 * time.Second,   // timeout per request termasuk download body
        Transport: transport,
        // Jangan follow redirect otomatis — URL bi5 tidak seharusnya redirect
        CheckRedirect: func(req *http.Request, via []*http.Request) error {
            return http.ErrUseLastResponse
        },
    }
}`}</CodeBlock>
        </div>
        <div className="mt-4">
          <Table
            headers={['Parameter', 'Nilai', 'Alasan']}
            rows={[
              ['Timeout',              '30s',    'File bi5 1–2MB — 30s cukup bahkan di koneksi lambat'],
              ['DisableCompression',   'true',   'bi5 sudah LZMA — HTTP gzip di atas LZMA tidak efisien'],
              ['MaxIdleConnsPerHost',  '20',     'Mendukung konkurensi tinggi ke satu host CDN'],
              ['CheckRedirect',        'reject', 'URL deterministik — redirect tidak diharapkan'],
            ]}
          />
        </div>
      </Section>

      <Section title="3. Fungsi Unduh — Klasifikasi Error">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Kunci desain: <strong>HTTP 404 dari Dukascopy bukan error</strong> — ini sinyal bahwa jam
          tersebut adalah gap pasar yang valid (akhir pekan, hari libur). Kode ini harus membedakan
          404 dari error jaringan nyata.
        </p>
        <CodeBlock lang="go">{`// ErrMarketGap menandakan jam yang diminta adalah gap pasar yang diharapkan.
// Caller harus menangani ini sebagai kondisi normal, bukan kegagalan.
var ErrMarketGap = errors.New("market gap: no data for this hour")

type DownloadResult struct {
    CompressedData []byte // data mentah LZMA — belum didekompresi
    ContentLength  int64
    URL            string
}

func DownloadBi5(client *http.Client, url string) (*DownloadResult, error) {
    req, err := http.NewRequest(http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("membuat request: %w", err)
    }

    // Beberapa edge server Dukascopy memblokir request tanpa User-Agent
    req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GeoneraBi5Ingest/1.0)")
    req.Header.Set("Accept-Encoding", "identity")

    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("mengirim request ke %s: %w", url, err)
    }
    defer resp.Body.Close()

    switch resp.StatusCode {
    case http.StatusOK:
        // normal — lanjutkan baca body
    case http.StatusNotFound:
        // 404 = gap pasar (akhir pekan, hari libur, data tidak tersedia)
        return nil, fmt.Errorf("%w: %s", ErrMarketGap, url)
    case http.StatusTooManyRequests:
        return nil, fmt.Errorf("rate limit Dukascopy: %s", url)
    default:
        return nil, fmt.Errorf("respons tidak terduga (status %d): %s", resp.StatusCode, url)
    }

    // Max 10MB safety limit — file bi5 normal jauh lebih kecil
    data, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
    if err != nil {
        return nil, fmt.Errorf("membaca body response: %w", err)
    }

    if len(data) == 0 {
        // Server kadang mengembalikan 200 dengan body kosong
        return nil, fmt.Errorf("%w (body kosong): %s", ErrMarketGap, url)
    }

    return &DownloadResult{
        CompressedData: data,
        ContentLength:  resp.ContentLength,
        URL:            url,
    }, nil
}`}</CodeBlock>
        <div className="mt-4">
          <Table
            headers={['HTTP Status', 'Interpretasi', 'Tindakan']}
            rows={[
              ['200 OK',           'Data tersedia',             'Baca body, lanjutkan pipeline'],
              ['404 Not Found',    'Gap pasar — normal',        'Return ErrMarketGap, skip'],
              ['429 Too Many Req', 'Rate limit CDN',            'Return error, trigger backoff'],
              ['200 + body kosong','Jam tanpa transaksi',       'Perlakukan sebagai gap'],
              ['403 / 401',        'Akses ditolak',             'Return error permanen'],
            ]}
          />
        </div>
      </Section>

      <Section title="4. Retry dengan Exponential Backoff">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Retry harus cerdas: jangan retry 404 (gap pasar — kondisi permanen), retry untuk error
          jaringan sementara, dengan jeda yang semakin panjang tiap attempt.
        </p>
        <CodeBlock lang="go">{`type RetryConfig struct {
    MaxAttempts int
    BaseDelay   time.Duration
    MaxDelay    time.Duration
    Multiplier  float64
}

var DefaultRetryConfig = RetryConfig{
    MaxAttempts: 3,
    BaseDelay:   1 * time.Second,
    MaxDelay:    30 * time.Second,
    Multiplier:  2.0, // 1s → 2s → 4s → ...
}

func DownloadBi5WithRetry(
    ctx context.Context,
    client *http.Client,
    url string,
    cfg RetryConfig,
) (*DownloadResult, error) {
    var lastErr error

    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        if ctx.Err() != nil {
            return nil, fmt.Errorf("konteks dibatalkan: %w", ctx.Err())
        }

        result, err := DownloadBi5(client, url)
        if err == nil {
            return result, nil
        }

        // Jangan retry untuk gap pasar — kondisi permanen
        if errors.Is(err, ErrMarketGap) {
            return nil, err
        }

        lastErr = err
        if attempt == cfg.MaxAttempts {
            break
        }

        delay := time.Duration(float64(cfg.BaseDelay) * math.Pow(cfg.Multiplier, float64(attempt-1)))
        if delay > cfg.MaxDelay {
            delay = cfg.MaxDelay
        }

        slog.Warn("unduhan gagal, akan retry",
            "url", url, "attempt", attempt, "delay", delay, "error", err)

        select {
        case <-time.After(delay):
        case <-ctx.Done():
            return nil, fmt.Errorf("konteks dibatalkan saat menunggu retry: %w", ctx.Err())
        }
    }

    return nil, fmt.Errorf("semua %d attempt gagal: %w", cfg.MaxAttempts, lastErr)
}`}</CodeBlock>
      </Section>

      <Section title="5. Worker Pool — Konkurensi Terkontrol">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Ingest historis perlu mengunduh ribuan jam sekaligus. Tanpa rate limiting, ini akan memicu
          pemblokiran dari CDN Dukascopy. Worker pool dengan semaphore membatasi request paralel.
        </p>
        <CodeBlock lang="go">{`type IngestTask struct {
    Instrument string
    HourUTC    time.Time
}

type IngestResult struct {
    Task       IngestTask
    Data       []byte // nil jika gap atau error
    IsGap      bool
    Err        error
    DurationMs int64
}

// DownloadRange mengunduh semua jam dalam rentang waktu untuk semua instrumen.
// maxConcurrent mengontrol berapa request yang berjalan paralel (rekomendasi: 8).
func DownloadRange(
    ctx context.Context,
    client *http.Client,
    instruments []string,
    start, end time.Time,
    maxConcurrent int,
) <-chan IngestResult {
    results := make(chan IngestResult, maxConcurrent*2)

    go func() {
        defer close(results)

        var tasks []IngestTask
        for _, inst := range instruments {
            for t := start.Truncate(time.Hour); t.Before(end); t = t.Add(time.Hour) {
                tasks = append(tasks, IngestTask{Instrument: inst, HourUTC: t})
            }
        }

        sem := make(chan struct{}, maxConcurrent)
        var wg sync.WaitGroup

        for _, task := range tasks {
            task := task
            select {
            case <-ctx.Done():
                break
            case sem <- struct{}{}:
            }

            wg.Add(1)
            go func() {
                defer wg.Done()
                defer func() { <-sem }()

                started := time.Now()
                url := BuildBi5URL(task.Instrument, task.HourUTC)
                result, err := DownloadBi5WithRetry(ctx, client, url, DefaultRetryConfig)

                ir := IngestResult{Task: task, DurationMs: time.Since(started).Milliseconds()}
                switch {
                case err == nil:
                    ir.Data = result.CompressedData
                case errors.Is(err, ErrMarketGap):
                    ir.IsGap = true
                default:
                    ir.Err = err
                }
                results <- ir
            }()
        }
        wg.Wait()
    }()

    return results
}`}</CodeBlock>
        <div className="mt-4">
          <CodeBlock lang="go">{`// Penggunaan di main ingest loop
func RunHistoricalIngest(ctx context.Context, cfg Config) error {
    client := NewDukascopyClient()
    results := DownloadRange(ctx, client,
        cfg.Instruments,   // ["EURUSD", "GBPUSD", "USDJPY"]
        cfg.StartTime,
        cfg.EndTime,
        8,                 // maxConcurrent — cukup agresif tapi tidak spam CDN
    )

    var downloaded, gaps, errs int
    for result := range results {
        switch {
        case result.IsGap:
            gaps++
            slog.Debug("gap pasar", "inst", result.Task.Instrument, "hour", result.Task.HourUTC)
        case result.Err != nil:
            errs++
            slog.Error("gagal unduh", "inst", result.Task.Instrument, "error", result.Err)
        default:
            downloaded++
            // → dekompresi LZMA → decode binary → insert ClickHouse
            processAndStore(ctx, result)
        }
    }

    slog.Info("ingest selesai",
        "downloaded", downloaded, "gaps", gaps, "errors", errs)
    return nil
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="6. Klasifikasi Gap: Valid vs Tidak Terduga">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Tidak semua 404 adalah gap pasar yang normal. Helper ini membantu membedakan weekend
          (expected) dari gap di jam kerja (perlu investigasi):
        </p>
        <CodeBlock lang="go">{`// IsExpectedMarketGap mengembalikan true jika jam tersebut seharusnya
// tidak memiliki data karena pasar tutup.
// Pasar forex tutup Sabtu 22:00 UTC – Minggu 22:00 UTC
func IsExpectedMarketGap(t time.Time) bool {
    t = t.UTC()
    switch t.Weekday() {
    case time.Saturday:
        return t.Hour() >= 22
    case time.Sunday:
        return t.Hour() < 22
    default:
        return false
    }
}

// Penggunaan — log berbeda untuk gap expected vs unexpected
if errors.Is(err, ErrMarketGap) {
    if IsExpectedMarketGap(task.HourUTC) {
        slog.Debug("gap akhir pekan", "inst", task.Instrument, "hour", task.HourUTC)
    } else {
        // 404 di jam kerja — lebih menarik, perlu perhatian
        slog.Warn("gap tidak terduga di jam kerja",
            "inst", task.Instrument, "hour", task.HourUTC)
    }
}`}</CodeBlock>
      </Section>

      <Section title="Ringkasan Alur Lengkap">
        <div className="bg-slate-900 rounded-lg p-6 font-mono text-xs text-slate-300 leading-loose overflow-x-auto">
          <div className="text-slate-500 mb-3">{'// Pipeline pengunduhan bi5 end-to-end'}</div>
          <div><span className="text-teal-400">Scheduler</span> <span className="text-slate-500">(range waktu × instrumen)</span></div>
          <div className="ml-4 text-slate-500">│</div>
          <div className="ml-4"><span className="text-slate-500">├─</span> <span className="text-yellow-400">BuildBi5URL</span><span className="text-slate-500">(instrument, hour)</span></div>
          <div className="ml-4"><span className="text-slate-500">│       └─ .../EURUSD/2024/00/15/10h_ticks.bi5</span></div>
          <div className="ml-4 text-slate-500">│</div>
          <div className="ml-4"><span className="text-slate-500">├─</span> <span className="text-blue-400">Worker Pool</span> <span className="text-slate-500">(8 goroutines paralel)</span></div>
          <div className="ml-4"><span className="text-slate-500">│       │</span></div>
          <div className="ml-4"><span className="text-slate-500">│       └─</span> <span className="text-purple-400">DownloadBi5WithRetry</span></div>
          <div className="ml-4"><span className="text-slate-500">│               ├─ 200 OK  → []byte LZMA mentah</span></div>
          <div className="ml-4"><span className="text-slate-500">│               ├─ 404     → ErrMarketGap (skip)</span></div>
          <div className="ml-4"><span className="text-slate-500">│               └─ error   → retry 3× backoff (1s→2s→4s)</span></div>
          <div className="ml-4 text-slate-500">│</div>
          <div className="ml-4"><span className="text-slate-500">└─</span> <span className="text-green-400">Channel hasil</span> <span className="text-slate-500">→ pipeline berikutnya</span></div>
          <div className="ml-12"><span className="text-slate-500">├─ IsGap=true   → skip, catat statistik</span></div>
          <div className="ml-12"><span className="text-slate-500">├─ Err != nil   → log error, lanjutkan</span></div>
          <div className="ml-12"><span className="text-slate-500">└─ Data != nil  → dekompresi LZMA → decode binary → ClickHouse</span></div>
        </div>
        <div className="mt-4">
          <CardGrid>
            <Card icon="download" title="Ukuran file bi5">
              Tipikal 10 KB–2 MB per jam tergantung volatilitas. Jam London/NY overlap
              bisa jauh lebih besar dari jam Asia yang sepi.
            </Card>
            <Card icon="speed" title="Throughput rekomendasi">
              <code>maxConcurrent = 8</code> memberikan throughput optimal tanpa
              memicu rate limiting CDN Dukascopy. Lebih dari 20 paralel berisiko 429.
            </Card>
            <Card icon="calendar_month" title="Volume historis">
              5 tahun × 5 instrumen × ~120 jam/minggu ≈ <strong>~156.000 file</strong>.
              Dengan 8 paralel, full ingest selesai dalam beberapa jam.
            </Card>
            <Card icon="warning" title="Gotcha utama">
              Bulan 0-indexed adalah sumber bug paling umum. Januari = <code>00</code>,
              bukan <code>01</code>. Selalu validasi URL pertama sebelum bulk download.
            </Card>
          </CardGrid>
        </div>
      </Section>
    </DocPage>
  )
}
