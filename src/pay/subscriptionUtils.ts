import { wzrdKitLog } from '../log';
import { getSession } from '../auth/auth';
import { getKitConfig } from '../configure';
import { unlockAllFeatures } from './promo';

export type SubscriptionTier = 'free' | 'pro' | 'ultra' | 'trial';

export type EntitlementTier = 'pro' | 'ultra' | null;

export type ExtensionSubscriptionSummary = {
	id: string;
	productKey: string;
	productName: string;
	displayStatus: 'active' | 'trial' | 'cancels';
	displayStatusLabel: string;
	renewsAt: number | null;
	isTrial: boolean;
	isMigrated: boolean;
};

export interface SubscriptionStatusResponse {
	tier: SubscriptionTier;
	isTrial: boolean;
	trialDaysRemaining: number | null;
	source: 'wzrd';
	entitlementTier: EntitlementTier;
	subscriptions: ExtensionSubscriptionSummary[];
}

export type StripePriceInfo = {
	lookup_key: string;
	amount: number;
	currency: string;
	interval: 'day' | 'week' | 'month' | 'year' | null;
};

export type GetStripePricesResponse = {
	ok: boolean;
	prices?: StripePriceInfo[];
	error?: string;
};

export type AccessBadge = 'ultra' | 'pro' | 'trial' | 'free';

/**
 * Loads live Stripe prices through the background script (avoids page CORS).
 *
 * @param lookupKeys - Stripe price lookup keys to fetch.
 * @returns Price list, or `{ ok: false }` on failure.
 */
export async function fetchStripePricesViaBackground(
	lookupKeys: string[],
): Promise<GetStripePricesResponse> {
	try {
		return (await getKitConfig().sendToBackground({
			type: 'GET_STRIPE_PRICES',
			lookupKeys,
		})) as GetStripePricesResponse;
	} catch (error) {
		wzrdKitLog('Runtime error fetching Stripe prices:', error);
		return { ok: false, error: 'Failed to fetch prices' };
	}
}

/**
 * Formats a Stripe unit amount in cents for the paywall.
 *
 * @param amountCents - Amount in the smallest currency unit.
 * @param currency - ISO currency code.
 * @param interval - Billing interval, if any.
 * @returns Localized price with `/mo` or `/yr` when interval is known.
 */
export function formatStripePriceLabel(
	amountCents: number,
	currency: string,
	interval: StripePriceInfo['interval'],
): string {
	const formatted = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase(),
		minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(amountCents / 100);

	if (interval === 'year') return `${formatted}/yr`;
	if (interval === 'month') return `${formatted}/mo`;
	return formatted;
}

/**
 * Free-tier subscription payload used when unauthenticated or on error.
 *
 * @returns A `tier: 'free'` status object.
 */
export function defaultSubscription(): SubscriptionStatusResponse {
	return {
		tier: 'free',
		isTrial: false,
		trialDaysRemaining: null,
		source: 'wzrd',
		entitlementTier: null,
		subscriptions: [],
	};
}

/**
 * Loads subscription status through the background script using the session JWT.
 *
 * @returns Status from the server, or {@link defaultSubscription} on failure.
 */
export async function fetchSubscriptionViaBackground(): Promise<SubscriptionStatusResponse> {
	try {
		const { session } = await getSession();
		if (!session?.access_token) {
			return defaultSubscription();
		}

		const response = (await getKitConfig().sendToBackground({
			type: 'CHECK_SUBSCRIPTION',
			accessToken: session.access_token,
		})) as SubscriptionStatusResponse | undefined;

		return response ?? defaultSubscription();
	} catch (error) {
		wzrdKitLog('Runtime error checking subscription:', error);
		return defaultSubscription();
	}
}

/**
 * Maps a subscription payload to Ultra / this sport's Pro / trial / free.
 *
 * @param s - Status from {@link fetchSubscriptionViaBackground}.
 * @param proProductKeys - Product keys that count as this extension's Pro.
 * @returns Badge used on the status bar.
 */
export function getAccessBadge(
	s: SubscriptionStatusResponse,
	proProductKeys: string[] = getKitConfig().pricing.proProductKeys,
): AccessBadge {
	if (s.tier === 'ultra') return 'ultra';
	if (s.tier === 'trial' && s.entitlementTier === 'ultra') return 'trial';
	const sportPro = s.subscriptions.find((sub) => proProductKeys.includes(sub.productKey));
	if (!sportPro) return 'free';
	if (sportPro.isTrial) return 'trial';
	return 'pro';
}

/**
 * Reports whether the user has Pro (or better) for this extension.
 *
 * @param s - Subscription status.
 * @returns `true` when the access badge is not `free`.
 */
export function isProEntitled(s: SubscriptionStatusResponse): boolean {
	return getAccessBadge(s) !== 'free';
}

/**
 * Reports whether the user has SportsWZRD Ultra (including Ultra trial).
 *
 * @param s - Subscription status.
 */
export function isUltraEntitled(s: SubscriptionStatusResponse): boolean {
	return s.tier === 'ultra' || (s.tier === 'trial' && s.entitlementTier === 'ultra');
}

/**
 * Reports whether the signed-in user has Pro (or better) for this extension.
 *
 * @returns `true` when unlocked via config or a qualifying subscription.
 */
export async function isWZRDProUser(): Promise<boolean> {
	if (unlockAllFeatures()) {
		return true;
	}
	try {
		const session = await getSession();
		if (!session.authenticated || !session.user) {
			return false;
		}
		const sub = await fetchSubscriptionViaBackground();
		return isProEntitled(sub);
	} catch (error) {
		wzrdKitLog('Error getting effective subscription:', error);
		return false;
	}
}
