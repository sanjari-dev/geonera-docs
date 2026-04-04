import { DocPage, Section, CardGrid, Card, Table, InfoBox, CodeBlock } from '@/components/ui/DocPage'

export function TestingPage() {
  return (
    <DocPage
      icon="rule"
      title="Testing & Validasi"
      subtitle="Strategi testing berlapis dari unit test hingga backtesting model AI, memastikan kualitas kode, keandalan sistem, dan robustness strategi trading berbasis data historis."
      badge="QA"
      badgeColor="slate"
    >
      <Section title="Testing Pyramid">
        <CardGrid>
          <Card icon="science" title="Unit Tests">
            Test terisolasi untuk setiap fungsi dan komponen. Fokus pada logika bisnis:
            kalkulasi risk management, parsing bi5, agregasi OHLCV, dan validasi parameter sinyal.
          </Card>
          <Card icon="integration_instructions" title="Integration Tests">
            Test komunikasi antar service: Go→ClickHouse, C#→RabbitMQ, Java→JForex sandbox.
            Menggunakan docker-compose untuk spin up dependensi nyata (tidak di-mock).
          </Card>
          <Card icon="rocket_launch" title="End-to-End Tests">
            Simulasi alur lengkap dari ingest data hingga eksekusi sinyal menggunakan environment
            staging dengan data historis dan JForex demo account.
          </Card>
          <Card icon="model_training" title="Model Validation">
            Walk-forward validation, backtesting, dan stress testing model AI menggunakan
            data historis yang tidak pernah dilihat saat training.
          </Card>
        </CardGrid>
      </Section>

      <Section title="Testing Stack per Bahasa">
        <Table
          headers={['Bahasa', 'Unit Test', 'Integration', 'Coverage Target']}
          rows={[
            ['Go',         'go test + testify',       'testcontainers-go',        '≥ 80%'],
            ['Rust',       'cargo test + proptest',   'cargo test (integration/)', '≥ 85%'],
            ['Python',     'pytest + hypothesis',      'pytest + docker fixtures',  '≥ 75%'],
            ['C#',         'xUnit + Moq',             'WebApplicationFactory',     '≥ 80%'],
            ['Java',       'JUnit 5 + Mockito',       'JForex demo account',       '≥ 75%'],
            ['TypeScript', 'Vitest + Testing Library', 'Playwright E2E',           '≥ 70%'],
          ]}
        />
      </Section>

      <Section title="Model Backtesting">
        <InfoBox type="tip">
          Backtesting dilakukan menggunakan teknik <strong>walk-forward validation</strong> untuk menghindari
          lookahead bias. Data dibagi menjadi window training dan testing yang tidak tumpang tindih,
          digeser secara bertahap maju ke depan.
        </InfoBox>
        <div className="mt-4">
          <CodeBlock lang="python">{`# Walk-forward validation framework
def walk_forward_validate(data, train_size, test_size, step):
    results = []
    for start in range(0, len(data) - train_size - test_size, step):
        train = data[start : start + train_size]
        test  = data[start + train_size : start + train_size + test_size]

        model = train_tft(train)
        meta  = train_meta_model(model, train)

        signals = generate_signals(model, meta, test)
        metrics = backtest_signals(signals, test)
        results.append(metrics)

    return aggregate_results(results)

# Metrik yang dievaluasi
metrics = {
    "win_rate":      0.583,   # % sinyal profit
    "profit_factor": 1.72,    # gross profit / gross loss
    "max_drawdown":  0.089,   # 8.9%
    "sharpe_ratio":  1.34,
    "calmar_ratio":  0.61,
    "total_signals": 1847,
}`}</CodeBlock>
        </div>
      </Section>

      <Section title="Risk System Tests">
        <Table
          headers={['Skenario Test', 'Input', 'Expected Output']}
          rows={[
            ['Drawdown hard stop',       'Drawdown = 15.1%',              'Semua trading dihentikan, alert critical'],
            ['Lot size calculation',     'Equity=$10k, Risk=1%, SL=20pip', 'Lot = 0.50 (EURUSD)'],
            ['Max exposure breach',      'Existing EURUSD position + new signal', 'Sinyal ditolak'],
            ['News blackout period',     'Signal timestamp = 5 min sebelum NFP',  'Sinyal ditunda/ditolak'],
            ['Low prob filter',          'prob_profit = 0.52 (< 0.60 threshold)',  'Sinyal tidak dieksekusi'],
            ['Emergency stop',           'API POST /risk/emergency-stop',         'Semua posisi ditutup dalam < 5s'],
          ]}
        />
      </Section>

      <Section title="Continuous Testing in CI">
        <CodeBlock lang="yaml">{`# .github/workflows/test.yml
name: Test Pipeline
on: [pull_request]

jobs:
  go-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
      - run: go test ./... -race -coverprofile=coverage.out
      - run: go tool cover -func coverage.out

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --all-features
      - run: cargo test --test integration

  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install pytest pytest-cov hypothesis
      - run: pytest --cov=geonera --cov-fail-under=75

  csharp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
      - run: dotnet test --collect:"XPlat Code Coverage"`}</CodeBlock>
      </Section>
    </DocPage>
  )
}
