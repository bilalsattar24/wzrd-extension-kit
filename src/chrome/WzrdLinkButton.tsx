import React from 'react';
import { SPORTS_WZRD_PRIMARY } from '../brand';
import clsx from 'clsx';

interface WzrdLinkButtonProps {
	/** Click handler. */
	onClick: () => void;
	/** Button label. */
	label: string;
	/** Extra classes on the button. */
	className?: string;
	/** Inline styles. */
	style?: React.CSSProperties;
	/** When true, shows a NEW badge. */
	showNewBadge?: boolean;
}

/**
 * Pill button used on control bars for in-page actions.
 */
export const WzrdLinkButton: React.FC<WzrdLinkButtonProps> = ({
	onClick,
	label,
	className,
	style,
	showNewBadge,
	...props
}) => {
	return (
		<div style={{ position: 'relative', display: 'inline-block' }}>
			<button
				className={clsx(
					'wz-inline-flex wz-h-8 wz-cursor-pointer wz-border-0 wz-items-center wz-justify-center wz-whitespace-nowrap wz-rounded-full wz-px-4 wz-text-white wz-text-sm wz-font-semibold hover:wz-opacity-90',
					className,
				)}
				onClick={onClick}
				style={{ backgroundColor: SPORTS_WZRD_PRIMARY, border: 'none', ...style }}
				{...props}
			>
				{label}
			</button>
			{showNewBadge && (
				<div
					style={{
						position: 'absolute',
						top: '-10px',
						right: '-12px',
						backgroundColor: '#ff4d4f',
						color: 'white',
						padding: '2px 6px',
						borderRadius: '12px',
						fontSize: '11px',
						fontWeight: 'bold',
						lineHeight: '14px',
						boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
						border: '1.5px solid white',
						zIndex: 1,
					}}
				>
					NEW
				</div>
			)}
		</div>
	);
};
