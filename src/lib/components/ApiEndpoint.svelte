<script>
  export let method = 'GET';
  export let endpoint = '/';
  export let description = '';

  const methodStyles = {
    GET: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    POST: 'bg-green-500/20 text-green-300 border border-green-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-300 border border-red-500/30',
    PATCH: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  };

  const style = methodStyles[method] || methodStyles.GET;
</script>

<div class="my-6 space-y-3">
  <div class="flex items-baseline gap-3 flex-wrap">
    <span class={`px-3 py-1 rounded text-xs font-bold ${style}`}>
      {method}
    </span>
    <code class="text-xl font-mono text-slate-100 px-3 py-1 rounded" style="background-color: rgb(30, 41, 59);">
      {endpoint}
    </code>
  </div>
  {#if description}
    <p class="text-slate-300">{description}</p>
  {/if}
</div>
