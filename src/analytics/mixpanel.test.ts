import { describe, expect, it } from 'vitest';
import {
	buildMixpanelEvent,
	encodeMixpanelFormBody,
	sanitizeProperties,
	utf8ToBase64,
	type MixpanelRuntimeContext,
} from './mixpanel';

const runtime: MixpanelRuntimeContext = {
	token: 'test-token',
	version: '1.6.0',
	browser: 'chrome',
	environment: 'production',
	mpLib: 'fantasy-football-wzrd',
};

describe('sanitizeProperties', () => {
	it('omits undefined values and keeps null', () => {
		expect(sanitizeProperties({ league_id: '12', team_id: undefined, week: null })).toEqual({
			league_id: '12',
			week: null,
		});
	});
});

describe('buildMixpanelEvent', () => {
	it('uses the anonymous distinct id when the user is logged out', () => {
		const event = buildMixpanelEvent(
			'FF League Page Loaded',
			'device-1',
			{ platform: 'espn', league_id: '55' },
			runtime,
			1_700_000_000_000,
			'insert-1',
		);

		expect(event.event).toBe('FF League Page Loaded');
		expect(event.properties).toMatchObject({
			token: 'test-token',
			distinct_id: 'device-1',
			$device_id: 'device-1',
			time: 1_700_000_000,
			$insert_id: 'insert-1',
			platform: 'espn',
			league_id: '55',
			extension_version: '1.6.0',
			browser: 'chrome',
			environment: 'production',
			mp_lib: 'fantasy-football-wzrd',
		});
		expect(event.properties.$user_id).toBeUndefined();
	});

	it('sets $user_id and prefers it as distinct_id when logged in', () => {
		const event = buildMixpanelEvent(
			'FF Paywall Shown',
			'device-1',
			{ user_id: 'supabase-user', authenticated: true },
			runtime,
			1_700_000_000_000,
			'insert-2',
		);

		expect(event.properties.distinct_id).toBe('supabase-user');
		expect(event.properties.$user_id).toBe('supabase-user');
		expect(event.properties.$device_id).toBe('device-1');
		expect(event.properties.authenticated).toBe(true);
	});
});

describe('encodeMixpanelFormBody', () => {
	it('wraps base64 JSON in a data= form field', () => {
		const payload = [
			{
				event: 'FF Popup Opened',
				properties: { token: 't', distinct_id: 'd' },
			},
		];
		const body = encodeMixpanelFormBody(payload);
		expect(body.startsWith('data=')).toBe(true);
		const encoded = decodeURIComponent(body.slice('data='.length));
		expect(encoded).toBe(utf8ToBase64(JSON.stringify(payload)));
		expect(JSON.parse(atob(encoded))).toEqual(payload);
	});
});
