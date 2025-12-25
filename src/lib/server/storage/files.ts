import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query } from 'node-appwrite';
import { deleteR2Object, getDownloadUrl } from './r2';

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

export async function createFile(metadata: FileMetadata) {
	const { tablesDB } = createAdminClient();

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

	return file;
}

export async function listFiles(userId: string, folderId: string | null = null) {
	const { tablesDB } = createAdminClient();
	const queries = [Query.equal('ownerId', userId)];

	if (folderId) {
		queries.push(Query.equal('parentFolderId', folderId));
	} else {
		queries.push(Query.isNull('parentFolderId'));
	}

	queries.push(Query.orderDesc('$createdAt'));

	return await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		queries
	});
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

	return await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId,
		data: { name: newName }
	});
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

	return await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId,
		data: { parentFolderId: targetFolderId }
	});
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

	return file;
}

export async function getFileDownloadUrl(fileId: string, userId: string) {
	const file = await getFile(fileId, userId);
	const url = await getDownloadUrl(file.r2Key as string, file.name as string);
	return { file, url };
}
