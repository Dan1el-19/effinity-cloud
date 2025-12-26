<script lang="ts">
	import { page } from '$app/stores';
	import { Menu, X, Users, LayoutDashboard, ChevronRight, FolderOpen } from 'lucide-svelte';

	let { children, data } = $props();
	let sidebarOpen = $state(false);

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/users', label: 'Użytkownicy', icon: Users },
		{ href: '/', label: 'Mój Storage', icon: FolderOpen }
	];

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white lg:hidden">
		<div class="flex items-center justify-between px-4 py-3">
			<button onclick={() => (sidebarOpen = !sidebarOpen)} class="rounded-lg p-2 hover:bg-gray-100">
				{#if sidebarOpen}
					<X class="h-6 w-6" />
				{:else}
					<Menu class="h-6 w-6" />
				{/if}
			</button>
			<span class="font-semibold text-gray-900">Panel Admin</span>
			<div class="w-10"></div>
		</div>
	</header>

	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-40 bg-black/50 lg:hidden"
			onclick={closeSidebar}
			onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
			role="button"
			tabindex="0"
		></div>
	{/if}

	<aside
		class="fixed top-0 left-0 z-50 h-full w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
				<span class="text-sm font-bold text-white">A</span>
			</div>
			<span class="font-semibold text-gray-900">Panel Admin</span>
		</div>

		<nav class="space-y-1 p-4">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.href}
				<a
					href={item.href}
					onclick={closeSidebar}
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors {isActive
						? 'bg-indigo-50 text-indigo-700'
						: 'text-gray-700 hover:bg-gray-100'}"
				>
					<item.icon class="h-5 w-5" />
					<span class="font-medium">{item.label}</span>
					{#if isActive}
						<ChevronRight class="ml-auto h-4 w-4" />
					{/if}
				</a>
			{/each}
		</nav>

		<div class="absolute right-0 bottom-0 left-0 border-t border-gray-200 p-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
					<span class="text-sm font-medium text-gray-600">
						{data.user?.name?.charAt(0) || 'A'}
					</span>
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-gray-900">{data.user?.name || 'Admin'}</p>
					<p class="truncate text-xs text-gray-500">{data.user?.email}</p>
				</div>
			</div>
		</div>
	</aside>

	<main class="pt-16 lg:pt-0 lg:pl-64">
		<div class="p-4 lg:p-8">
			{@render children()}
		</div>
	</main>
</div>
