import { wzrdKitLog } from '../log';
import { getSession } from '../auth/auth';
import { getKitConfig } from '../configure';

export type UsageFeature = string;

export type UsageStatusResponse = {
	feature: string;
	unlimited: boolean;
	limit: number | null;
	used: number | null;
	remaining: number | null;
	resetsAt: string | null;
};

/**
 * Loads feature usage via the background script (Bearer JWT).
 *
 * @param feature - Usage bucket name. Defaults to `projections`.
 * @returns Usage payload, or `null` when logged out or the request fails.
 */
export async function fetchUsage(
	feature: UsageFeature = 'projections',
): Promise<UsageStatusResponse | null> {
	try {
		const { session } = await getSession();
		if (!session?.access_token) {
			return null;
		}
		const response = await getKitConfig().sendToBackground({
			type: 'GET_USAGE',
			accessToken: session.access_token,
			feature,
		});
		if (!response || (typeof response === 'object' && 'error' in (response as object))) {
			wzrdKitLog('fetchUsage failed:', response);
			return null;
		}
		return response as UsageStatusResponse;
	} catch (error) {
		wzrdKitLog('fetchUsage error:', error);
		return null;
	}
}
