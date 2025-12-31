<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import FileList from './FileList.svelte';
	import FileTable from './FileTable.svelte';

	let { files, folders } = $props();

	// Logic Handlers

	async function onNavigate(id: string) {
		window.location.href = `?folder=${id}`;
	}

	async function onDownload(id: string, name: string, isFolder: boolean) {
		try {
			if (isFolder) {
				toast.info(`Preparing zip: ${name}.zip`);
				window.location.href = `/api/folders/${id}/download`;
			} else {
				const res = await fetch(`/api/files/${id}?download=true`);
				const data = await res.json();
				if (data.downloadUrl) {
					toast.info(`Downloading: ${name}`);
					window.location.href = data.downloadUrl;
				}
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function onDelete(id: string, name: string, isFolder: boolean) {
		if (!confirm(`Delete "${name}"?`)) return;
		try {
			const endpoint = isFolder ? `/api/folders/${id}` : `/api/files/${id}`;
			const res = await fetch(endpoint, { method: 'DELETE' });
			if (res.ok) {
				toast.success(`Deleted "${name}"`);
				invalidateAll();
			} else {
				toast.error('Failed to delete');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}

	async function onRename(id: string, name: string, isFolder: boolean) {
		const newName = prompt('New name:', name);
		if (!newName || newName === name) return;
		try {
			const endpoint = isFolder ? `/api/folders/${id}` : `/api/files/${id}`;
			const res = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});
			if (res.ok) {
				toast.success(`Renamed to "${newName}"`);
				invalidateAll();
			} else {
				toast.error('Failed to rename');
			}
		} catch (e: any) {
			toast.error(e.message);
		}
	}
</script>

<div class="mt-4">
	<!-- Desktop View -->
	<FileTable {files} {folders} {onDownload} {onDelete} {onRename} {onNavigate} />

	<!-- Mobile View -->
	<FileList {files} {folders} {onDownload} {onDelete} {onRename} {onNavigate} />
</div>
