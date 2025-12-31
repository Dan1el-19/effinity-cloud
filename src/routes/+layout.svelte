<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { Folder, Settings, Shield, LogOut, Menu, X } from 'lucide-svelte';

	let { children, data } = $props();
	let isDrawerOpen = $state(false);

	function toggleDrawer() {
		isDrawerOpen = !isDrawerOpen;
	}
	const allNavItems = [
		{ href: '/', label: 'Files', icon: Folder, roles: ['basic', 'plus', 'admin'] },
		{ href: '/main', label: 'Main Storage', icon: Shield, roles: ['plus', 'admin'] },
		{ href: '/admin', label: 'Admin', icon: Settings, roles: ['admin'] }
	];

	let navItems = $derived(
		allNavItems.filter((item) => data.role && item.roles.includes(data.role))
	);

	let currentPath = $derived(page.url.pathname);

	$effect(() => {
		currentPath;
		isDrawerOpen = false;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />
</svelte:head>

<Toaster position="top-right" richColors theme="system" />

{#if currentPath.startsWith('/login')}
	<!-- Login Layout (Minimal) -->
	<main class="min-h-dvh bg-bg-app">
		{@render children()}
	</main>
{:else}
	<div class="flex min-h-dvh flex-col lg:flex-row">
		<aside
			class="hidden w-[240px] shrink-0 flex-col border-r border-border-line bg-bg-panel lg:flex"
		>
			<div class="flex h-14 items-center border-b border-border-line px-6">
				<span class="font-mono text-sm font-bold tracking-tight text-primary">IO.EFFINITY</span>
			</div>

			<nav class="flex-1 space-y-1 p-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                           {currentPath === item.href
							? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
							: 'text-text-muted hover:bg-gray-50 hover:text-text-main dark:hover:bg-zinc-800'}"
					>
						<item.icon class="h-4 w-4" />
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="border-t border-border-line p-4">
				<form action="/logout" method="POST">
					<button
						type="submit"
						class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400"
					>
						<LogOut class="h-4 w-4" />
						Log out
					</button>
				</form>
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<header
				class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-line bg-bg-panel px-4 lg:hidden"
			>
				<span class="font-mono text-sm font-bold text-primary">IO.EFFINITY</span>
				<button
					onclick={toggleDrawer}
					class="rounded-md p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-zinc-800"
					aria-label="Toggle menu"
				>
					{#if isDrawerOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</header>

			{#if isDrawerOpen}
				<div
					class="fixed inset-0 z-20 mt-14 bg-bg-app/95 backdrop-blur-sm lg:hidden"
					onclick={() => (isDrawerOpen = false)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Escape' && (isDrawerOpen = false)}
				>
					<!-- Stop propagation here to prevent closing when clicking inside -->
					<nav class="space-y-2 p-4" onclick={(e) => e.stopPropagation()} role="presentation">
						{#each navItems as item}
							<a
								href={item.href}
								class="flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium
                                   {currentPath === item.href
									? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
									: 'text-text-main hover:bg-gray-50 dark:hover:bg-zinc-800'}"
							>
								<item.icon class="h-5 w-5" />
								{item.label}
							</a>
						{/each}
						<div class="my-4 border-t border-border-line"></div>
						<form action="/logout" method="POST">
							<button
								type="submit"
								class="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-base font-medium text-text-muted hover:text-red-600"
							>
								<LogOut class="h-5 w-5" />
								Log out
							</button>
						</form>
					</nav>
				</div>
			{/if}

			<main class="flex-1 overflow-y-auto p-4 lg:p-8">
				{@render children()}
			</main>

			<nav
				class="sticky bottom-0 z-30 flex h-16 w-full items-center justify-around border-t border-border-line bg-bg-panel px-2 lg:hidden"
			>
				{#each navItems as item}
					<a
						href={item.href}
						class="flex flex-col items-center justify-center gap-1 rounded-md p-2
                           {currentPath === item.href
							? 'text-primary'
							: 'text-text-muted hover:text-text-main'}"
					>
						<item.icon class="h-5 w-5" />
						<span class="text-[10px] font-medium">{item.label}</span>
					</a>
				{/each}
			</nav>
		</div>
	</div>
{/if}
