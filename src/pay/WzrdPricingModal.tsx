import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, type WzrdUser } from '../auth/auth';
import WzrdLoginForm from '../chrome/WzrdLoginForm';
import { getKitConfig } from '../configure';
import { wzrdKitLog } from '../log';
import { WzrdModal } from '../WzrdModal';
import { openStripeCheckout } from './paymentUtils';
import { areFreeTrialsEnabled, getActivePromoCode, getFreeTrialDays } from './promo';
import { fetchStripePricesViaBackground, type StripePriceInfo } from './subscriptionUtils';

type BillingInterval = 'monthly' | 'yearly';

type ResolvedPricing = {
	monthlyCents: number;
	yearlyCents: number;
	currency: string;
};

/**
 * Formats a Stripe amount in cents, dropping decimals on whole amounts.
 *
 * @param cents - Amount in the smallest currency unit.
 * @param currency - ISO currency code.
 */
function formatAmount(cents: number, currency: string): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase(),
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(cents / 100);
}

/**
 * Percent saved by paying yearly instead of twelve monthly charges.
 *
 * @param pricing - Resolved monthly and yearly amounts.
 * @returns Whole-number percent, or `null` when yearly is not cheaper.
 */
function savingsPercent(pricing: ResolvedPricing): number | null {
	const twelveMonths = pricing.monthlyCents * 12;
	if (twelveMonths <= 0 || pricing.yearlyCents >= twelveMonths) return null;
	const pct = Math.round((1 - pricing.yearlyCents / twelveMonths) * 100);
	return pct > 0 ? pct : null;
}

/**
 * Plain-language billing terms for the selected plan.
 *
 * @param interval - Monthly or yearly.
 * @param pricing - Resolved amounts.
 * @param trialDays - Trial length; 0 means pay today.
 */
function billingTerms(
	interval: BillingInterval,
	pricing: ResolvedPricing,
	trialDays: number,
): string {
	const total = interval === 'yearly' ? pricing.yearlyCents : pricing.monthlyCents;
	const cadence = interval === 'yearly' ? 'year' : 'month';
	const amount = formatAmount(total, pricing.currency);

	if (trialDays > 0) {
		return `Free for ${trialDays} days, then ${amount} per ${cadence}. Cancel anytime before the trial ends.`;
	}
	return `${amount} today, then every ${cadence}. Cancel anytime.`;
}

/**
 * Finds a fetched Stripe price by lookup key.
 *
 * @param prices - Price list, or `null` while loading / on error.
 * @param lookupKey - Stripe lookup key.
 */
function priceByLookup(
	prices: StripePriceInfo[] | null,
	lookupKey: string,
): StripePriceInfo | undefined {
	return prices?.find((price) => price.lookup_key === lookupKey);
}

/**
 * A selectable plan. Both plans stay visible; the chosen one carries the emphasis.
 */
function PlanRow({
	label,
	selected,
	onSelect,
	amount,
	amountSuffix,
	detail,
	badge,
}: {
	label: string;
	selected: boolean;
	onSelect: () => void;
	amount: string;
	amountSuffix: string;
	detail: string;
	badge?: string;
}) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			onClick={onSelect}
			className={`wz-flex wz-w-full wz-items-center wz-gap-3 wz-rounded-wzrd wz-border wz-p-3 wz-text-left wz-cursor-pointer wz-transition-colors wz-duration-150 ${
				selected
					? 'wz-border-wzrd-primary wz-bg-wzrd-primary-soft'
					: 'wz-border-wzrd-border wz-bg-white hover:wz-bg-wzrd-surface-muted'
			}`}
		>
			<span
				aria-hidden
				className={`wz-flex wz-h-4 wz-w-4 wz-shrink-0 wz-items-center wz-justify-center wz-rounded-full wz-border-2 ${
					selected ? 'wz-border-wzrd-primary' : 'wz-border-wzrd-border'
				}`}
			>
				{selected && <span className="wz-h-2 wz-w-2 wz-rounded-full wz-bg-wzrd-primary" />}
			</span>

			<span className="wz-min-w-0 wz-flex-1">
				<span className="wz-flex wz-flex-wrap wz-items-center wz-gap-2">
					<span className="wz-text-sm wz-font-bold wz-text-wzrd-text">{label}</span>
					{badge && (
						<span className="wz-rounded-full wz-bg-wzrd-success wz-px-2 wz-py-0.5 wz-text-[10px] wz-font-semibold wz-uppercase wz-tracking-wide wz-text-white">
							{badge}
						</span>
					)}
				</span>
				<span className="wz-mt-0.5 wz-block wz-text-xs wz-text-wzrd-text-muted">{detail}</span>
			</span>

			<span className="wz-shrink-0 wz-text-right">
				<span className="wz-block wz-text-lg wz-font-bold wz-text-wzrd-text">{amount}</span>
				<span className="wz-block wz-text-[11px] wz-text-wzrd-text-muted">{amountSuffix}</span>
			</span>
		</button>
	);
}

