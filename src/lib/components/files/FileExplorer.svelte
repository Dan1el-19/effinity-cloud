<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Folder, FileText, Download, Pencil, Trash2, FolderDown } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';

	let { files, folders } = $props();

	async function deleteFile(fileId: string, fileName: string) {
		if (!confirm(`Usunąć "${fileName}"?`)) return;

		try {
			const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
			if (res.ok) {
				toast.success(`Plik "${fileName}" został usunięty`);
				invalidateAll();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Nie udało się usunąć pliku');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function downloadFile(fileId: string, fileName: string) {
		try {
			const res = await fetch(`/api/files/${fileId}?download=true`);
			const data = await res.json();
			if (data.downloadUrl) {
				toast.info(`Pobieranie: ${fileName}`);
				window.location.href = data.downloadUrl;
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function renameFile(fileId: string, currentName: string) {
		const newName = prompt('Nowa nazwa:', currentName);
		if (!newName || newName === currentName) return;

		try {
			const res = await fetch(`/api/files/${fileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});
			if (res.ok) {
				toast.success(`Zmieniono nazwę na "${newName}"`);
				invalidateAll();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Nie udało się zmienić nazwy pliku');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function deleteFolder(folderId: string, folderName: string) {
		if (!confirm(`Usunąć folder "${folderName}" i całą jego zawartość?`)) return;

		try {
			const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
			if (res.ok) {
				toast.success(`Folder "${folderName}" został usunięty`);
				invalidateAll();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Nie udało się usunąć folderu');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function renameFolder(folderId: string, currentName: string) {
		const newName = prompt('Nowa nazwa folderu:', currentName);
		if (!newName || newName === currentName) return;

		try {
			const res = await fetch(`/api/folders/${folderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});
			if (res.ok) {
				toast.success(`Zmieniono nazwę folderu na "${newName}"`);
				invalidateAll();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Nie udało się zmienić nazwy folderu');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	function downloadFolder(folderId: string, folderName: string) {
		toast.info(`Pobieranie: ${folderName}.zip`);
		window.location.href = `/api/folders/${folderId}/download`;
	}
</script>

{#if files.length === 0 && folders.length === 0}
	<div class="py-12 text-center">
		<Folder class="mx-auto h-12 w-12 text-gray-300" />
		<p class="mt-2 text-gray-500">Ten folder jest pusty</p>
	</div>
{:else}
	<!-- Desktop: Table view -->
	<div class="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
		<table class="w-full">
			<thead class="border-b border-gray-200 bg-gray-50">
				<tr>
					<th class="w-10 px-6 py-3"></th>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nazwa</th>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rozmiar</th>
					<th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Akcje</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each folders as folder}
					<tr class="transition-colors hover:bg-gray-50">
						<td class="px-6 py-4 text-amber-500">
							<Folder class="h-5 w-5" />
						</td>
						<td class="px-6 py-4">
							<a href="?folder={folder.$id}" class="font-medium text-gray-900 hover:text-blue-600">
								{folder.name}
							</a>
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{new Date(folder.$createdAt).toLocaleDateString('pl-PL')}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{folder.size ? formatFileSize(folder.size) : '-'}
						</td>
						<td class="px-6 py-4 text-right">
							<button
								onclick={() => downloadFolder(folder.$id, folder.name)}
								class="mr-2 text-green-600 hover:text-green-800"
								title="Pobierz ZIP"
							>
								<FolderDown class="inline h-4 w-4" />
							</button>
							<button
								onclick={() => renameFolder(folder.$id, folder.name)}
								class="mr-2 text-blue-600 hover:text-blue-800"
								title="Zmień nazwę"
							>
								<Pencil class="inline h-4 w-4" />
							</button>
							<button
								onclick={() => deleteFolder(folder.$id, folder.name)}
								class="text-red-600 hover:text-red-800"
								title="Usuń"
							>
								<Trash2 class="inline h-4 w-4" />
							</button>
						</td>
					</tr>
				{/each}

				{#each files as file}
					<tr class="transition-colors hover:bg-gray-50">
						<td class="px-6 py-4 text-gray-400">
							<FileText class="h-5 w-5" />
						</td>
						<td class="px-6 py-4 font-medium text-gray-900">{file.name}</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{new Date(file.$createdAt).toLocaleDateString('pl-PL')}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{formatFileSize(file.size)}
						</td>
						<td class="px-6 py-4 text-right">
							<button
								onclick={() => downloadFile(file.$id, file.name)}
								class="mr-2 text-green-600 hover:text-green-800"
								title="Pobierz"
							>
								<Download class="inline h-4 w-4" />
							</button>
							<button
								onclick={() => renameFile(file.$id, file.name)}
								class="mr-2 text-blue-600 hover:text-blue-800"
								title="Zmień nazwę"
							>
								<Pencil class="inline h-4 w-4" />
							</button>
							<button
								onclick={() => deleteFile(file.$id, file.name)}
								class="text-red-600 hover:text-red-800"
								title="Usuń"
							>
								<Trash2 class="inline h-4 w-4" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Mobile: Card view -->
	<div class="space-y-2 lg:hidden">
		{#each folders as folder}
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<a href="?folder={folder.$id}" class="flex min-w-0 flex-1 items-center gap-3">
						<Folder class="h-5 w-5 shrink-0 text-amber-500" />
						<div class="min-w-0">
							<p class="truncate font-medium text-gray-900">{folder.name}</p>
							<p class="text-xs text-gray-500">
								{folder.size ? formatFileSize(folder.size) : 'Folder'}
							</p>
						</div>
					</a>
					<div class="ml-2 flex items-center gap-1">
						<button
							onclick={() => downloadFolder(folder.$id, folder.name)}
							class="p-2 text-green-600"
						>
							<FolderDown class="h-4 w-4" />
						</button>
						<button onclick={() => renameFolder(folder.$id, folder.name)} class="p-2 text-blue-600">
							<Pencil class="h-4 w-4" />
						</button>
						<button onclick={() => deleteFolder(folder.$id, folder.name)} class="p-2 text-red-600">
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		{/each}

		{#each files as file}
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<FileText class="h-5 w-5 shrink-0 text-gray-400" />
						<div class="min-w-0">
							<p class="truncate font-medium text-gray-900">{file.name}</p>
							<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
						</div>
					</div>
					<div class="ml-2 flex items-center gap-1">
						<button onclick={() => downloadFile(file.$id, file.name)} class="p-2 text-green-600">
							<Download class="h-4 w-4" />
						</button>
						<button onclick={() => renameFile(file.$id, file.name)} class="p-2 text-blue-600">
							<Pencil class="h-4 w-4" />
						</button>
						<button onclick={() => deleteFile(file.$id, file.name)} class="p-2 text-red-600">
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
