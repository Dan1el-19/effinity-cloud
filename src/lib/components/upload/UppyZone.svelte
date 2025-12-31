<script lang="ts">
	import type { UppyState } from '$lib/modules/upload.svelte';
	import { CloudUpload, X, File as FileIcon } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { uppyState }: { uppyState: UppyState } = $props();

	let isDragging = $state(false);

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			Array.from(e.dataTransfer.files).forEach((file) => {
				uppyState.addFile(file);
			});
		}
	}

	function onFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			Array.from(input.files).forEach((file) => {
				uppyState.addFile(file);
			});
			input.value = '';
		}
	}
</script>

<div class="space-y-4">
	<!-- Drop Zone -->
	<div
		role="button"
		tabindex="0"
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		onclick={() => document.getElementById('file-input')?.click()}
		onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
		class="relative flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors
               {isDragging
			? 'border-primary bg-blue-50/50 dark:bg-blue-900/10'
			: 'border-border-line hover:border-gray-400 dark:hover:border-zinc-600'}
               cursor-pointer"
	>
		<input type="file" multiple class="hidden" id="file-input" onchange={onFileSelect} />
		<div class="rounded-full border border-border-line bg-bg-panel p-3">
			<CloudUpload class="h-6 w-6 text-primary" />
		</div>
		<p class="mt-3 text-sm font-medium text-text-main">
			Drop files here or <span class="text-primary hover:underline">browse</span>
		</p>
		<p class="mt-1 text-xs text-text-muted">Any file type</p>
	</div>

	<!-- File List & Progress -->
	{#if uppyState.files.length > 0}
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-medium tracking-wider text-text-muted uppercase">Uploads</h3>
				<span class="font-mono text-xs text-text-muted">{uppyState.files.length} Item(s)</span>
			</div>
			{#each uppyState.files as file (file.id)}
				<div
					class="group relative flex items-center gap-3 rounded-md border border-border-line bg-bg-panel p-3"
				>
					<!-- Icon -->
					<div class="shrink-0 text-text-muted">
						<FileIcon class="h-5 w-5" />
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<div class="mb-1 flex items-center justify-between">
							<p class="truncate text-sm font-medium text-text-main">{file.name}</p>
							<span class="font-mono text-xs text-text-muted">{formatFileSize(file.size)}</span>
						</div>

						<!-- Progress Bar -->
						<div class="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
							<div
								class="h-full bg-primary transition-all duration-300"
								style="width: {file.progress?.percentage ?? 0}%"
							></div>
						</div>

						<!-- Status Text -->
						<div class="mt-1 flex justify-between">
							<span class="text-[10px] text-text-muted uppercase">
								{#if file.error}
									<span class="text-red-500">Error</span>
								{:else if file.progress?.uploadComplete}
									<span class="text-green-600">Complete</span>
								{:else}
									{Math.round(file.progress?.percentage ?? 0)}%
								{/if}
							</span>
						</div>
					</div>

					<!-- Actions -->
					<button
						class="p-1 text-text-muted hover:text-red-500"
						onclick={(e) => {
							e.stopPropagation();
							uppyState.uppy.removeFile(file.id);
						}}
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
