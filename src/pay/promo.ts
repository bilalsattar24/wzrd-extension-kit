import { getKitConfig } from '../configure';

/**
 * Get the active promo code if a promotion is running.
 */
export function getActivePromoCode(): string | null {
	return getKitConfig().getActivePromoCode?.() ?? null;
}

/**
 * Whether free trials are currently enabled.
 */
export function areFreeTrialsEnabled(): boolean {
	return getKitConfig().freeTrial?.enabled === true;
}

/**
 * Active free trial duration in days, or 0.
 */
export function getFreeTrialDays(): number {
	const trial = getKitConfig().freeTrial;
	if (!trial?.enabled) return 0;
	return trial.days;
}

/**
 * Early-access switch: unlock Pro-gated features with no charge.
 */
export function unlockAllFeatures(): boolean {
	return getKitConfig().unlockAllFeatures === true;
}
