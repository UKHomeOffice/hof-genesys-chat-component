/* 
 * Pure functional helpers for agent banner state.
 * All state is provided by the caller (React hook), not stored here.
 */

/**
 * Determines whether we should show the agent connected banner.
 * Uses the hook's ref, not module-level state.
 *
 * @param {React.<boolean>} hasShownRef
 * @returns {boolean} true if banner should be shown
 */
export const shouldShowAgentConnectedBanner = (hasShownRef) => {
  return hasShownRef.current === false;
};

/**
 * Resets the banner state by mutating the hook's ref.
 * Used on agent disconnect, or during tests.
 *
 * @param {React.<boolean>} hasShownRef
 */
export const resetAgentBannerState = (hasShownRef) => {
  hasShownRef.current = false;
};
