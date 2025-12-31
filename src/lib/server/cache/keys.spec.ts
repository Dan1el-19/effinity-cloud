import { describe, it, expect } from 'vitest';
import { CacheKeys, TTL } from './keys';

describe('CacheKeys', () => {
	describe('file keys', () => {
		it('should generate correct fileMetadata key', () => {
			expect(CacheKeys.fileMetadata('abc123')).toBe('file:abc123');
		});

		it('should generate correct filesList key with folder', () => {
			expect(CacheKeys.filesList('user1', 'folder1')).toBe('files:list:user1:folder1');
		});

		it('should generate correct filesList key without folder', () => {
			expect(CacheKeys.filesList('user1', null)).toBe('files:list:user1:root');
		});

		it('should generate correct userFilesPrefix', () => {
			expect(CacheKeys.userFilesPrefix('user1')).toBe('files:list:user1:');
		});
	});

	describe('folder keys', () => {
		it('should generate correct folderMetadata key', () => {
			expect(CacheKeys.folderMetadata('folder123')).toBe('folder:folder123');
		});

		it('should generate correct foldersList key', () => {
			expect(CacheKeys.foldersList('user1', 'parent1')).toBe('folders:list:user1:parent1');
			expect(CacheKeys.foldersList('user1', null)).toBe('folders:list:user1:root');
		});

		it('should generate correct folderSize key', () => {
			expect(CacheKeys.folderSize('folder123')).toBe('folder:size:folder123');
		});
	});

	describe('user keys', () => {
		it('should generate correct storageUsage key', () => {
			expect(CacheKeys.storageUsage('user123')).toBe('user:storage:user123');
		});
	});

	describe('download keys', () => {
		it('should generate correct downloadUrl key', () => {
			expect(CacheKeys.downloadUrl('path/to/file.pdf')).toBe('download:path/to/file.pdf');
		});
	});

	describe('admin keys', () => {
		it('should generate correct admin keys', () => {
			expect(CacheKeys.adminTotalUsers()).toBe('admin:users:total');
			expect(CacheKeys.adminTotalStorage()).toBe('admin:storage:total');
			expect(CacheKeys.adminUsersList(1)).toBe('admin:users:list:1');
		});
	});
});

describe('TTL constants', () => {
	it('should have correct TTL values', () => {
		expect(TTL.LIST).toBe(30_000);
		expect(TTL.FOLDER_SIZE).toBe(60_000);
		expect(TTL.STORAGE_USAGE).toBe(60_000);
		expect(TTL.METADATA).toBe(60_000);
		expect(TTL.DOWNLOAD_URL).toBe(3500_000);
	});
});
