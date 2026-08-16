import { describe, expect, it } from 'vitest';
import { wheelWouldEscapeScrollable } from './lockPageScroll';

describe('wheelWouldEscapeScrollable', () => {
	it('blocks upward wheel at the top so the page behind does not move', () => {
		expect(wheelWouldEscapeScrollable(-40, 0, 400, 200)).toBe(true);
	});

	it('blocks downward wheel at the bottom', () => {
		expect(wheelWouldEscapeScrollable(40, 200, 400, 200)).toBe(true);
	});

	it('allows wheel in the middle of the dialog', () => {
		expect(wheelWouldEscapeScrollable(40, 80, 400, 200)).toBe(false);
		expect(wheelWouldEscapeScrollable(-40, 80, 400, 200)).toBe(false);
	});
});
