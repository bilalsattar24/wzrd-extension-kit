import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/auth';
import { getKitConfig } from '../configure';
import { wzrdKitLog } from '../log';
import { WzrdModal } from '../WzrdModal';
import { WzrdCheckoutEmailPrompt } from './WzrdCheckoutEmailPrompt';
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
 * Outcome-first headline for the feature the user just tried to open.
 *
 * @param context - Hint from the gated surface.
 * @returns Display headline.
 */
function paywallHeadline(context: string): string {
	if (/me vs\.? league/i.test(context)) return 'Unblur your weekly ranks';
	if (/start\s*\/\s*sit/i.test(context)) return 'Set your best lineup in one click';
	if (/player comparison|ai player/i.test(context)) return 'Compare players before you lock';
	if (/^unlock /i.test(context) || /^upgrade /i.test(context)) {
		return 'Win your matchup this week';
	}
	return context;
}

/**
 * Monthly equivalent of a yearly Stripe amount, floored to the cent.
 * $11.99 / 12 is $0.999...; rounding would display $1.
 *
 * @param yearlyCents - Annual amount in the smallest currency unit.
 * @returns Whole cents to show as the per-month equivalent.
 */
function yearlyMonthlyEquivalentCents(yearlyCents: number): number {
	return Math.floor(yearlyCents / 12);
}

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
	const amount = formatAmount(total, pricing.currency);

	if (trialDays > 0) {
		const cadence = interval === 'yearly' ? 'year' : 'month';
		return `Free for ${trialDays} days, then ${amount} per ${cadence}. Cancel anytime before the trial ends.`;
	}
	if (interval === 'yearly') {
		return `${amount} today, renews yearly. Cancel anytime.`;
	}
	return `${amount} today, renews monthly. Cancel anytime.`;
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
 * Check mark in a soft blue chip, used on the feature list.
 */
function FeatureCheckChip() {
	return (
		<span className="wz-flex wz-h-7 wz-w-7 wz-shrink-0 wz-items-center wz-justify-center wz-rounded-lg wz-bg-wzrd-primary-soft wz-text-wzrd-primary">
			<svg className="wz-h-4 wz-w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
				<path
					d="M3.5 8.5 6.5 11.5 12.5 4.5"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</span>
	);
}

/**
 * Filled check circle marking the selected plan.
 */
function SelectedCheck() {
	return (
		<span className="wz-flex wz-h-5 wz-w-5 wz-shrink-0 wz-items-center wz-justify-center wz-rounded-full wz-bg-wzrd-primary">
			<svg className="wz-h-3 wz-w-3 wz-text-white" viewBox="0 0 16 16" fill="none" aria-hidden>
				<path
					d="M3.5 8.5 6.5 11.5 12.5 4.5"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</span>
	);
}

/**
 * Paywall for this extension's Pro plan. Lookup keys and feature copy come from kit config.
 *
 * The yearly plan is the dominant, pre-selected card with its monthly equivalent
 * shown inline; monthly stays visible as a compact secondary option. One checkout
 * action states the exact billed amount. Amounts come from Stripe.
 *
 * @param open - Whether the modal is visible.
 * @param onClose - Called when the user dismisses the modal.
 * @param context - Hint naming the feature the user just tried to open.
 * @param headline - Optional action-specific headline (e.g. the two players picked)
 *   that overrides the context-derived one.
 */
