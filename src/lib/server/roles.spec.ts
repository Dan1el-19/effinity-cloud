import { describe, it, expect } from 'vitest';
import { getUserRole, getUserStorageLimit, STORAGE_LIMITS } from './roles';
import type { Models } from 'node-appwrite';

function createMockUser(
	labels: string[] = [],
	prefs: Record<string, any> = {}
): Models.User<Models.Preferences> {
	return {
		$id: 'test-user-123',
		$createdAt: '2024-01-01T00:00:00.000Z',
		$updatedAt: '2024-01-01T00:00:00.000Z',
		name: 'Test User',
		email: 'test@example.com',
		phone: '',
		emailVerification: true,
		phoneVerification: false,
		mfa: false,
		labels,
		prefs,
		password: '',
		hash: '',
		hashOptions: {},
		registration: '',
		status: true,
		passwordUpdate: '',
		accessedAt: '',
		targets: []
	};
}

describe('User Roles', () => {
	describe('getUserRole', () => {
		it('should return admin for user with admin label', () => {
			const user = createMockUser(['admin']);
			expect(getUserRole(user)).toBe('admin');
		});

		it('should return plus for user with plus label', () => {
			const user = createMockUser(['plus']);
			expect(getUserRole(user)).toBe('plus');
		});

		it('should return basic for user without special labels', () => {
			const user = createMockUser([]);
			expect(getUserRole(user)).toBe('basic');
		});

		it('should prioritize admin over plus', () => {
			const user = createMockUser(['plus', 'admin']);
			expect(getUserRole(user)).toBe('admin');
		});
	});

	describe('getUserStorageLimit', () => {
		it('should return custom limit from prefs if set', () => {
			const user = createMockUser([], { storageLimit: 20 * 1024 * 1024 * 1024 });
			expect(getUserStorageLimit(user)).toBe(20 * 1024 * 1024 * 1024);
		});

		it('should return basic limit for basic user', () => {
			const user = createMockUser([]);
			expect(getUserStorageLimit(user)).toBe(STORAGE_LIMITS.basic);
		});

		it('should return plus limit for plus user', () => {
			const user = createMockUser(['plus']);
			expect(getUserStorageLimit(user)).toBe(STORAGE_LIMITS.plus);
		});

		it('should return Infinity for admin user', () => {
			const user = createMockUser(['admin']);
			expect(getUserStorageLimit(user)).toBe(Infinity);
		});
	});

	describe('STORAGE_LIMITS constants', () => {
		it('should have correct storage limits', () => {
			expect(STORAGE_LIMITS.basic).toBe(5 * 1024 * 1024 * 1024);
			expect(STORAGE_LIMITS.plus).toBe(10 * 1024 * 1024 * 1024);
			expect(STORAGE_LIMITS.admin).toBe(Infinity);
		});
	});
});
