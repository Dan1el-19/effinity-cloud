import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query } from 'node-appwrite';

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

	return await tablesDB.createRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: ID.unique(),
		data: metadata
	});
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
	await tablesDB.deleteRow({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		rowId: fileId
	});

	return file.r2Key;
}
