import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFolder, deleteFolder, renameFolder, moveFolder } from '$lib/server/storage/folders';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { folderId } = params;

	try {
		const folder = await getFolder(folderId, user.$id);
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
		await deleteFolder(folderId, user.$id);
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
		if (body.name !== undefined) {
			const folder = await renameFolder(folderId, body.name, user.$id);
			return json(folder);
		}

		if (body.parentFolderId !== undefined) {
			const folder = await moveFolder(folderId, body.parentFolderId, user.$id);
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
