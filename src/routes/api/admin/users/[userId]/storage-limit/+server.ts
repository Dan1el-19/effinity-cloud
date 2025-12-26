import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/roles';
import { deleteCache } from '$lib/server/cache';
import { CacheKeys } from '$lib/server/cache/keys';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || getUserRole(locals.user) !== 'admin') {
		throw error(403, 'Brak uprawnień');
	}

	const { userId } = params;
	const { limit } = await request.json();

	const { users } = createAdminClient();

	try {
		const user = await users.get({ userId });
		const currentPrefs = (user.prefs as Record<string, any>) || {};

		if (limit === null || limit === undefined) {
			delete currentPrefs.storageLimit;
		} else {
			currentPrefs.storageLimit = limit;
		}

		await users.updatePrefs({ userId, prefs: currentPrefs });

		deleteCache(CacheKeys.storageUsage(userId));

		return json({ success: true });
	} catch (e: any) {
		throw error(500, e.message);
	}
};
