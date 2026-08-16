import React, { useState } from 'react';
import clsx from 'clsx';
import { logout as authLogout, type WzrdUser, useAuth } from '../auth/auth';
import { SPORTS_WZRD_PRIMARY } from '../brand';
import WzrdLoginForm from './WzrdLoginForm';

export interface WzrdLoginButtonProps {
	/** Optional inline style for the trigger button (to match existing control bars) */
	style?: React.CSSProperties;
	/** Optional className for the trigger button */
	className?: string;
	/** Text for the trigger button when signed out */
	label?: string;
	/** Text for the trigger button when signed in */
	logoutLabel?: string;
	/** Called when login succeeds */
	onLoginSuccess?: (user: WzrdUser) => void;
	/** Called when login fails */
	onLoginError?: (error: string) => void;
	/** Called when logout succeeds */
	onLogoutSuccess?: () => void;
}

/**
 * Small wrapper that renders a button which opens the WzrdLoginForm as a modal.
 */
const WzrdLoginButton: React.FC<WzrdLoginButtonProps> = ({
	style,
	className = '',
	label = 'WZRD Login',
	logoutLabel = 'Log Out',
	onLoginSuccess,
	onLoginError,
	onLogoutSuccess,
}) => {
	const [open, setOpen] = useState(false);
	const { authenticated: isAuthenticated, isLoading: loading } = useAuth();

	const handleLogout = async () => {
		try {
			const resp = await authLogout();
			if (resp.ok) {
				// Force immediate state update as a fallback
				onLogoutSuccess?.();
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	const handleButtonClick = () => {
		if (isAuthenticated) {
			handleLogout();
		} else {
			setOpen(true);
		}
	};

	return (
		<>
			<button
				type="button"
				style={{ backgroundColor: SPORTS_WZRD_PRIMARY, border: 'none', ...style }}
				className={clsx(
					'wz-inline-flex wz-h-8 wz-cursor-pointer wz-border-0 wz-items-center wz-justify-center wz-whitespace-nowrap wz-rounded-full wz-px-4 wz-text-white wz-text-sm wz-font-semibold hover:wz-opacity-90',
					className,
				)}
				onClick={handleButtonClick}
				disabled={loading}
			>
				{loading ? (
					<div className="wz-flex wz-items-center wz-gap-1">
						<div className="wz-animate-spin wz-rounded-full wz-h-3 wz-w-3 wz-border-b wz-border-current"></div>
						{isAuthenticated ? 'Signing out...' : 'Loading...'}
					</div>
				) : isAuthenticated ? (
					logoutLabel
				) : (
					label
				)}
			</button>

			{!isAuthenticated && (
				<WzrdLoginForm
					open={open}
					onClose={() => setOpen(false)}
					onLoginSuccess={(user) => {
						onLoginSuccess?.(user);
						setOpen(false);
					}}
					onLoginError={onLoginError}
					onLogoutSuccess={onLogoutSuccess}
				/>
			)}
		</>
	);
};

export default WzrdLoginButton;
