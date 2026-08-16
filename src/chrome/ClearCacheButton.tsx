import React, { useState } from 'react';
import { getKitStorage } from '../configure';
import { WzrdModal } from '../WzrdModal';
import { WzrdTooltip } from '../WzrdTooltip';

/**
 * ClearCacheButton
 *
 * Renders a small broom button that clears the extension's cached data. Includes
 * a confirmation modal after clearing, and a rich tooltip describing when to use it.
 * Keeps durable prefs/league setup by default.
 */
type ClearCacheButtonProps = {
  clearUI?: () => void;
};
export function ClearCacheButton({ clearUI }: ClearCacheButtonProps) {
  const [isCacheCleared, setIsCacheCleared] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const clearCache = async () => {
    await getKitStorage().clear({ includeDurable: false });
    setIsCacheCleared(true);
    setIsModalOpen(true);
  };
  const handleClose = () => {
    setIsModalOpen(false);
    clearUI && clearUI();
  };
  return (
    <div className="wzrd">
      {!isCacheCleared && (
        <WzrdTooltip
          id="clear-cache"
          headerTitle="Clear WZRD Cache"
          place="bottom"
          width="wz-w-[420px]"
          maxWidth="wz-max-w-md"
          ariaLabel="Clear WZRD cache"
          trigger={
            <button
              className="wzrd Btn Btn-short Mend-med"
              id="wzrd-clear-cache-button"
              onClick={() => {
                void clearCache();
              }}
              style={{
                borderColor: '#e0e4e9',
                marginLeft: '5px',
                cursor: 'pointer',
                padding: '7px 9px',
                borderRadius: '10px',
              }}
            >
              🧹
            </button>
          }
        >
          <div className="wz-space-y-3">
            <p className="wz-text-sm">
              This removes locally cached data used by WZRD (player stats, schedules, API
              responses). League settings and preferences are kept. Use this
              <strong> only if you notice incorrect data or UI issues</strong>.
            </p>
            <ul className="wz-list-disc wz-pl-5 wz-space-y-1.5 wz-text-sm">
              <li>After clearing, please refresh the page to reload fresh data.</li>
              <li>Initial load may be slower right after clearing the cache.</li>
            </ul>
          </div>
        </WzrdTooltip>
      )}
      <WzrdModal isOpen={isModalOpen} onRequestClose={handleClose} width="420px" maxWidth="90vw">
        <div className="wz-bg-white dark:wz-bg-slate-800 wz-rounded-xl wz-border wz-border-slate-200 dark:wz-border-slate-700 wz-shadow-2xl wz-overflow-hidden wz-relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="wz-absolute wz-top-4 wz-right-4 wz-z-50 wz-bg-slate-100 dark:wz-bg-slate-700 wz-border wz-border-slate-200 dark:wz-border-slate-600 wz-cursor-pointer wz-text-slate-600 dark:wz-text-slate-200 hover:wz-text-slate-900 dark:hover:wz-text-white hover:wz-bg-slate-200 dark:hover:wz-bg-slate-600 wz-transition-all wz-duration-200 wz-p-2 wz-rounded-full"
            aria-label="Close modal"
          >
            <svg className="wz-w-5 wz-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="wz-p-8 wz-text-center">
            {/* Icon */}
            <div className="wz-inline-flex wz-items-center wz-justify-center wz-w-16 wz-h-16 wz-bg-emerald-100 dark:wz-bg-emerald-900/30 wz-rounded-full wz-mb-5">
              <svg
                className="wz-w-8 wz-h-8 wz-text-emerald-600 dark:wz-text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="wz-text-xl wz-font-bold wz-text-slate-900 dark:wz-text-white wz-mb-3">
              Cache Cleared Successfully
            </h3>

            {/* Body */}
            <div className="wz-space-y-3 wz-mb-6">
              <p className="wz-text-slate-700 dark:wz-text-slate-300 wz-text-base">
                WZRD cache has been cleared. Please refresh the page to reload fresh data.
              </p>
              <div className="wz-inline-flex wz-items-center wz-gap-2 wz-bg-amber-50 dark:wz-bg-amber-900/20 wz-border wz-border-amber-200 dark:wz-border-amber-800 wz-rounded-lg wz-px-4 wz-py-2.5">
                <svg
                  className="wz-w-5 wz-h-5 wz-text-amber-600 dark:wz-text-amber-400 wz-flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="wz-text-sm wz-text-amber-800 dark:wz-text-amber-200 wz-font-medium">
                  This should only be done if WZRD is experiencing issues.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="wz-flex wz-flex-col wz-gap-3">
              <button
                onClick={() => window.location.reload()}
                className="wz-w-full wz-px-5 wz-py-3 wz-bg-gradient-to-r wz-from-emerald-600 wz-to-emerald-500 hover:wz-from-emerald-700 hover:wz-to-emerald-600 wz-text-white wz-rounded-lg wz-font-bold wz-transition-all wz-cursor-pointer wz-shadow-lg"
              >
                <span className="wz-inline-flex wz-items-center wz-justify-center wz-gap-2">
                  <svg
                    className="wz-w-5 wz-h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Page
                </span>
              </button>
              <button
                onClick={handleClose}
                className="wz-w-full wz-px-5 wz-py-2.5 wz-bg-white dark:wz-bg-slate-800 wz-border wz-border-slate-300 dark:wz-border-slate-600 wz-text-slate-700 dark:wz-text-slate-300 hover:wz-bg-slate-50 dark:hover:wz-bg-slate-700 wz-rounded-lg wz-font-semibold wz-transition-all wz-cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </WzrdModal>
    </div>
  );
}
