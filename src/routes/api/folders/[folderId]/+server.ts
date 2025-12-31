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
import { updateFolderSchema } from '$lib/schemas';

async function checkAccess(folderId: string, user: any, targetUserId?: string | null) {
	const folder = await getFolderMetadata(folderId);
	const role = getUserRole(user);

	if (role === 'admin' && targetUserId) {
		if (folder.ownerId === targetUserId) {
			return { folder, effectiveUserId: targetUserId };
		}
	}

	if (folder.ownerId === user.$id) return { folder, effectiveUserId: user.$id };

	if (folder.ownerId === MAIN_STORAGE_OWNER_ID && role !== 'basic') {
		return { folder, effectiveUserId: MAIN_STORAGE_OWNER_ID };
	}

	throw new Error('Access denied');
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;
	const targetUserId = url.searchParams.get('targetUserId');

	try {
		const { folder } = await checkAccess(folderId, user, targetUserId);
		return json(folder);
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 404 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;
	const targetUserId = url.searchParams.get('targetUserId');

	try {
		const { effectiveUserId } = await checkAccess(folderId, user, targetUserId);
		await deleteFolder(folderId, effectiveUserId);
		return json({ success: true });
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, locals, request, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;
	const body = await request.json();
	const targetUserId = url.searchParams.get('targetUserId');

	const validated = updateFolderSchema.safeParse(body);
	if (!validated.success) {
		return json({ error: 'Validation error', details: validated.error.issues }, { status: 400 });
	}

	const { name, parentFolderId } = validated.data;

	try {
		const { effectiveUserId } = await checkAccess(folderId, user, targetUserId);

		if (name !== undefined) {
			const folder = await renameFolder(folderId, name, effectiveUserId);
			return json(folder);
		}

		if (parentFolderId !== undefined) {
			const folder = await moveFolder(folderId, parentFolderId, effectiveUserId);
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
