<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import { LogOut } from 'lucide-svelte';
	import FileExplorer from '$lib/components/files/FileExplorer.svelte';
	import CreateFolder from '$lib/components/files/CreateFolder.svelte';
	import StorageUsage from '$lib/components/files/StorageUsage.svelte';

	let { data } = $props();
	let uploadStatus = $state<'idle' | 'success' | 'error'>('idle');
	let statusMessage = $state('');
	let showCreateFolder = $state(false);

	async function handleUploadComplete(result: {
		key: string;
		location?: string;
		name: string;
		size: number;
		type: string;
	}) {
		statusMessage = `Processing: ${result.name}...`;

		const formData = new FormData();
		formData.append('name', result.name);
		formData.append('size', result.size.toString());
		formData.append('mimeType', result.type);
		formData.append('r2Key', result.key);
		if (data.currentFolderId) {
			formData.append('parentFolderId', data.currentFolderId);
		}

		try {
			const response = await fetch('?/createFile', {
				method: 'POST',
				body: formData
			});
			const resultAction = await response.json();

			if (resultAction.type === 'success' || resultAction.status === 200 || response.ok) {
				uploadStatus = 'success';
				statusMessage = `Uploaded: ${result.name}`;
				invalidateAll();

				setTimeout(() => {
					uploadStatus = 'idle';
					statusMessage = '';
				}, 3000);
			} else {
				const errorMsg =
					resultAction?.data?.error || resultAction?.error || 'Failed to save file metadata';
				throw new Error(errorMsg);
			}
		} catch (e: any) {
			handleUploadError(e);
		}
	}

	function handleUploadError(error: Error) {
		uploadStatus = 'error';
		statusMessage = error.message;
	}
</script>

<div class="mx-auto max-w-6xl p-8 font-sans">
	<header class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Effinity Cloud</h1>
			<p class="text-gray-500">
				Virtual File System <span
					class="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 uppercase"
					>{data.role}</span
				>
			</p>
		</div>
		<div class="flex gap-4">
			{#if data.role === 'admin'}
				<a
					href="/admin"
					class="flex items-center rounded-lg bg-amber-50 px-4 py-2 font-medium text-amber-600 transition hover:bg-amber-100"
				>
					Panel Admin
				</a>
			{/if}
			{#if data.role !== 'basic'}
				<a
					href="/main"
					class="flex items-center rounded-lg bg-indigo-50 px-4 py-2 font-medium text-indigo-600 transition hover:bg-indigo-100"
				>
					Main Storage
				</a>
			{/if}
			<button
				onclick={() => (showCreateFolder = !showCreateFolder)}
				class="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
			>
				{showCreateFolder ? 'Cancel' : 'New Folder'}
			</button>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
				>
					<LogOut class="h-4 w-4" />
					Logout
				</button>
			</form>
		</div>
	</header>

	<section class="mb-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		{#if showCreateFolder}
			<CreateFolder
				parentFolderId={data.currentFolderId}
				onCancel={() => (showCreateFolder = false)}
			/>
		{/if}

		<StorageUsage usage={data.usage} limit={data.limit} role={data.role} />

		<h2 class="mb-4 text-xl font-semibold text-gray-700">Upload Files</h2>
		<UppyUploader onUploadComplete={handleUploadComplete} onUploadError={handleUploadError} />

		{#if uploadStatus === 'success'}
			<p class="mt-4 text-green-600">✓ {statusMessage}</p>
		{:else if uploadStatus === 'error'}
			<p class="mt-4 text-red-500">Error: {statusMessage}</p>
		{/if}
	</section>

	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-700">Files & Folders</h2>
			{#if data.currentFolderId}
				<a href="?" class="text-blue-600 hover:underline">← Back to Root</a>
			{/if}
		</div>

		{#if data.error}
			<p class="rounded bg-red-50 p-4 text-red-500">{data.error}</p>
		{:else}
			<FileExplorer files={data.files} folders={data.folders} />
		{/if}
	</section>
</div>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
