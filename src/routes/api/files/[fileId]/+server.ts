import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	deleteFile,
	renameFile,
	moveFile,
	getFileMetadata,
	getFileDownloadUrl
} from '$lib/server/storage/files';
import { getUserRole, MAIN_STORAGE_OWNER_ID } from '$lib/server/roles';

async function checkAccess(fileId: string, user: any, mode: 'read' | 'write' = 'read') {
	const file = await getFileMetadata(fileId);
	const role = getUserRole(user);

	if (file.ownerId === user.$id) return { file, effectiveUserId: user.$id };

	if (file.ownerId === MAIN_STORAGE_OWNER_ID && role !== 'basic') {
		return { file, effectiveUserId: MAIN_STORAGE_OWNER_ID };
	}

	throw new Error('Access denied');
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { fileId } = params;

	try {
		const { file, effectiveUserId } = await checkAccess(fileId, user, 'read');
		const includeDownloadUrl = url.searchParams.get('download') === 'true';

		if (includeDownloadUrl) {
			const { file: fileObj, url: downloadUrl } = await getFileDownloadUrl(fileId, effectiveUserId);
			return json({ ...fileObj, downloadUrl });
		}

		return json(file);
	} catch (error: any) {
		if (error.message.includes('Access denied') || error.message.includes('Forbidden')) {
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
		const { effectiveUserId } = await checkAccess(fileId, user, 'write');
		await deleteFile(fileId, effectiveUserId);
		return json({ success: true });
	} catch (error: any) {
		if (error.message.includes('Access denied') || error.message.includes('Forbidden')) {
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
		const { effectiveUserId } = await checkAccess(fileId, user, 'write');

		if (body.name !== undefined) {
			const file = await renameFile(fileId, body.name, effectiveUserId);
			return json(file);
		}

		if (body.parentFolderId !== undefined) {
			const file = await moveFile(fileId, body.parentFolderId, effectiveUserId);
			return json(file);
		}

		return json({ error: 'No valid operation specified' }, { status: 400 });
	} catch (error: any) {
		if (error.message.includes('Access denied') || error.message.includes('Forbidden')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		return json({ error: error.message }, { status: 500 });
	}
};
