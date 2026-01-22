/**
 * Feature Flags and Configuration
 *
 * Controls feature toggles for gradual rollouts and A/B testing.
 */

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  /**
   * Use the new v0-style WorkflowModeLayout instead of the legacy SetupSidebar layout.
   *
   * When enabled:
   * - Tutorial and Renubu Chat use WorkflowSidebar (280-450px)
   * - Chat messages appear in the sidebar, not main content
   * - Step actions (snooze/skip) available via step indicators
   * - Artifact panel always visible during workflows
   *
   * When disabled (default during transition):
   * - Legacy SetupSidebar (48-240px) with separate chat area
   * - Original tutorial and renubu-chat behavior
   *
   * Set VITE_USE_WORKFLOW_MODE_LAYOUT=true to enable.
   */
  USE_WORKFLOW_MODE_LAYOUT: import.meta.env.VITE_USE_WORKFLOW_MODE_LAYOUT === 'true',

  /**
   * Enable workflow state persistence (localStorage + Supabase sync).
   *
   * When enabled:
   * - Workflow progress auto-saves to localStorage
   * - Resume detection on page load
   * - Cross-device sync (when Supabase configured)
   *
   * Set VITE_ENABLE_WORKFLOW_PERSISTENCE=true to enable.
   */
  ENABLE_WORKFLOW_PERSISTENCE: import.meta.env.VITE_ENABLE_WORKFLOW_PERSISTENCE === 'true',

  /**
   * Enable step action features (snooze, skip).
   *
   * When enabled:
   * - Hover over steps to see action menu
   * - Snooze steps for later
   * - Skip non-required steps with reason
   *
   * Set VITE_ENABLE_STEP_ACTIONS=false to disable.
   */
  ENABLE_STEP_ACTIONS: import.meta.env.VITE_ENABLE_STEP_ACTIONS !== 'false',
} as const;

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

export const LAYOUT_CONFIG = {
  /**
   * Sidebar width constraints for WorkflowSidebar
   */
  sidebar: {
    minWidth: 280,
    maxWidth: 450,
    defaultWidth: 340,
    collapsedWidth: 48,
  },

  /**
   * Artifact panel width constraints
   */
  artifactPanel: {
    minWidth: 300,
    maxWidth: 600,
    defaultWidth: 400,
    collapsedWidth: 0,
  },

  /**
   * Animation durations (ms)
   */
  animations: {
    panelToggle: 200,
    messageAppear: 300,
    stepTransition: 200,
  },
} as const;

// =============================================================================
// PERSISTENCE CONFIGURATION
// =============================================================================

export const PERSISTENCE_CONFIG = {
  /**
   * localStorage key prefix for workflow state
   */
  localStorageKey: 'founder-os-workflow',

  /**
   * Debounce delay for auto-save (ms)
   */
  autoSaveDelay: 500,

  /**
   * Interval for server sync (ms)
   */
  syncInterval: 30000,
} as const;

// =============================================================================
// TUTORIAL CONFIGURATION
// =============================================================================

export const TUTORIAL_CONFIG = {
  /**
   * Default loading stages for tutorial operations
   */
  loadingStages: [
    { message: 'Thinking...', duration: 800 },
    { message: 'Preparing your profile...', duration: 1200 },
    { message: 'Almost there...', duration: 600 },
  ],

  /**
   * Loading stages for feedback processing
   */
  feedbackLoadingStages: [
    { message: 'Processing feedback...', duration: 600 },
    { message: 'Updating your profile...', duration: 1000 },
    { message: 'Finishing up...', duration: 400 },
  ],
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Features = typeof FEATURES;
export type LayoutConfig = typeof LAYOUT_CONFIG;
export type PersistenceConfig = typeof PERSISTENCE_CONFIG;
export type TutorialConfig = typeof TUTORIAL_CONFIG;
