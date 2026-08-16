import clsx from 'clsx';
import React, { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/auth';
import { getKitConfig } from '../configure';
import { unlockAllFeatures } from '../pay/promo';
import {
	fetchSubscriptionViaBackground,
	getAccessBadge,
	type SubscriptionStatusResponse,
} from '../pay/subscriptionUtils';
import { WzrdPricingModal } from '../pay/WzrdPricingModal';
import { SocialNetwork, WzrdSocialLink } from '../WzrdSocialLink';
import WzrdLoginButton from './WzrdLoginButton';
import { WzrdProfileButton } from './WzrdProfileButton';
import { WzrdWelcomeCallout } from './WzrdWelcomeCallout';

/**
 * Tailwind classes for the plan chip.
 *
 * @param kind - Plan kind shown on the bar.
 */
function planBadgeClassName(kind: 'pro' | 'ultra' | 'free' | 'trial' | 'beta'): string {
	if (kind === 'free') return 'wz-bg-yellow-100 wz-text-yellow-800';
	return 'wz-bg-green-100 wz-text-green-800';
}

/**
 * Label and kind for the plan chip beside the product title.
 *
 * @param authenticated - Whether a user is signed in.
 * @param subscription - Latest subscription payload, if loaded.
 */
function titlePlanBadge(
	authenticated: boolean,
	subscription: SubscriptionStatusResponse | null,
): { text: string; kind: 'pro' | 'ultra' | 'free' | 'trial' | 'beta' } | null {
	if (!authenticated) {
		return unlockAllFeatures() ? { text: 'Open Beta', kind: 'beta' } : null;
	}
	const access = subscription ? getAccessBadge(subscription) : 'free';
	if (access === 'ultra') return { text: 'SportsWZRD Ultra', kind: 'ultra' };
	if (access === 'pro') return { text: 'Pro', kind: 'pro' };
	if (access === 'trial') return { text: 'Trial', kind: 'trial' };
	if (unlockAllFeatures()) return { text: 'Open Beta', kind: 'beta' };
	return { text: 'Free', kind: 'free' };
}

/**
 * Shared status / control bar. Pass sport-specific actions as `actions`.
 */
export function WzrdStatusBar({
	welcomeStorageKey,
	welcomeBody,
	frameClassName,
	actions,
}: {
	/** Durable storage key for the welcome callout; omit to hide it. */
	welcomeStorageKey?: string;
	/** Welcome callout body; required when `welcomeStorageKey` is set. */
	welcomeBody?: string;
	/** Extra host-page classes for the outer card. */
	frameClassName?: string;
	/** Sport-specific controls (Start/Sit, Compare, …). */
	actions?: ReactNode;
}) {
	const { productName } = getKitConfig();
	const { user, authenticated, isLoading: loading } = useAuth();
	const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
	const [subscriptionReady, setSubscriptionReady] = useState(false);
	const [pricingOpen, setPricingOpen] = useState(false);

	useEffect(() => {
		if (!authenticated) {
			setSubscription(null);
			setSubscriptionReady(true);
			return;
		}
		setSubscriptionReady(false);
		fetchSubscriptionViaBackground()
			.then((status) => {
				setSubscription(status);
				setSubscriptionReady(true);
			})
			.catch(() => {
				setSubscription(null);
				setSubscriptionReady(true);
			});
	}, [authenticated]);

	const planReady = !loading && (!authenticated || subscriptionReady);
	const plan = planReady ? titlePlanBadge(authenticated, subscription) : null;
	const showUpgrade =
		planReady && (!authenticated || plan?.kind === 'free') && !unlockAllFeatures();

	return (
		<div className="wz-font-sans">
			{welcomeStorageKey && welcomeBody && (
				<WzrdWelcomeCallout storageKey={welcomeStorageKey} body={welcomeBody} />
			)}
			<div
				className={clsx(
					'wz-my-4 wz-rounded-wzrd wz-border wz-border-wzrd-border wz-bg-wzrd-surface-muted wz-px-4 wz-py-3',
					frameClassName,
				)}
			>
				<div className="wz-mb-3 wz-flex wz-items-center wz-justify-between wz-gap-3">
					<div className="wz-flex wz-min-w-0 wz-items-center wz-gap-2">
						<h2 className="wz-m-0 wz-text-xl wz-font-bold wz-text-wzrd-text">{productName}</h2>
						{plan && (
							<span
								className={`wz-shrink-0 wz-px-2 wz-py-0.5 wz-rounded wz-text-xs wz-font-semibold ${planBadgeClassName(
									plan.kind,
								)}`}
							>
								{plan.text}
							</span>
						)}
					</div>
					<div className="wz-flex wz-items-center wz-gap-1.5 wz-text-wzrd-text-muted">
						<span className="wz-text-[13px] wz-opacity-70">Follow us:</span>
						<WzrdSocialLink network={SocialNetwork.Instagram} />
						<WzrdSocialLink network={SocialNetwork.X} />
						<WzrdSocialLink network={SocialNetwork.Discord} />
					</div>
				</div>

				<div className="wz-flex wz-flex-wrap wz-items-center wz-justify-between wz-gap-3">
					<div className="wz-flex wz-items-center wz-gap-2 wz-text-sm wz-min-w-0">
						{loading ? (
							<span className="wz-inline-flex wz-items-center wz-gap-2 wz-text-wzrd-text-muted">
								<span className="wz-wzrd-spinner wz-h-3.5 wz-w-3.5" />
								Checking…
							</span>
						) : authenticated ? (
							user?.email ? (
								<span className="wz-text-wzrd-text wz-truncate" title={user.email}>
									{user.email}
								</span>
							) : null
						) : (
							<span className="wz-text-wzrd-text-muted">Not signed in</span>
						)}
					</div>

					<div className="wz-flex wz-flex-wrap wz-items-center wz-gap-2">
						{showUpgrade && (
							<button
								type="button"
								className="wz-wzrd-btn-primary wz-py-1.5 wz-text-xs"
								onClick={() => setPricingOpen(true)}
							>
								Upgrade
							</button>
						)}
						{actions}
						<WzrdLoginButton />
						{user && <WzrdProfileButton />}
					</div>
				</div>
			</div>
			<WzrdPricingModal
				open={pricingOpen}
				onClose={() => setPricingOpen(false)}
				context={`Upgrade ${productName}`}
			/>
		</div>
	);
}
