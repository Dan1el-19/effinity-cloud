<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import UppyUploader from '$lib/components/UppyUploader.svelte';

	let { data } = $props();
	let uploadStatus = $state<'idle' | 'success' | 'error'>('idle');
	let statusMessage = $state('');

	function handleUploadComplete(result: { key: string; location?: string }) {
		uploadStatus = 'success';
		statusMessage = `Uploaded: ${result.key}`;
		invalidateAll();

		setTimeout(() => {
			uploadStatus = 'idle';
			statusMessage = '';
		}, 3000);
	}

	function handleUploadError(error: Error) {
		uploadStatus = 'error';
		statusMessage = error.message;
	}
</script>

<div class="mx-auto max-w-4xl p-8 font-sans">
	<h1 class="mb-8 text-3xl font-bold text-gray-800">Effinity Cloud</h1>

	<section class="mb-12 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Upload Files</h2>

		<UppyUploader onUploadComplete={handleUploadComplete} onUploadError={handleUploadError} />

		{#if uploadStatus === 'success'}
			<p class="mt-4 text-green-600">✓ {statusMessage}</p>
		{:else if uploadStatus === 'error'}
			<p class="mt-4 text-red-500">Error: {statusMessage}</p>
		{/if}
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
