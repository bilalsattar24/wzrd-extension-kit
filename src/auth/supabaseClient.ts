import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getKitConfig } from '../configure';

const chromeStorageAdapter = {
	/** Reads a string from `chrome.storage.local`. */
	getItem: async (key: string): Promise<string | null> => {
		const result = await chrome.storage.local.get(key);
		return result[key] ?? null;
	},
	/** Writes a string to `chrome.storage.local`. */
	setItem: async (key: string, value: string): Promise<void> => {
		await chrome.storage.local.set({ [key]: value });
	},
	/** Removes a key from `chrome.storage.local`. */
	removeItem: async (key: string): Promise<void> => {
		await chrome.storage.local.remove(key);
	},
};

let supabaseInstance: SupabaseClient | null = null;
let configuredFor = '';

/**
 * Returns a singleton Supabase client using kit config and chrome.storage for the session.
 * Recreated when URL or anon key change.
 *
 * @returns The shared client.
 * @throws When {@link configureWzrdKit} has not run.
 */
export function getSupabase(): SupabaseClient {
	const { supabaseUrl, supabaseAnonKey } = getKitConfig();
	const stamp = `${supabaseUrl}:${supabaseAnonKey}`;
	if (!supabaseInstance || configuredFor !== stamp) {
		supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				storage: chromeStorageAdapter,
				autoRefreshToken: true,
				persistSession: true,
				detectSessionInUrl: false,
			},
		});
		configuredFor = stamp;
	}
	return supabaseInstance;
}
