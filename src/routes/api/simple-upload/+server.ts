import { env as privateEnv } from "$env/dynamic/private";
import { env } from "$env/dynamic/public";
import { R2 } from "$lib/clients/r2";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  let { name: filename, size, type } = await request.json();

  if (!filename || !size || !type) {
    return json({ error: "Invalid request data" }, { status: 400 });
  }

  if (typeof type !== 'string' || !type.includes('/')) {
    return json({ error: "Invalid file type" }, { status: 400 });
  }
  const maxSize = parseInt(env.PUBLIC_MAX_FILE_SIZE || '') || 10 * 1024 * 1024; // Default 10MB
  if (size > maxSize) {
    return json({ error: "File too large" }, { status: 400 });
  }

  try {
    let key = filename;
    let attempts = 0;
    const maxAttempts = 5;
    const lastDotIndex = filename.lastIndexOf('.');
    const namePart = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    const extPart = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';

    while (attempts < maxAttempts) {
      try {
        await R2.send(new HeadObjectCommand({
          Bucket: privateEnv.R2_BUCKET_NAME,
          Key: key
        }));

        attempts++;
        key = `${namePart}_${attempts}${extPart}`;

      } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          break;
        }
        console.error("Error checking file existence:", err);
        throw err;
      }
    }

    if (attempts >= maxAttempts) {
      return json({ error: "Could not generate unique filename" }, { status: 409 });
    }

    const signableHeaders = new Set<string>();
    signableHeaders.add("content-length");

    const uploadUrl = await getSignedUrl(
      R2,
      new PutObjectCommand({
        Bucket: privateEnv.R2_BUCKET_NAME,
        Key: key,
        ContentLength: size,
        ContentType: type,
      }),
      { expiresIn: 60 * 60, signableHeaders }
    );

    return json({ uploadUrl, key });

  } catch (err) {
    console.error("Upload provisioning failed:", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
