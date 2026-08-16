/**
 * Shared auth helpers using the configured Supabase client.
 * Sessions persist in chrome.storage.local via the kit adapter.
 */

import { useEffect, useState } from 'react';
import { getSupabase } from './supabaseClient';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface WzrdUser {
	id: string;
	email?: string;
	[key: string]: unknown;
}

export interface AuthSessionResponse {
	ok: boolean;
	authenticated: boolean;
	user?: WzrdUser | null;
	session?: Session | null;
	error?: string;
}

/**
 * Reads the current Supabase session from chrome.storage-backed auth.
 *
 * @returns Session payload; `ok` is false on SDK or runtime errors.
 */
export async function getSession(): Promise<AuthSessionResponse> {
	try {
		const supabase = getSupabase();
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			console.error('Error getting session:', error);
			return { ok: false, authenticated: false, error: error.message };
		}

		const user = data.session?.user;
		return {
			ok: true,
			authenticated: !!user,
			user: user ? { id: user.id, email: user.email } : null,
			session: data.session,
		};
	} catch (e) {
		console.error('Exception in getSession:', e);
		return { ok: false, authenticated: false, error: 'RUNTIME_ERROR' };
	}
}

/**
 * Signs in with email and password.
 *
 * @param email - Account email.
 * @param password - Account password.
 * @returns Session payload; `authenticated` is false when credentials fail.
 */
export async function login(email: string, password: string): Promise<AuthSessionResponse> {
	try {
		const supabase = getSupabase();
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error('Login error:', error);
			return { ok: false, authenticated: false, error: error.message };
		}

		const user = data.user;
		return {
			ok: true,
			authenticated: !!user,
			user: user ? { id: user.id, email: user.email } : null,
			session: data.session,
		};
	} catch (e) {
		console.error('Exception in login:', e);
		return { ok: false, authenticated: false, error: 'RUNTIME_ERROR' };
	}
}

/**
 * Creates a user with email and password.
 *
 * @param email - Account email.
 * @param password - Account password.
 * @returns Session payload. `authenticated` is true only when signup also returns a session.
 */
export async function signUp(email: string, password: string): Promise<AuthSessionResponse> {
	try {
		const supabase = getSupabase();
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			console.error('Signup error:', error);
			return { ok: false, authenticated: false, error: error.message };
		}

		const user = data.user;
		return {
			ok: true,
			authenticated: !!user && !!data.session,
			user: user ? { id: user.id, email: user.email } : null,
			session: data.session,
		};
	} catch (e) {
		console.error('Exception in signUp:', e);
		return { ok: false, authenticated: false, error: 'RUNTIME_ERROR' };
	}
}

/**
 * Signs out and clears the persisted Supabase session.
 *
 * @returns `{ ok: true }` on success, or `{ ok: false, error }` on failure.
 */
export async function logout(): Promise<{ ok: boolean; error?: string }> {
	try {
		const supabase = getSupabase();
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error('Logout error:', error);
			return { ok: false, error: error.message };
		}

		return { ok: true };
	} catch (e) {
		console.error('Exception in logout:', e);
		return { ok: false, error: 'RUNTIME_ERROR' };
	}
}

/**
 * Subscribes to Supabase auth state changes.
 *
 * @param cb - Called when the user signs in or out.
 * @returns Unsubscribe function.
 */
export function onAuthStateChanged(
	cb: (state: { authenticated: boolean; user: WzrdUser | null }) => void,
) {
	const supabase = getSupabase();
	const { data } = supabase.auth.onAuthStateChange(
		(_event: AuthChangeEvent, session: Session | null) => {
			const user = session?.user;
			cb({
				authenticated: !!user,
				user: user ? { id: user.id, email: user.email } : null,
			});
		},
	);

	return () => data.subscription.unsubscribe();
}

/**
 * React hook for the current session. Does not require a QueryClientProvider.
 *
 * @returns Loading flag, user, session, error, and `refetch`.
 */
export function useAuth() {
	const [isLoading, setIsLoading] = useState(true);
	const [authenticated, setAuthenticated] = useState(false);
	const [user, setUser] = useState<WzrdUser | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setIsLoading(true);
				const resp = await getSession();
				if (cancelled) return;
				setAuthenticated(resp.authenticated);
				setUser(resp.user ?? null);
				setSession(resp.session ?? null);
				setError(resp.error);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged((state) => {
			setAuthenticated(state.authenticated);
			setUser(state.user);
			setError(undefined);
			setIsLoading(false);
			setTimeout(async () => {
				const resp = await getSession();
				setSession(resp.session ?? null);
			}, 0);
		});
		return unsubscribe;
	}, []);

	const refetch = async () => {
		setIsLoading(true);
		try {
			const resp = await getSession();
			setAuthenticated(resp.authenticated);
			setUser(resp.user ?? null);
			setSession(resp.session ?? null);
			setError(resp.error);
			return resp;
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, authenticated, user, session, error, refetch };
}
