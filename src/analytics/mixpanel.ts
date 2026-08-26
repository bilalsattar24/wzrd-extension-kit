/**
 * Mixpanel /track client for extension service workers.
 *
 * Uses the public project token only. The Mixpanel API secret is server-side
 * and must never be bundled. Import this module via
 * `wzrd-extension-kit/mixpanel` so the worker does not load kit React.
 */

export type MixpanelPropertyValue = string | number | boolean | null;

export type MixpanelProperties = Record<string, MixpanelPropertyValue | undefined>;

export type MixpanelTrackEvent = {
	event: string;
	properties: Record<string, MixpanelPropertyValue>;
};

export type MixpanelRuntimeContext = {
	token: string;
	version: string;
	browser: 'chrome' | 'firefox';
	environment: 'development' | 'production';
	mpLib: string;
};

export type CreateMixpanelClientOptions = {
	/** Public Mixpanel project token. Never the API secret. */
	token: string;
	/** chrome.storage.local key for the anonymous distinct id. */
	distinctIdStorageKey: string;
	/** Mixpanel `mp_lib` label for this extension. */
	mpLib: string;
	/** Defaults to `production`. Host workers may pass `development`. */
	environment?: 'development' | 'production';
	/** Optional logger; defaults to `console.log`. */
	log?: (...args: unknown[]) => void;
};

const MIXPANEL_TRACK_URL = 'https://api.mixpanel.com/track?ip=1';

/**
 * Encodes a UTF-8 string as base64 for Mixpanel's classic `data=` form body.
 *
 * @param value - JSON payload string
 */
export function utf8ToBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

/**
 * Drops undefined values so Mixpanel does not store empty keys.
 *
 * @param properties - Raw event properties
 */
export function sanitizeProperties(
	properties: MixpanelProperties,
): Record<string, MixpanelPropertyValue> {
	const cleaned: Record<string, MixpanelPropertyValue> = {};
	for (const [key, value] of Object.entries(properties)) {
		if (value !== undefined) {
			cleaned[key] = value;
		}
	}
	return cleaned;
}

/**
 * Builds a Mixpanel /track event with identity + extension super-properties.
 *
 * @param event - Event name from the host extension
 * @param distinctId - Persistent anonymous device id
 * @param properties - Caller properties (`user_id` becomes `$user_id`)
 * @param runtime - Token, version, browser, environment, library name
 * @param nowMs - Clock override for tests
 * @param insertId - Dedup id override for tests
 */
export function buildMixpanelEvent(
	event: string,
	distinctId: string,
	properties: MixpanelProperties,
	runtime: MixpanelRuntimeContext,
	nowMs: number = Date.now(),
	insertId: string = crypto.randomUUID(),
): MixpanelTrackEvent {
	const cleaned = sanitizeProperties(properties);
	const userId = typeof cleaned.user_id === 'string' ? cleaned.user_id : undefined;

	return {
		event,
		properties: {
			token: runtime.token,
			distinct_id: userId ?? distinctId,
			time: Math.floor(nowMs / 1000),
			$insert_id: insertId,
			$device_id: distinctId,
			...(userId ? { $user_id: userId } : {}),
			mp_lib: runtime.mpLib,
			$lib_version: runtime.version,
			extension_version: runtime.version,
			browser: runtime.browser,
			environment: runtime.environment,
			...cleaned,
		},
	};
}

/**
 * Form-urlencoded body Mixpanel accepts without a CORS preflight.
 *
 * @param events - One or more track payloads
 */
export function encodeMixpanelFormBody(events: MixpanelTrackEvent[]): string {
	return `data=${encodeURIComponent(utf8ToBase64(JSON.stringify(events)))}`;
}

/**
 * Chrome vs Firefox from the extension origin (works in the service worker).
 */
export function getExtensionBrowser(): 'chrome' | 'firefox' {
	return chrome.runtime.getURL('').startsWith('moz-extension:') ? 'firefox' : 'chrome';
}

export type MixpanelClient = {
	/** Posts one event to Mixpanel /track. */
	trackMixpanelEvent: (event: string, properties?: MixpanelProperties) => Promise<void>;
	/** Reads or creates the durable anonymous distinct id. */
	getOrCreateDistinctId: () => Promise<string>;
};

/**
 * Builds a Mixpanel client for a host extension's background script.
 *
 * @param options - Project token, storage key, and library name from the host
 */
export function createMixpanelClient(options: CreateMixpanelClientOptions): MixpanelClient {
	const log = options.log ?? ((...args: unknown[]) => console.log('[WZRD]', ...args));

	const getRuntime = (): MixpanelRuntimeContext => ({
		token: options.token,
		version: chrome.runtime.getManifest().version,
		browser: getExtensionBrowser(),
		environment: options.environment ?? 'production',
		mpLib: options.mpLib,
	});

	const getOrCreateDistinctId = async (): Promise<string> => {
		const existing = await chrome.storage.local.get(options.distinctIdStorageKey);
		const value = existing[options.distinctIdStorageKey];
		if (typeof value === 'string' && value.length > 0) {
			return value;
		}
		const id = crypto.randomUUID();
		await chrome.storage.local.set({ [options.distinctIdStorageKey]: id });
		return id;
	};

	const sendMixpanelEvents = async (events: MixpanelTrackEvent[]): Promise<boolean> => {
		if (events.length === 0 || !options.token) {
			return true;
		}

		const response = await fetch(MIXPANEL_TRACK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: encodeMixpanelFormBody(events),
			credentials: 'omit',
		});

		if (!response.ok) {
			log('Mixpanel track failed', response.status);
			return false;
		}
		return true;
	};

	const trackMixpanelEvent = async (
		event: string,
		properties: MixpanelProperties = {},
	): Promise<void> => {
		if (!options.token) {
			return;
		}
		const distinctId = await getOrCreateDistinctId();
		const payload = buildMixpanelEvent(event, distinctId, properties, getRuntime());
		await sendMixpanelEvents([payload]);
	};

	return { trackMixpanelEvent, getOrCreateDistinctId };
}
