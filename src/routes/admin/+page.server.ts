import type { PageServerLoad } from './$types';
import { getAdminStats } from '$lib/server/admin/stats';

export const load: PageServerLoad = async () => {
	const stats = await getAdminStats();
	return { stats };
};
