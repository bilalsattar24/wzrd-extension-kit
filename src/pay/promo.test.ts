import { describe, expect, it } from 'vitest';
import { configureWzrdKit, type WzrdKitConfig } from '../configure';
import { unlockAllFeatures, unlockAllFeaturesLabel } from './promo';

function configure(overrides: Partial<WzrdKitConfig> = {}): void {
	configureWzrdKit({
		productName: 'Test',
		sportswzrdBaseUrl: 'https://example.com',
		supabaseUrl: 'https://example.supabase.co',
		supabaseAnonKey: 'anon',
		authSuccessPath: 'auth-success.html',
		sendToBackground: async () => undefined,
		pricing: {
			monthlyLookupKey: 'test_monthly',
			yearlyLookupKey: 'test_yearly',
			features: [],
			fallbackMonthlyCents: 299,
			fallbackYearlyCents: 1199,
			proProductKeys: ['test_pro'],
		},
		...overrides,
	});
}

describe('unlockAllFeaturesLabel', () => {
	it('is null when unlock-all is off', () => {
		configure({ unlockAllFeatures: false });
		expect(unlockAllFeatures()).toBe(false);
		expect(unlockAllFeaturesLabel()).toBeNull();
	});

	it('defaults to Open Beta when unlock-all is on and no override is set', () => {
		configure({ unlockAllFeatures: true });
		expect(unlockAllFeaturesLabel()).toBe('Open Beta');
	});

	it('uses a custom label from the sport config', () => {
		configure({ unlockAllFeatures: true, unlockAllFeaturesLabel: 'Free' });
		expect(unlockAllFeaturesLabel()).toBe('Free');
	});

	it('hides the chip when the sport passes null', () => {
		configure({ unlockAllFeatures: true, unlockAllFeaturesLabel: null });
		expect(unlockAllFeaturesLabel()).toBeNull();
	});
});
