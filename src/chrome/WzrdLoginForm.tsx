import React, { useState, useEffect } from 'react';
import {
	login as authLogin,
	logout as authLogout,
	getSession,
	onAuthStateChanged,
	type WzrdUser,
} from '../auth/auth';
import { getSupabase } from '../auth/supabaseClient';
import { getKitConfig } from '../configure';
import { WzrdModal } from '../WzrdModal';

export interface WzrdLoginFormProps {
	/** Called when login succeeds with user data */
	onLoginSuccess?: (user: WzrdUser) => void;
	/** Called when login fails with error message */
	onLoginError?: (error: string) => void;
	/** Called when logout succeeds */
	onLogoutSuccess?: () => void;
	/** Optional custom styling classes */
	className?: string;
	/** Show a title/header */
	showTitle?: boolean;
	/** Whether the modal is open */
	open?: boolean;
	/** Close handler for the modal */
	onClose?: () => void;
}

/**
 * Standalone login form component for use in content scripts or other UI.
 * Uses the shared auth helper to communicate with the background script.
 * Shows login form when user is not authenticated, and user profile with logout when authenticated.
 */
export const WzrdLoginForm: React.FC<WzrdLoginFormProps> = ({
	onLoginSuccess,
	onLoginError,
	onLogoutSuccess,
	showTitle = true,
	open = false,
	onClose,
}) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [currentUser, setCurrentUser] = useState<WzrdUser | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const { sportswzrdBaseUrl, productName, authSuccessPath } = getKitConfig();

	// Check initial auth state
	useEffect(() => {
		const checkAuthState = async () => {
			try {
				const session = await getSession();
				setIsAuthenticated(session.authenticated);
				setCurrentUser(session.user || null);
			} catch (error) {
				console.error('Error checking auth state:', error);
			} finally {
				setCheckingAuth(false);
			}
		};
		checkAuthState();
	}, []);

	const handleGoogleLogin = async () => {
		setLoading(true);
		setError(null);

		try {
			// Detect if we're in a popup (chrome-extension:// URL)
			const isPopup = window.location.protocol === 'chrome-extension:';

			// For popup: redirect to auth-success page
			// For content script: redirect back to current page
			const returnUrl = isPopup
				? chrome.runtime.getURL(authSuccessPath)
				: window.location.href;

			const redirectTo = `${sportswzrdBaseUrl}/auth-complete?return_url=${encodeURIComponent(
				returnUrl,
			)}`;

			const supabase = getSupabase();
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo,
					skipBrowserRedirect: isPopup, // Don't redirect popup, get URL instead
				},
			});

			if (error) {
				setError(error.message);
				onLoginError?.(error.message);
				return;
			}

			// If in popup, open OAuth URL in a new tab and close the popup
			if (isPopup && data.url) {
				chrome.tabs.create({ url: data.url });
				window.close(); // Close the popup
			}
		} catch (err) {
			setError('Unexpected error during Google login');
			onLoginError?.('Unexpected error during Google login');
		} finally {
			setLoading(false);
		}
	};

	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged((state) => {
			setIsAuthenticated(state.authenticated);
			setCurrentUser(state.user);
			setCheckingAuth(false);
		});

		return unsubscribe;
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const resp = await authLogin(email.trim(), password);
			if (!resp.ok || !resp.authenticated) {
				const errorMsg = resp.error || 'Login failed';
				setError(errorMsg);
				onLoginError?.(errorMsg);
			} else {
				setEmail('');
				setPassword('');
				onLoginSuccess?.(resp.user!);
				onClose?.();
			}
		} catch (err) {
			const errorMsg = 'Unexpected error occurred';
			setError(errorMsg);
			onLoginError?.(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		setError(null);

		try {
			const resp = await authLogout();
			if (resp.ok) {
				// Force immediate state update as a fallback
				setIsAuthenticated(false);
				setCurrentUser(null);
				setEmail('');
				setPassword('');
				onLogoutSuccess?.();
				onClose?.();
			} else {
				setError('Failed to sign out. Please try again.');
			}
		} catch (error) {
			setError('Unexpected error occurred during sign out');
		} finally {
			setLoading(false);
		}
	};

	if (!open) return null;

	return (
		<WzrdModal
			isOpen={open}
			onRequestClose={() => onClose?.()}
			preventScroll
			width="400px"
			maxWidth="90vw"
			ariaHideApp={false}
		>
			<div className="wz-bg-white wz-border wz-border-wzrd-border wz-shadow-wzrd-lg wz-rounded-wzrd-lg wz-overflow-hidden wz-w-full">
				{/* Header */}
				<div className="wz-bg-wzrd-primary wz-px-4 wz-py-3">
					<div className="wz-flex wz-items-center wz-justify-between">
						<div className="wz-flex wz-items-center wz-gap-2">
							<div className="wz-w-2 wz-h-2 wz-rounded-full wz-bg-white/80"></div>
							{showTitle && (
								<div className="wz-text-sm wz-font-semibold wz-tracking-wide wz-text-white">
									{isAuthenticated ? 'Account' : 'Sign in to WZRD'}
								</div>
							)}
						</div>
						<button
							aria-label="Close"
							onClick={() => onClose?.()}
							className="wz-flex wz-items-center wz-justify-center wz-w-8 wz-h-8 wz-bg-white/20 wz-text-white wz-rounded-lg hover:wz-bg-white/30 wz-transition-all wz-duration-200 wz-border wz-border-white/20 wz-cursor-pointer"
						>
							<svg
								className="wz-w-4 wz-h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								strokeWidth={2.5}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="wz-px-5 wz-py-4 wz-text-slate-800">
					{checkingAuth ? (
						<div className="wz-flex wz-items-center wz-justify-center wz-py-4">
							<div className="wz-wzrd-spinner wz-h-5 wz-w-5"></div>
							<span className="wz-ml-2 wz-text-sm wz-text-wzrd-text-muted">
								Checking authentication...
							</span>
						</div>
					) : isAuthenticated && currentUser ? (
						/* Authenticated User Profile */
						<div className="wz-space-y-4">
							<div className="wz-text-center">
								<div className="wz-w-12 wz-h-12 wz-bg-wzrd-primary wz-rounded-full wz-flex wz-items-center wz-justify-center wz-mx-auto wz-mb-3">
									<span className="wz-text-white wz-font-semibold wz-text-lg">
										{currentUser.email?.charAt(0).toUpperCase() || 'U'}
									</span>
								</div>
								<h4 className="wz-text-base wz-font-semibold wz-text-wzrd-text wz-mb-1">
									Welcome back!
								</h4>
								<p className="wz-text-sm wz-text-wzrd-text-muted">{currentUser.email || 'User'}</p>
							</div>

							<div className="wz-bg-wzrd-surface-muted wz-rounded-lg wz-p-3 wz-border wz-border-wzrd-border">
								<div className="wz-flex wz-items-center wz-gap-2">
									<div className="wz-w-2 wz-h-2 wz-bg-wzrd-success wz-rounded-full"></div>
									<span className="wz-text-sm wz-text-wzrd-text wz-font-medium">
										Account Active
									</span>
								</div>
								<p className="wz-text-xs wz-text-wzrd-text-muted wz-mt-1">
									Signed in to {productName}. Manage your plan from your profile.
								</p>
							</div>

							{error && (
								<div className="wz-bg-red-50 wz-border wz-border-red-200 wz-rounded-lg wz-p-3">
									<div className="wz-flex wz-items-center">
										<svg
											className="wz-w-4 wz-h-4 wz-text-red-500 wz-mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span className="wz-text-sm wz-text-red-700">{error}</span>
									</div>
								</div>
							)}

							<button
								onClick={handleLogout}
								disabled={loading}
								className="wz-w-full wz-bg-red-600 wz-text-white wz-font-medium wz-py-2.5 wz-px-4 wz-rounded-lg wz-hover:bg-red-700 wz-focus:outline-none wz-focus:ring-2 wz-focus:ring-red-500 wz-focus:ring-offset-2 wz-disabled:opacity-50 wz-disabled:cursor-not-allowed wz-transition-colors wz-text-sm"
							>
								{loading ? (
									<div className="wz-flex wz-items-center wz-justify-center">
										<div className="wz-animate-spin wz-rounded-full wz-h-4 wz-w-4 wz-border-b-2 wz-border-white wz-mr-2"></div>
										Signing out...
									</div>
								) : (
									'Sign Out'
								)}
							</button>
						</div>
					) : (
						/* Login Form */
						<form onSubmit={handleSubmit} className="wz-space-y-4">
							{error && (
								<div className="wz-bg-red-50 wz-border wz-border-red-200 wz-rounded-lg wz-p-3">
									<div className="wz-flex wz-items-center">
										<svg
											className="wz-w-4 wz-h-4 wz-text-red-500 wz-mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span className="wz-text-sm wz-text-red-700">{error}</span>
									</div>
								</div>
							)}

							<div className="wz-space-y-3">
								<div>
									<label className="wz-block wz-text-sm wz-font-medium wz-text-slate-700 wz-mb-1">
										Email
									</label>
									<input
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="Enter your email"
										autoComplete="email"
										inputMode="email"
										disabled={loading}
										className="wz-w-full wz-bg-white wz-border wz-border-slate-300 wz-rounded-lg wz-px-3 wz-py-2.5 wz-text-sm wz-placeholder-slate-400 wz-focus:outline-none wz-focus:ring-2 wz-focus:ring-blue-500 wz-focus:border-blue-500 wz-disabled:bg-slate-50 wz-disabled:text-slate-500 wz-transition-colors wz-box-border"
									/>
								</div>

								<div>
									<div className="wz-flex wz-items-center wz-justify-between wz-mb-1">
										<label className="wz-block wz-text-sm wz-font-medium wz-text-slate-700">
											Password
										</label>
										<a
											href={`${sportswzrdBaseUrl}/forgot-password`}
											target="_blank"
											rel="noopener noreferrer"
											className="wz-text-xs wz-text-wzrd-primary hover:wz-text-wzrd-primary-hover hover:wz-underline wz-font-medium wz-transition-colors"
										>
											Forgot?
										</a>
									</div>
									<input
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Enter your password"
										autoComplete="current-password"
										disabled={loading}
										className="wz-w-full wz-bg-white wz-border wz-border-slate-300 wz-rounded-lg wz-px-3 wz-py-2.5 wz-text-sm wz-placeholder-slate-400 wz-focus:outline-none wz-focus:ring-2 wz-focus:ring-blue-500 wz-focus:border-blue-500 wz-disabled:bg-slate-50 wz-disabled:text-slate-500 wz-transition-colors wz-box-border"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={loading || !email.trim() || !password}
								className="wz-wzrd-btn-primary wz-w-full wz-py-2.5"
							>
								{loading ? (
									<div className="wz-flex wz-items-center wz-justify-center">
										<div className="wz-wzrd-spinner wz-h-4 wz-w-4 wz-border-white/30 wz-border-t-white wz-mr-2"></div>
										Signing in...
									</div>
								) : (
									'Sign in'
								)}
							</button>

							<button
								type="button"
								disabled={loading}
								onClick={handleGoogleLogin}
								className="wz-w-full wz-rounded-lg wz-border wz-border-slate-200 wz-bg-white wz-text-slate-800 wz-font-semibold wz-py-2.5 wz-shadow-sm hover:wz-shadow-md wz-transition wz-duration-200 wz-disabled:opacity-60 wz-flex wz-items-center wz-justify-center wz-gap-2"
							>
								<svg
									className="wz-w-5 wz-h-5"
									viewBox="0 0 18 18"
									aria-hidden="true"
									focusable="false"
								>
									<path
										fill="#EA4335"
										d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.55-2.48C13.57.89 11.46 0 9 0 5.48 0 2.44 2.02.96 4.96l2.97 2.31C4.52 5.09 6.57 3.48 9 3.48z"
									/>
									<path
										fill="#4285F4"
										d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.97c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.67-3.88 2.67-6.62z"
									/>
									<path
										fill="#FBBC05"
										d="M3.94 10.73A5.5 5.5 0 0 1 3.63 9c0-.6.11-1.18.3-1.73L.96 4.96A9.02 9.02 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.98-2.31z"
									/>
									<path
										fill="#34A853"
										d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.77.54-1.82.92-3.12.92-2.43 0-4.48-1.6-5.22-3.8L.96 13.04C2.44 15.98 5.48 18 9 18z"
									/>
								</svg>
								<span>{loading ? 'Working…' : 'Continue with Google'}</span>
							</button>

							<div className="wz-text-center wz-pt-1">
								<p className="wz-text-xs wz-text-slate-500">
									Don&apos;t have an account?{' '}
									<a
										href={`${sportswzrdBaseUrl}/login`}
										target="_blank"
										rel="noopener noreferrer"
										className="wz-text-wzrd-primary hover:wz-text-wzrd-primary-hover hover:wz-underline wz-font-medium wz-transition-colors"
									>
										Create one
									</a>
								</p>
							</div>
						</form>
					)}
				</div>
			</div>
		</WzrdModal>
	);
};
export default WzrdLoginForm;