export function WzrdPricingModal({
	open,
	onClose,
	context = 'Unlock Pro',
	headline: headlineOverride,
}: {
	open: boolean;
	onClose: () => void;
	context?: string;
	headline?: string;
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
	const [emailPromptOpen, setEmailPromptOpen] = useState(false);
	const [prices, setPrices] = useState<StripePriceInfo[] | null>(null);
	const [pricesLoading, setPricesLoading] = useState(false);

	const trialDays = areFreeTrialsEnabled() ? getFreeTrialDays() : 0;
	const lookupKeys = useMemo(() => [MONTHLY_LOOKUP, YEARLY_LOOKUP], []);
	const headline = headlineOverride ?? paywallHeadline(context);

	useEffect(() => {
		if (!open) {
			setEmailPromptOpen(false);
			return;
		}
		setBillingInterval('yearly');
		setError(null);
	}, [open]);

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
	const yearlyPerMonth = formatAmount(
		yearlyMonthlyEquivalentCents(pricing.yearlyCents),
		pricing.currency,
	);

	/**
	 * Opens Stripe checkout. Signed-in users skip the email prompt; guests
	 * enter an email so the backend can create or attach their account.
	 *
	 * @param opts - Skip the email prompt after it is submitted, and optional email.
	 */
	const startCheckout = async (opts?: { skipEmailPrompt?: boolean; email?: string }) => {
		if (!authenticated && !opts?.skipEmailPrompt) {
			setEmailPromptOpen(true);
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
				setEmailPromptOpen(false);
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

	if (!open) return null;

	const selectedTotal = billingInterval === 'yearly' ? pricing.yearlyCents : pricing.monthlyCents;
	const checkoutLabel = checkoutLoading
		? 'Opening checkout\u2026'
		: trialDays > 0
			? `Start ${trialDays}-day free trial`
			: `Unlock Pro \u00b7 ${formatAmount(selectedTotal, pricing.currency)}/${
					billingInterval === 'yearly' ? 'year' : 'month'
				}`;

	const yearlySelected = billingInterval === 'yearly';

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
				<div className="wz-relative wz-overflow-hidden wz-rounded-wzrd-lg wz-bg-white wz-font-sans wz-shadow-wzrd-lg wz-animate-wzrd-fade-in">
					<div className="wz-relative wz-bg-slate-900 wz-px-5 wz-pb-5 wz-pt-4">
						<p className="wz-m-0 wz-text-[11px] wz-font-bold wz-tracking-[0.2em] wz-text-sky-400">
							WZRD PRO
						</p>
						<h2 className="wz-m-0 wz-mt-1.5 wz-text-xl wz-font-bold wz-leading-tight wz-text-white">
							{headline}
						</h2>
						<p className="wz-m-0 wz-mt-1 wz-text-[13px] wz-leading-snug wz-text-slate-300">
							One plan unlocks every Pro tool on ESPN and Yahoo.
						</p>
						<button
							type="button"
							aria-label="Close"
							onClick={onClose}
							className="wz-absolute wz-right-3 wz-top-3 wz-flex wz-h-7 wz-w-7 wz-items-center wz-justify-center wz-rounded-lg wz-border-0 wz-bg-transparent wz-text-lg wz-leading-none wz-text-slate-400 wz-cursor-pointer hover:wz-bg-white/10 hover:wz-text-white"
						>
							{'\u00d7'}
						</button>
					</div>

					<div className="wz-max-h-[70vh] wz-overflow-y-auto wz-px-5 wz-py-4">
						<ul className="wz-m-0 wz-mb-4 wz-list-none wz-space-y-2.5 wz-p-0">
							{PRO_FEATURES.map((feature, index) => (
								<li
									key={feature}
									className={`wz-flex wz-items-center wz-gap-2.5 wz-text-[13px] wz-leading-snug wz-text-wzrd-text ${
										index === 0 ? 'wz-font-semibold' : ''
									}`}
								>
									<FeatureCheckChip />
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
							<button
								type="button"
								role="radio"
								aria-checked={yearlySelected}
								onClick={() => setBillingInterval('yearly')}
								className={`wz-relative wz-w-full wz-rounded-wzrd wz-border-2 wz-p-4 wz-pt-5 wz-text-left wz-cursor-pointer wz-transition-colors wz-duration-150 ${
									yearlySelected
										? 'wz-border-wzrd-primary wz-bg-wzrd-primary-soft'
										: 'wz-border-wzrd-primary/30 wz-bg-white hover:wz-bg-wzrd-primary-soft/50'
								}`}
							>
								<span className="wz-absolute wz--top-2.5 wz-left-4 wz-rounded-full wz-bg-wzrd-success wz-px-2.5 wz-py-0.5 wz-text-[10px] wz-font-bold wz-uppercase wz-tracking-wide wz-text-white">
									{savings ? `Best value \u00b7 Save ${savings}%` : 'Best value'}
								</span>
								<span className="wz-flex wz-items-center wz-gap-3">
									<span className="wz-min-w-0 wz-flex-1">
										<span className="wz-block wz-text-sm wz-font-bold wz-text-wzrd-text">
											Season pass
										</span>
										<span className="wz-mt-0.5 wz-block wz-text-xs wz-text-wzrd-text-muted">
											{formatAmount(pricing.yearlyCents, pricing.currency)} billed once {'\u00b7'}
											covers the whole season
										</span>
									</span>
									<span className="wz-shrink-0 wz-text-right">
										<span className="wz-block wz-text-2xl wz-font-bold wz-leading-none wz-text-wzrd-text">
											{yearlyPerMonth}
										</span>
										<span className="wz-mt-1 wz-block wz-text-[11px] wz-text-wzrd-text-muted">
											per month
										</span>
									</span>
									{yearlySelected && <SelectedCheck />}
								</span>
							</button>

							<button
								type="button"
								role="radio"
								aria-checked={!yearlySelected}
								onClick={() => setBillingInterval('monthly')}
								className={`wz-flex wz-w-full wz-items-center wz-gap-3 wz-rounded-wzrd wz-border wz-px-4 wz-py-2.5 wz-text-left wz-cursor-pointer wz-transition-colors wz-duration-150 ${
									!yearlySelected
										? 'wz-border-wzrd-primary wz-bg-wzrd-primary-soft'
										: 'wz-border-wzrd-border wz-bg-white hover:wz-bg-wzrd-surface-muted'
								}`}
							>
								<span className="wz-min-w-0 wz-flex-1 wz-text-[13px] wz-font-semibold wz-text-wzrd-text">
									Monthly
								</span>
								<span className="wz-shrink-0 wz-text-[13px] wz-text-wzrd-text-muted">
									{formatAmount(pricing.monthlyCents, pricing.currency)}/month
								</span>
								{!yearlySelected && <SelectedCheck />}
							</button>
						</div>

						{error && (
							<div className="wz-mt-3 wz-rounded-lg wz-border wz-border-red-200 wz-bg-red-50 wz-px-3 wz-py-2 wz-text-sm wz-text-red-700">
								{error}
							</div>
						)}

						<button
							type="button"
							className="wz-wzrd-btn-primary wz-mt-4 wz-w-full wz-py-3 wz-text-[15px]"
							disabled={checkoutLoading}
							onClick={() => void startCheckout()}
						>
							{checkoutLabel}
						</button>

						<p className="wz-m-0 wz-mt-2.5 wz-text-center wz-text-[11px] wz-text-wzrd-text-muted">
							{billingTerms(billingInterval, pricing, trialDays)}
						</p>

						<div className="wz-mt-3 wz-flex wz-items-center wz-justify-center wz-gap-1.5 wz-border-t wz-border-wzrd-border wz-pt-3 wz-text-[11px] wz-text-wzrd-text-muted">
							<span>Instant access</span>
							<span aria-hidden>{'\u00b7'}</span>
							<span>Cancel anytime</span>
							<span aria-hidden>{'\u00b7'}</span>
							<span>Works on ESPN &amp; Yahoo</span>
						</div>
					</div>

					<WzrdCheckoutEmailPrompt
						open={emailPromptOpen}
						submitting={checkoutLoading}
						onCancel={() => setEmailPromptOpen(false)}
						onSubmit={(email) => {
							void startCheckout({ skipEmailPrompt: true, email });
						}}
					/>
				</div>
			</WzrdModal>
		</>
	);
}
