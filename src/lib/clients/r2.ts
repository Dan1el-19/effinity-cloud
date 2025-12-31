import { ENV } from '$lib/server/env';
import { S3Client } from '@aws-sdk/client-s3';

export const R2 = new S3Client({
	region: 'auto',
	endpoint: ENV.R2_ENDPOINT,
	credentials: {
		accessKeyId: ENV.R2_ACCESS_KEY_ID,
		secretAccessKey: ENV.R2_SECRET_ACCESS_KEY
	}
});
