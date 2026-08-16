import React, { memo, useEffect, useId, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable tooltip for content scripts.
 *
 * Avoids `react-tooltip` — under CRXJS Vite it can resolve a second React copy and
 * crash with "Cannot read properties of null (reading 'useState')".
 *
 * - `default`: rich panel with blue header + body (help / long copy)
 * - `compact`: small pill for short phrases (e.g. Me vs League column names)
 */
export type WzrdTooltipProps = {
	/** Unique identifier for the tooltip (kept for API parity with basketball) */
	id: string;
	/** Content for the tooltip header (default) or compact label text */
	headerTitle: string;
	/** Content for the tooltip body (ignored when size="compact") */
	children?: ReactNode;
	/** Placement relative to trigger */
	place?: 'top' | 'right' | 'bottom' | 'left';
	/** Optional className override for the trigger wrapper */
	className?: string;
	/** Custom trigger element - defaults to info icon */
	trigger?: ReactNode;
	/** Delay before showing tooltip in ms */
	delayShow?: number;
	/** Custom width class - defaults to wz-w-96 (default size only) */
	width?: string;
	/** Custom max-width class - defaults to wz-max-w-sm (default size only) */
	maxWidth?: string;
	/** Aria label for accessibility */
	ariaLabel?: string;
	/** Visual size — compact for short labels, default for rich help panels */
	size?: 'default' | 'compact';
};

function panelTransform(place: WzrdTooltipProps['place']): string {
	switch (place) {
		case 'bottom':
			return 'translate(-50%, 8px)';
		case 'left':
			return 'translate(calc(-100% - 8px), -50%)';
		case 'right':
			return 'translate(8px, -50%)';
		case 'top':
		default:
			return 'translate(-50%, calc(-100% - 8px))';
	}
}

function panelOrigin(
	place: WzrdTooltipProps['place'],
	rect: DOMRect,
): { top: number; left: number } {
	switch (place) {
		case 'bottom':
			return { top: rect.bottom, left: rect.left + rect.width / 2 };
		case 'left':
			return { top: rect.top + rect.height / 2, left: rect.left };
		case 'right':
			return { top: rect.top + rect.height / 2, left: rect.right };
		case 'top':
		default:
			return { top: rect.top, left: rect.left + rect.width / 2 };
	}
}

const WzrdTooltipBase: React.FC<WzrdTooltipProps> = ({
	id,
	headerTitle,
	children,
	place = 'right',
	className,
	trigger,
	delayShow = 150,
	width = 'wz-w-96',
	maxWidth = 'wz-max-w-sm',
	ariaLabel,
	size = 'default',
}) => {
	const reactId = useId();
	const tooltipDomId = `wzrd-tooltip-${id}-${reactId}`;
	const triggerRef = useRef<HTMLDivElement>(null);
	const showTimer = useRef<number | null>(null);
	const [open, setOpen] = useState(false);
	const [coords, setCoords] = useState({ top: 0, left: 0 });

	const clearShowTimer = () => {
		if (showTimer.current != null) {
			window.clearTimeout(showTimer.current);
			showTimer.current = null;
		}
	};

	const updatePosition = () => {
		const rect = triggerRef.current?.getBoundingClientRect();
		if (!rect) return;
		setCoords(panelOrigin(place, rect));
	};

	const show = () => {
		clearShowTimer();
		showTimer.current = window.setTimeout(() => {
			updatePosition();
			setOpen(true);
		}, delayShow);
	};

	const hide = () => {
		clearShowTimer();
		setOpen(false);
	};

	useEffect(() => {
		if (!open) return;
		const onScrollOrResize = () => updatePosition();
		window.addEventListener('scroll', onScrollOrResize, true);
		window.addEventListener('resize', onScrollOrResize);
		return () => {
			window.removeEventListener('scroll', onScrollOrResize, true);
			window.removeEventListener('resize', onScrollOrResize);
		};
	}, [open, place]);

	useEffect(() => () => clearShowTimer(), []);

	const defaultTrigger = (
		<span
			className="wz-ml-2 wz-inline-flex wz-items-center wz-justify-center wz-cursor-help wz-select-none"
			aria-label={ariaLabel || `${headerTitle} help`}
		>
			<span className="wz-text-base">ℹ️</span>
		</span>
	);

	const panel =
		size === 'compact' ? (
			<div
				className="wz-max-w-[14rem] wz-rounded-md wz-border wz-border-slate-200/80 wz-bg-white wz-px-2.5 wz-py-1.5 wz-text-xs wz-font-medium wz-leading-snug wz-text-slate-800 wz-font-sans wz-shadow-lg"
				style={{
					boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)',
				}}
			>
				<span className="wz-inline-flex wz-items-center wz-gap-1.5">
					<span className="wz-h-1.5 wz-w-1.5 wz-shrink-0 wz-rounded-full wz-bg-blue-600" />
					{headerTitle}
				</span>
			</div>
		) : (
			<div
				className={`${width} ${maxWidth} wz-rounded-xl wz-bg-gradient-to-br wz-from-slate-50 wz-to-white wz-border wz-border-slate-200/60 wz-shadow-2xl wz-backdrop-blur-sm wz-overflow-hidden wz-font-sans`}
				style={{
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				}}
			>
				<div className="wz-px-4 wz-py-3 wz-bg-gradient-to-r wz-from-blue-600 wz-to-indigo-600 wz-text-white">
					<div className="wz-flex wz-items-center wz-gap-2">
						<div className="wz-w-2 wz-h-2 wz-rounded-full wz-bg-white/80"></div>
						<div className="wz-text-sm wz-font-semibold wz-tracking-wide">{headerTitle}</div>
					</div>
				</div>
				{children != null && <div className="wz-px-4 wz-py-3 wz-text-slate-800">{children}</div>}
			</div>
		);

	return (
		<>
			<div
				ref={triggerRef}
				className={className}
				onMouseEnter={show}
				onMouseLeave={hide}
				onFocus={show}
				onBlur={hide}
				aria-describedby={open ? tooltipDomId : undefined}
			>
				{trigger ?? defaultTrigger}
			</div>
			{open &&
				createPortal(
					<div
						id={tooltipDomId}
						role="tooltip"
						style={{
							position: 'fixed',
							top: coords.top,
							left: coords.left,
							transform: panelTransform(place),
							zIndex: 1000010,
							pointerEvents: 'none',
						}}
					>
						{panel}
					</div>,
					document.body,
				)}
		</>
	);
};

const WzrdTooltip = memo(WzrdTooltipBase);
export default WzrdTooltip;
export { WzrdTooltip };
