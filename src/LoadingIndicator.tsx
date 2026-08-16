import React from 'react';

type LoadingIndicatorProps = {
	/** Status copy announced to assistive tech. @defaultValue Loading… */
	label?: string;
	/** Extra classes on the outer wrapper. */
	className?: string;
};

/**
 * Centered spinner and status text for async panels.
 */
export function LoadingIndicator({
	label = 'Loading…',
	className = '',
}: LoadingIndicatorProps) {
	return (
		<div
			className={`wz-flex wz-flex-col wz-items-center wz-justify-center wz-gap-3 wz-py-8 wz-px-4 wz-font-sans ${className}`}
			role="status"
			aria-live="polite"
		>
			<div className="wz-wzrd-spinner wz-h-7 wz-w-7" />
			<p className="wz-m-0 wz-text-sm wz-font-medium wz-text-wzrd-text-muted">{label}</p>
		</div>
	);
}

export default LoadingIndicator;
