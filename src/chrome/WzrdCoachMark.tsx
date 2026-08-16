import React, { useEffect, useState } from 'react';
import { getKitStorage } from '../configure';

/**
 * One-time tip. Pass a durable storage key so each sport can version the mark independently.
 */
export function WzrdCoachMark({
	storageKey,
	title,
	body,
}: {
	storageKey: string;
	title: string;
	body: string;
}) {
	const [visible, setVisible] = useState(false);
	const storage = getKitStorage();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const seen = (await storage.get<boolean>(storageKey)) === true;
			if (!cancelled && !seen) {
				setVisible(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [storage, storageKey]);

	const dismiss = async () => {
		await storage.put(storageKey, true, undefined, 'durable');
		setVisible(false);
	};

	if (!visible) return null;

	return (
		<div className="wz-mt-3 wz-max-w-md wz-rounded-lg wz-border wz-border-wzrd-border wz-bg-white wz-p-3">
			<div className="wz-mb-1 wz-text-[13px] wz-font-semibold wz-text-wzrd-text">{title}</div>
			<div className="wz-mb-2.5 wz-text-xs wz-leading-relaxed wz-text-wzrd-text-muted">{body}</div>
			<div className="wz-flex wz-justify-end wz-gap-2">
				<button
					type="button"
					onClick={() => void dismiss()}
					className="wz-wzrd-btn-ghost wz-px-2.5 wz-py-1.5 wz-text-xs"
				>
					Dismiss
				</button>
				<button
					type="button"
					onClick={() => void dismiss()}
					className="wz-wzrd-btn-primary wz-px-3 wz-py-1.5 wz-text-xs"
				>
					Got it
				</button>
			</div>
		</div>
	);
}
