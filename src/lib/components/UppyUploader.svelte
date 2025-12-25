<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Uppy from '@uppy/core';
	import Dashboard from '@uppy/dashboard';
	import AwsS3 from '@uppy/aws-s3';
	import GoldenRetriever from '@uppy/golden-retriever';

	import '@uppy/core/css/style.min.css';
	import '@uppy/dashboard/css/style.min.css';

	interface Props {
		onUploadComplete?: (result: {
			key: string;
			location?: string;
			name: string;
			size: number;
			type: string;
		}) => void;
		onUploadError?: (error: Error) => void;
		maxFileSize?: number | null;
		allowedFileTypes?: string[];
	}

	let { onUploadComplete, onUploadError, maxFileSize = null, allowedFileTypes }: Props = $props();

	let dashboardContainer: HTMLDivElement;
	let uppy: Uppy | null = null;

	onMount(() => {
		uppy = new Uppy({
			restrictions: {
				maxFileSize,
				allowedFileTypes
			},
			autoProceed: false
		})
			.use(Dashboard, {
				inline: true,
				target: dashboardContainer,
				hideProgressDetails: false,
				proudlyDisplayPoweredByUppy: false,
				height: 400,
				theme: 'auto'
			})
			.use(GoldenRetriever, {
				expires: 24 * 60 * 60 * 1000
			})
			.use(AwsS3, {
				shouldUseMultipart: (file) => (file.size ?? 0) > 100 * 1024 * 1024,

				async getUploadParameters(file) {
					const response = await fetch('/api/uppy/sign', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							filename: file.name,
							type: file.type
						})
					});

					if (!response.ok) {
						throw new Error('Failed to get upload parameters');
					}

					const json = await response.json();
					// Store the strictly generated key in file meta so we can access it later
					file.meta['r2Key'] = json.key;
					return json;
				},

				async createMultipartUpload(file) {
					const response = await fetch('/api/uppy/multipart', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							filename: file.name,
							type: file.type
						})
					});

					if (!response.ok) {
						throw new Error('Failed to create multipart upload');
					}

					return response.json();
				},

				async listParts(file, { uploadId, key }) {
					const response = await fetch(
						`/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`
					);

					if (!response.ok) {
						throw new Error('Failed to list parts');
					}

					return response.json();
				},

				async signPart(file, { uploadId, key, partNumber }) {
					const response = await fetch(
						`/api/uppy/multipart/${uploadId}/${partNumber}?key=${encodeURIComponent(key)}`
					);

					if (!response.ok) {
						throw new Error('Failed to sign part');
					}

					return response.json();
				},

				async abortMultipartUpload(file, { uploadId, key }) {
					await fetch(`/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`, {
						method: 'DELETE'
					});
				},

				async completeMultipartUpload(file, { uploadId, key, parts }) {
					const response = await fetch(
						`/api/uppy/multipart/${uploadId}/complete?key=${encodeURIComponent(key)}`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ parts })
						}
					);

					if (!response.ok) {
						throw new Error('Failed to complete multipart upload');
					}

					return response.json();
				}
			});

		uppy.on('complete', (result) => {
			if (result.successful && result.successful.length > 0) {
				for (const file of result.successful) {
					const body = file.response?.body as { location?: string } | undefined;
					onUploadComplete?.({
						key: (file.meta['r2Key'] as string) || file.name || 'unknown', // Use the verified R2 key
						location: body?.location,
						name: file.name || 'unknown',
						size: file.size || 0,
						type: file.type || 'application/octet-stream'
					});
				}
			}
		});

		uppy.on('error', (error) => {
			onUploadError?.(error);
		});
	});

	onDestroy(() => {
		uppy?.destroy();
	});
</script>

<div bind:this={dashboardContainer} class="uppy-dashboard-container"></div>

<style>
	.uppy-dashboard-container {
		width: 100%;
	}

	:global(.uppy-Dashboard-inner) {
		border-radius: 0.5rem;
	}
</style>
