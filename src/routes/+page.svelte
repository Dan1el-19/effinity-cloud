<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let status = $state<'idle' | 'uploading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  async function uploadFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    status = 'uploading';
    errorMessage = '';

    try {
      const res = await fetch('/api/simple-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }
      
      const { uploadUrl } = data;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      status = 'success';
      target.value = '';
      
      await invalidateAll();
      
      setTimeout(() => {
        status = 'idle';
      }, 3000);

    } catch (err) {
      console.error(err);
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
    }
  }
</script>

<div class="p-8 max-w-4xl mx-auto font-sans">
  <h1 class="text-3xl font-bold mb-8 text-gray-800">Effinity Cloud</h1>

  <section class="mb-12 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
    <h2 class="text-xl font-semibold mb-4 text-gray-700">Upload File</h2>
    
    <div class="flex items-center gap-4">
      <input
        type="file"
        onchange={uploadFile}
        disabled={status === 'uploading'}
        class="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100
          cursor-pointer disabled:opacity-50"
      />
      
      {#if status === 'uploading'}
        <span class="text-blue-600 animate-pulse">Uploading...</span>
      {:else if status === 'success'}
        <span class="text-green-600">✓ Uploaded!</span>
      {:else if status === 'error'}
        <span class="text-red-500">Error: {errorMessage}</span>
      {/if}
    </div>
  </section>

  <section>
    <h2 class="text-xl font-semibold mb-4 text-gray-700">Bucket Contents</h2>
    
    {#if data.error}
      <p class="text-red-500 p-4 bg-red-50 rounded">{data.error}</p>
    {:else if data.files.length === 0}
      <p class="text-gray-500 italic">No files found in bucket.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name (Key)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each data.files as file}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.key}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.lastModified).toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>