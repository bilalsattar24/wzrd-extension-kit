import type { WzrdStorageApi } from './storage/createWzrdStorage';

/**
 * Background messages the kit knows how to send. Apps map these onto their typed bus.
 */
export type WzrdBackgroundMessage =
	| {
			type: 'STRIPE_CHECKOUT';
			lookupKey: string;
			email?: string;
			promoCode?: string;
			trialDays?: number;
			accessToken?: string;
	  }
	| { type: 'GET_STRIPE_PRICES'; lookupKeys: string[] }
	| { type: 'CHECK_SUBSCRIPTION'; accessToken: string }
	| { type: 'GET_USAGE'; accessToken: string; feature: string };

export type WzrdBackgroundSend = (message: WzrdBackgroundMessage) => Promise<unknown>;

export type WzrdPricingConfig = {
	monthlyLookupKey: string;
	yearlyLookupKey: string;
	features: string[];
	fallbackMonthlyCents: number;
	fallbackYearlyCents: number;
	currency?: string;
	/** Product keys on the subscription payload that count as this extension's Pro. */
	proProductKeys: string[];
};

export type WzrdKitConfig = {
	productName: string;
	sportswzrdBaseUrl: string;
	supabaseUrl: string;
	supabaseAnonKey: string;
	/** Path passed to `chrome.runtime.getURL` for popup OAuth return. */
	authSuccessPath: string;
	sendToBackground: WzrdBackgroundSend;
	pricing: WzrdPricingConfig;
	unlockAllFeatures?: boolean;
	freeTrial?: { enabled: boolean; days: number };
	getActivePromoCode?: () => string | null;
	storage?: WzrdStorageApi;
};

let kitConfig: WzrdKitConfig | null = null;

/**
 * Registers kit config for this content-script or popup context.
 * Must run before auth, pay, or chrome UI that reads config.
 *
 * @param config - Product name, Supabase, Stripe lookups, and optional storage.
 */
export function configureWzrdKit(config: WzrdKitConfig): void {
	kitConfig = config;
}

/**
 * Returns the config passed to {@link configureWzrdKit}.
 *
 * @returns The active kit config.
 * @throws When `configureWzrdKit` has not run.
 */
export function getKitConfig(): WzrdKitConfig {
	if (!kitConfig) {
		throw new Error('wzrd-extension-kit: call configureWzrdKit() before using auth, pay, or chrome UI');
	}
	return kitConfig;
}

/**
 * Returns the storage API attached on kit config.
 *
 * @returns The {@link WzrdStorageApi} instance.
 * @throws When config has no `storage`.
 */
export function getKitStorage(): WzrdStorageApi {
	const storage = getKitConfig().storage;
	if (!storage) {
		throw new Error('wzrd-extension-kit: pass storage on configureWzrdKit to use cache helpers');
	}
	return storage;
}
