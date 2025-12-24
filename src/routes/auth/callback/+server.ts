import { redirect, type RequestHandler } from '@sveltejs/kit';
import { createAdminClient, SESSION_COOKIE } from '$lib/server/appwrite';

export const GET: RequestHandler = async (event) => {
	const userId = event.url.searchParams.get('userId');
	const secret = event.url.searchParams.get('secret');

	if (!userId || !secret) {
		throw redirect(302, '/login?error=missing_params');
	}

	const { account } = createAdminClient();
	const session = await account.createSession({ userId, secret });

	event.cookies.set(SESSION_COOKIE, session.secret, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		expires: new Date(session.expire)
	});

	throw redirect(302, '/');
};
