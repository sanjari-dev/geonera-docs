<script>
  export let params = [];
  export let title = 'Parameters';
</script>

<div class="my-6 space-y-3">
  <h4 class="text-lg font-semibold text-cyan-300">{title}</h4>
  <div class="overflow-x-auto rounded-lg border border-slate-700">
    <table class="w-full text-sm" style="margin: 0;">
      <thead>
        <tr class="bg-slate-800 border-b border-slate-700">
          <th class="px-4 py-3 text-left font-semibold text-cyan-300" style="border: none;">Parameter</th>
          <th class="px-4 py-3 text-left font-semibold text-cyan-300" style="border: none;">Type</th>
          <th class="px-4 py-3 text-left font-semibold text-cyan-300" style="border: none;">Default</th>
          <th class="px-4 py-3 text-left font-semibold text-cyan-300" style="border: none;">Description</th>
        </tr>
      </thead>
      <tbody>
        {#each params as param (param.name)}
          <tr class="border-b border-slate-700 hover:bg-slate-900/50 transition">
            <td class="px-4 py-3" style="border: none;">
              <code class="font-mono text-cyan-400">{param.name}</code>
            </td>
            <td class="px-4 py-3" style="border: none;">
              <span class="inline-block bg-slate-700 px-2 py-1 rounded text-xs text-slate-300 font-mono">
                {param.type}
              </span>
            </td>
            <td class="px-4 py-3" style="border: none;">
              {#if param.default}
                <code class="font-mono text-emerald-400">{param.default}</code>
              {:else}
                <span class="text-slate-500">-</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-slate-300" style="border: none;">{param.description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
