/**
 * TaskMode - Feature Flag Router
 *
 * Routes between V1 (monolithic) and V2 (modular) based on feature flag.
 *
 * V1 (TaskModeFullscreen.tsx): 1,151 lines - Original monolithic component
 * V2 (TaskModeFullscreenV2.tsx): ~350 lines - Modular architecture with 6 child components
 *
 * Feature flag: USE_MODULAR_TASK_MODE
 * - false (default): Use V1 for safety
 * - true: Use V2 for improved maintainability
 *
 * Rollback: Set NEXT_PUBLIC_USE_MODULAR_TASK_MODE=false in .env.local
 */

import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';
import TaskModeFullscreenV1 from './TaskModeFullscreen';
import TaskModeFullscreenV2 from './TaskModeFullscreenV2';

// Export the appropriate version based on feature flag
export default FEATURE_FLAGS.USE_MODULAR_TASK_MODE
  ? TaskModeFullscreenV2
  : TaskModeFullscreenV1;

// Always export context and hooks
export { default as TaskModeContext, useTaskModeContext } from './TaskModeContext';
export { useTaskModeState } from './hooks/useTaskModeState';
export { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';

// Re-export types
export type { TaskModeContextValue } from './TaskModeContext';