/**
 * Paywall for this extension's Pro plan. Lookup keys and feature copy come from kit config.
 *
 * Both billing options are shown at once with yearly pre-selected, followed by a
 * single checkout action and the exact billing terms. Amounts come from Stripe.
 *
 * @param open - Whether the modal is visible.
 * @param onClose - Called when the user dismisses the modal.
 * @param context - Headline naming the feature the user just tried to open.
 */
export function WzrdPricingModal({
	open,
	onClose,
	context = 'Unlock Pro',
}: {
	open: boolean;
	onClose: () => void;
	context?: string;
}) {
	const { authenticated, user } = useAuth();
	const pricingCfg = getKitConfig().pricing;
	const MONTHLY_LOOKUP = pricingCfg.monthlyLookupKey;
	const YEARLY_LOOKUP = pricingCfg.yearlyLookupKey;
	const PRO_FEATURES = pricingCfg.features;
	const FALLBACK_PRICING = {
		monthlyCents: pricingCfg.fallbackMonthlyCents,
		yearlyCents: pricingCfg.fallbackYearlyCents,
		currency: pricingCfg.currency ?? 'usd',
	};
	const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly');
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loginOpen, setLoginOpen] = useState(false);
	const [prices, setPrices] = useState<StripePriceInfo[] | null>(null);
	const [pricesLoading, setPricesLoading] = useState(false);
	const resumeCheckoutRef = useRef(false);

	const trialDays = areFreeTrialsEnabled() ? getFreeTrialDays() : 0;
	const lookupKeys = useMemo(() => [MONTHLY_LOOKUP, YEARLY_LOOKUP], []);

	useEffect(() => {
		if (!open) return;

		let cancelled = false;
		setPricesLoading(true);
		void fetchStripePricesViaBackground(lookupKeys).then((result) => {
			if (cancelled) return;
			setPricesLoading(false);
			if (result.ok && result.prices) {
				setPrices(result.prices);
			} else {
				wzrdKitLog('Pricing modal failed to load Stripe prices', result.error);
				setPrices(null);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [open, lookupKeys]);

	const pricing = useMemo<ResolvedPricing>(() => {
		const monthly = priceByLookup(prices, MONTHLY_LOOKUP);
		const yearly = priceByLookup(prices, YEARLY_LOOKUP);
		if (!monthly || !yearly) return FALLBACK_PRICING;
		return {
			monthlyCents: monthly.amount,
			yearlyCents: yearly.amount,
			currency: monthly.currency,
		};
	}, [prices]);

	const savings = savingsPercent(pricing);

	/**
	 * Opens Stripe checkout for the selected plan, signing the user in first if needed.
	 */
	const startCheckout = async (opts?: { skipAuthCheck?: boolean; email?: string }) => {
		if (!authenticated && !opts?.skipAuthCheck) {
			resumeCheckoutRef.current = true;
			setLoginOpen(true);
			return;
		}

		setCheckoutLoading(true);
		setError(null);
		try {
			const lookupKey = billingInterval === 'yearly' ? YEARLY_LOOKUP : MONTHLY_LOOKUP;
			const result = await openStripeCheckout(
				lookupKey,
				opts?.email ?? user?.email,
				getActivePromoCode() ?? undefined,
				trialDays > 0 ? trialDays : undefined,
			);
			if (result.ok) {
				onClose();
			} else {
				wzrdKitLog('Pricing checkout failed', result.error);
				setError(result.error || 'Could not open checkout. Please try again.');
			}
		} catch (err) {
			wzrdKitLog('Pricing checkout error', err);
			setError('Could not open checkout. Please try again.');
		} finally {
			setCheckoutLoading(false);
		}
	};

	/**
	 * Continues to checkout once the user signs in from this modal.
	 */
	const onLoginSuccess = (loggedInUser: WzrdUser) => {
		setLoginOpen(false);
		if (!resumeCheckoutRef.current) return;
		resumeCheckoutRef.current = false;
		void startCheckout({ skipAuthCheck: true, email: loggedInUser.email });
	};

	if (!open) return null;

	const selectedTotal = billingInterval === 'yearly' ? pricing.yearlyCents : pricing.monthlyCents;
	const checkoutLabel = checkoutLoading
		? 'Opening checkout…'
		: trialDays > 0
		? `Start ${trialDays}-day free trial`
		: `Continue — ${formatAmount(selectedTotal, pricing.currency)}/${
				billingInterval === 'yearly' ? 'year' : 'month'
		  }`;

	return (
		<>
			<WzrdModal
				isOpen={open}
				onRequestClose={onClose}
				preventScroll
				width="440px"
				maxWidth="94vw"
				maxHeight="90vh"
				ariaHideApp={false}
			>
				<div className="wz-wzrd-card wz-overflow-hidden wz-font-sans wz-animate-wzrd-fade-in">
					<div className="wz-relative wz-px-5 wz-pr-12 wz-pt-4">
						<h2 className="wz-m-0 wz-text-lg wz-font-bold wz-text-wzrd-text">{context}</h2>
						<p className="wz-m-0 wz-mt-1 wz-text-sm wz-text-wzrd-text-muted">
							Pro unlocks every WZRD tool inside ESPN and Yahoo.
						</p>
						<button
							type="button"
							aria-label="Close"
							onClick={onClose}
							className="wz-absolute wz-right-3 wz-top-3 wz-flex wz-h-7 wz-w-7 wz-items-center wz-justify-center wz-rounded-lg wz-border-0 wz-bg-transparent wz-text-lg wz-leading-none wz-text-wzrd-text-muted wz-cursor-pointer hover:wz-bg-wzrd-surface-muted"
						>
							×
						</button>
					</div>

					<div className="wz-max-h-[70vh] wz-overflow-y-auto wz-px-5 wz-py-4">
						<ul className="wz-m-0 wz-mb-4 wz-list-none wz-space-y-1.5 wz-p-0">
							{PRO_FEATURES.map((feature) => (
								<li
									key={feature}
									className="wz-flex wz-items-start wz-gap-2 wz-text-[13px] wz-text-wzrd-text"
								>
									<span className="wz-mt-px wz-font-bold wz-text-wzrd-primary" aria-hidden>
										✓
									</span>
									<span>{feature}</span>
								</li>
							))}
						</ul>

						<div
							role="radiogroup"
							aria-label="Billing period"
							aria-busy={pricesLoading}
							className="wz-flex wz-flex-col wz-gap-2"
						>
							<PlanRow
								label="Yearly"
								selected={billingInterval === 'yearly'}
								onSelect={() => setBillingInterval('yearly')}
								amount={formatAmount(Math.round(pricing.yearlyCents / 12), pricing.currency)}
								amountSuffix="per month"
								detail={`${formatAmount(pricing.yearlyCents, pricing.currency)} billed once a year`}
								badge={savings ? `Save ${savings}%` : undefined}
							/>
							<PlanRow
								label="Monthly"
								selected={billingInterval === 'monthly'}
								onSelect={() => setBillingInterval('monthly')}
								amount={formatAmount(pricing.monthlyCents, pricing.currency)}
								amountSuffix="per month"
								detail="Billed every month"
							/>
						</div>

						{error && (
							<div className="wz-mt-3 wz-rounded-lg wz-border wz-border-red-200 wz-bg-red-50 wz-px-3 wz-py-2 wz-text-sm wz-text-red-700">
								{error}
							</div>
						)}

						<button
							type="button"
							className="wz-wzrd-btn-primary wz-mt-4 wz-w-full wz-py-2.5"
							disabled={checkoutLoading}
							onClick={() => void startCheckout()}
						>
							{checkoutLabel}
						</button>

						<p className="wz-m-0 wz-mt-2 wz-text-center wz-text-[11px] wz-text-wzrd-text-muted">
							{billingTerms(billingInterval, pricing, trialDays)}
						</p>

						<button
							type="button"
							className="wz-wzrd-btn-ghost wz-mt-1 wz-w-full wz-text-wzrd-text-muted"
							onClick={onClose}
						>
							Not now
						</button>
					</div>
				</div>
			</WzrdModal>

			{loginOpen && (
				<WzrdLoginForm
					open={loginOpen}
					onClose={() => {
						resumeCheckoutRef.current = false;
						setLoginOpen(false);
					}}
					onLoginSuccess={onLoginSuccess}
				/>
			)}
		</>
	);
}
