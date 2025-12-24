import { env } from '$env/dynamic/private';
import { R2 } from '$lib/clients/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';
import type { RequestHandler } from './$types';

const EXPIRES_IN = 900;

export const POST: RequestHandler = async ({ request }) => {
	const { filename, type } = await request.json();

	if (!filename || typeof filename !== 'string') {
		return json({ error: 'filename is required' }, { status: 400 });
	}

	if (!type || typeof type !== 'string') {
		return json({ error: 'type is required' }, { status: 400 });
	}

	const key = `${uuid()}-${filename}`;

	const url = await getSignedUrl(
		R2,
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			ContentType: type
		}),
		{ expiresIn: EXPIRES_IN }
	);

	return json({
		url,
		method: 'PUT',
		headers: {
			'content-type': type
		}
	});
};
