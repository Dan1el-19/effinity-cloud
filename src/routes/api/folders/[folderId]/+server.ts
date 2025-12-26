import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getFolder,
	deleteFolder,
	renameFolder,
	moveFolder,
	getFolderMetadata
} from '$lib/server/storage/folders';
import { getUserRole, MAIN_STORAGE_OWNER_ID } from '$lib/server/roles';

async function checkAccess(folderId: string, user: any) {
	const folder = await getFolderMetadata(folderId);
	const role = getUserRole(user);

	if (folder.ownerId === user.$id) return { folder, effectiveUserId: user.$id };

	if (folder.ownerId === MAIN_STORAGE_OWNER_ID && role !== 'basic') {
		return { folder, effectiveUserId: MAIN_STORAGE_OWNER_ID };
	}

	throw new Error('Access denied');
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;

	try {
		const { folder } = await checkAccess(folderId, user);
		return json(folder);
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 404 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;

	try {
		const { effectiveUserId } = await checkAccess(folderId, user);
		await deleteFolder(folderId, effectiveUserId);
		return json({ success: true });
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;
	const body = await request.json();

	try {
		const { effectiveUserId } = await checkAccess(folderId, user);

		if (body.name !== undefined) {
			const folder = await renameFolder(folderId, body.name, effectiveUserId);
			return json(folder);
		}

		if (body.parentFolderId !== undefined) {
			const folder = await moveFolder(folderId, body.parentFolderId, effectiveUserId);
			return json(folder);
		}

		return json({ error: 'No valid operation specified' }, { status: 400 });
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 500 });
	}
};
