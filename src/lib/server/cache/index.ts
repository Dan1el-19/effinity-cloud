import { lru } from 'tiny-lru';

const DEBUG = import.meta.env.DEV;

export const cache = lru(500, 300000);

export function getCached<T>(key: string): T | undefined {
	const value = cache.get(key) as T | undefined;
	if (DEBUG) {
		// 		if (value !== undefined) {
		// 			console.log(`[CACHE HIT] ${key}`);
		// 		} else {
		// 			console.log(`[CACHE MISS] ${key}`);
		// 		}
	}
	return value;
}

export function setCache<T>(key: string, value: T): void {
	if (DEBUG) {
		console.log(`[CACHE SET] ${key}`);
	}
	cache.set(key, value);
}

export function deleteCache(key: string): void {
	if (DEBUG) {
		console.log(`[CACHE DELETE] ${key}`);
	}
	cache.delete(key);
}

export function invalidateByPrefix(prefix: string): void {
	const keys = cache.keys();
	let count = 0;
	for (const key of keys) {
		if (key.startsWith(prefix)) {
			cache.delete(key);
			count++;
		}
	}
	if (DEBUG && count > 0) {
		console.log(`[CACHE INVALIDATE] ${prefix}* (${count} keys)`);
	}
}

export function clearCache(): void {
	if (DEBUG) {
		console.log(`[CACHE CLEAR]`);
	}
	cache.clear();
}
