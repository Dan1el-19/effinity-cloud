import type { Models } from 'node-appwrite';
import { createAdminClient } from '$lib/server/appwrite';
import { Query } from 'node-appwrite';
import { getCached, setCache } from './cache';
import { CacheKeys } from './cache/keys';
import { STORAGE } from '$lib/constants';

export type UserRole = 'basic' | 'plus' | 'admin';

export interface UserPreferences extends Models.Preferences {
	storageLimit?: number;
}

export const STORAGE_LIMITS = {
	basic: STORAGE.LIMITS.BASIC,
	plus: STORAGE.LIMITS.PLUS,
	admin: STORAGE.LIMITS.ADMIN
};

export const MAIN_STORAGE_OWNER_ID = 'main-storage';

export function getUserRole(user: Models.User<UserPreferences>): UserRole {
	if (user.labels.includes('admin')) return 'admin';
	if (user.labels.includes('plus')) return 'plus';
	return 'basic';
}

export function getUserStorageLimit(user: Models.User<UserPreferences>): number {
	if (user.prefs && typeof user.prefs.storageLimit === 'number') {
		return user.prefs.storageLimit;
	}
	const role = getUserRole(user);
	return STORAGE_LIMITS[role];
}

export async function getUserStorageUsage(userId: string): Promise<number> {
	const cacheKey = CacheKeys.storageUsage(userId);
	const cached = getCached<number>(cacheKey);
	if (cached !== undefined) return cached;

	const { tablesDB } = createAdminClient();

	let total = 0;
	let cursor: string | undefined = undefined;

	do {
		const queries = [Query.equal('ownerId', userId), Query.select(['size']), Query.limit(100)];

		if (cursor) {
			queries.push(Query.cursorAfter(cursor));
		}

		const result = await tablesDB.listRows({
			databaseId: 'main',
			tableId: 'files',
			queries
		});

		for (const file of result.rows) {
			total += (file.size as number) || 0;
		}

		if (result.rows.length < 100) {
			cursor = undefined;
		} else {
			cursor = result.rows[result.rows.length - 1].$id;
		}
	} while (cursor);

	setCache(cacheKey, total);
	return total;
}

export async function checkStorageQuota(
	user: Models.User<Models.Preferences>,
	newFileSize: number
) {
	const limit = getUserStorageLimit(user);
	if (limit === Infinity) return;

	const currentUsage = await getUserStorageUsage(user.$id);

	if (currentUsage + newFileSize > limit) {
		throw new Error(
			`Storage limit exceeded. Current usage: ${(currentUsage / 1024 / 1024).toFixed(2)} MB, Limit: ${(limit / 1024 / 1024).toFixed(2)} MB`
		);
	}
}
