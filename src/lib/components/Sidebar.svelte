<script>
  import { page } from '$app/stores';
  import { ChevronDown } from 'lucide-svelte';

  export let open = true;

  const navigationItems = [
    {
      category: 'Getting Started',
      icon: '🎯',
      items: [
        { label: 'Overview', href: '/getting-started' },
        { label: 'Architecture', href: '/getting-started/architecture' },
      ]
    },
    {
      category: 'Data Pipeline',
      icon: '📊',
      items: [
        { label: 'Data Ingestion', href: '/data-pipeline/ingestion' },
        { label: 'Data Processing', href: '/data-pipeline/processing' },
      ]
    },
    {
      category: 'AI/ML Model',
      icon: '🤖',
      items: [
        { label: 'Model Architecture', href: '/ai-ml/architecture' },
        { label: 'Training & Evaluation', href: '/ai-ml/training' },
      ]
    },
    {
      category: 'API Reference',
      icon: '🔌',
      items: [
        { label: 'Authentication', href: '/api-reference/auth' },
        { label: 'Data Retrieval', href: '/api-reference/data-retrieval' },
        { label: 'Trading Operations', href: '/api-reference/trading' },
        { label: 'Risk Management', href: '/api-reference/risk' },
      ]
    },
    {
      category: 'Infrastructure',
      icon: '📡',
      items: [
        { label: 'Message Queue', href: '/infrastructure/message-queue' },
        { label: 'Observability', href: '/infrastructure/observability' },
      ]
    },
  ];

  let expandedCategories = { 'API Reference': true };

  function toggleCategory(category) {
    expandedCategories[category] = !expandedCategories[category];
  }
</script>

<aside class={`fixed md:static inset-0 z-30 transition-all duration-300 ${open ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
  <div class="w-64 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700 overflow-y-auto flex flex-col">
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-slate-700 sticky top-0 bg-slate-900/80 backdrop-blur">
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          GEONERA
        </span>
        <span class="text-xs text-slate-500 font-medium">DOCS</span>
      </div>
      <p class="text-xs text-slate-400 mt-2">AI-Driven Trading Intelligence</p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-6">
      {#each navigationItems as section (section.category)}
        <div>
          <button
            on:click={() => toggleCategory(section.category)}
            class="w-full text-left px-2 mb-3 flex items-center justify-between hover:text-slate-200 transition"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span class="text-base">{section.icon}</span>
              {section.category}
            </h3>
            <ChevronDown size={14} class={`transition ${expandedCategories[section.category] ? 'rotate-180' : ''}`} />
          </button>

          {#if expandedCategories[section.category]}
            <ul class="space-y-1 animate-in fade-in duration-200">
              {#each section.items as item (item.href)}
                <li>
                  <a
                    href={item.href}
                    class={`block px-3 py-2 rounded text-sm transition ${
                      $page.url.pathname === item.href
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
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
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500">
      <p>© 2026 Geonera</p>
      <p>v1.0.0 · Production Ready</p>
    </div>
  </div>

  <!-- Mobile Overlay -->
  {#if open}
    <div class="md:hidden absolute inset-0 z-20 bg-black/30" on:click={() => (open = false)} on:keydown />
  {/if}
</aside>
