import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getFile,
	deleteFile,
	renameFile,
	moveFile,
	getFileDownloadUrl
} from '$lib/server/storage/files';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { fileId } = params;

	try {
		const includeDownloadUrl = url.searchParams.get('download') === 'true';

		if (includeDownloadUrl) {
			const { file, url: downloadUrl } = await getFileDownloadUrl(fileId, user.$id);
			return json({ ...file, downloadUrl });
		}

		const file = await getFile(fileId, user.$id);
		return json(file);
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

	const { fileId } = params;

	try {
		await deleteFile(fileId, user.$id);
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

	const { fileId } = params;
	const body = await request.json();

	try {
		if (body.name !== undefined) {
			const file = await renameFile(fileId, body.name, user.$id);
			return json(file);
		}

		if (body.parentFolderId !== undefined) {
			const file = await moveFile(fileId, body.parentFolderId, user.$id);
			return json(file);
		}

		return json({ error: 'No valid operation specified' }, { status: 400 });
	} catch (error: any) {
		if (error.message.includes('Access denied')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 500 });
	}
};
