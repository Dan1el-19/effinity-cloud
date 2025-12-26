import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query } from 'node-appwrite';
import { deleteR2Object, getDownloadUrl } from './r2';
import { checkStorageQuota, MAIN_STORAGE_OWNER_ID } from '../roles';
import { getCached, setCache, deleteCache, invalidateByPrefix } from '../cache';
import { CacheKeys } from '../cache/keys';

const DATABASE_ID = 'main';
const FILES_TABLE = 'files';

interface FileMetadata {
	name: string;
	size: number;
	mimeType: string;
	r2Key: string;
	bucketId: string;
	ownerId: string;
	parentFolderId?: string | null;
}

export async function getFile(fileId: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	if (file.ownerId !== userId) {
		throw new Error('Access denied: File does not belong to user.');
	}

	return file;
}

export async function getFileMetadata(fileId: string) {
	const cacheKey = CacheKeys.fileMetadata(fileId);
	const cached = getCached<any>(cacheKey);
	if (cached) return cached;

	const { tablesDB } = createAdminClient();
	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	setCache(cacheKey, file);
	return file;
}

export async function createFile(metadata: FileMetadata) {
	const { tablesDB, users } = createAdminClient();

	if (metadata.ownerId !== MAIN_STORAGE_OWNER_ID) {
		const user = await users.get(metadata.ownerId);
		await checkStorageQuota(user, metadata.size);
	}

	if (metadata.parentFolderId) {
		try {
			const folder = await tablesDB.getRow({
				databaseId: DATABASE_ID,
				tableId: 'folders',
				rowId: metadata.parentFolderId
			});
			if (folder.ownerId !== metadata.ownerId) {
				throw new Error('Access denied: Destination folder does not belong to user.');
			}
		} catch (e) {
			throw new Error('Parent folder not found or access denied.');
		}
	}

	const file = await tablesDB.createRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: ID.unique(),
		data: metadata
	});

	invalidateByPrefix(CacheKeys.userFilesPrefix(metadata.ownerId));
	deleteCache(CacheKeys.storageUsage(metadata.ownerId));
	if (metadata.parentFolderId) {
		deleteCache(CacheKeys.folderSize(metadata.parentFolderId));
	}

	return file;
}

export async function listFiles(userId: string, folderId: string | null = null) {
	const cacheKey = CacheKeys.filesList(userId, folderId);
	const cached = getCached<any>(cacheKey);
	if (cached) return cached;

	const { tablesDB } = createAdminClient();
	const queries = [Query.equal('ownerId', userId)];

	if (folderId) {
		queries.push(Query.equal('parentFolderId', folderId));
	} else {
		queries.push(Query.isNull('parentFolderId'));
	}

	queries.push(Query.orderDesc('$createdAt'));

	const result = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		queries
	});

	setCache(cacheKey, result);
	return result;
}

export async function renameFile(fileId: string, newName: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	if (file.ownerId !== userId) {
		throw new Error('Access denied: File does not belong to user.');
	}

	const updated = await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId,
		data: { name: newName }
	});

	deleteCache(CacheKeys.fileMetadata(fileId));
	invalidateByPrefix(CacheKeys.userFilesPrefix(userId));

	return updated;
}

export async function moveFile(fileId: string, targetFolderId: string | null, userId: string) {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});
	if (file.ownerId !== userId) {
		throw new Error('Access denied: File does not belong to user.');
	}

	const oldFolderId = file.parentFolderId as string | null;

	if (oldFolderId === targetFolderId) {
		return file;
	}

	if (targetFolderId) {
		const folder = await tablesDB.getRow({
			databaseId: DATABASE_ID,
			tableId: 'folders',
			rowId: targetFolderId
		});
		if (folder.ownerId !== userId) {
			throw new Error('Access denied: Target folder does not belong to user.');
		}
	}

	const updated = await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId,
		data: { parentFolderId: targetFolderId }
	});

	deleteCache(CacheKeys.fileMetadata(fileId));
	invalidateByPrefix(CacheKeys.userFilesPrefix(userId));
	if (oldFolderId) deleteCache(CacheKeys.folderSize(oldFolderId));
	if (targetFolderId) deleteCache(CacheKeys.folderSize(targetFolderId));

	return updated;
}

export async function deleteFile(fileId: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	if (file.ownerId !== userId) {
		throw new Error('Access denied.');
	}

	await deleteR2Object(file.r2Key as string);

	await tablesDB.deleteRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	deleteCache(CacheKeys.fileMetadata(fileId));
	invalidateByPrefix(CacheKeys.userFilesPrefix(userId));
	deleteCache(CacheKeys.storageUsage(userId));
	if (file.parentFolderId) {
		deleteCache(CacheKeys.folderSize(file.parentFolderId as string));
	}

	return file;
}

export async function getFileDownloadUrl(fileId: string, userId: string) {
	const file = await getFile(fileId, userId);
	const url = await getDownloadUrl(file.r2Key as string, file.name as string);
	return { file, url };
}
