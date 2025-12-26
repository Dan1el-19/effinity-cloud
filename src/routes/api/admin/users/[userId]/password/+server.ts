import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/roles';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || getUserRole(locals.user) !== 'admin') {
		throw error(403, 'Brak uprawnień');
	}

	const { userId } = params;
	const { password } = await request.json();

	if (!password || password.length < 8) {
		throw error(400, 'Hasło musi mieć minimum 8 znaków');
	}

	const { users } = createAdminClient();

	try {
		await users.updatePassword({ userId, password });
		return json({ success: true });
	} catch (e: any) {
		throw error(500, e.message);
	}
};
