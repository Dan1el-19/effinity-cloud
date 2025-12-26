import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserRole } from '$lib/server/roles';
import { listFiles } from '$lib/server/storage/files';
import { listFolders } from '$lib/server/storage/folders';
import { createAdminClient } from '$lib/server/appwrite';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const role = getUserRole(locals.user);
	if (role !== 'admin') {
		throw redirect(303, '/');
	}

	const { userId } = params;
	const folderId = url.searchParams.get('folder') || null;

	const { users } = createAdminClient();

	try {
		const targetUser = await users.get({ userId });

		const filesResult = await listFiles(userId, folderId);
		const foldersResult = await listFolders(userId, folderId);

		let breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Root' }];

		if (folderId) {
			const { tablesDB } = createAdminClient();
			let currentId: string | null = folderId;

			while (currentId) {
				const folderData = await tablesDB.getRow({
					databaseId: 'main',
					tableId: 'folders',
					rowId: currentId
				});
				breadcrumbs.unshift({ id: folderData.$id, name: folderData.name as string });
				const parentId = folderData.parentFolderId as string | null;
				currentId = parentId || null;
			}
		}

		return {
			targetUser: {
				$id: targetUser.$id,
				name: targetUser.name,
				email: targetUser.email
			},
			files: filesResult.rows || [],
			folders: foldersResult.rows || [],
			currentFolder: folderId,
			breadcrumbs
		};
	} catch (e) {
		throw error(404, 'Użytkownik nie został znaleziony');
	}
};
