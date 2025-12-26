export const TTL = {
	LIST: 30_000,
	FOLDER_SIZE: 60_000,
	STORAGE_USAGE: 60_000,
	METADATA: 60_000,
	DOWNLOAD_URL: 3500_000
};

export const CacheKeys = {
	filesList: (userId: string, folderId: string | null) =>
		`files:list:${userId}:${folderId ?? 'root'}`,

	foldersList: (userId: string, parentId: string | null) =>
		`folders:list:${userId}:${parentId ?? 'root'}`,

	folderSize: (folderId: string) => `folder:size:${folderId}`,

	storageUsage: (userId: string) => `user:storage:${userId}`,

	fileMetadata: (fileId: string) => `file:${fileId}`,

	folderMetadata: (folderId: string) => `folder:${folderId}`,

	downloadUrl: (fileId: string) => `download:${fileId}`,

	userFilesPrefix: (userId: string) => `files:list:${userId}:`,

	userFoldersPrefix: (userId: string) => `folders:list:${userId}:`,

	adminTotalUsers: () => 'admin:users:total',
	adminTotalStorage: () => 'admin:storage:total',
	adminUsersList: (page: number) => `admin:users:list:${page}`
};
