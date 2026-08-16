import React, { useEffect, useState } from 'react';
import { getKitConfig, getKitStorage } from '../configure';

/**
 * One-time dismissible tip. Pass the durable storage key for this sport.
 */
export function WzrdWelcomeCallout({
	storageKey,
	title,
	body,
}: {
	storageKey: string;
	title?: string;
	body: string;
}) {
	const [visible, setVisible] = useState(false);
	const { productName } = getKitConfig();
	const storage = getKitStorage();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const dismissed = (await storage.get<boolean>(storageKey)) === true;
			if (!cancelled && !dismissed) {
				setVisible(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [storage, storageKey]);

	const onDismiss = async () => {
		setVisible(false);
		await storage.put(storageKey, true, undefined, 'durable');
	};

	if (!visible) return null;

	return (
		<div className="wz-font-sans wz-mb-3 wz-animate-wzrd-fade-in wz-rounded-wzrd-lg wz-border wz-border-wzrd-primary/25 wz-bg-wzrd-primary-soft wz-px-4 wz-py-3">
			<div className="wz-flex wz-items-start wz-justify-between wz-gap-3">
				<div className="wz-min-w-0">
					<p className="wz-m-0 wz-text-[11px] wz-font-bold wz-uppercase wz-tracking-wide wz-text-wzrd-primary">
						{productName}
					</p>
					<p className="wz-m-0 wz-mt-1 wz-text-sm wz-font-semibold wz-text-wzrd-text">
						{title ?? `You're set up — here's where ${productName} lives on this page`}
					</p>
					<p className="wz-m-0 wz-mt-1 wz-text-xs wz-leading-relaxed wz-text-wzrd-text-muted">
						{body}
					</p>
				</div>
				<button
					type="button"
					onClick={() => void onDismiss()}
					className="wz-shrink-0 wz-rounded-md wz-border-0 wz-bg-transparent wz-px-2 wz-py-1 wz-text-xs wz-font-semibold wz-text-wzrd-primary wz-cursor-pointer hover:wz-bg-white/60"
					aria-label={`Dismiss ${productName} welcome tip`}
				>
					Got it
				</button>
			</div>
		</div>
	);
}
