<script lang="ts">
	import { enhance } from '$app/forms';

	let { parentFolderId, onCancel } = $props();
</script>

<form
	method="POST"
	action="?/createFolder"
	class="rounded-xl border border-blue-200 bg-blue-50 p-4"
	use:enhance={() => {
		return async ({ update }) => {
			await update();
			onCancel();
		};
	}}
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="flex-1">
			<label for="folderName" class="mb-1 block text-sm font-medium text-gray-700">
				Nazwa folderu
			</label>
			<input
				type="text"
				name="folderName"
				id="folderName"
				required
				class="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
				placeholder="Nowy folder"
			/>
			<input type="hidden" name="parentFolderId" value={parentFolderId || ''} />
		</div>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={onCancel}
				class="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200 sm:flex-none"
			>
				Anuluj
			</button>
			<button
				type="submit"
				class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 sm:flex-none"
			>
				Utwórz
			</button>
		</div>
	</div>
</form>
