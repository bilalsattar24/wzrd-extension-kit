import React, { useEffect, useState } from 'react';
import { getKitStorage } from '../configure';
import { WzrdStorageTtl } from '../storage/createWzrdStorage';
import { WzrdModal } from '../WzrdModal';

export type WzrdReleaseNote = {
	/** Short heading. */
	title: string;
	/** Body copy. */
	description: string;
	/** Host this note applies to. */
	platform: 'yahoo' | 'espn';
};

/**
 * Release notes modal. Apps pass notes and a version id so each sport can ship its own copy.
 */
export function WzrdReleaseNotes({
	platform,
	versionId,
	storageKey,
	notes,
}: {
	/** Host page context; those notes are listed first. */
	platform: 'yahoo' | 'espn';
	/** Version token stored after dismiss (e.g. `release-notes-v7`). */
	versionId: string;
	/** Durable storage key for seen version ids. */
	storageKey: string;
	/** Notes to show. */
	notes: WzrdReleaseNote[];
}) {
	const [isOpen, setIsOpen] = useState(false);
	const storage = getKitStorage();

	useEffect(() => {
		const checkSeen = async () => {
			const seenVersions = (await storage.get<string[]>(storageKey, [])) ?? [];
			if (!seenVersions.includes(versionId)) {
				setIsOpen(true);
			}
		};
		void checkSeen();
	}, [storage, storageKey, versionId]);

	const handleDismiss = async () => {
		const seenVersions = (await storage.get<string[]>(storageKey, [])) ?? [];
		if (!seenVersions.includes(versionId)) {
			seenVersions.push(versionId);
			await storage.put(storageKey, seenVersions, WzrdStorageTtl.OneYear, 'durable');
		}
		setIsOpen(false);
	};

	const yahooNotes = notes.filter((note) => note.platform === 'yahoo');
	const espnNotes = notes.filter((note) => note.platform === 'espn');
	const primaryNotes = platform === 'yahoo' ? yahooNotes : espnNotes;
	const secondaryNotes = platform === 'yahoo' ? espnNotes : yahooNotes;
	const primaryTitle = platform === 'yahoo' ? 'Yahoo' : 'ESPN';
	const secondaryTitle = platform === 'yahoo' ? 'ESPN' : 'Yahoo';

	return (
		<WzrdModal isOpen={isOpen} onRequestClose={() => void handleDismiss()} width="480px" maxWidth="92vw">
			<div className="wz-wzrd-card wz-p-5 wz-font-sans">
				<h2 className="wz-m-0 wz-text-lg wz-font-bold wz-text-wzrd-text">What&apos;s new</h2>
				{primaryNotes.length > 0 && (
					<div className="wz-mt-3">
						<p className="wz-m-0 wz-text-xs wz-font-semibold wz-uppercase wz-tracking-wide wz-text-wzrd-primary">
							{primaryTitle}
						</p>
						<ul className="wz-mt-2 wz-space-y-2 wz-pl-4">
							{primaryNotes.map((note) => (
								<li key={note.title}>
									<div className="wz-text-sm wz-font-semibold wz-text-wzrd-text">{note.title}</div>
									<p className="wz-m-0 wz-text-xs wz-text-wzrd-text-muted">{note.description}</p>
								</li>
							))}
						</ul>
					</div>
				)}
				{secondaryNotes.length > 0 && (
					<div className="wz-mt-4">
						<p className="wz-m-0 wz-text-xs wz-font-semibold wz-uppercase wz-tracking-wide wz-text-wzrd-text-muted">
							{secondaryTitle}
						</p>
						<ul className="wz-mt-2 wz-space-y-2 wz-pl-4">
							{secondaryNotes.map((note) => (
								<li key={note.title}>
									<div className="wz-text-sm wz-font-semibold wz-text-wzrd-text">{note.title}</div>
									<p className="wz-m-0 wz-text-xs wz-text-wzrd-text-muted">{note.description}</p>
								</li>
							))}
						</ul>
					</div>
				)}
				<button type="button" className="wz-wzrd-btn-primary wz-mt-4 wz-w-full" onClick={() => void handleDismiss()}>
					Got it
				</button>
			</div>
		</WzrdModal>
	);
}
