/**
 * TaskMode - Feature Flag Router
 *
 * Routes between different TaskMode implementations based on feature flags.
 *
 * Available implementations:
 * - V1 (TaskModeFullscreen.tsx): Original monolithic component (1,151 lines)
 * - V2 (TaskModeFullscreenV2.tsx): Modular architecture with 6 child components (~350 lines)
 * - Encapsulated (TaskModeEncapsulated.tsx): Side-by-side chat + artifact per slide layout
 *
 * Feature flags:
 * - USE_MODULAR_TASK_MODE: false → V1, true → V2
 * - USE_ENCAPSULATED_TASK_MODE: true → Encapsulated (overrides above)
 *
 * Rollback: Set flags in .env.local
 */

import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';
import TaskModeFullscreenV1 from './TaskModeFullscreen';
import TaskModeFullscreenV2 from './TaskModeFullscreenV2';
import TaskModeEncapsulated from './TaskModeEncapsulated';

// Export the appropriate version based on feature flags
// Priority: Encapsulated > V2 > V1
const getTaskModeComponent = () => {
  if (FEATURE_FLAGS.USE_ENCAPSULATED_TASK_MODE) {
    return TaskModeEncapsulated;
  }
  if (FEATURE_FLAGS.USE_MODULAR_TASK_MODE) {
    return TaskModeFullscreenV2;
  }
  return TaskModeFullscreenV1;
};

export default getTaskModeComponent();

// Named exports for direct access
export { TaskModeFullscreenV1, TaskModeFullscreenV2, TaskModeEncapsulated };

// Always export context and hooks
export { default as TaskModeContext, useTaskModeContext } from './TaskModeContext';
export { useTaskModeState } from './hooks/useTaskModeState';
export { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';

// Re-export types
export type { TaskModeContextValue } from './TaskModeContext';
