export type WzrdStorageKind = 'avg' | 'api' | 'schedule' | 'durable';

/** Common TTLs in seconds. */
export const WzrdStorageTtl = {
	Minute: 60,
	FifteenMinutes: 900,
	FourHours: 14400,
	OneDay: 86_400,
	OneWeek: 604_800,
	ThirtyDays: 2_592_000,
	OneYear: 31_536_000,
} as const;

type StoredEnvelope = {
	__wzrd: 1;
	value: unknown;
	expiresAt: number | null;
	lastAccessedAt: number;
	kind: WzrdStorageKind;
};

const HIGH_WATER_BYTES = 8 * 1024 * 1024;
const TARGET_AFTER_EVICT_BYTES = 5 * 1024 * 1024;
const MAX_AVG_KEYS = 2500;

export type CreateWzrdStorageOptions = {
	durableKeys: Set<string> | readonly string[];
	migrationKey: string;
	isPageLocalStorageKey: (key: string) => boolean;
	inferKind?: (key: string) => WzrdStorageKind;
};

export type ClearOptions = {
	includeDurable?: boolean;
};

export type WzrdStorageApi = {
	hydrate: () => Promise<void>;
	get: <T>(key: string, defaultValue?: T) => Promise<T | undefined>;
	getSync: <T>(key: string, defaultValue?: T) => T | undefined;
	put: (key: string, value: unknown, ttlSeconds?: number, kind?: WzrdStorageKind) => Promise<void>;
	remove: (key: string) => Promise<void>;
	keyExists: (key: string) => Promise<boolean>;
	clear: (options?: ClearOptions) => Promise<void>;
	evictLru: (targetBytes?: number) => Promise<number>;
	getBytesInUse: () => Promise<number>;
};

const hasChromeStorage = (): boolean =>
	typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;

const now = () => Date.now();

const isEnvelope = (value: unknown): value is StoredEnvelope =>
	!!value &&
	typeof value === 'object' &&
	(value as StoredEnvelope).__wzrd === 1 &&
	'value' in (value as StoredEnvelope);

/**
 * TTL cache on chrome.storage.local with LRU eviction. Each extension passes its own keys.
 */
