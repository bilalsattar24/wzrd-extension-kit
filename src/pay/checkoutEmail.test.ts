import { describe, expect, it } from 'vitest';
import { isValidCheckoutEmail } from './checkoutEmail';

describe('isValidCheckoutEmail', () => {
	it('accepts a typical email', () => {
		expect(isValidCheckoutEmail('user@example.com')).toBe(true);
	});

	it('trims whitespace before validating', () => {
		expect(isValidCheckoutEmail('  user@example.com  ')).toBe(true);
	});

	it('rejects empty and malformed values', () => {
		expect(isValidCheckoutEmail('')).toBe(false);
		expect(isValidCheckoutEmail('not-an-email')).toBe(false);
		expect(isValidCheckoutEmail('missing-domain@')).toBe(false);
	});
});
