import { ENV } from '$lib/server/env';
import { R2 } from '$lib/clients/r2';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { json } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';
import type { RequestHandler } from './$types';
import { uploadRequestSchema } from '$lib/schemas';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const validated = uploadRequestSchema.safeParse(body);

	if (!validated.success) {
		return json({ error: 'Validation error', details: validated.error.issues }, { status: 400 });
	}

	const { filename, type, metadata } = validated.data;

	const fileUuid = uuid();
	const parts = filename.split('.');
	const ext = parts.length > 1 ? parts.pop() : '';
	const key = ext ? `${user.$id}/${fileUuid}.${ext}` : `${user.$id}/${fileUuid}`;

	const command = new CreateMultipartUploadCommand({
		Bucket: ENV.R2_BUCKET_NAME,
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
