import { env as privateEnv } from "$env/dynamic/private";
import { R2 } from "$lib/clients/r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function load() {
    const command = new ListObjectsV2Command({
        Bucket: privateEnv.R2_BUCKET_NAME,
    });

    try {
        const response = await R2.send(command);

        // Serializable data
        const files = (response.Contents || []).map((file) => ({
            key: file.Key ?? 'unknown',
            lastModified: file.LastModified?.toISOString() ?? new Date().toISOString(),
            size: file.Size ?? 0,
            etag: file.ETag ?? '',
        }));

        return {
            files,
        };
    } catch (error) {
        console.error("Error fetching files:", error);
        return {
            files: [],
            error: "Failed to load files",
        };
    }
}
