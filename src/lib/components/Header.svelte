<script>
  import { page } from '$app/stores';
  import { Menu, X, Github } from 'lucide-svelte';

  export let sidebarOpen = false;

  function getTitleFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';
    return segments
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
      .join(' • ');
  }
</script>

<header class="border-b border-slate-700 bg-slate-900/40 backdrop-blur sticky top-0 z-30 px-6 py-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button
        on:click={() => (sidebarOpen = !sidebarOpen)}
        class="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
        aria-label="Toggle sidebar"
      >
        {#if sidebarOpen}
          <X size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>
      <h1 class="text-lg font-semibold text-slate-100">{getTitleFromPath($page.url.pathname)}</h1>
    </div>

    <div class="flex items-center gap-4">
      <a
        href="https://github.com/geonera/geonera-docs"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition no-underline"
        aria-label="GitHub Repository"
      >
        <Github size={20} />
      </a>
    </div>
  </div>
</header>
