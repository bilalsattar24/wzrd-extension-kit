/**
 * Console prefix for kit internals. Sport apps may use their own logger.
 */
export function wzrdKitLog(...args: unknown[]): void {
	console.log('[WZRD]', ...args);
}
