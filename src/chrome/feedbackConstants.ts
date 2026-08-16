export const FEEDBACK_REASONS = [
	'not_useful',
	'too_expensive',
	'bugs',
	'missing_features',
	'switched_tool',
	'season_over',
	'other',
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
	not_useful: "Not getting enough value",
	too_expensive: 'Too expensive',
	bugs: 'Bugs / technical issues',
	missing_features: 'Missing features',
	switched_tool: 'Switched to another tool',
	season_over: 'Season over / not using fantasy',
	other: 'Other',
};

export type FeedbackExtension = 'basketball' | 'baseball' | 'football';
