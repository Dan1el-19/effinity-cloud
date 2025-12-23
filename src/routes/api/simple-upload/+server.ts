import { env as privateEnv } from "$env/dynamic/private";
import { env } from "$env/dynamic/public";
import { R2 } from "$lib/clients/r2";
import { PutObjectCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { json } from "@sveltejs/kit";

export async function POST({ cookies, request }) {
  const { name: filename, size, type } = await request.json();

  if (!filename || !size || !type) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  if (size > parseInt(env.PUBLIC_MAX_FILE_SIZE)) {
    return json({ error: "File too large" }, { status: 400 });
  }

  const signableHeaders = new Set<string>();
  signableHeaders.add("content-length");

  const fileExt = (filename as string).split(".").slice(1).join(".");

  const uploadUrl = await getSignedUrl(
    R2,
    new PutObjectCommand({
      Bucket: privateEnv.R2_BUCKET_NAME,
      Key: filename,
      ContentLength: size,
      ContentType: type,
    }),
    { expiresIn: 60 * 60, signableHeaders }
  );

  return json({ uploadUrl });
}
