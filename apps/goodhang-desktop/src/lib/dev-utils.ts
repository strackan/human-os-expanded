/**
 * Development utilities for testing onboarding flows
 *
 * Usage: Import and call from browser console or add to a dev menu
 */

import { getAllCompletionKeys } from './tutorial/steps';

/**
 * Reset all local onboarding progress for Founder OS
 * Clears localStorage items that track tutorial/onboarding state
 */
export function resetOnboarding() {
  // Get completion keys from config + other progress keys
  const itemsToRemove = [
    ...getAllCompletionKeys(),
    'founder-os-tutorial-progress',
    'founder-os-work-style-progress',
    'question-e-answers',
    'founder-os-welcome-seen',
    'goodhang-dnd-assessment-progress',
  ];

  itemsToRemove.forEach(key => {
    const had = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (had) {
      console.log(`[reset] Cleared: ${key}`);
    }
  });

  console.log('[reset] Onboarding state cleared. Refresh to restart flow.');
  return 'Onboarding reset complete. Refresh the app.';
}

/**
 * Show current onboarding state (for debugging)
 */
export function showOnboardingState() {
  const items = [
    ...getAllCompletionKeys(),
    'founder-os-tutorial-progress',
    'founder-os-work-style-progress',
    'question-e-answers',
    'founder-os-welcome-seen',
    'goodhang-dnd-assessment-progress',
  ];

  console.log('=== Onboarding State ===');
  items.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      } catch {
        console.log(`${key}:`, value);
      }
    } else {
      console.log(`${key}: (not set)`);
    }
  });
}

// Expose to window for easy console access in dev
if (typeof window !== 'undefined') {
  (window as any).devUtils = {
    resetOnboarding,
    showOnboardingState,
  };
}
