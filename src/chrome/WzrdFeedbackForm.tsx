import React, { useState } from 'react';
import { getSession } from '../auth/auth';
import { getKitConfig } from '../configure';
import {
	FEEDBACK_REASON_LABELS,
	FEEDBACK_REASONS,
	type FeedbackExtension,
	type FeedbackReason,
} from './feedbackConstants';

type Props = {
	extension: FeedbackExtension;
	authenticated: boolean;
};

export default function WzrdFeedbackForm({ extension, authenticated }: Props) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState<FeedbackReason | null>(null);
	const [text, setText] = useState('');
	const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
	const [error, setError] = useState<string | null>(null);

	const { sportswzrdBaseUrl } = getKitConfig();
	const version = chrome.runtime.getManifest().version;

	const reset = () => {
		setReason(null);
		setText('');
		setStatus('idle');
		setError(null);
	};

	const handleClose = () => {
		setOpen(false);
		reset();
	};

	const handleSubmit = async () => {
		if (!reason || status === 'submitting') return;
		setStatus('submitting');
		setError(null);

		try {
			const { session } = await getSession();
			if (!session?.access_token) {
				throw new Error('Please sign in to send feedback');
			}

			const res = await fetch(`${sportswzrdBaseUrl}/api/extension/feedback`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({
					reason,
					text: text.trim(),
					extension,
					extension_version: version,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message || 'Failed to send feedback');
			}

			setStatus('done');
		} catch (err) {
			setStatus('error');
			setError(err instanceof Error ? err.message : 'Something went wrong');
		}
	};

	if (!authenticated) {
		return (
			<button
				type="button"
				onClick={() => window.open(`${sportswzrdBaseUrl}/contact`, '_blank')}
				className="wz-w-full wz-px-3 wz-py-2 wz-text-xs wz-font-medium wz-text-gray-700 wz-bg-gray-50 hover:wz-bg-gray-100 wz-rounded-md wz-transition-colors wz-border wz-border-gray-200"
			>
				Send feedback
			</button>
		);
	}

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="wz-w-full wz-px-3 wz-py-2 wz-text-xs wz-font-medium wz-text-gray-700 wz-bg-gray-50 hover:wz-bg-gray-100 wz-rounded-md wz-transition-colors wz-border wz-border-gray-200"
			>
				Send feedback
			</button>
		);
	}

	return (
		<div className="wz-rounded-lg wz-border wz-border-gray-200 wz-bg-white wz-p-3 wz-space-y-3">
			<div className="wz-flex wz-items-center wz-justify-between">
				<div className="wz-text-sm wz-font-semibold wz-text-gray-800">Send feedback</div>
				<button
					type="button"
					onClick={handleClose}
					className="wz-text-xs wz-text-gray-500 hover:wz-text-gray-700"
				>
					Close
				</button>
			</div>

			{status === 'done' ? (
				<p className="wz-text-sm wz-text-green-700">Thanks — we got your feedback.</p>
			) : (
				<>
					<div className="wz-space-y-1.5">
						<p className="wz-text-xs wz-font-medium wz-text-gray-600">What&apos;s on your mind?</p>
						<div className="wz-flex wz-flex-col wz-gap-1">
							{FEEDBACK_REASONS.map((r) => (
								<button
									key={r}
									type="button"
									onClick={() => setReason(r)}
									disabled={status === 'submitting'}
									className={`wz-w-full wz-text-left wz-px-2.5 wz-py-1.5 wz-rounded-md wz-text-xs wz-transition-colors ${
										reason === r
											? 'wz-bg-blue-600 wz-text-white'
											: 'wz-bg-gray-50 wz-text-gray-700 hover:wz-bg-gray-100'
									}`}
								>
									{FEEDBACK_REASON_LABELS[r]}
								</button>
							))}
						</div>
					</div>

					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Optional details…"
						maxLength={2000}
						rows={3}
						disabled={status === 'submitting'}
						className="wz-w-full wz-text-xs wz-border wz-border-gray-200 wz-rounded-md wz-p-2 wz-resize-none focus:wz-outline-none focus:wz-ring-1 focus:wz-ring-blue-400"
					/>

					{error && <p className="wz-text-xs wz-text-red-600">{error}</p>}

					<button
						type="button"
						onClick={handleSubmit}
						disabled={!reason || status === 'submitting'}
						className="wz-w-full wz-px-3 wz-py-2 wz-text-xs wz-font-medium wz-text-white wz-bg-blue-600 hover:wz-bg-blue-700 disabled:wz-opacity-50 disabled:wz-cursor-not-allowed wz-rounded-md"
					>
						{status === 'submitting' ? 'Sending…' : 'Submit'}
					</button>
				</>
			)}
		</div>
	);
}
