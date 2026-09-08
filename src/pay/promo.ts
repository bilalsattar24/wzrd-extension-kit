import { getKitConfig } from '../configure';

/**
 * Returns the active promo code from kit config, if any.
 *
 * @returns Promo code string, or `null` when none is set.
 */
export function getActivePromoCode(): string | null {
	return getKitConfig().getActivePromoCode?.() ?? null;
}

/**
 * Reports whether free trials are enabled in kit config.
 *
 * @returns `true` when `freeTrial.enabled` is set.
 */
export function areFreeTrialsEnabled(): boolean {
	return getKitConfig().freeTrial?.enabled === true;
}

/**
 * Returns the configured trial length, or 0 when trials are off.
 *
 * @returns Trial days.
 */
export function getFreeTrialDays(): number {
	const trial = getKitConfig().freeTrial;
	if (!trial?.enabled) return 0;
	return trial.days;
}

/**
 * Reports the unlock-all switch that treats every user as entitled.
 *
 * @returns `true` when `unlockAllFeatures` is set on kit config.
 */
export function unlockAllFeatures(): boolean {
	return getKitConfig().unlockAllFeatures === true;
}

const DEFAULT_UNLOCK_ALL_FEATURES_LABEL = 'Open Beta';

/**
 * Status-bar chip while unlock-all is on.
 *
 * @returns Override text, the kit default, or `null` when the chip should hide.
 */
export function unlockAllFeaturesLabel(): string | null {
	if (!unlockAllFeatures()) {
		return null;
	}
	const config = getKitConfig();
	if (config.unlockAllFeaturesLabel === null) {
		return null;
	}
	if (typeof config.unlockAllFeaturesLabel === 'string') {
		const trimmed = config.unlockAllFeaturesLabel.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	return DEFAULT_UNLOCK_ALL_FEATURES_LABEL;
}
