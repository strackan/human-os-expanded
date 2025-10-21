/**
 * TaskMode - Modular Architecture
 *
 * This is the new refactored version of TaskModeFullscreen-v3.
 *
 * Export facade to maintain backward compatibility with existing imports.
 * Components can continue to import from the same path:
 *   import TaskModeFullscreen from '@/components/workflows/TaskModeFullscreen-v3'
 *
 * Will now resolve to the modular version.
 */

export { default } from './TaskModeFullscreen';
export { default as TaskModeContext, useTaskModeContext } from './TaskModeContext';
export { useTaskModeState } from './hooks/useTaskModeState';

// Re-export types
export type { TaskModeContextValue } from './TaskModeContext';
