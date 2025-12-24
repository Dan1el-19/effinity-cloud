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

<div class="mx-auto max-w-4xl p-8 font-sans">
	<h1 class="mb-8 text-3xl font-bold text-gray-800">Effinity Cloud</h1>

	<section class="mb-12 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Upload File</h2>

		<div class="flex items-center gap-4">
			<input
				type="file"
				onchange={uploadFile}
				disabled={status === 'uploading'}
				class="block w-full cursor-pointer text-sm
          text-gray-500 file:mr-4 file:rounded-full
          file:border-0 file:bg-violet-50
          file:px-4 file:py-2
          file:text-sm file:font-semibold
          file:text-violet-700
          hover:file:bg-violet-100 disabled:opacity-50"
			/>

			{#if status === 'uploading'}
				<span class="animate-pulse text-blue-600">Uploading...</span>
			{:else if status === 'success'}
				<span class="text-green-600">✓ Uploaded!</span>
			{:else if status === 'error'}
				<span class="text-red-500">Error: {errorMessage}</span>
			{/if}
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Bucket Contents</h2>

		{#if data.error}
			<p class="rounded bg-red-50 p-4 text-red-500">{data.error}</p>
		{:else if data.files.length === 0}
			<p class="text-gray-500 italic">No files found in bucket.</p>
		{:else}
			<div class="overflow-x-auto">
				<table
					class="min-w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
				>
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Name (Key)</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Size</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Last Modified</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.files as file}
							<tr class="transition-colors hover:bg-gray-50">
								<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900"
									>{file.key}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
									>{(file.size / 1024).toFixed(2)} KB</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
									>{new Date(file.lastModified).toLocaleString()}</td
								>
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
