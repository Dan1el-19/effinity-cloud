import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('tiny-lru', () => {
	return {
		lru: () => {
			const store = new Map<string, any>();
			return {
				get: (key: string) => store.get(key),
				set: (key: string, value: any) => store.set(key, value),
				delete: (key: string) => store.delete(key),
				keys: () => Array.from(store.keys()),
				clear: () => store.clear(),
				size: store.size
			};
		}
	};
});

import { getCached, setCache, deleteCache, invalidateByPrefix, clearCache, cache } from './index';

describe('Cache Module', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('setCache and getCached', () => {
		it('should store and retrieve a value', () => {
			setCache('test-key', { data: 'test-value' });
			const result = getCached<{ data: string }>('test-key');
			expect(result).toEqual({ data: 'test-value' });
		});

		it('should return undefined for non-existent key', () => {
			const result = getCached('non-existent');
			expect(result).toBeUndefined();
		});

		it('should handle different data types', () => {
			setCache('string', 'hello');
			setCache('number', 42);
			setCache('array', [1, 2, 3]);
			setCache('object', { nested: { value: true } });

			expect(getCached<string>('string')).toBe('hello');
			expect(getCached<number>('number')).toBe(42);
			expect(getCached<number[]>('array')).toEqual([1, 2, 3]);
			expect(getCached<object>('object')).toEqual({ nested: { value: true } });
		});
	});

	describe('deleteCache', () => {
		it('should remove a cached value', () => {
			setCache('to-delete', 'value');
			expect(getCached('to-delete')).toBe('value');

			deleteCache('to-delete');
			expect(getCached('to-delete')).toBeUndefined();
		});

		it('should not throw for non-existent key', () => {
			expect(() => deleteCache('non-existent')).not.toThrow();
		});
	});

	describe('invalidateByPrefix', () => {
		it('should remove all keys with matching prefix', () => {
			setCache('user:123:files', ['file1']);
			setCache('user:123:folders', ['folder1']);
			setCache('user:456:files', ['file2']);
			setCache('settings:theme', 'dark');

			invalidateByPrefix('user:123:');

			expect(getCached('user:123:files')).toBeUndefined();
			expect(getCached('user:123:folders')).toBeUndefined();
			expect(getCached('user:456:files')).toEqual(['file2']);
			expect(getCached('settings:theme')).toBe('dark');
		});

		it('should handle empty prefix (clear all)', () => {
			setCache('key1', 'value1');
			setCache('key2', 'value2');

			invalidateByPrefix('');

			expect(getCached('key1')).toBeUndefined();
			expect(getCached('key2')).toBeUndefined();
		});
	});

	describe('clearCache', () => {
		it('should remove all cached values', () => {
			setCache('key1', 'value1');
			setCache('key2', 'value2');
			setCache('key3', 'value3');

			clearCache();

			expect(getCached('key1')).toBeUndefined();
			expect(getCached('key2')).toBeUndefined();
			expect(getCached('key3')).toBeUndefined();
		});
	});
});
