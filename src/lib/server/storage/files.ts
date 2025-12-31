import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query, type Models } from 'node-appwrite';
import { deleteR2Object, getDownloadUrl } from './r2';
import { checkStorageQuota, MAIN_STORAGE_OWNER_ID } from '../roles';
import { getCached, setCache, deleteCache, invalidateByPrefix } from '../cache';
import { CacheKeys } from '../cache/keys';
import { DATABASE } from '$lib/constants';
import type {
	FileDocument,
	FileMetadata,
	ListResult,
	FileDownloadResult
} from '$lib/types/storage';

const DATABASE_ID = DATABASE.ID;
const FILES_TABLE = DATABASE.TABLES.FILES;

export async function getFile(fileId: string, userId: string): Promise<FileDocument> {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	if (file.ownerId !== userId) {
		throw new Error('Access denied: File does not belong to user.');
	}

	return file as unknown as FileDocument;
}

export async function getFileMetadata(fileId: string): Promise<FileDocument> {
	const cacheKey = CacheKeys.fileMetadata(fileId);
	const cached = getCached<FileDocument>(cacheKey);
	if (cached) return cached;

	const { tablesDB } = createAdminClient();
	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	const typedFile = file as unknown as FileDocument;
	setCache(cacheKey, typedFile);
	return typedFile;
}

export async function createFile(metadata: FileMetadata): Promise<FileDocument> {
	const { tablesDB, users } = createAdminClient();

	if (metadata.ownerId !== MAIN_STORAGE_OWNER_ID) {
		const user = await users.get({ userId: metadata.ownerId });
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

	return file as unknown as FileDocument;
}

export async function listFiles(
	userId: string,
	folderId: string | null = null
): Promise<ListResult<FileDocument>> {
	const cacheKey = CacheKeys.filesList(userId, folderId);
	const cached = getCached<ListResult<FileDocument>>(cacheKey);
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

	const typedResult = {
		total: result.total,
		rows: result.rows as unknown as FileDocument[]
	};

	setCache(cacheKey, typedResult);
	return typedResult;
}

export async function renameFile(
	fileId: string,
	newName: string,
	userId: string
): Promise<Models.Row> {
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

export async function moveFile(
	fileId: string,
	targetFolderId: string | null,
	userId: string
): Promise<Models.Row> {
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

export async function deleteFile(fileId: string, userId: string): Promise<FileDocument> {
	const { tablesDB } = createAdminClient();

	const file = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	if (file.ownerId !== userId) {
		throw new Error('Access denied.');
	}

	const r2Key = file.r2Key as string;
	const parentFolderId = file.parentFolderId as string | null;

	await tablesDB.deleteRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	try {
		await deleteR2Object(r2Key);
	} catch (error) {
		console.error(`Failed to delete R2 object ${r2Key}:`, error);
	}

	deleteCache(CacheKeys.fileMetadata(fileId));
	invalidateByPrefix(CacheKeys.userFilesPrefix(userId));
	deleteCache(CacheKeys.storageUsage(userId));
	if (parentFolderId) {
		deleteCache(CacheKeys.folderSize(parentFolderId));
	}

	return file as unknown as FileDocument;
}

export async function getFileDownloadUrl(
	fileId: string,
	userId: string
): Promise<FileDownloadResult> {
	const file = await getFile(fileId, userId);
	const url = await getDownloadUrl(file.r2Key, file.name);
	return { file, url };
}
