<script>
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let open = false;

  const navigationStructure = [
    {
      category: 'Getting Started',
      icon: '🎯',
      items: [
        { label: 'Platform Overview', href: '/getting-started' },
        { label: 'System Architecture', href: '/getting-started/architecture' },
        { label: 'Quick Start', href: '/getting-started/quick-start' },
      ]
    },
    {
      category: 'Data Pipeline',
      icon: '📊',
      items: [
        { label: 'Dukascopy Ingestion (Go)', href: '/data-pipeline/ingestion' },
        { label: 'Data Processing (Rust)', href: '/data-pipeline/processing' },
        { label: 'Multi-Timeframe Transform', href: '/data-pipeline/timeframe' },
        { label: 'Feature Engineering', href: '/data-pipeline/features' },
      ]
    },
    {
      category: 'AI/ML Model',
      icon: '🤖',
      items: [
        { label: 'Model Architecture (TFT)', href: '/ai-ml/architecture' },
        { label: 'XGBoost Meta-Model', href: '/ai-ml/meta-model' },
        { label: 'Training & Validation', href: '/ai-ml/training' },
        { label: 'Backtesting Framework', href: '/ai-ml/backtesting' },
        { label: 'Model Interpretability', href: '/ai-ml/interpretability' },
      ]
    },
    {
      category: 'API Reference',
      icon: '🔌',
      items: [
        { label: 'Authentication', href: '/api-reference/auth' },
        { label: 'Data Retrieval', href: '/api-reference/data-retrieval' },
        { label: 'Signals & Orders', href: '/api-reference/signals' },
        { label: 'Price History', href: '/api-reference/price-history' },
        { label: 'Market Data', href: '/api-reference/market-data' },
        { label: 'Risk Management', href: '/api-reference/risk' },
        { label: 'Error Handling', href: '/api-reference/errors' },
      ]
    },
    {
      category: 'Trading Execution',
      icon: '🎮',
      items: [
        { label: 'JForex Integration (Java)', href: '/trading-execution/jforex' },
        { label: 'Order Types & Execution', href: '/trading-execution/orders' },
        { label: 'Liquidity Providers', href: '/trading-execution/liquidity' },
      ]
    },
    {
      category: 'Infrastructure',
      icon: '📡',
      items: [
        { label: 'Message Queue (RabbitMQ)', href: '/infrastructure/message-queue' },
        { label: 'Database Setup', href: '/infrastructure/databases' },
        { label: 'Logging (Loki)', href: '/infrastructure/logging' },
        { label: 'Monitoring (Prometheus)', href: '/infrastructure/monitoring' },
        { label: 'Visualization (Grafana)', href: '/infrastructure/visualization' },
        { label: 'Deployment & Scaling', href: '/infrastructure/deployment' },
      ]
    },
    {
      category: 'Security & Operations',
      icon: '🔒',
      items: [
        { label: 'Authentication & Authorization', href: '/security/authentication' },
        { label: 'Data Encryption', href: '/security/encryption' },
        { label: 'Audit Logging', href: '/security/audit' },
        { label: 'Compliance', href: '/security/compliance' },
      ]
    },
    {
      category: 'Best Practices',
      icon: '✨',
      items: [
        { label: 'Design Patterns', href: '/best-practices/patterns' },
        { label: 'Performance Tuning', href: '/best-practices/performance' },
        { label: 'Testing Strategies', href: '/best-practices/testing' },
        { label: 'Troubleshooting', href: '/best-practices/troubleshooting' },
      ]
    },
  ];

  let expandedCategories = {};

  function determineExpandedCategories() {
    const pathname = $page.url.pathname;
    expandedCategories = {};
    navigationStructure.forEach((section) => {
      const isInCategory = section.items.some((item) => pathname.startsWith(item.href));
      if (isInCategory) {
        expandedCategories[section.category] = true;
      }
    });
  }

  $: if ($page.url.pathname) {
    determineExpandedCategories();
  }

  function toggleCategory(category) {
    expandedCategories[category] = !expandedCategories[category];
  }

  function isActive(href) {
    return $page.url.pathname === href;
  }

  function isInActivePath(href) {
    return $page.url.pathname.startsWith(href.split('/').slice(0, 3).join('/'));
  }
</script>

<aside
  class={`fixed md:static inset-0 z-40 transition-all duration-300 ${
    open ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'
  }`}
>
  <div class="w-64 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700 overflow-y-auto flex flex-col">
    <!-- Logo Section -->
    <div class="px-6 py-6 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-50">
      <div class="flex items-baseline gap-2 mb-1">
        <span class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          GEONERA
        </span>
        <span class="text-xs text-slate-500 font-medium">DOCS</span>
      </div>
      <p class="text-xs text-slate-400 mt-2">AI-Driven Trading Intelligence</p>
      <p class="text-xs text-slate-500 mt-1">v1.0.0 · Enterprise</p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-6 space-y-4 overflow-y-auto">
      {#each navigationStructure as section (section.category)}
        <div>
          <button
            on:click={() => toggleCategory(section.category)}
            class={`w-full text-left px-3 py-2 rounded mb-2 flex items-center justify-between transition-all duration-200 ${
              expandedCategories[section.category]
                ? 'text-cyan-300 bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <h3 class="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span class="text-base">{section.icon}</span>
              <span>{section.category}</span>
            </h3>
            <svg
              class={`w-4 h-4 transition-transform duration-300 ${
                expandedCategories[section.category] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if expandedCategories[section.category]}
            <ul
              class="space-y-1"
              transition:slide={{ duration: 200, easing: quintOut, axis: 'y' }}
            >
              {#each section.items as item (item.href)}
                <li>
                  <a
                    href={item.href}
                    on:click={() => (open = false)}
                    class={`block px-3 py-2.5 rounded text-sm transition-all duration-200 font-medium no-underline ${
                      isActive(item.href)
                        ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 pl-2.5'
                        : isInActivePath(item.href)
                          ? 'text-slate-300 bg-slate-800/30'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-slate-700 bg-slate-950 text-xs text-slate-500 space-y-2">
      <p class="font-semibold text-slate-400">© 2026 Geonera</p>
      <p>Production Ready · Enterprise Grade</p>
    </div>
  </div>

  <!-- Mobile Overlay -->
  {#if open}
    <button
      on:click={() => (open = false)}
      on:keydown={(e) => e.key === 'Escape' && (open = false)}
      class="md:hidden absolute inset-0 z-30 bg-black/40 backdrop-blur-sm"
      aria-label="Close sidebar"
    />
  {/if}
</aside>
