import React, { useEffect, useState } from 'react';
import { isValidCheckoutEmail } from './checkoutEmail';

export type WzrdCheckoutEmailPromptProps = {
	/** Whether the overlay is visible. */
	open: boolean;
	/** Called when the user cancels without submitting. */
	onCancel: () => void;
	/** Called with a trimmed, valid email. */
	onSubmit: (email: string) => void;
	/** Disables the continue button while checkout is opening. */
	submitting?: boolean;
	/** Prefills the field (signed-in email is not required for this prompt). */
	initialEmail?: string;
};

/**
 * Overlay that collects an email so checkout can run without a prior sign-in.
 * The backend checkout webhook creates the account when `create_account` is set.
 *
 * Render inside a `position: relative` ancestor (typically the pricing card).
 *
 * @param props - Open state, submit/cancel, and optional submit loading.
 */
export function WzrdCheckoutEmailPrompt({
	open,
	onCancel,
	onSubmit,
	submitting = false,
	initialEmail = '',
}: WzrdCheckoutEmailPromptProps) {
	const [email, setEmail] = useState(initialEmail);
	const [emailError, setEmailError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setEmail(initialEmail);
		setEmailError(null);
	}, [open, initialEmail]);

	if (!open) return null;

	/**
	 * Validates and submits the guest checkout email.
	 */
	const handleSubmit = () => {
		setEmailError(null);
		const trimmed = email.trim();
		if (!trimmed) {
			setEmailError('Please enter your email address');
			return;
		}
		if (!isValidCheckoutEmail(trimmed)) {
			setEmailError('Please enter a valid email address');
			return;
		}
		onSubmit(trimmed);
	};

	return (
		<div className="wz-absolute wz-inset-0 wz-z-50 wz-flex wz-items-center wz-justify-center wz-rounded-wzrd-lg wz-bg-black/80 wz-p-6 wz-backdrop-blur-sm">
			<div className="wz-wzrd-card wz-w-full wz-max-w-md wz-p-6 wz-shadow-wzrd-lg">
				<div className="wz-mb-5 wz-text-center">
					<h3 className="wz-m-0 wz-text-xl wz-font-bold wz-text-wzrd-text">Enter Your Email</h3>
					<p className="wz-m-0 wz-mt-1 wz-text-sm wz-text-wzrd-text-muted">
						We&apos;ll use this to set up your account
					</p>
				</div>

				<label className="wz-mb-2 wz-block wz-text-sm wz-font-semibold wz-text-wzrd-text">
					Email Address
				</label>
				<input
					type="email"
					value={email}
					autoFocus
					placeholder="your.email@example.com"
					onChange={(event) => {
						setEmail(event.target.value);
						setEmailError(null);
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							handleSubmit();
						}
					}}
					className="wz-box-border wz-w-full wz-max-w-full wz-rounded-lg wz-border-2 wz-border-wzrd-border wz-bg-white wz-px-4 wz-py-3 wz-text-wzrd-text placeholder:wz-text-wzrd-text-muted focus:wz-border-wzrd-primary focus:wz-outline-none"
				/>
				{emailError && (
					<p className="wz-mt-2 wz-m-0 wz-text-sm wz-font-medium wz-text-wzrd-danger">{emailError}</p>
				)}

				<div className="wz-mt-5 wz-flex wz-gap-3">
					<button type="button" className="wz-wzrd-btn-secondary wz-flex-1" onClick={onCancel}>
						Cancel
					</button>
					<button
						type="button"
						className="wz-wzrd-btn-primary wz-flex-1"
						disabled={submitting}
						onClick={handleSubmit}
					>
						{submitting ? 'Processing…' : 'Continue'}
					</button>
				</div>
			</div>
		</div>
	);
}
