import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query } from 'node-appwrite';
import { deleteR2Object } from './r2';

const DATABASE_ID = 'main';
const FOLDERS_TABLE = 'folders';
const FILES_TABLE = 'files';

export async function getFolder(folderId: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const folder = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId
	});

	if (folder.ownerId !== userId) {
		throw new Error('Access denied: Folder does not belong to user.');
	}

	return folder;
}

export async function createFolder(userId: string, name: string, parentId: string | null = null) {
	const { tablesDB } = createAdminClient();

	let path = '/';
	let parentFolderId = parentId;

	if (parentId) {
		try {
			const parent = await tablesDB.getRow({
				databaseId: DATABASE_ID,
				tableId: FOLDERS_TABLE,
				rowId: parentId
			});
			if (parent.ownerId !== userId) {
				throw new Error('Access denied: Parent folder not owned by user.');
			}
			path = parent.path + parent.$id + '/';
		} catch (e) {
			throw new Error('Parent folder not found.');
		}
	}

	return await tablesDB.createRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: ID.unique(),
		data: {
			name,
			parentFolderId,
			ownerId: userId,
			path
		}
	});
}

export async function calculateFolderSize(folderId: string): Promise<number> {
	const { tablesDB } = createAdminClient();

	const files = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	let totalSize = 0;
	for (const file of files.rows) {
		totalSize += (file.size as number) || 0;
	}

	const subfolders = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	for (const subfolder of subfolders.rows) {
		totalSize += await calculateFolderSize(subfolder.$id);
	}

	return totalSize;
}

export async function listFolders(userId: string, parentId: string | null = null) {
	const { tablesDB } = createAdminClient();
	const queries = [Query.equal('ownerId', userId)];

	if (parentId) {
		queries.push(Query.equal('parentFolderId', parentId));
	} else {
		queries.push(Query.isNull('parentFolderId'));
	}
	queries.push(Query.orderAsc('name'));

	const result = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		queries
	});

	const foldersWithSize = await Promise.all(
		result.rows.map(async (folder) => {
			const size = await calculateFolderSize(folder.$id);
			return { ...folder, size } as typeof folder & { size: number };
		})
	);

	return { ...result, rows: foldersWithSize };
}

export async function renameFolder(folderId: string, newName: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const folder = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId
	});

	if (folder.ownerId !== userId) {
		throw new Error('Access denied: Folder does not belong to user.');
	}

	return await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId,
		data: { name: newName }
	});
}

export async function moveFolder(folderId: string, targetParentId: string | null, userId: string) {
	const { tablesDB } = createAdminClient();

	const folder = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId
	});

	if (folder.ownerId !== userId) {
		throw new Error('Access denied: Folder does not belong to user.');
	}

	if (targetParentId === folderId) {
		throw new Error('Cannot move folder into itself.');
	}

	let newPath = '/';
	if (targetParentId) {
		const targetParent = await tablesDB.getRow({
			databaseId: DATABASE_ID,
			tableId: FOLDERS_TABLE,
			rowId: targetParentId
		});

		if (targetParent.ownerId !== userId) {
			throw new Error('Access denied: Target folder does not belong to user.');
		}

		if ((targetParent.path as string).includes(`/${folderId}/`)) {
			throw new Error('Cannot move folder into its descendant.');
		}

		newPath = targetParent.path + targetParent.$id + '/';
	}

	return await tablesDB.updateRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId,
		data: {
			parentFolderId: targetParentId,
			path: newPath
		}
	});
}

export async function deleteFolder(folderId: string, userId: string) {
	const { tablesDB } = createAdminClient();

	const folder = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId
	});

	if (folder.ownerId !== userId) {
		throw new Error('Access denied: Folder does not belong to user.');
	}

	const files = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	for (const file of files.rows) {
		await deleteR2Object(file.r2Key as string);
		await tablesDB.deleteRow({
			databaseId: DATABASE_ID,
			tableId: FILES_TABLE,
			rowId: file.$id
		});
	}

	const subfolders = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	for (const subfolder of subfolders.rows) {
		await deleteFolder(subfolder.$id, userId);
	}

	await tablesDB.deleteRow({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		rowId: folderId
	});

	return folder;
}
