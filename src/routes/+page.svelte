<script>
  import { ChevronRight, Zap, Database, Brain, Cpu } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Home - Geonera Documentation</title>
  <meta name="description" content="AI-Driven Trading Intelligence Platform Documentation" />
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
  <!-- Hero Section -->
  <section class="space-y-6">
    <div>
      <h1 class="text-6xl font-bold mb-4">Geonera Documentation</h1>
      <p class="text-2xl text-slate-400 max-w-2xl">
        Comprehensive technical documentation for the Geonera AI-driven trading intelligence platform.
        Built by engineers, for engineers. Covering data pipelines, ML models, APIs, and microservices architecture.
      </p>
    </div>

    <div class="flex flex-wrap gap-4 pt-4">
      <a
        href="/getting-started"
        class="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition no-underline"
      >
        Get Started <ChevronRight size={18} />
      </a>
      <a
        href="/api-reference/data-retrieval"
        class="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-lg hover:border-cyan-400 transition no-underline"
      >
        API Reference <ChevronRight size={18} />
      </a>
    </div>
  </section>

  <!-- Feature Grid -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <a
      href="/getting-started/architecture"
      class="group p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-lg hover:border-cyan-400 transition space-y-3 no-underline"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-cyan-500/20 rounded">
          <Cpu size={24} class="text-cyan-400" />
        </div>
        <h3 class="text-xl font-bold group-hover:text-cyan-400 transition">System Architecture</h3>
      </div>
      <p class="text-slate-400">
        Polyglot microservices with Go (ingest), Rust (preprocessing), Python (ML), C# (API), Java (JForex).
      </p>
    </a>

    <a
      href="/data-pipeline/ingestion"
      class="group p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-lg hover:border-emerald-400 transition space-y-3 no-underline"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-emerald-500/20 rounded">
          <Database size={24} class="text-emerald-400" />
        </div>
        <h3 class="text-xl font-bold group-hover:text-emerald-400 transition">Data Pipeline</h3>
      </div>
      <p class="text-slate-400">
        Dukascopy bi5 tick data ingestion, multi-timeframe transformation, and feature engineering.
      </p>
    </a>

    <a
      href="/ai-ml/architecture"
      class="group p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-lg hover:border-amber-400 transition space-y-3 no-underline"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-amber-500/20 rounded">
          <Brain size={24} class="text-amber-400" />
        </div>
        <h3 class="text-xl font-bold group-hover:text-amber-400 transition">AI/ML Engine</h3>
      </div>
      <p class="text-slate-400">
        Temporal Fusion Transformer (TFT) for multi-step price predictions with XGBoost meta-models.
      </p>
    </a>

    <a
      href="/api-reference/data-retrieval"
      class="group p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-lg hover:border-cyan-400 transition space-y-3 no-underline"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-cyan-500/20 rounded">
          <Zap size={24} class="text-cyan-400" />
        </div>
        <h3 class="text-xl font-bold group-hover:text-cyan-400 transition">REST API</h3>
      </div>
      <p class="text-slate-400">
        Endpoints for signal retrieval, price history, market data with pagination & time filtering.
      </p>
    </a>
  </section>

  <!-- Quick Links Section -->
  <section class="p-8 bg-gradient-to-br from-slate-900/50 to-slate-950 border border-slate-700 rounded-lg space-y-4">
    <h2 class="text-2xl font-bold">Explore by Role</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <h3 class="font-bold text-cyan-400">Backend Engineers</h3>
        <p class="text-slate-400 text-sm">Start with API Reference and System Architecture</p>
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-emerald-400">Data Engineers</h3>
        <p class="text-slate-400 text-sm">Focus on Data Pipeline and ClickHouse/PostgreSQL setup</p>
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-amber-400">ML Engineers</h3>
        <p class="text-slate-400 text-sm">Deep dive into TFT models, training pipelines, and backtesting</p>
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-cyan-400">DevOps Engineers</h3>
        <p class="text-slate-400 text-sm">Infrastructure, observability (Grafana/Prometheus), and deployment</p>
      </div>
    </div>
  </section>
</div>
