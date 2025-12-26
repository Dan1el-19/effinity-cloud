import { env } from '$env/dynamic/private';
import { R2 } from '$lib/clients/r2';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCached, setCache } from '../cache';
import { CacheKeys } from '../cache/keys';

const DOWNLOAD_EXPIRES_IN = 3600;

export async function deleteR2Object(key: string): Promise<void> {
	await R2.send(
		new DeleteObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key
		})
	);
}

export async function getDownloadUrl(key: string, filename: string): Promise<string> {
	const cacheKey = CacheKeys.downloadUrl(key);
	const cached = getCached<string>(cacheKey);
	if (cached) return cached;

	const url = await getSignedUrl(
		R2,
		new GetObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`
		}),
		{ expiresIn: DOWNLOAD_EXPIRES_IN }
	);

	setCache(cacheKey, url);
	return url;
}
