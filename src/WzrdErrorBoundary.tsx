import React, { Component, ErrorInfo, ReactNode } from 'react';
import { wzrdKitLog } from './log';

export interface WzrdErrorBoundaryProps {
	/** Optional fallback UI to show when an error occurs. Defaults to a compact recovery card. */
	fallback?: ReactNode;
	/** Optional label to identify which component tree errored (for logging). */
	label?: string;
	/** Full product name in the default fallback copy. */
	productName?: string;
	children: ReactNode;
}

interface WzrdErrorBoundaryState {
	hasError: boolean;
}

/**
 * Catches errors in a child React tree, logs them, and renders a fallback
 * instead of crashing the host fantasy page.
 */
export class WzrdErrorBoundary extends Component<WzrdErrorBoundaryProps, WzrdErrorBoundaryState> {
	constructor(props: WzrdErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): WzrdErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const label = this.props.label ? ` [${this.props.label}]` : '';
		wzrdKitLog(`WzrdErrorBoundary${label} caught an error:`, error, errorInfo);
	}

	private handleRetry = () => {
		this.setState({ hasError: false });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback !== undefined) {
				return this.props.fallback;
			}
			const productName = this.props.productName ?? 'WZRD';
			return (
				<div className="wz-font-sans wz-my-3 wz-rounded-wzrd wz-border wz-border-wzrd-border wz-bg-wzrd-surface-muted wz-px-4 wz-py-3">
					<p className="wz-m-0 wz-text-sm wz-font-semibold wz-text-wzrd-text">
						Something went wrong in {productName}
					</p>
					<p className="wz-m-0 wz-mt-1 wz-text-xs wz-text-wzrd-text-muted">
						Your league page is fine — try reloading this section.
					</p>
					<button
						type="button"
						className="wz-wzrd-btn-ghost wz-mt-2 wz-px-0"
						onClick={this.handleRetry}
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
