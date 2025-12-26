<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		ExternalLink,
		Crown,
		Sparkles,
		User as UserIcon
	} from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { data } = $props();

	const STORAGE_LIMITS = {
		basic: 5 * 1024 * 1024 * 1024,
		plus: 10 * 1024 * 1024 * 1024,
		admin: Infinity
	};

	const roleConfig = {
		basic: { label: 'Basic', icon: UserIcon, bg: 'bg-gray-100', text: 'text-gray-700' },
		plus: { label: 'Plus', icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-700' },
		admin: { label: 'Admin', icon: Crown, bg: 'bg-amber-100', text: 'text-amber-700' }
	};

	function getStorageLimit(role: 'basic' | 'plus' | 'admin') {
		const limit = STORAGE_LIMITS[role];
		return limit === Infinity ? '∞' : formatFileSize(limit);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 lg:text-3xl">Użytkownicy</h1>
			<p class="mt-1 text-gray-500">Zarządzaj kontami użytkowników ({data.total})</p>
		</div>
	</div>

	<div class="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
		<table class="w-full">
			<thead class="border-b border-gray-200 bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
						>Data utworzenia</th
					>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rola</th>
					<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Storage</th>
					<th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Akcje</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.users as user}
					{@const config = roleConfig[user.role]}
					<tr class="transition-colors hover:bg-gray-50">
						<td class="px-6 py-4">
							<div>
								<p class="font-medium text-gray-900">{user.email}</p>
								{#if user.name}
									<p class="text-sm text-gray-500">{user.name}</p>
								{/if}
							</div>
						</td>
						<td class="px-6 py-4 text-sm text-gray-500">
							{new Date(user.$createdAt).toLocaleDateString('pl-PL')}
						</td>
						<td class="px-6 py-4">
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {config.bg} {config.text}"
							>
								<config.icon class="h-3.5 w-3.5" />
								{config.label}
							</span>
						</td>
						<td class="px-6 py-4 text-sm text-gray-500">
							{formatFileSize(user.storageUsage)} / {getStorageLimit(user.role)}
						</td>
						<td class="px-6 py-4 text-right">
							<a
								href="/admin/users/{user.$id}"
								class="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
							>
								Szczegóły
								<ExternalLink class="h-3.5 w-3.5" />
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="space-y-3 lg:hidden">
		{#each data.users as user}
			{@const config = roleConfig[user.role]}
			<a
				href="/admin/users/{user.$id}"
				class="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-gray-900">{user.email}</p>
						{#if user.name}
							<p class="truncate text-sm text-gray-500">{user.name}</p>
						{/if}
					</div>
					<span
						class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium {config.bg} {config.text}"
					>
						<config.icon class="h-3 w-3" />
						{config.label}
					</span>
				</div>
				<div class="mt-3 flex items-center justify-between text-sm text-gray-500">
					<span>{new Date(user.$createdAt).toLocaleDateString('pl-PL')}</span>
					<span>{formatFileSize(user.storageUsage)} / {getStorageLimit(user.role)}</span>
				</div>
			</a>
		{/each}
	</div>

	{#if data.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			<a
				href="?page={data.page - 1}"
				class="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50 {data.page <=
				1
					? 'pointer-events-none opacity-50'
					: ''}"
			>
				<ChevronLeft class="h-5 w-5" />
			</a>
			<span class="px-4 py-2 text-sm text-gray-700">
				Strona {data.page} z {data.totalPages}
			</span>
			<a
				href="?page={data.page + 1}"
				class="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 {data.page >= data.totalPages
					? 'pointer-events-none opacity-50'
					: ''}"
			>
				<ChevronRight class="h-5 w-5" />
			</a>
		</div>
	{/if}
</div>
