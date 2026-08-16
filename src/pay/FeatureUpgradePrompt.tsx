import React from 'react';

interface FeatureUpgradePromptProps {
	/** Feature name shown in the heading. */
	featureName: string;
	/** Short explanation of what Pro unlocks. */
	description: string;
	/** Called when the user chooses to upgrade. */
	onUpgrade: () => void;
	/** Extra classes on the wrapper. */
	className?: string;
	/** Compact single-row layout. */
	compact?: boolean;
}

/**
 * Feature-specific upgrade prompt component for contextual conversion
 * Shows when users try to access Pro features
 */
export const FeatureUpgradePrompt: React.FC<FeatureUpgradePromptProps> = ({
  featureName,
  description,
  onUpgrade,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`wz-bg-gradient-to-r wz-from-blue-50 wz-to-indigo-50 wz-border wz-border-blue-200 wz-rounded-lg wz-p-3 wz-text-center ${className}`}
      >
        <div className="wz-flex wz-items-center wz-justify-center wz-gap-2 wz-mb-2">
          <span className="wz-text-lg">🔒</span>
          <span className="wz-text-sm wz-font-bold wz-text-slate-800">
            {featureName} is Pro Only
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className="wz-bg-gradient-to-r wz-from-blue-500 wz-to-indigo-500 wz-text-white wz-px-4 wz-py-2 wz-rounded-lg wz-text-sm wz-font-bold wz-transition-all wz-duration-200 hover:wz-from-blue-600 hover:wz-to-indigo-600 hover:wz-scale-105"
        >
          🚀 Unlock Now
        </button>
      </div>
    );
  }

  return (
    <div
      className={`wz-bg-gradient-to-br wz-from-blue-50 wz-to-indigo-50 wz-border-2 wz-border-blue-200 wz-rounded-xl wz-p-4 wz-text-center wz-shadow-lg ${className}`}
    >
      <div className="wz-mb-3">
        <div className="wz-inline-flex wz-items-center wz-gap-2 wz-bg-blue-100 wz-px-3 wz-py-1 wz-rounded-full wz-mb-2">
          <span className="wz-text-lg">🔒</span>
          <span className="wz-text-sm wz-font-bold wz-text-blue-800">PRO FEATURE</span>
        </div>
        <h3 className="wz-text-lg wz-font-bold wz-text-slate-800 wz-mb-1">Unlock {featureName}</h3>
        <p className="wz-text-sm wz-text-slate-600">{description}</p>
      </div>

      <div className="wz-space-y-2">
        <button
          onClick={onUpgrade}
          className="wz-w-full wz-bg-gradient-to-r wz-from-blue-500 wz-to-indigo-500 wz-text-white wz-px-4 wz-py-3 wz-rounded-lg wz-font-bold wz-transition-all wz-duration-200 hover:wz-from-blue-600 hover:wz-to-indigo-600 hover:wz-scale-105 wz-shadow-md"
        >
          🚀 Get Pro
        </button>

        <div className="wz-flex wz-items-center wz-justify-center wz-gap-2 wz-text-xs wz-text-slate-500">
          <span>✅ 30-day guarantee</span>
          <span>•</span>
          <span>✅ Cancel anytime</span>
          <span>•</span>
          <span>✅ Instant access</span>
        </div>
      </div>

      {/* Social proof mini indicator */}
      <div className="wz-mt-3 wz-text-xs wz-text-slate-500">
        <div className="wz-flex wz-items-center wz-justify-center wz-gap-1">
          <div className="wz-w-1.5 wz-h-1.5 wz-bg-green-500 wz-rounded-full wz-animate-pulse"></div>
          <span>23 users upgraded to access this feature today</span>
        </div>
      </div>
    </div>
  );
};

export default FeatureUpgradePrompt;
