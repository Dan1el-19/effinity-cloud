<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import { Folder, FileText, Download, Pencil, Trash2 } from 'lucide-svelte';

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
				throw new Error('Failed to save file metadata');
			}
		} catch (e: any) {
			handleUploadError(e);
		}
	}

	function handleUploadError(error: Error) {
		uploadStatus = 'error';
		statusMessage = error.message;
	}

	async function deleteFile(fileId: string, fileName: string) {
		if (!confirm(`Delete "${fileName}"?`)) return;

		try {
			const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
			if (res.ok) {
				invalidateAll();
			} else {
				const data = await res.json();
				alert(data.error || 'Failed to delete file');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function downloadFile(fileId: string) {
		try {
			const res = await fetch(`/api/files/${fileId}?download=true`);
			const data = await res.json();
			if (data.downloadUrl) {
				const a = document.createElement('a');
				a.href = data.downloadUrl;
				a.download = data.name || 'download';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function renameFile(fileId: string, currentName: string) {
		const newName = prompt('New name:', currentName);
		if (!newName || newName === currentName) return;

		try {
			const res = await fetch(`/api/files/${fileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});
			if (res.ok) {
				invalidateAll();
			} else {
				const data = await res.json();
				alert(data.error || 'Failed to rename file');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function deleteFolder(folderId: string, folderName: string) {
		if (!confirm(`Delete folder "${folderName}" and all its contents?`)) return;

		try {
			const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
			if (res.ok) {
				invalidateAll();
			} else {
				const data = await res.json();
				alert(data.error || 'Failed to delete folder');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function renameFolder(folderId: string, currentName: string) {
		const newName = prompt('New folder name:', currentName);
		if (!newName || newName === currentName) return;

		try {
			const res = await fetch(`/api/folders/${folderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});
			if (res.ok) {
				invalidateAll();
			} else {
				const data = await res.json();
				alert(data.error || 'Failed to rename folder');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}
</script>

<div class="mx-auto max-w-6xl p-8 font-sans">
	<header class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Effinity Cloud</h1>
			<p class="text-gray-500">Virtual File System</p>
		</div>
		<div class="flex gap-4">
			<button
				onclick={() => (showCreateFolder = !showCreateFolder)}
				class="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
			>
				{showCreateFolder ? 'Cancel' : 'New Folder'}
			</button>
		</div>
	</header>

	<section class="mb-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		{#if showCreateFolder}
			<form
				method="POST"
				action="?/createFolder"
				class="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showCreateFolder = false;
					};
				}}
			>
				<div class="flex items-end gap-4">
					<div class="grow">
						<label for="folderName" class="mb-1 block text-sm font-medium text-gray-700"
							>Folder Name</label
						>
						<input
							type="text"
							name="folderName"
							id="folderName"
							required
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="My Documents"
						/>
						<input type="hidden" name="parentFolderId" value={data.currentFolderId || ''} />
					</div>
					<button
						type="submit"
						class="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
					>
						Create
					</button>
				</div>
			</form>
		{/if}

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
		{:else if data.files.length === 0 && data.folders.length === 0}
			<p class="text-gray-500 italic">This folder is empty.</p>
		{:else}
			<div class="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
				<table class="min-w-full overflow-hidden">
					<thead class="bg-gray-50">
						<tr>
							<th class="w-10 px-6 py-3"></th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Date</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Size</th
							>
							<th
								class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.folders as folder}
							<tr class="group transition-colors hover:bg-gray-50">
								<td class="px-6 py-4 text-amber-500">
									<Folder class="h-5 w-5" />
								</td>
								<td class="px-6 py-4 text-sm font-medium text-gray-900">
									<a href="?folder={folder.$id}" class="block w-full hover:text-blue-600">
										{folder.name}
									</a>
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
									>{new Date(folder.$createdAt).toLocaleDateString()}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">-</td>
								<td class="px-6 py-4 text-right">
									<button
										onclick={() => renameFolder(folder.$id, folder.name)}
										class="mr-2 text-blue-600 hover:text-blue-800"
										title="Rename"
									>
										<Pencil class="inline h-4 w-4" />
									</button>
									<button
										onclick={() => deleteFolder(folder.$id, folder.name)}
										class="text-red-600 hover:text-red-800"
										title="Delete"
									>
										<Trash2 class="inline h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}

						{#each data.files as file}
							<tr class="group transition-colors hover:bg-gray-50">
								<td class="px-6 py-4 text-gray-400">
									<FileText class="h-5 w-5" />
								</td>
								<td class="px-6 py-4 text-sm font-medium text-gray-900">{file.name}</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
									>{new Date(file.$createdAt).toLocaleString()}</td
								>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{(file.size / 1024).toFixed(2)} KB
								</td>
								<td class="px-6 py-4 text-right">
									<button
										onclick={() => downloadFile(file.$id)}
										class="mr-2 text-green-600 hover:text-green-800"
										title="Download"
									>
										<Download class="inline h-4 w-4" />
									</button>
									<button
										onclick={() => renameFile(file.$id, file.name)}
										class="mr-2 text-blue-600 hover:text-blue-800"
										title="Rename"
									>
										<Pencil class="inline h-4 w-4" />
									</button>
									<button
										onclick={() => deleteFile(file.$id, file.name)}
										class="text-red-600 hover:text-red-800"
										title="Delete"
									>
										<Trash2 class="inline h-4 w-4" />
									</button>
								</td>
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
