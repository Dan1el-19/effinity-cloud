import { ENV } from '$lib/server/env';
import { R2 } from '$lib/clients/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import { createAdminClient } from '$lib/server/appwrite';
import { Query } from 'node-appwrite';
import { getFolder, calculateFolderSize } from './folders';
import { DATABASE, STORAGE } from '$lib/constants';
import type { FolderDocument, FileDocument } from '$lib/types/storage';

const DATABASE_ID = DATABASE.ID;
const FILES_TABLE = DATABASE.TABLES.FILES;
const FOLDERS_TABLE = DATABASE.TABLES.FOLDERS;
const MAX_ZIP_SIZE = STORAGE.MAX_ZIP_SIZE;

interface FolderFile {
	r2Key: string;
	name: string;
	relativePath: string;
}

async function collectFolderFiles(folderId: string, basePath: string = ''): Promise<FolderFile[]> {
	const { tablesDB } = createAdminClient();
	const files: FolderFile[] = [];

	const folderFiles = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FILES_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	for (const row of folderFiles.rows) {
		const file = row as unknown as FileDocument;
		files.push({
			r2Key: file.r2Key,
			name: file.name,
			relativePath: basePath ? `${basePath}/${file.name}` : file.name
		});
	}

	const subfolders = await tablesDB.listRows({
		databaseId: DATABASE_ID,
		tableId: FOLDERS_TABLE,
		queries: [Query.equal('parentFolderId', folderId)]
	});

	for (const row of subfolders.rows) {
		const subfolder = row as unknown as FolderDocument;
		const subPath = basePath ? `${basePath}/${subfolder.name}` : subfolder.name;
		const subFiles = await collectFolderFiles(subfolder.$id, subPath);
		files.push(...subFiles);
	}

	return files;
}

export async function streamFolderAsZip(
	folderId: string,
	userId: string
): Promise<{ stream: PassThrough; folderName: string }> {
	const folder = await getFolder(folderId, userId);
	const folderSize = await calculateFolderSize(folderId);

	if (folderSize > MAX_ZIP_SIZE) {
		throw new Error(
			`Folder size (${(folderSize / 1024 / 1024 / 1024).toFixed(2)}GB) exceeds maximum allowed size of 10GB`
		);
	}

	const files = await collectFolderFiles(folderId, folder.name);

	if (files.length === 0) {
		throw new Error('Folder is empty');
	}

	const passThrough = new PassThrough();
	const archive = archiver('zip', { zlib: { level: 5 } });

	archive.pipe(passThrough);

	archive.on('error', (err) => {
		passThrough.destroy(err);
	});

	(async () => {
		try {
			for (const file of files) {
				const response = await R2.send(
					new GetObjectCommand({
						Bucket: ENV.R2_BUCKET_NAME,
						Key: file.r2Key
					})
				);

				if (response.Body) {
					const webStream = response.Body.transformToWebStream();
					const nodeStream = Readable.fromWeb(webStream as any);
					archive.append(nodeStream, { name: file.relativePath });
				}
			}
			await archive.finalize();
		} catch (err) {
			archive.abort();
			passThrough.destroy(err as Error);
		}
	})();

	return { stream: passThrough, folderName: folder.name };
}
