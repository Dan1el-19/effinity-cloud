<script lang="ts">
	import { formatFileSize } from '$lib/utils/format';

	let { usage, limit, role } = $props();
</script>

<div class="mb-6">
	<div class="mb-1 flex justify-between text-sm">
		<span class="font-medium text-gray-700">Storage Usage</span>
		{#if role === 'admin'}
			<span class="text-gray-600">{formatFileSize(usage)}</span>
		{:else}
			<span class="text-gray-600"
				>{formatFileSize(usage)} / {limit === null ? 'Unlimited' : formatFileSize(limit)}</span
			>
		{/if}
	</div>
	{#if role !== 'admin'}
		<div class="h-2.5 w-full rounded-full bg-gray-200">
			<div
				class="h-2.5 rounded-full bg-blue-600 transition-all duration-500"
				style="width: {limit ? Math.min((usage / limit) * 100, 100) : 0}%"
			></div>
		</div>
	{/if}
</div>
