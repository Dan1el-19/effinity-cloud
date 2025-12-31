import type { PageServerLoad } from './$types';
import { createAdminClient } from '$lib/server/appwrite';
import { getUserStorageUsage, getUserStorageLimit, type UserPreferences } from '$lib/server/roles';
import { error } from '@sveltejs/kit';
import type { Models } from 'node-appwrite';

export const load: PageServerLoad = async ({ params }) => {
	const { userId } = params;

	const { users } = createAdminClient();

	try {
		const user = (await users.get({ userId })) as Models.User<UserPreferences>;
		const storageUsage = await getUserStorageUsage(userId);

		let role: 'basic' | 'plus' | 'admin' = 'basic';
		if (user.labels.includes('admin')) role = 'admin';
		else if (user.labels.includes('plus')) role = 'plus';

		const storageLimit = getUserStorageLimit(user);

		return {
			targetUser: {
				$id: user.$id,
				email: user.email,
				name: user.name,
				$createdAt: user.$createdAt,
				role,
				storageUsage,
				storageLimit,
				customLimit: user.prefs.storageLimit
			}
		};
	} catch (e) {
		throw error(404, 'Użytkownik nie został znaleziony');
	}
};
