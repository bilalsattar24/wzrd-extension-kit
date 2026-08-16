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
 * Get current auth session from Supabase.
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
 * Attempt login with email/password via Supabase.
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
 * Sign up a new user with email/password via Supabase.
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
 * Logout via Supabase.
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
 * Subscribe to Supabase auth state changes. Returns an unsubscribe function.
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
 * React hook for current authentication state (no react-query).
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
