import { createAdminClient } from '$lib/server/appwrite';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = 'main';
const FOLDERS_TABLE = 'folders';

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

export async function listFolders(userId: string, parentId: string | null = null) {
	const { tablesDB } = createAdminClient();
	const queries = [Query.equal('ownerId', userId)];

	if (parentId) {
		queries.push(Query.equal('parentFolderId', parentId));
	} else {
		queries.push(Query.isNull('parentFolderId'));
	}
	queries.push(Query.orderAsc('name'));

	return await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		queries
	});
}
