import React from 'react';
import { useAuth } from '../auth/auth';
import WzrdLoginButton from '../chrome/WzrdLoginButton';
import { unlockAllFeatures } from './promo';
import { WzrdPricingModal } from './WzrdPricingModal';

/**
 * Upgrade CTA for gated surfaces. Opens the pricing modal (or sign-in first).
 */
export function UpgradePrompt({
	text = 'Upgrade to unlock this feature',
	context = 'Unlock Pro',
}: {
	/** Primary line on the banner. */
	text?: string;
	/** Headline passed to {@link WzrdPricingModal}. */
	context?: string;
}) {
	const { authenticated } = useAuth();
	const [pricingOpen, setPricingOpen] = React.useState(false);

	if (unlockAllFeatures()) {
		return null;
	}

	return (
		<>
			<div className="wz-mb-3 wz-flex wz-flex-wrap wz-items-center wz-justify-between wz-gap-3 wz-rounded-wzrd wz-border wz-border-wzrd-primary/20 wz-bg-wzrd-primary-soft wz-px-3 wz-py-2.5">
				<div className="wz-min-w-0">
					<p className="wz-m-0 wz-text-sm wz-font-semibold wz-text-wzrd-text">{text}</p>
					<p className="wz-m-0 wz-mt-0.5 wz-text-xs wz-text-wzrd-text-muted">
						{authenticated
							? 'See full ranks, sorting, Team POV, and unblurred matchup analytics.'
							: 'Sign in, then choose a plan to unlock Pro tools on ESPN and Yahoo.'}
					</p>
				</div>
				<div className="wz-flex wz-shrink-0 wz-flex-wrap wz-items-center wz-gap-2">
					{!authenticated && <WzrdLoginButton />}
					<button
						type="button"
						className="wz-wzrd-btn-primary"
						onClick={() => setPricingOpen(true)}
					>
						View plans
					</button>
				</div>
			</div>
			<WzrdPricingModal
				open={pricingOpen}
				onClose={() => setPricingOpen(false)}
				context={context}
			/>
		</>
	);
}
