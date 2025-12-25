import { env } from '$env/dynamic/private';
import { R2 } from '$lib/clients/r2';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { json } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { filename, type, metadata } = await request.json();

	if (!filename || typeof filename !== 'string') {
		return json({ error: 'filename is required' }, { status: 400 });
	}

	if (!type || typeof type !== 'string') {
		return json({ error: 'type is required' }, { status: 400 });
	}

	const fileUuid = uuid();
	const ext = filename.split('.').pop();
	const key = `${user.$id}/${fileUuid}.${ext}`;

	const command = new CreateMultipartUploadCommand({
		Bucket: env.R2_BUCKET_NAME,
		Key: key,
		ContentType: type,
		Metadata: {
			...metadata,
			ownerId: user.$id,
			originalName: filename
		}
	});

	const response = await R2.send(command);

	return json({
		key: response.Key,
		uploadId: response.UploadId
	});
};
