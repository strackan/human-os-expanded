/**
 * Workflow Actions & Queries
 *
 * Exports:
 * - WorkflowActionService: Handle snooze/skip/escalate/complete actions
 * - WorkflowQueryService: Query workflows by state (active/snoozed/escalated)
 * - WorkflowStepActionService: Handle step-level snooze/skip actions
 * - createWorkflowExecution: Helper to create execution records for testing
 */

export {
  WorkflowActionService,
  createWorkflowActionService,
  type WorkflowStatus,
  type WorkflowActionType,
  type SnoozeOptions,
  type EscalateOptions,
  type SkipOptions,
  type RejectOptions,
  type LoseOptions,
  type WorkflowAction,
} from './WorkflowActionService';

export {
  WorkflowQueryService,
  createWorkflowQueryService,
  type WorkflowExecution,
  type WorkflowFilters,
} from './WorkflowQueryService';

export {
  createWorkflowExecution,
  getTestUserId,
  type CreateExecutionParams,
  type CreateExecutionResult,
} from './createWorkflowExecution';

export {
  WorkflowStepActionService,
  createWorkflowStepActionService,
  type StepSnoozeOptions,
  type StepSkipOptions,
  type StepState,
} from './WorkflowStepActionService';
