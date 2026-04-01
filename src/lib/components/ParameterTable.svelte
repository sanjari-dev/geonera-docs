<script>
  export let params = [];
</script>

<div class="overflow-x-auto mb-4">
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-slate-800 border border-slate-700">
        <th class="px-4 py-3 text-left font-semibold text-cyan-300">Parameter</th>
        <th class="px-4 py-3 text-left font-semibold text-cyan-300">Type</th>
        <th class="px-4 py-3 text-left font-semibold text-cyan-300">Default</th>
        <th class="px-4 py-3 text-left font-semibold text-cyan-300">Description</th>
      </tr>
    </thead>
    <tbody>
      {#each params as param (param.name)}
        <tr class="border border-slate-700 hover:bg-slate-900/50 transition">
          <td class="px-4 py-3 font-mono text-cyan-400">{param.name}</td>
          <td class="px-4 py-3">
            <span class="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">{param.type}</span>
          </td>
          <td class="px-4 py-3 font-mono text-emerald-400">{param.default || 'N/A'}</td>
          <td class="px-4 py-3 text-slate-300">{param.description}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
