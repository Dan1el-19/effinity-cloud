<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import { LogOut, Menu, X } from 'lucide-svelte';
	import FileExplorer from '$lib/components/files/FileExplorer.svelte';
	import CreateFolder from '$lib/components/files/CreateFolder.svelte';

	let { data } = $props();
	let uploadStatus = $state<'idle' | 'success' | 'error'>('idle');
	let statusMessage = $state('');
	let showCreateFolder = $state(false);
	let mobileMenuOpen = $state(false);

	async function handleUploadComplete(result: {
		key: string;
		location?: string;
		name: string;
		size: number;
		type: string;
	}) {
		statusMessage = `Przetwarzanie: ${result.name}...`;

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
				statusMessage = `Przesłano: ${result.name}`;
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

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
		<div class="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div class="min-w-0">
					<h1 class="truncate text-xl font-bold text-gray-900 sm:text-2xl">Effinity Cloud</h1>
					<div class="flex items-center gap-2">
						<span
							class="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 uppercase"
						>
							Shared
						</span>
						<span class="hidden text-sm text-gray-500 sm:inline">Main Storage</span>
					</div>
				</div>

				<!-- Desktop navigation -->
				<div class="hidden items-center gap-3 md:flex">
					{#if data.role === 'admin'}
						<a
							href="/admin"
							class="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-100"
						>
							Panel Admin
						</a>
					{/if}
					<a
						href="/"
						class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
					>
						← My Storage
					</a>
					<button
						onclick={() => (showCreateFolder = !showCreateFolder)}
						class="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
					>
						{showCreateFolder ? 'Anuluj' : 'Nowy folder'}
					</button>
					<form method="POST" action="/logout">
						<button
							type="submit"
							class="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
						>
							<LogOut class="h-4 w-4" />
							<span class="hidden lg:inline">Wyloguj</span>
						</button>
					</form>
				</div>

				<!-- Mobile menu button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="rounded-lg p-2 hover:bg-gray-100 md:hidden"
				>
					{#if mobileMenuOpen}
						<X class="h-6 w-6" />
					{:else}
						<Menu class="h-6 w-6" />
					{/if}
				</button>
			</div>

			<!-- Mobile navigation -->
			{#if mobileMenuOpen}
				<div class="mt-3 space-y-2 border-t border-gray-200 pt-3 md:hidden">
					{#if data.role === 'admin'}
						<a
							href="/admin"
							class="block rounded-lg bg-amber-50 px-4 py-2 text-center font-medium text-amber-600"
						>
							Panel Admin
						</a>
					{/if}
					<a
						href="/"
						class="block rounded-lg bg-gray-100 px-4 py-2 text-center font-medium text-gray-700"
					>
						← My Storage
					</a>
					<button
						onclick={() => {
							showCreateFolder = !showCreateFolder;
							mobileMenuOpen = false;
						}}
						class="w-full rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700"
					>
						{showCreateFolder ? 'Anuluj' : 'Nowy folder'}
					</button>
					<form method="POST" action="/logout" class="w-full">
						<button
							type="submit"
							class="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600"
						>
							<LogOut class="h-4 w-4" />
							Wyloguj
						</button>
					</form>
				</div>
			{/if}
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
		<!-- Create folder form -->
		{#if showCreateFolder}
			<div class="mb-6">
				<CreateFolder
					parentFolderId={data.currentFolderId}
					onCancel={() => (showCreateFolder = false)}
				/>
			</div>
		{/if}

		<!-- Upload section -->
		<section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Prześlij pliki</h2>
			<UppyUploader onUploadComplete={handleUploadComplete} onUploadError={handleUploadError} />

			{#if uploadStatus === 'success'}
				<p class="mt-4 text-green-600">✓ {statusMessage}</p>
			{:else if uploadStatus === 'error'}
				<p class="mt-4 text-red-500">Błąd: {statusMessage}</p>
			{/if}
		</section>

		<!-- Files section -->
		<section>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Pliki i foldery</h2>
				{#if data.currentFolderId}
					<a href="/main" class="text-sm text-blue-600 hover:underline">← Powrót do głównego</a>
				{/if}
			</div>

			{#if data.error}
				<div class="rounded-lg bg-red-50 p-4 text-red-500">{data.error}</div>
			{:else}
				<FileExplorer files={data.files} folders={data.folders} />
			{/if}
		</section>
	</main>
</div>
