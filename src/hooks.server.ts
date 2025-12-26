import { createSessionClient, SESSION_COOKIE } from '$lib/server/appwrite';
import { redirect, type Handle } from '@sveltejs/kit';
import { getUserRole } from '$lib/server/roles';

const PUBLIC_ROUTES = ['/login', '/register', '/auth/callback'];

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const { account } = createSessionClient(event);

		try {
			event.locals.user = await account.get();
		} catch (err) {
			event.locals.user = undefined;
		}

		const isPublicRoute = PUBLIC_ROUTES.some((route) => {
			return event.url.pathname === route;
		});

		if (!event.locals.user && !isPublicRoute) {
			if (event.url.pathname.startsWith('/api/')) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			throw redirect(303, '/login');
		}

		if (event.locals.user && event.url.pathname === '/login') {
			throw redirect(303, '/');
		}

		const isAdminRoute =
			event.url.pathname.startsWith('/admin') ||
			event.url.pathname.startsWith('/api/admin') ||
			event.url.pathname.startsWith('/preview/');

		if (isAdminRoute && event.locals.user) {
			const role = getUserRole(event.locals.user);
			if (role !== 'admin') {
				if (event.url.pathname.startsWith('/api/')) {
					return new Response(JSON.stringify({ error: 'Forbidden' }), {
						status: 403,
						headers: { 'Content-Type': 'application/json' }
					});
				}
				throw redirect(303, '/');
			}
		}

		return resolve(event);
	} catch (e: any) {
		if (e?.status === 303) throw e;
		console.error('Hooks Error:', e);
		return new Response(`Internal Error: ${e.message} \nStack: ${e.stack}`, { status: 500 });
	}
};
