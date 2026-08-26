/**
 * Content-script / popup Mixpanel entry. Sends TRACK_EVENT through the host bus.
 * Event names stay in each sport repo.
 */
import { getSession } from '../auth/auth';
import { getKitConfig } from '../configure';
import { wzrdKitLog } from '../log';
import type { MixpanelProperties } from './mixpanel';

/**
 * Fire-and-forget Mixpanel event from a content script, popup, or page.
 * The host service worker posts to Mixpanel.
 *
 * @param event - Event name defined by the host extension
 * @param properties - Event-specific properties (no PII; do not send email)
 */
export function trackEvent(event: string, properties: MixpanelProperties = {}): void {
	void trackEventAsync(event, properties);
}

/**
 * Sends a Mixpanel event through the typed background bus.
 *
 * @param event - Event name defined by the host extension
 * @param properties - Event-specific properties
 */
export async function trackEventAsync(
	event: string,
	properties: MixpanelProperties = {},
): Promise<void> {
	try {
		const { sendToBackground } = getKitConfig();
		const session = await getSession();
		await sendToBackground({
			type: 'TRACK_EVENT',
			event,
			properties: {
				...properties,
				authenticated: session.authenticated,
				...(session.user?.id ? { user_id: session.user.id } : {}),
			},
		});
	} catch (error) {
		wzrdKitLog('trackEvent failed', error);
	}
}
