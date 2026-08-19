const CHECKOUT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email collected for guest (unsigned-in) Stripe checkout.
 * The web checkout session then creates or links the SportsWZRD account.
 *
 * @param email - Raw input from the checkout email prompt.
 * @returns `true` when the trimmed value looks like an email.
 */
export function isValidCheckoutEmail(email: string): boolean {
	return CHECKOUT_EMAIL_PATTERN.test(email.trim());
}
