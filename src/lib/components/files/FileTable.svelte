<script lang="ts">
	import { Folder, File as FileIcon, Download, Pencil, Trash2 } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	type FileType = { $id: string; name: string; size: number; $createdAt: string };
	type FolderType = { $id: string; name: string; $createdAt: string; size?: number };

	let { files, folders, onDownload, onRename, onDelete, onNavigate } = $props<{
		files: FileType[];
		folders: FolderType[];
		onDownload: (id: string, name: string, isFolder: boolean) => void;
		onRename: (id: string, name: string, isFolder: boolean) => void;
		onDelete: (id: string, name: string, isFolder: boolean) => void;
		onNavigate: (id: string) => void;
	}>();

	// Helper for date formatting
	const formatDate = (date: string) =>
		new Date(date).toLocaleDateString('pl-PL', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
</script>

<div class="hidden overflow-hidden rounded-md border border-border-line bg-bg-panel lg:block">
	<table class="w-full text-left text-sm">
		<thead
			class="border-b border-border-line bg-gray-50/50 font-medium text-text-muted dark:bg-zinc-900/50"
		>
			<tr>
				<th class="w-10 px-4 py-3"></th>
				<th class="px-4 py-3 font-medium">Name</th>
				<th class="w-32 px-4 py-3 font-medium">Date</th>
				<th class="w-24 px-4 py-3 font-medium">Size</th>
				<th class="w-24 px-4 py-3 text-right font-medium">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border-line">
			{#if folders.length === 0 && files.length === 0}
				<tr>
					<td colspan="5" class="px-4 py-12 text-center text-text-muted"> Folder is empty </td>
				</tr>
			{/if}

			{#each folders as folder (folder.$id)}
				<tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50">
					<td class="px-4 py-2">
						<Folder class="h-4 w-4 fill-amber-500/20 text-amber-500" />
					</td>
					<td class="px-4 py-2">
						<button
							onclick={() => onNavigate(folder.$id)}
							class="w-full truncate text-left font-medium text-text-main hover:underline"
						>
							{folder.name}
						</button>
					</td>
					<td class="px-4 py-2 font-mono text-xs text-text-muted"
						>{formatDate(folder.$createdAt)}</td
					>
					<td class="px-4 py-2 font-mono text-xs text-text-muted">-</td>
					<td class="px-4 py-2 text-right">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => onDownload(folder.$id, folder.name, true)}
								class="p-1.5 text-text-muted hover:text-primary"
								title="Download"
							>
								<Download class="h-3.5 w-3.5" />
							</button>
							<button
								onclick={() => onRename(folder.$id, folder.name, true)}
								class="p-1.5 text-text-muted hover:text-text-main"
								title="Rename"
							>
								<Pencil class="h-3.5 w-3.5" />
							</button>
							<button
								onclick={() => onDelete(folder.$id, folder.name, true)}
								class="p-1.5 text-text-muted hover:text-red-600"
								title="Delete"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						</div>
					</td>
				</tr>
			{/each}

			{#each files as file (file.$id)}
				<tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50">
					<td class="px-4 py-2">
						<FileIcon class="h-4 w-4 text-primary opacity-70" />
					</td>
					<td class="max-w-[300px] truncate px-4 py-2 text-text-main" title={file.name}>
						{file.name}
					</td>
					<td class="px-4 py-2 font-mono text-xs text-text-muted">{formatDate(file.$createdAt)}</td>
					<td class="px-4 py-2 font-mono text-xs text-text-muted">{formatFileSize(file.size)}</td>
					<td class="px-4 py-2 text-right">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => onDownload(file.$id, file.name, false)}
								class="p-1.5 text-text-muted hover:text-primary"
								title="Download"
							>
								<Download class="h-3.5 w-3.5" />
							</button>
							<button
								onclick={() => onRename(file.$id, file.name, false)}
								class="p-1.5 text-text-muted hover:text-text-main"
								title="Rename"
							>
								<Pencil class="h-3.5 w-3.5" />
							</button>
							<button
								onclick={() => onDelete(file.$id, file.name, false)}
								class="p-1.5 text-text-muted hover:text-red-600"
								title="Delete"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
