<script>
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import '../styles/global.css';
  import { fade } from 'svelte/transition';

  let sidebarOpen = false;

  $: if (typeof window !== 'undefined') {
    if (window.innerWidth < 768) {
      sidebarOpen = false;
    }
  }
</script>

<svelte:head>
  <title>Geonera Documentation</title>
</svelte:head>

<div class="flex h-screen bg-slate-950 text-slate-100">
  <Sidebar bind:open={sidebarOpen} />

  <div class="flex-1 flex flex-col overflow-hidden">
    <Header bind:sidebarOpen />

    <main class="flex-1 overflow-y-auto" in:fade={{ duration: 200 }}>
      <slot />
    </main>
  </div>
</div>

<style>
  :global(html, body) {
    overflow: hidden;
  }
</style>
