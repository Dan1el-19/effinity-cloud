import { redirect } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { createAdminClient, SESSION_COOKIE } from '$lib/server/appwrite';
import { OAuthProvider } from 'node-appwrite';

export const actions: Actions = {
	login: async (event) => {
		const data = await event.request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return { error: 'Email and password are required' };
		}

		const { account } = createAdminClient();

		try {
			const session = await account.createEmailPasswordSession({ email, password });

			event.cookies.set(SESSION_COOKIE, session.secret, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				expires: new Date(session.expire)
			});
		} catch (e: any) {
			return { email, error: e.message };
		}

		throw redirect(303, '/');
	},

	oauth: async (event) => {
		const { account } = createAdminClient();

		const redirectUrl = await account.createOAuth2Token({
			provider: OAuthProvider.Github,
			success: `${event.url.origin}/auth/callback`,
			failure: `${event.url.origin}/login?failure=true`
		});

		throw redirect(302, redirectUrl);
	}
};
