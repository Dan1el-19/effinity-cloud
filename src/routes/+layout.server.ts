import type { LayoutServerLoad } from './$types';
import { getUserRole } from '$lib/server/roles';

export const load: LayoutServerLoad = async ({ locals }) => {
	const role = locals.user ? getUserRole(locals.user) : null;

	return {
		user: locals.user,
		role
	};
};
