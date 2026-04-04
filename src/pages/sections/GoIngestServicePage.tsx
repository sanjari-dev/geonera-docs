import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function GoIngestServicePage() {
  return (
    <DocPage
      icon="download"
      title="Go Ingest Service"
      subtitle="Service pertama dalam pipeline Geonera — bertanggung jawab mengunduh data tick bi5 dari Dukascopy, mendekompresi LZMA, mendecode binary 20-byte per record, mengagregas tick ke OHLCV multi-timeframe, dan menyimpan ke ClickHouse secara batch."
      badge="Go"
      badgeColor="teal"
    >
      <Section title="Tanggung Jawab Service">
        <InfoBox type="info">
          Service ini adalah pintu masuk semua data ke sistem Geonera. Dua mode operasi: (1) Historical Ingest — bulk download data historis bi5, (2) Real-time Streaming — menerima tick live dari JForex via RabbitMQ.
        </InfoBox>
        <div className="mt-4">
          <CardGrid>
            <Card icon="download" title="Download bi5">
              Mengunduh file bi5 dari CDN Dukascopy dengan worker pool 8 goroutine paralel. Menangani gap pasar (404) sebagai kondisi normal, retry 3&times; untuk error jaringan.
            </Card>
            <Card icon="compress" title="Dekompresi LZMA">
              Setiap file bi5 dikompres dengan algoritma LZMA. Go service menggunakan library github.com/ulikunitz/xz/lzma untuk dekompresi in-memory sebelum parsing binary.
            </Card>
            <Card icon="table_rows" title="Decode Binary">
              Setelah dekompresi, data dibaca sebagai stream 20-byte record dalam format big-endian: timestamp offset (4B), ask&times;100000 (4B), bid&times;100000 (4B), ask volume float32 (4B), bid volume float32 (4B).
            </Card>
            <Card icon="candlestick_chart" title="Agregasi OHLCV">
              Tick mentah diagregasi menjadi candlestick OHLCV untuk 7 timeframe: M1, M5, M15, M30, H1, H4, D1. Agregasi dilakukan in-memory menggunakan sliding window sebelum batch insert ke ClickHouse.
            </Card>
          </CardGrid>
        </div>
      </Section>

      <Section title="Pipeline Dekompresi LZMA">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          File bi5 adalah data biner mentah yang dikompres LZMA. Proses dekompresi dilakukan sepenuhnya in-memory — tidak ada file sementara di disk untuk menjaga throughput tinggi.
        </p>
        <CodeBlock lang="go">{`import (
    "bytes"
    "encoding/binary"
    "fmt"
    "io"
    "time"

    "github.com/ulikunitz/xz/lzma"
)

// Tick adalah satu data harga dari Dukascopy setelah decoding.
type Tick struct {
    Time      time.Time
    Ask       float64
    Bid       float64
    AskVolume float32 // dalam lot (1 lot = 100.000 unit)
    BidVolume float32
    Mid       float64 // (Ask + Bid) / 2 — dihitung saat decode
}

// rawTickBinary adalah layout biner persis 20 bytes dalam file bi5.
// Selalu big-endian sesuai spesifikasi Dukascopy.
type rawTickBinary struct {
    TimestampMs uint32  // offset milidetik dari awal jam
    Ask         uint32  // harga ask × 100000 (5 desimal)
    Bid         uint32  // harga bid × 100000
    AskVolume   float32 // volume dalam lot
    BidVolume   float32
}

// DecompressAndDecode mendekompresi data LZMA dari file bi5
// dan mendecode semua tick yang dikandungnya.
// hourBase adalah waktu UTC awal jam file ini (misal: 2024-01-15 10:00:00 UTC)
func DecompressAndDecode(compressedData []byte, hourBase time.Time) ([]Tick, error) {
    // Buat reader LZMA dari data terkompresi
    lzmaReader, err := lzma.NewReader(bytes.NewReader(compressedData))
    if err != nil {
        return nil, fmt.Errorf("membuat LZMA reader: %w", err)
    }

    // Baca seluruh hasil dekompresi ke memory
    // Ukuran hasil dekompresi biasanya 5–20× ukuran file terkompresi
    decompressed, err := io.ReadAll(lzmaReader)
    if err != nil {
        return nil, fmt.Errorf("dekompresi LZMA: %w", err)
    }

    // Validasi: ukuran harus kelipatan 20 bytes
    if len(decompressed)%20 != 0 {
        return nil, fmt.Errorf("ukuran data tidak valid: %d bytes (bukan kelipatan 20)", len(decompressed))
    }

    tickCount := len(decompressed) / 20
    ticks := make([]Tick, 0, tickCount)

    reader := bytes.NewReader(decompressed)
    var raw rawTickBinary

    for i := 0; i < tickCount; i++ {
        // binary.Read membaca 20 bytes dalam urutan big-endian
        if err := binary.Read(reader, binary.BigEndian, &raw); err != nil {
            return nil, fmt.Errorf("membaca tick ke-%d: %w", i, err)
        }

        // Konversi timestamp offset ke waktu absolute UTC
        tickTime := hourBase.Add(time.Duration(raw.TimestampMs) * time.Millisecond)

        // Konversi harga integer ke float64 (5 desimal)
        ask := float64(raw.Ask) / 100000.0
        bid := float64(raw.Bid) / 100000.0

        // Validasi dasar — filter spike yang jelas tidak valid
        if ask <= 0 || bid <= 0 || ask < bid {
            continue // skip tick yang corrupt
        }

        ticks = append(ticks, Tick{
            Time:      tickTime,
            Ask:       ask,
            Bid:       bid,
            AskVolume: raw.AskVolume,
            BidVolume: raw.BidVolume,
            Mid:       (ask + bid) / 2.0,
        })
    }

    return ticks, nil
}`}</CodeBlock>
        <div className="mt-4">
          <Table
            headers={['Field', 'Ukuran', 'Format', 'Keterangan']}
            rows={[
              ['TimestampMs', '4 bytes', 'uint32 big-endian', 'Offset ms dari awal jam. 0 = tepat awal jam, 3599999 = 59:59.999'],
              ['Ask',         '4 bytes', 'uint32 big-endian', 'Harga ask x 100000. Untuk EURUSD: 108542 = 1.08542'],
              ['Bid',         '4 bytes', 'uint32 big-endian', 'Harga bid x 100000. Selalu <= Ask'],
              ['AskVolume',   '4 bytes', 'float32 big-endian', 'Volume yang ditawarkan di sisi ask, dalam lot'],
              ['BidVolume',   '4 bytes', 'float32 big-endian', 'Volume yang ditawarkan di sisi bid, dalam lot'],
            ]}
          />
        </div>
      </Section>

      <Section title="Agregasi Tick ke OHLCV">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Setelah decoding, tick mentah diagregasi ke candlestick OHLCV untuk setiap timeframe. Menggunakan harga Mid (rata-rata Ask dan Bid) sebagai price reference karena lebih representatif dari perspektif analitik.
        </p>
        <CodeBlock lang="go">{`// OHLCVBar adalah satu candlestick untuk timeframe tertentu.
type OHLCVBar struct {
    Symbol    string
    OpenTime  time.Time
    Open      float64
    High      float64
    Low       float64
    Close     float64
    AskVol    float32
    BidVol    float32
    SpreadAvg float32 // rata-rata spread (Ask-Bid) dalam pip selama periode
    TickCount int     // jumlah tick yang membentuk bar ini
}

// AggregateToOHLCV mengkonversi slice tick menjadi OHLCV bar
// untuk durasi timeframe yang ditentukan (misal: time.Minute untuk M1).
func AggregateToOHLCV(ticks []Tick, symbol string, tf time.Duration) []OHLCVBar {
    if len(ticks) == 0 {
        return nil
    }

    bars := make([]OHLCVBar, 0)
    var current *OHLCVBar

    for _, tick := range ticks {
        // Hitung awal periode untuk tick ini
        barStart := tick.Time.Truncate(tf)

        if current == nil || !current.OpenTime.Equal(barStart) {
            // Simpan bar sebelumnya jika ada
            if current != nil {
                bars = append(bars, *current)
            }
            // Mulai bar baru
            current = &OHLCVBar{
                Symbol:   symbol,
                OpenTime: barStart,
                Open:     tick.Mid,
                High:     tick.Mid,
                Low:      tick.Mid,
                Close:    tick.Mid,
            }
        }

        // Update bar yang sedang berjalan
        if tick.Mid > current.High {
            current.High = tick.Mid
        }
        if tick.Mid < current.Low {
            current.Low = tick.Mid
        }
        current.Close = tick.Mid
        current.AskVol += tick.AskVolume
        current.BidVol += tick.BidVolume
        current.SpreadAvg += float32(tick.Ask - tick.Bid)
        current.TickCount++
    }

    // Jangan lupa bar terakhir
    if current != nil {
        if current.TickCount > 0 {
            current.SpreadAvg /= float32(current.TickCount)
        }
        bars = append(bars, *current)
    }

    return bars
}

// Timeframes yang dihasilkan untuk setiap simbol
var Timeframes = []struct {
    Name     string
    Duration time.Duration
    Table    string
}{
    {"M1",  1 * time.Minute,       "ohlcv_m1"},
    {"M5",  5 * time.Minute,       "ohlcv_m5"},
    {"M15", 15 * time.Minute,      "ohlcv_m15"},
    {"M30", 30 * time.Minute,      "ohlcv_m30"},
    {"H1",  1 * time.Hour,         "ohlcv_h1"},
    {"H4",  4 * time.Hour,         "ohlcv_h4"},
    {"D1",  24 * time.Hour,        "ohlcv_d1"},
}`}</CodeBlock>
      </Section>

      <Section title="Batch Insert ke ClickHouse">
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Insert satu per satu sangat lambat untuk data tick volume tinggi. Go service menggunakan batch insert — mengakumulasi rows dan insert setiap 5.000 rows atau setiap 5 detik, mana yang lebih dulu.
        </p>
        <CodeBlock lang="go">{`import (
    "context"
    "fmt"
    "time"

    "github.com/ClickHouse/clickhouse-go/v2"
)

// BatchInserter mengakumulasi OHLCV bars dan insert ke ClickHouse secara batch.
type BatchInserter struct {
    conn      clickhouse.Conn
    table     string
    buffer    []OHLCVBar
    batchSize int
    flushEvery time.Duration
    lastFlush  time.Time
}

func NewBatchInserter(conn clickhouse.Conn, table string) *BatchInserter {
    return &BatchInserter{
        conn:       conn,
        table:      table,
        buffer:     make([]OHLCVBar, 0, 5000),
        batchSize:  5000,
        flushEvery: 5 * time.Second,
        lastFlush:  time.Now(),
    }
}

func (b *BatchInserter) Add(ctx context.Context, bar OHLCVBar) error {
    b.buffer = append(b.buffer, bar)

    // Flush jika buffer penuh atau sudah waktunya
    if len(b.buffer) >= b.batchSize || time.Since(b.lastFlush) >= b.flushEvery {
        return b.Flush(ctx)
    }
    return nil
}

func (b *BatchInserter) Flush(ctx context.Context) error {
    if len(b.buffer) == 0 {
        return nil
    }

    batch, err := b.conn.PrepareBatch(ctx,
        fmt.Sprintf("INSERT INTO %s (symbol, open_time, open, high, low, close, ask_vol, bid_vol, spread_avg)", b.table))
    if err != nil {
        return fmt.Errorf("prepare batch: %w", err)
    }

    for _, bar := range b.buffer {
        if err := batch.Append(
            bar.Symbol, bar.OpenTime,
            bar.Open, bar.High, bar.Low, bar.Close,
            bar.AskVol, bar.BidVol, bar.SpreadAvg,
        ); err != nil {
            return fmt.Errorf("append row: %w", err)
        }
    }

    if err := batch.Send(); err != nil {
        return fmt.Errorf("send batch (%d rows) ke %s: %w", len(b.buffer), b.table, err)
    }

    b.buffer = b.buffer[:0] // reset buffer tanpa alokasi baru
    b.lastFlush = time.Now()
    return nil
}`}</CodeBlock>
      </Section>

      <Section title="Pipeline Lengkap — Satu Jam Data">
        <InfoBox type="tip">
          Fungsi ini mengorkestrasikan seluruh pipeline untuk satu file bi5: download &rarr; decompress &rarr; decode &rarr; aggregate &rarr; insert. Dipanggil oleh worker pool untuk setiap IngestTask.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="go">{`// ProcessHour mengeksekusi pipeline lengkap untuk satu jam data satu instrumen.
func ProcessHour(
    ctx context.Context,
    client *http.Client,
    chConn clickhouse.Conn,
    instrument string,
    hour time.Time,
) error {
    url := BuildBi5URL(instrument, hour)

    // 1. Download dengan retry
    result, err := DownloadBi5WithRetry(ctx, client, url, DefaultRetryConfig)
    if errors.Is(err, ErrMarketGap) {
        return nil // gap pasar normal, bukan error
    }
    if err != nil {
        return fmt.Errorf("download: %w", err)
    }

    // 2. Dekompresi LZMA + decode binary
    ticks, err := DecompressAndDecode(result.CompressedData, hour)
    if err != nil {
        return fmt.Errorf("decode bi5: %w", err)
    }
    if len(ticks) == 0 {
        return nil // file valid tapi tidak ada tick (sangat jarang)
    }

    // 3. Agregasi ke semua timeframe dan insert ke ClickHouse
    for _, tf := range Timeframes {
        bars := AggregateToOHLCV(ticks, instrument, tf.Duration)

        inserter := NewBatchInserter(chConn, tf.Table)
        for _, bar := range bars {
            if err := inserter.Add(ctx, bar); err != nil {
                return fmt.Errorf("insert %s ke %s: %w", tf.Name, tf.Table, err)
            }
        }
        if err := inserter.Flush(ctx); err != nil {
            return fmt.Errorf("flush %s: %w", tf.Name, err)
        }
    }

    return nil
}`}</CodeBlock>
        </div>
      </Section>
    </DocPage>
  )
}
