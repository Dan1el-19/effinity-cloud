import { Client, Databases, Permission, Role } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
	try {
		const envPath = resolve(process.cwd(), '.env');
		const envFile = readFileSync(envPath, 'utf8');
		envFile.split('\n').forEach((line) => {
			const [key, ...values] = line.split('=');
			const value = values.join('=');
			if (key && value) {
				process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
			}
		});
	} catch (e) {
		console.log('No .env file found, relying on process.env');
	}
}

loadEnv();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = 'main';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
	console.error('Missing required environment variables.');
	process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);

async function createCollections() {
	console.log(`Initializing Database (${DATABASE_ID})...`);

	// 0. Ensure Database Exists
	try {
		await databases.get(DATABASE_ID);
		console.log(`Database '${DATABASE_ID}' exists.`);
	} catch (e: any) {
		if (e.code === 404) {
			console.log(`Database '${DATABASE_ID}' not found. Creating...`);
			await databases.create(DATABASE_ID, 'main', true); // enabled
		} else {
			console.error('Error fetching database:', e.message);
			process.exit(1);
		}
	}

	try {
		// 1. Create 'folders' collection
		console.log("Creating 'folders' collection...");
		try {
			await databases.createCollection(DATABASE_ID, 'folders', 'Folders', []);
			console.log("Created 'folders' collection.");
		} catch (e: any) {
			if (e.code === 409) console.log("'folders' collection already exists.");
			else console.error("Error creating 'folders':", e.message);
		}

		console.log("Creating attributes for 'folders'...");
		const folderAttrs = [
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'folders',
					key: 'name',
					size: 255,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'folders',
					key: 'parentFolderId',
					size: 36,
					required: false
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'folders',
					key: 'ownerId',
					size: 36,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'folders',
					key: 'path',
					size: 4096,
					required: true
				})
		];
		await runAttributes(folderAttrs);

		// 2. Create 'files' collection
		console.log("Creating 'files' collection...");
		try {
			await databases.createCollection(DATABASE_ID, 'files', 'Files', []);
			console.log("Created 'files' collection.");
		} catch (e: any) {
			if (e.code === 409) console.log("'files' collection already exists.");
			else console.error("Error creating 'files':", e.message);
		}

		console.log("Creating attributes for 'files'...");
		const fileAttrs = [
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'name',
					size: 255,
					required: true
				}),
			() =>
				databases.createIntegerAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'size',
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'mimeType',
					size: 127,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'r2Key',
					size: 1024,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'bucketId',
					size: 255,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'ownerId',
					size: 36,
					required: true
				}),
			() =>
				databases.createStringAttribute({
					databaseId: DATABASE_ID,
					collectionId: 'files',
					key: 'parentFolderId',
					size: 36,
					required: false
				})
		];
		await runAttributes(fileAttrs);

		console.log('✅ Database Schema initialized successfully.');
	} catch (err: any) {
		console.error('Fatal error during migration:', err);
	}
}

async function runAttributes(attrFunctions: Array<() => Promise<any>>) {
	for (const fn of attrFunctions) {
		try {
			await fn();
			await new Promise((r) => setTimeout(r, 500));
		} catch (e: any) {
			if (e.code !== 409) {
				console.error('  Error creating attribute:', e.message);
			}
		}
	}
}

createCollections();
