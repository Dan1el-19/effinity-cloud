import { redirect } from '@sveltejs/kit';
import { createSessionClient, SESSION_COOKIE } from '$lib/server/appwrite';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const { account } = createSessionClient(event);

		try {
			await account.deleteSession({ sessionId: 'current' });
		} catch {
		}

		event.cookies.delete(SESSION_COOKIE, { path: '/' });

		throw redirect(303, '/login');
	}
};
