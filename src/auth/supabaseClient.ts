import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getKitConfig } from '../configure';

const chromeStorageAdapter = {
	getItem: async (key: string): Promise<string | null> => {
		const result = await chrome.storage.local.get(key);
		return result[key] ?? null;
	},
	setItem: async (key: string, value: string): Promise<void> => {
		await chrome.storage.local.set({ [key]: value });
	},
	removeItem: async (key: string): Promise<void> => {
		await chrome.storage.local.remove(key);
	},
};

let supabaseInstance: SupabaseClient | null = null;
let configuredFor = '';

/**
 * Supabase client with chrome.storage session persistence. Recreated if URL/key change.
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
