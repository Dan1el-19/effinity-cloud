<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		ArrowLeft,
		Crown,
		Sparkles,
		User as UserIcon,
		Key,
		RefreshCw,
		FolderOpen,
		Save
	} from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { data } = $props();

	let selectedRole = $state(data.targetUser.role as 'basic' | 'plus' | 'admin');
	let customLimit = $state(
		data.targetUser.customLimit ? (data.targetUser.customLimit / 1024 / 1024 / 1024).toString() : ''
	);
	let newPassword = $state('');
	let saving = $state(false);
	let message = $state('');

	function generatePassword() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
		let password = '';
		for (let i = 0; i < 15; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		newPassword = password;
	}

	async function saveRole() {
		saving = true;
		try {
			const res = await fetch(`/api/admin/users/${data.targetUser.$id}/role`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: selectedRole })
			});
			if (res.ok) {
				message = 'Rola zapisana!';
				invalidateAll();
			} else {
				const err = await res.json();
				message = err.error || 'Błąd zapisu';
			}
		} catch (e: any) {
			message = e.message;
		}
		saving = false;
		setTimeout(() => (message = ''), 3000);
	}

	async function saveStorageLimit() {
		saving = true;
		try {
			const limitBytes = customLimit ? parseFloat(customLimit) * 1024 * 1024 * 1024 : null;
			const res = await fetch(`/api/admin/users/${data.targetUser.$id}/storage-limit`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: limitBytes })
			});
			if (res.ok) {
				message = 'Limit zapisany!';
				invalidateAll();
			} else {
				const err = await res.json();
				message = err.error || 'Błąd zapisu';
			}
		} catch (e: any) {
			message = e.message;
		}
		saving = false;
		setTimeout(() => (message = ''), 3000);
	}

	async function savePassword() {
		if (newPassword.length < 8) {
			message = 'Hasło musi mieć min. 8 znaków';
			setTimeout(() => (message = ''), 3000);
			return;
		}
		saving = true;
		try {
			const res = await fetch(`/api/admin/users/${data.targetUser.$id}/password`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: newPassword })
			});
			if (res.ok) {
				message = 'Hasło zmienione!';
				newPassword = '';
			} else {
				const err = await res.json();
				message = err.error || 'Błąd zapisu';
			}
		} catch (e: any) {
			message = e.message;
		}
		saving = false;
		setTimeout(() => (message = ''), 3000);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a
			href="/admin/users"
			class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-xl font-bold text-gray-900 lg:text-2xl">{data.targetUser.email}</h1>
			<p class="text-sm text-gray-500">
				Utworzono: {new Date(data.targetUser.$createdAt).toLocaleDateString('pl-PL')}
			</p>
		</div>
	</div>

	{#if message}
		<div class="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
			{message}
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Rola użytkownika</h2>
			<div class="space-y-3">
				{#each ['basic', 'plus', 'admin'] as role (role)}
					{@const icons: Record<string, typeof UserIcon> = { basic: UserIcon, plus: Sparkles, admin: Crown }}
					{@const Icon = icons[role]}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
						{selectedRole === role ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}"
					>
						<input
							type="radio"
							name="role"
							value={role}
							bind:group={selectedRole}
							class="sr-only"
						/>
						<Icon
							class="h-5 w-5 {role === 'admin'
								? 'text-amber-600'
								: role === 'plus'
									? 'text-purple-600'
									: 'text-gray-600'}"
						/>
						<span class="font-medium capitalize">{role}</span>
					</label>
				{/each}
			</div>
			<button
				onclick={saveRole}
				disabled={saving || selectedRole === data.targetUser.role}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Save class="h-4 w-4" />
				Zapisz rolę
			</button>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Limit storage</h2>
			<p class="mb-3 text-sm text-gray-500">
				Aktualne zużycie: <strong>{formatFileSize(data.targetUser.storageUsage)}</strong> /
				{data.targetUser.storageLimit === Infinity
					? '∞'
					: formatFileSize(data.targetUser.storageLimit)}
			</p>
			<div class="flex gap-2">
				<input
					type="number"
					bind:value={customLimit}
					placeholder="Custom limit (GB)"
					class="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
				/>
				<span class="self-center text-gray-500">GB</span>
			</div>
			<p class="mt-2 text-xs text-gray-400">Zostaw puste aby użyć domyślnego limitu dla roli</p>
			<button
				onclick={saveStorageLimit}
				disabled={saving}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
			>
				<Save class="h-4 w-4" />
				Zapisz limit
			</button>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Zmiana hasła</h2>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newPassword}
					placeholder="Nowe hasło"
					class="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono focus:border-transparent focus:ring-2 focus:ring-indigo-500"
				/>
				<button
					onclick={generatePassword}
					class="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
					title="Generuj losowe hasło"
				>
					<RefreshCw class="h-5 w-5 text-gray-600" />
				</button>
			</div>
			<button
				onclick={savePassword}
				disabled={saving || !newPassword}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Key class="h-4 w-4" />
				Ustaw hasło
			</button>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Magazyn użytkownika</h2>
			<p class="mb-4 text-sm text-gray-500">Przeglądaj i zarządzaj plikami tego użytkownika</p>
			<a
				href="/preview/{data.targetUser.$id}"
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
			>
				<FolderOpen class="h-4 w-4" />
				Otwórz magazyn
			</a>
		</div>
	</div>
</div>
