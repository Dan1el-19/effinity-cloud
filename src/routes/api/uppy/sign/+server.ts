import { ENV } from '$lib/server/env';
import { R2 } from '$lib/clients/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';
import type { RequestHandler } from './$types';
import { filenameSchema, mimeTypeSchema } from '$lib/schemas';
import { UPLOAD } from '$lib/constants';
import { z } from 'zod';

const EXPIRES_IN = UPLOAD.SIGNED_URL_EXPIRES_IN;

const signRequestSchema = z.object({
	filename: filenameSchema,
	type: mimeTypeSchema
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const validated = signRequestSchema.safeParse(body);

	if (!validated.success) {
		return json(
			{
				error: 'Validation error',
				details: validated.error.issues
			},
			{ status: 400 }
		);
	}

	const { filename, type } = validated.data;

	const fileUuid = uuid();
	const parts = filename.split('.');
	const ext = parts.length > 1 ? parts.pop() : '';
	const key = ext ? `${user.$id}/${fileUuid}.${ext}` : `${user.$id}/${fileUuid}`;

	const url = await getSignedUrl(
		R2,
		new PutObjectCommand({
			Bucket: ENV.R2_BUCKET_NAME,
			Key: key,
			ContentType: type,
			Metadata: {
				ownerId: user.$id,
				originalName: filename
			}
		}),
		{ expiresIn: EXPIRES_IN }
	);

	return json({
		url,
		method: 'PUT',
		headers: {
			'content-type': type
		},
		key,
		fileId: fileUuid
	});
};
