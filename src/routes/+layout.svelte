<script>
  import '../styles/global.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';

  let sidebarOpen = true;
</script>

<div class="flex h-screen bg-slate-950 text-slate-100">
  <Sidebar bind:open={sidebarOpen} />

  <div class="flex-1 flex flex-col overflow-hidden">
    <Header bind:sidebarOpen />
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</div>

<style global>
  :global(html, body) {
    @apply m-0 p-0;
  }

  :global(*) {
    @apply box-border;
  }
</style>
