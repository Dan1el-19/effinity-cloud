<script lang="ts">
	import { type Snippet } from 'svelte';

	type Props = {
		title?: string;
		description?: string;
		class?: string;
		children?: Snippet;
		footer?: Snippet;
	};

	let { title, description, class: className = '', children, footer }: Props = $props();
</script>

<div
	class="card-technical overflow-hidden rounded-md border border-border-line bg-bg-panel transition-colors hover:border-gray-300 dark:hover:border-zinc-700 {className}"
>
	{#if title}
		<div class="border-b border-border-line/50 px-6 py-4">
			<h3 class="text-sm leading-none font-semibold tracking-tight text-text-main">{title}</h3>
			{#if description}
				<p class="mt-1.5 text-xs text-text-muted">{description}</p>
			{/if}
		</div>
	{/if}

	<div class="p-6">
		{@render children?.()}
	</div>

	{#if footer}
		<div class="flex items-center p-6 pt-0">
			{@render footer()}
		</div>
	{/if}
</div>
