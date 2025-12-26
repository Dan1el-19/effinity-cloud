import type { PageServerLoad } from './$types';
import { createAdminClient } from '$lib/server/appwrite';
import { Query } from 'node-appwrite';
import { getUserStorageUsage } from '$lib/server/roles';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const { users } = createAdminClient();

	const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

	const usersWithStorage = await Promise.all(
		usersList.users.map(async (user) => {
			const storageUsage = await getUserStorageUsage(user.$id);
			let role: 'basic' | 'plus' | 'admin' = 'basic';
			if (user.labels.includes('admin')) role = 'admin';
			else if (user.labels.includes('plus')) role = 'plus';

			return {
				$id: user.$id,
				email: user.email,
				name: user.name,
				$createdAt: user.$createdAt,
				role,
				storageUsage
			};
		})
	);

	return {
		users: usersWithStorage,
		total: usersList.total,
		page,
		totalPages: Math.ceil(usersList.total / limit)
	};
};
