<script lang="ts">
	import { enhance } from '$app/forms';

	let { parentFolderId, onCancel } = $props();
</script>

<form
	method="POST"
	action="?/createFolder"
	class="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4"
	use:enhance={() => {
		return async ({ update }) => {
			await update();
			onCancel();
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
				placeholder="New Folder"
			/>
			<input type="hidden" name="parentFolderId" value={parentFolderId || ''} />
		</div>
		<button
			type="submit"
			class="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
		>
			Create
		</button>
	</div>
</form>
