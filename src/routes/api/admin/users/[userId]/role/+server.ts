import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/roles';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || getUserRole(locals.user) !== 'admin') {
		throw error(403, 'Brak uprawnień');
	}

	const { userId } = params;
	const { role } = await request.json();

	if (!['basic', 'plus', 'admin'].includes(role)) {
		throw error(400, 'Nieprawidłowa rola');
	}

	const { users } = createAdminClient();

	try {
		const user = await users.get({ userId });
		const currentLabels = user.labels.filter(
			(l: string) => !['basic', 'plus', 'admin'].includes(l)
		);

		if (role !== 'basic') {
			currentLabels.push(role);
		}

		await users.updateLabels({ userId, labels: currentLabels });

		return json({ success: true });
	} catch (e: any) {
		throw error(500, e.message);
	}
};
