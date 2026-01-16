/**
 * Development utilities for testing onboarding flows
 *
 * Usage: Import and call from browser console or add to a dev menu
 */

/**
 * Reset all local onboarding progress for Founder OS
 * Clears localStorage items that track tutorial/onboarding state
 */
export function resetOnboarding() {
  const itemsToRemove = [
    'founder-os-tutorial-completed',
    'founder-os-tutorial-progress',
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
    'founder-os-tutorial-completed',
    'founder-os-tutorial-progress',
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
