<script>
  import { Menu, X } from 'lucide-svelte';

  export let sidebarOpen = true;
</script>

<header class="border-b border-slate-700 bg-slate-900/40 backdrop-blur px-6 py-4 sticky top-0 z-20">
  <div class="flex items-center justify-between max-w-7xl mx-auto">
    <div class="flex items-center gap-4">
      <button
        on:click={() => (sidebarOpen = !sidebarOpen)}
        class="md:hidden p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
      >
        {#if sidebarOpen}
          <X size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>
      <h1 class="text-xl font-bold">Geonera Documentation</h1>
    </div>
  </div>
</header>
