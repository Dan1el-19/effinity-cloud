<script lang="ts">
	import { Users, Database, Crown, Sparkles, User } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 lg:text-3xl">Dashboard</h1>
		<p class="mt-1 text-gray-500">Przegląd systemu Effinity Cloud</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-blue-100 p-2">
					<Users class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-sm text-gray-500">Wszyscy użytkownicy</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.totalUsers}</p>
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-gray-100 p-2">
					<User class="h-5 w-5 text-gray-600" />
				</div>
				<div>
					<p class="text-sm text-gray-500">Basic</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.usersByRole.basic}</p>
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-purple-100 p-2">
					<Sparkles class="h-5 w-5 text-purple-600" />
				</div>
				<div>
					<p class="text-sm text-gray-500">Plus</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.usersByRole.plus}</p>
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-amber-100 p-2">
					<Crown class="h-5 w-5 text-amber-600" />
				</div>
				<div>
					<p class="text-sm text-gray-500">Admin</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.usersByRole.admin}</p>
				</div>
			</div>
		</div>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-green-100 p-2">
				<Database class="h-5 w-5 text-green-600" />
			</div>
			<div>
				<p class="text-sm text-gray-500">Całkowite zużycie storage</p>
				<p class="text-2xl font-bold text-gray-900">{formatFileSize(data.stats.totalStorage)}</p>
			</div>
		</div>
	</div>
</div>
