import { getKitConfig } from '../configure';
import { wzrdKitLog } from '../log';
import { getSession } from '../auth/auth';

/**
 * Opens Stripe checkout through the host extension background script.
 *
 * @param lookupKey - Stripe price lookup key.
 * @param email - Optional checkout email.
 * @param promoCode - Optional promo to apply.
 * @param trialDays - Optional trial length.
 * @returns Checkout URL payload, or `{ ok: false }` on failure.
 */
export const openStripeCheckout = async (
	lookupKey: string,
	email?: string,
	promoCode?: string,
	trialDays?: number,
): Promise<{ ok: boolean; url?: string; sessionId?: string; error?: string }> => {
	try {
		const { sendToBackground } = getKitConfig();
		const { session } = await getSession();
		const response = (await sendToBackground({
			type: 'STRIPE_CHECKOUT',
			lookupKey,
			email,
			promoCode,
			trialDays,
			accessToken: session?.access_token,
		})) as { ok: boolean; url?: string; sessionId?: string; error?: string };
		return response;
	} catch (error) {
		wzrdKitLog('Runtime error in openStripeCheckout:', error);
		return { ok: false, error: 'Failed to open checkout' };
	}
};
