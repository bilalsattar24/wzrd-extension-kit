import { getSupabase } from './supabaseClient';
import { wzrdKitLog } from '../log';

/**
 * Handles OAuth callback from Google sign-in redirects.
 * Extracts tokens from the URL hash, sets the Supabase session, and clears the hash.
 */
export async function handleOAuthCallback(): Promise<void> {
	const hash = window.location.hash;
	if (!hash || !hash.includes('access_token')) {
		return;
	}

	try {
		const params = new URLSearchParams(hash.slice(1));
		const access_token = params.get('access_token');
		const refresh_token = params.get('refresh_token');

		if (!access_token || !refresh_token) {
			wzrdKitLog('OAuth callback: missing tokens in hash');
			return;
		}

		wzrdKitLog('OAuth callback: setting session from redirect');
		const supabase = getSupabase();
		const { data, error } = await supabase.auth.setSession({
			access_token,
			refresh_token,
		});

		if (error) {
			console.error('OAuth callback: failed to set session', error);
			return;
		}

		wzrdKitLog('OAuth callback: session set successfully', data.user?.email);

		if (window.history.replaceState) {
			window.history.replaceState(null, '', window.location.pathname + window.location.search);
		}
	} catch (e) {
		console.error('OAuth callback: exception', e);
	}
}
