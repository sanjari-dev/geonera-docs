<script>
  import { ChevronRight } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Geonera Documentation - Home</title>
  <meta name="description" content="AI-Driven Trading Intelligence Platform Documentation" />
</svelte:head>

<div class="max-w-4xl mx-auto px-6 py-12">
  <div class="mb-12">
    <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
      Geonera Documentation
    </h1>
    <p class="text-xl text-slate-400 mb-8">
      Comprehensive technical documentation for the Geonera AI-driven trading intelligence platform.
      Built for software engineers across backend, data, ML, and DevOps teams.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
    <a href="/api-reference/data-retrieval" class="group p-6 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-cyan-400 transition">
      <h3 class="text-lg font-bold mb-2 flex items-center gap-2 group-hover:text-cyan-400 transition">
        API Reference <ChevronRight size={18} />
      </h3>
      <p class="text-slate-400">Explore REST API endpoints for data retrieval, trading operations, and risk management.</p>
    </a>

    <a href="/getting-started/architecture" class="group p-6 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-emerald-400 transition">
      <h3 class="text-lg font-bold mb-2 flex items-center gap-2 group-hover:text-emerald-400 transition">
        System Architecture <ChevronRight size={18} />
      </h3>
      <p class="text-slate-400">Understand the polyglot microservices architecture and data pipeline design.</p>
    </a>
  </div>

  <div class="p-6 bg-gradient-to-br from-slate-900/50 to-slate-950 border border-slate-700 rounded-lg">
    <h2 class="text-2xl font-bold mb-4">Getting Started</h2>
    <p class="text-slate-400 mb-4">
      New to Geonera? Start with our comprehensive guides covering system architecture, data pipeline, and API integration patterns.
    </p>
    <a href="/getting-started" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
      Browse Documentation <ChevronRight size={18} />
    </a>
  </div>
</div>
