import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const signRequestSchema = z.object({
	filename: z
		.string()
		.min(1, 'Filename cannot be empty')
		.max(255, 'Filename too long')
		.regex(/^[^\\/\\:*?"<>|]+$/, 'Invalid characters in filename'),
	type: z.string().regex(/^[\w\-]+\/[\w\-+.]+$/, 'Invalid MIME type')
});

describe('Sign Request Schema', () => {
	describe('filename validation', () => {
		it('should accept valid filename', () => {
			const result = signRequestSchema.safeParse({
				filename: 'document.pdf',
				type: 'application/pdf'
			});
			expect(result.success).toBe(true);
		});

		it('should accept filename with polish characters', () => {
			const result = signRequestSchema.safeParse({
				filename: 'zdjęcie-święta.jpg',
				type: 'image/jpeg'
			});
			expect(result.success).toBe(true);
		});

		it('should reject empty filename', () => {
			const result = signRequestSchema.safeParse({
				filename: '',
				type: 'text/plain'
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Filename cannot be empty');
			}
		});

		it('should reject filename with forbidden characters', () => {
			const forbiddenChars = [
				'file<name>.txt',
				'file>name.txt',
				'file:name.txt',
				'file*name.txt',
				'file?name.txt',
				'file"name.txt',
				'file|name.txt'
			];

			for (const filename of forbiddenChars) {
				const result = signRequestSchema.safeParse({
					filename,
					type: 'text/plain'
				});
				expect(result.success).toBe(false);
			}
		});

		it('should reject filename longer than 255 characters', () => {
			const result = signRequestSchema.safeParse({
				filename: 'a'.repeat(256) + '.txt',
				type: 'text/plain'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('MIME type validation', () => {
		it('should accept valid MIME types', () => {
			const validTypes = [
				'text/plain',
				'application/pdf',
				'image/jpeg',
				'image/png',
				'video/mp4',
				'application/octet-stream',
				'application/vnd.ms-excel'
			];

			for (const type of validTypes) {
				const result = signRequestSchema.safeParse({
					filename: 'test.file',
					type
				});
				expect(result.success).toBe(true);
			}
		});

		it('should reject invalid MIME types', () => {
			const invalidTypes = ['invalidtype', 'text/', '/plain', 'text plain', ''];

			for (const type of invalidTypes) {
				const result = signRequestSchema.safeParse({
					filename: 'test.file',
					type
				});
				expect(result.success).toBe(false);
			}
		});
	});
});

describe('File extension extraction', () => {
	function extractExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts.pop()! : '';
	}

	it('should extract extension from normal filename', () => {
		expect(extractExtension('document.pdf')).toBe('pdf');
		expect(extractExtension('image.jpeg')).toBe('jpeg');
	});

	it('should handle multiple dots', () => {
		expect(extractExtension('file.backup.2024.zip')).toBe('zip');
		expect(extractExtension('archive.tar.gz')).toBe('gz');
	});

	it('should return empty string for filename without extension', () => {
		expect(extractExtension('README')).toBe('');
		expect(extractExtension('Dockerfile')).toBe('');
	});

	it('should handle dot at the beginning', () => {
		expect(extractExtension('.gitignore')).toBe('gitignore');
		expect(extractExtension('.env')).toBe('env');
	});
});
