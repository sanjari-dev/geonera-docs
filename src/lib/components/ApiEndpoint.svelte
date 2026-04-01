<script>
  export let method = 'GET';
  export let endpoint = '/';
  export let title = 'Endpoint';

  const methodColors = {
    GET: 'bg-blue-500/20 text-blue-300',
    POST: 'bg-green-500/20 text-green-300',
    PUT: 'bg-yellow-500/20 text-yellow-300',
    DELETE: 'bg-red-500/20 text-red-300',
    PATCH: 'bg-orange-500/20 text-orange-300',
  };
</script>

<div class="mb-8">
  <div class="mb-4">
    <div class={`inline-block ${methodColors[method] || 'bg-slate-500/20 text-slate-300'} px-3 py-1 rounded text-xs font-bold mb-3`}>
      {method}
    </div>
    <h3 class="text-2xl font-bold mb-2 font-mono">{endpoint}</h3>
    <p class="text-slate-400">{title}</p>
  </div>
</div>

<style>
  :global(h3) {
    color: #e2e8f0;
  }
</style>
