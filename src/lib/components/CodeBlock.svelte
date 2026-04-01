<script>
  import { Copy, Check } from 'lucide-svelte';

  export let code = '';
  export let language = 'bash';

  let copied = false;
  let copyTimeout;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 mb-4">
  <div class="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
    <span class="text-xs font-medium text-slate-400">{language}</span>
    <button
      on:click={copyToClipboard}
      class="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium text-slate-200 transition"
    >
      {#if copied}
        <Check size={14} />
        <span>Copied</span>
      {:else}
        <Copy size={14} />
        <span>Copy</span>
      {/if}
    </button>
  </div>
  <pre class="px-4 py-4 text-sm text-slate-200 overflow-x-auto"><code>{code}</code></pre>
</div>

<style>
  pre {
    margin: 0;
    font-family: 'Fira Code', monospace;
  }

  code {
    background: none;
    color: inherit;
    padding: 0;
  }
</style>
