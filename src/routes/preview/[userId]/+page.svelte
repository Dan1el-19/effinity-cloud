<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { Folder, FileText, Download, Trash2, ArrowLeft, FolderDown, Home } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { data } = $props();
	let toastMessage = $state('');

	function showToast(message: string) {
		toastMessage = message;
		setTimeout(() => (toastMessage = ''), 3000);
	}

	async function deleteFile(fileId: string, fileName: string) {
		if (!confirm(`Usunąć "${fileName}"?`)) return;

		try {
			const res = await fetch(`/api/files/${fileId}?targetUserId=${data.targetUser.$id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				invalidateAll();
				showToast(`Usunięto: ${fileName}`);
			} else {
				const result = await res.json();
				alert(result.error || 'Błąd usuwania');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function downloadFile(fileId: string, fileName: string) {
		try {
			const res = await fetch(
				`/api/files/${fileId}?download=true&targetUserId=${data.targetUser.$id}`
			);
			const result = await res.json();
			if (result.downloadUrl) {
				showToast(`Pobieranie: ${fileName}`);
				window.location.href = result.downloadUrl;
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function deleteFolder(folderId: string, folderName: string) {
		if (!confirm(`Usunąć folder "${folderName}" i całą jego zawartość?`)) return;

		try {
			const res = await fetch(`/api/folders/${folderId}?targetUserId=${data.targetUser.$id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				invalidateAll();
				showToast(`Usunięto: ${folderName}`);
			} else {
				const result = await res.json();
				alert(result.error || 'Błąd usuwania');
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	function downloadFolder(folderId: string, folderName: string) {
		showToast(`Pobieranie: ${folderName}.zip`);
		window.location.href = `/api/folders/${folderId}/download?targetUserId=${data.targetUser.$id}`;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
		<div class="mx-auto max-w-6xl px-4 py-3 sm:px-6">
			<div class="flex items-center gap-4">
				<a
					href="/admin/users/{data.targetUser.$id}"
					class="rounded-lg p-2 hover:bg-gray-100"
					title="Powrót"
				>
					<ArrowLeft class="h-5 w-5" />
				</a>
				<div class="min-w-0">
					<h1 class="truncate text-lg font-bold text-gray-900 sm:text-xl">
						Magazyn: {data.targetUser.name || data.targetUser.email}
					</h1>
					<p class="text-sm text-gray-500">Podgląd administratora</p>
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
		<!-- Breadcrumbs -->
		{#if data.breadcrumbs.length > 1}
			<nav class="mb-4 flex flex-wrap items-center gap-2 text-sm">
				{#each data.breadcrumbs as crumb, i}
					{#if i > 0}
						<span class="text-gray-400">/</span>
					{/if}
					{#if i === data.breadcrumbs.length - 1}
						<span class="font-medium text-gray-900">{crumb.name}</span>
					{:else if crumb.id === null}
						<a
							href="/preview/{data.targetUser.$id}"
							class="flex items-center gap-1 text-blue-600 hover:underline"
						>
							<Home class="h-4 w-4" />
							<span class="hidden sm:inline">{crumb.name}</span>
						</a>
					{:else}
						<a
							href="/preview/{data.targetUser.$id}?folder={crumb.id}"
							class="text-blue-600 hover:underline"
						>
							{crumb.name}
						</a>
					{/if}
				{/each}
			</nav>
		{/if}

		{#if data.files.length === 0 && data.folders.length === 0}
			<div class="py-12 text-center">
				<Folder class="mx-auto h-12 w-12 text-gray-300" />
				<p class="mt-2 text-gray-500">Ten folder jest pusty</p>
			</div>
		{:else}
			<!-- Desktop: Table view -->
			<div
				class="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block"
			>
				<table class="w-full">
					<thead class="border-b border-gray-200 bg-gray-50">
						<tr>
							<th class="w-10 px-6 py-3"></th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
								>Nazwa</th
							>
							<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th
							>
							<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
								>Rozmiar</th
							>
							<th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase"
								>Akcje</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.folders as folder}
							<tr class="transition-colors hover:bg-gray-50">
								<td class="px-6 py-4 text-amber-500">
									<Folder class="h-5 w-5" />
								</td>
								<td class="px-6 py-4">
									<a
										href="/preview/{data.targetUser.$id}?folder={folder.$id}"
										class="font-medium text-gray-900 hover:text-blue-600"
									>
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
										onclick={() => deleteFolder(folder.$id, folder.name)}
										class="text-red-600 hover:text-red-800"
										title="Usuń"
									>
										<Trash2 class="inline h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}

						{#each data.files as file}
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
				{#each data.folders as folder}
					<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<a
								href="/preview/{data.targetUser.$id}?folder={folder.$id}"
								class="flex min-w-0 flex-1 items-center gap-3"
							>
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
								<button
									onclick={() => deleteFolder(folder.$id, folder.name)}
									class="p-2 text-red-600"
								>
									<Trash2 class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				{/each}

				{#each data.files as file}
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
								<button
									onclick={() => downloadFile(file.$id, file.name)}
									class="p-2 text-green-600"
								>
									<Download class="h-4 w-4" />
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
	</main>
</div>

{#if toastMessage}
	<div class="fixed right-4 bottom-4 rounded-lg bg-gray-800 px-4 py-3 text-white shadow-lg">
		{toastMessage}
	</div>
{/if}
