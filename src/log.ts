/**
 * Writes a kit-prefixed diagnostic line to the console.
 * Host extensions may use a sport-specific logger at call sites; this is for kit internals.
 *
 * @param args - Values forwarded to `console.log`.
 */
export function wzrdKitLog(...args: unknown[]): void {
	console.log('[WZRD]', ...args);
}
