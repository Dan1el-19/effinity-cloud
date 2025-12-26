import type { RequestHandler } from './$types';
import { streamFolderAsZip } from '$lib/server/storage/zip';
import { getUserRole, MAIN_STORAGE_OWNER_ID } from '$lib/server/roles';
import { getFolderMetadata } from '$lib/server/storage/folders';

async function checkFolderAccess(folderId: string, user: any) {
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
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const { folderId } = params;

	try {
		const { effectiveUserId } = await checkFolderAccess(folderId, user);
		const { stream, folderName } = await streamFolderAsZip(folderId, effectiveUserId);

		const encodedName = encodeURIComponent(`${folderName}.zip`);

		return new Response(stream as unknown as ReadableStream, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error: any) {
		const status = error.message.includes('Access denied')
			? 403
			: error.message.includes('empty')
				? 400
				: error.message.includes('exceeds')
					? 413
					: 500;

		return new Response(JSON.stringify({ error: error.message }), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
