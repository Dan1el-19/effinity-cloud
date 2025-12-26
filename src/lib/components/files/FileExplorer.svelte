<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Folder, FileText, Download, Pencil, Trash2 } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { files, folders } = $props();

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

{#if files.length === 0 && folders.length === 0}
	<p class="text-gray-500 italic">This folder is empty.</p>
{:else}
	<div class="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
		<table class="min-w-full overflow-hidden">
			<thead class="bg-gray-50">
				<tr>
					<th class="w-10 px-6 py-3"></th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Name</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Date</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Size</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each folders as folder}
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
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
							>{folder.size ? formatFileSize(folder.size) : '-'}</td
						>
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

				{#each files as file}
					<tr class="group transition-colors hover:bg-gray-50">
						<td class="px-6 py-4 text-gray-400">
							<FileText class="h-5 w-5" />
						</td>
						<td class="px-6 py-4 text-sm font-medium text-gray-900">{file.name}</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500"
							>{new Date(file.$createdAt).toLocaleString()}</td
						>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{formatFileSize(file.size)}
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