export function createWzrdStorage(options: CreateWzrdStorageOptions): WzrdStorageApi {
	const durableKeys = new Set(options.durableKeys);
	const migrationKey = options.migrationKey;
	durableKeys.add(migrationKey);

	const defaultInferKind = (key: string): WzrdStorageKind => {
		if (durableKeys.has(key)) return 'durable';
		if (key.includes(':avg:') || key.includes('-avg:') || key.includes(':avg-')) return 'avg';
		if (key.includes('schedule') || key.includes('gamesRemaining')) return 'schedule';
		return 'api';
	};

	const inferKind = options.inferKind ?? defaultInferKind;
	const memory = new Map<string, StoredEnvelope>();
	let hydratePromise: Promise<void> | null = null;

	const cleanupPageLocalStorage = (): void => {
		try {
			if (typeof localStorage === 'undefined') return;
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && options.isPageLocalStorageKey(key)) {
					keysToRemove.push(key);
				}
			}
			for (const key of keysToRemove) {
				localStorage.removeItem(key);
			}
		} catch {
			// Ignore private-mode / unavailable localStorage
		}
	};

	const readAllFromChrome = async (): Promise<Record<string, unknown>> => {
		if (!hasChromeStorage()) return {};
		return (await chrome.storage.local.get(null)) as Record<string, unknown>;
	};

	const writeToChrome = async (items: Record<string, unknown>): Promise<void> => {
		if (!hasChromeStorage()) return;
		await chrome.storage.local.set(items);
	};

	const removeFromChrome = async (keys: string[]): Promise<void> => {
		if (!hasChromeStorage() || keys.length === 0) return;
		await chrome.storage.local.remove(keys);
	};

	const touchAccess = (key: string, entry: StoredEnvelope): void => {
		entry.lastAccessedAt = now();
		memory.set(key, entry);
	};

	const getBytesInUse = async (): Promise<number> => {
		if (!hasChromeStorage() || !chrome.storage.local.getBytesInUse) return 0;
		return await new Promise<number>((resolve) => {
			chrome.storage.local.getBytesInUse(null, (bytes) => resolve(bytes ?? 0));
		});
	};

	const isExpired = (entry: StoredEnvelope): boolean =>
		entry.expiresAt !== null && entry.expiresAt <= now();

	const listEvictableKeys = (): Array<{
		key: string;
		lastAccessedAt: number;
		kind: WzrdStorageKind;
	}> => {
		const result: Array<{ key: string; lastAccessedAt: number; kind: WzrdStorageKind }> = [];
		for (const [key, entry] of memory.entries()) {
			if (entry.kind === 'durable' || durableKeys.has(key)) continue;
			result.push({ key, lastAccessedAt: entry.lastAccessedAt, kind: entry.kind });
		}
		return result;
	};

	const evictLru = async (targetBytes = TARGET_AFTER_EVICT_BYTES): Promise<number> => {
		const candidates = listEvictableKeys().sort((a, b) => {
			if (a.kind === 'avg' && b.kind !== 'avg') return -1;
			if (b.kind === 'avg' && a.kind !== 'avg') return 1;
			return a.lastAccessedAt - b.lastAccessedAt;
		});

		const keysToRemove: string[] = [];
		for (const candidate of candidates) {
			const bytes = await getBytesInUse();
			if (bytes <= targetBytes && keysToRemove.length > 0) break;
			if (bytes <= targetBytes && candidates.filter((c) => c.kind === 'avg').length <= MAX_AVG_KEYS) {
				break;
			}
			keysToRemove.push(candidate.key);
			memory.delete(candidate.key);
			if (keysToRemove.length >= 200) break;
		}

		await removeFromChrome(keysToRemove);
		return keysToRemove.length;
	};

	const enforceAvgKeyCap = async (): Promise<void> => {
		const avgKeys = listEvictableKeys()
			.filter((k) => k.kind === 'avg')
			.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
		if (avgKeys.length <= MAX_AVG_KEYS) return;
		const overflow = avgKeys.slice(0, avgKeys.length - MAX_AVG_KEYS).map((k) => k.key);
		for (const key of overflow) memory.delete(key);
		await removeFromChrome(overflow);
	};

	const isQuotaError = (error: unknown): boolean => {
		if (!error) return false;
		const message = error instanceof Error ? error.message : String(error);
		return /quota|QUOTA|QuotaExceeded/i.test(message);
	};

	const hydrate = async (): Promise<void> => {
		if (hydratePromise) return hydratePromise;
		hydratePromise = (async () => {
			const all = await readAllFromChrome();
			const expiredKeys: string[] = [];

			for (const [key, raw] of Object.entries(all)) {
				if (key === migrationKey) continue;
				if (!isEnvelope(raw)) continue;
				if (isExpired(raw)) {
					expiredKeys.push(key);
					continue;
				}
				memory.set(key, raw);
			}

			if (expiredKeys.length) {
				await removeFromChrome(expiredKeys);
			}

			if (!all[migrationKey]) {
				cleanupPageLocalStorage();
				await writeToChrome({ [migrationKey]: true });
			}
		})();
		try {
			await hydratePromise;
		} catch (error) {
			hydratePromise = null;
			throw error;
		}
	};

	const getSync = <T>(key: string, defaultValue?: T): T | undefined => {
		const entry = memory.get(key);
		if (!entry) return defaultValue;
		if (isExpired(entry)) {
			memory.delete(key);
			void removeFromChrome([key]);
			return defaultValue;
		}
		touchAccess(key, entry);
		return entry.value as T;
	};

	const get = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
		await hydrate();
		const synced = getSync<T>(key, defaultValue);
		if (synced !== undefined || memory.has(key)) {
			return synced;
		}

		if (!hasChromeStorage()) return defaultValue;
		const result = await chrome.storage.local.get(key);
		const raw = result[key];
		if (!isEnvelope(raw)) return defaultValue;
		if (isExpired(raw)) {
			await removeFromChrome([key]);
			return defaultValue;
		}
		memory.set(key, raw);
		touchAccess(key, raw);
		return raw.value as T;
	};

	const keyExists = async (key: string): Promise<boolean> => {
		const value = await get(key);
		return value !== undefined;
	};

	const put = async (
		key: string,
		value: unknown,
		ttlSeconds?: number,
		kind: WzrdStorageKind = inferKind(key),
	): Promise<void> => {
		await hydrate();
		const entry: StoredEnvelope = {
			__wzrd: 1,
			value,
			expiresAt: ttlSeconds != null ? now() + ttlSeconds * 1000 : null,
			lastAccessedAt: now(),
			kind: durableKeys.has(key) ? 'durable' : kind,
		};
		memory.set(key, entry);

		const persist = async () => {
			await writeToChrome({ [key]: entry });
		};

		try {
			await persist();
		} catch (error) {
			if (!isQuotaError(error)) throw error;
			await evictLru();
			await persist();
		}

		const bytes = await getBytesInUse();
		if (bytes > HIGH_WATER_BYTES) {
			await evictLru();
		}
		if (kind === 'avg' || inferKind(key) === 'avg') {
			await enforceAvgKeyCap();
		}
	};

	const remove = async (key: string): Promise<void> => {
		memory.delete(key);
		await removeFromChrome([key]);
	};

	const clear = async (clearOptions: ClearOptions = {}): Promise<void> => {
		await hydrate();
		const { includeDurable = false } = clearOptions;
		const keysToRemove: string[] = [];

		for (const key of memory.keys()) {
			if (!includeDurable && (durableKeys.has(key) || memory.get(key)?.kind === 'durable')) {
				continue;
			}
			if (key === migrationKey) continue;
			keysToRemove.push(key);
		}

		for (const key of keysToRemove) memory.delete(key);
		await removeFromChrome(keysToRemove);
		cleanupPageLocalStorage();
	};

	return {
		hydrate,
		get,
		getSync,
		put,
		remove,
		keyExists,
		clear,
		evictLru,
		getBytesInUse,
	};
}
