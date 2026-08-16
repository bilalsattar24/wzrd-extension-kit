import React from 'react';
import clsx from 'clsx';
import { useAuth } from '../auth/auth';
import { getKitConfig } from '../configure';

/**
 * Button to the user's profile / subscription page. Only shown when signed in.
 */
export function WzrdProfileButton({
	style,
	className,
}: {
	style?: React.CSSProperties;
	className?: string;
}) {
	const { authenticated } = useAuth();
	const { sportswzrdBaseUrl } = getKitConfig();

	if (!authenticated) {
		return null;
	}

	const handleClick = () => {
		window.open(`${sportswzrdBaseUrl}/profile`, '_blank', 'noopener,noreferrer');
	};

	return (
		<button
			className={clsx(
				'wz-inline-flex wz-h-8 wz-cursor-pointer wz-border-0 wz-items-center wz-justify-center wz-whitespace-nowrap wz-rounded-full wz-bg-blue-600 wz-px-4 wz-text-white wz-text-sm wz-font-semibold hover:wz-bg-blue-700',
				className,
			)}
			onClick={handleClick}
			style={{ border: 'none', ...style }}
			title="Manage your WZRD plan and account settings"
		>
			Manage WZRD Plan
		</button>
	);
}
