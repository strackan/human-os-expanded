/**
 * TaskMode - Runtime Feature Flag Router
 *
 * Uses React.lazy() to evaluate feature flags at RUNTIME, not build time.
 * This fixes the issue where NEXT_PUBLIC_* vars were baked in at build time.
 *
 * The previous implementation used:
 *   export default getTaskModeComponent();
 * Which was called ONCE at module load time, baking the component choice into the bundle.
 *
 * Now, the feature flag is checked inside the TaskModeRouter component,
 * which runs at render time, allowing proper runtime switching.
 */

'use client';

import React, { lazy, Suspense, ComponentType } from 'react';
import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';

// Props type matching all TaskMode implementations
interface TaskModeProps {
  workflowId: string;
  workflowTitle?: string;
  customerId: string;
  customerName: string;
  executionId?: string;
  userId?: string;
  workflowStatus?: string;
  onClose: (completed?: boolean) => void;
  onWorkflowAction?: (actionType: string) => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
  prefetchedGreeting?: string;
}

// Lazy load all versions - only the selected one will actually load
const TaskModeFullscreenV1 = lazy(() => import('./TaskModeFullscreen'));
const TaskModeFullscreenV2 = lazy(() => import('./TaskModeFullscreenV2'));
const TaskModeEncapsulated = lazy(() => import('./TaskModeEncapsulated'));
const TaskModeStepChat = lazy(() => import('./TaskModeStepChat'));

// Loading component for Suspense fallback (using createElement for .ts file)
function TaskModeLoading() {
  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center',
    },
    React.createElement(
      'div',
      { className: 'text-center text-gray-700' },
      React.createElement('div', {
        className:
          'inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4',
      }),
      React.createElement('p', null, 'Loading workflow...')
    )
  );
}

/**
 * Runtime router component - evaluates feature flags at render time
 *
 * Priority: StepChat > Encapsulated > V2 > V1
 */
function TaskModeRouter(props: TaskModeProps) {
  // Select component based on feature flags (evaluated at RUNTIME)
  let Component: ComponentType<TaskModeProps>;

  if (FEATURE_FLAGS.USE_STEP_CHAT_LAYOUT) {
    // Phase 7: v0-style collapsible step chat layout
    Component = TaskModeStepChat;
  } else if (FEATURE_FLAGS.USE_ENCAPSULATED_TASK_MODE) {
    Component = TaskModeEncapsulated;
  } else if (FEATURE_FLAGS.USE_MODULAR_TASK_MODE) {
    Component = TaskModeFullscreenV2;
  } else {
    Component = TaskModeFullscreenV1;
  }

  return React.createElement(
    Suspense,
    { fallback: React.createElement(TaskModeLoading) },
    React.createElement(Component, props)
  );
}

export default TaskModeRouter;

// Named exports for direct access (if needed for testing or specific use cases)
export { TaskModeFullscreenV1, TaskModeFullscreenV2, TaskModeEncapsulated, TaskModeStepChat };

// Always export context and hooks
export { default as TaskModeContext, useTaskModeContext } from './TaskModeContext';
export { useTaskModeState } from './hooks/useTaskModeState';
export { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';

// Re-export types
export type { TaskModeContextValue } from './TaskModeContext';
