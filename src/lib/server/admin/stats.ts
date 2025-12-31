import { createAdminClient } from '$lib/server/appwrite';
import { Query } from 'node-appwrite';
import { getCached, setCache } from '../cache';
import { CacheKeys } from '../cache/keys';
import { DATABASE } from '$lib/constants';

const DATABASE_ID = DATABASE.ID;
const FILES_TABLE = DATABASE.TABLES.FILES;

interface AdminStats {
	totalUsers: number;
	usersByRole: { basic: number; plus: number; admin: number };
	totalStorage: number;
}

export async function getAdminStats(): Promise<AdminStats> {
	const cacheKey = CacheKeys.adminTotalUsers();
	const cached = getCached<AdminStats>(cacheKey);
	if (cached) return cached;

	const { users, tablesDB } = createAdminClient();

	const usersList = await users.list({ queries: [Query.limit(5000)] });

	let basic = 0;
	let plus = 0;
	let admin = 0;

	for (const user of usersList.users) {
		if (user.labels.includes('admin')) admin++;
		else if (user.labels.includes('plus')) plus++;
		else basic++;
	}

	let totalStorage = 0;
	let cursor: string | undefined = undefined;

	do {
		const queries = [Query.select(['size']), Query.limit(100)];
		if (cursor) queries.push(Query.cursorAfter(cursor));

		const result = await tablesDB.listRows({
			databaseId: 'main',
			tableId: 'files',
			queries
		});

		for (const file of result.rows) {
			totalStorage += (file.size as number) || 0;
		}

		if (result.rows.length < 100) {
			cursor = undefined;
		} else {
			cursor = result.rows[result.rows.length - 1].$id;
		}
	} while (cursor);

	const stats: AdminStats = {
		totalUsers: usersList.total,
		usersByRole: { basic, plus, admin },
		totalStorage
	};

	setCache(cacheKey, stats);
	return stats;
}
