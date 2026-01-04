/**
 * Review Trigger Types
 *
 * Type definitions for the unified workflow review trigger architecture.
 * Mirrors wake-triggers.ts and skip-triggers.ts architecture for review actions.
 * Key insight: DATE and EVENTS are both "triggers" - when a trigger fires, the reviewer is notified.
 *
 * Phase 1.2B: Review-Only Mode (converted from Escalate)
 * Review semantics: Original user keeps ownership but is blocked until reviewer approves.
 */

// Re-export shared types from wake-triggers
import type {
  TriggerLogic,
  DateTriggerConfig,
  EventTriggerConfig,
  EventType,
  TriggerEvaluationResult,
  WorkflowActionCompletedConfig,
  UsageThresholdConfig,
  ManualEventConfig,
} from './wake-triggers';

export type {
  TriggerLogic,
  DateTriggerConfig,
  EventTriggerConfig,
  EventType,
  TriggerEvaluationResult,
  WorkflowActionCompletedConfig,
  UsageThresholdConfig,
  ManualEventConfig,
};

// =====================================================
// Core Review Trigger Types
// =====================================================

/**
 * Unified review trigger interface
 * All review triggers (date and event) share this base structure
 */
export interface ReviewTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

// =====================================================
// Review Status and Rejection Types (Phase 1.4)
// =====================================================

/**
 * Status of a review request
 * Extended in Phase 1.4 to include 'rejected'
 */
export type ReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected';

/**
 * Single rejection history entry
 * Records one instance of a workflow or step being rejected
 */
export interface RejectionHistoryEntry {
  iteration: number;
  rejectedAt: string; // ISO 8601 timestamp
  rejectedBy: string; // User ID of reviewer who rejected
  reason: string; // Rejection reason/category
  comments?: string; // Optional detailed feedback
}

/**
 * Array of rejection history entries
 * Stored in review_rejection_history JSONB column
 */
export type ReviewRejectionHistory = RejectionHistoryEntry[];

// =====================================================
// Database Types
// =====================================================

/**
 * workflow_review_triggers table row type
 * History and debugging log for review trigger evaluations
 */
export interface WorkflowReviewTrigger {
  id: string;
  workflow_execution_id: string;
  trigger_type: 'date' | 'event';
  trigger_config: DateTriggerConfig | EventTriggerConfig;
  is_fired: boolean;
  evaluated_at: string | null;
  evaluation_count: number;
  fired_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended workflow execution type with review trigger fields
 * (Augments existing WorkflowExecution type)
 * Updated in Phase 1.4 to include review rejection fields
 */
export interface WorkflowExecutionWithReviewTriggers {
  id: string;
  review_triggers: ReviewTrigger[];
  review_trigger_logic?: TriggerLogic; // How to combine triggers (defaults to 'OR')
  review_last_evaluated_at: string | null;
  review_trigger_fired_at: string | null;
  review_fired_trigger_type: 'date' | 'event' | null;
  reviewer_id: string | null;
  review_status: ReviewStatus | null;
  review_requested_at: string | null;
  reviewed_at: string | null;
  reviewer_comments: string | null;
  review_iteration?: number; // Phase 1.4: Iteration tracking
  review_rejection_history?: ReviewRejectionHistory; // Phase 1.4: Rejection history
  status: string;
  customer_id: string;
  user_id: string;
  review_reason?: string;
  // ... other workflow_executions columns
}

/**
 * Extended step execution type with review fields
 * For per-step review requests
 */
export interface WorkflowStepWithReview {
  id: string;
  workflow_execution_id: string;
  step_index: number;
  review_required_from: string | null; // User ID who needs to review this step
  review_status: ReviewStatus | null;
  reviewed_at: string | null;
  reviewer_comments: string | null;
  // ... other workflow_step_executions columns
}

// =====================================================
// Helper Type Guards
// =====================================================

/**
 * Type guard to check if config is a DateTriggerConfig
 */
export function isDateTriggerConfig(config: unknown): config is DateTriggerConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'date' in config &&
    typeof (config as DateTriggerConfig).date === 'string'
  );
}

/**
 * Type guard to check if config is an EventTriggerConfig
 */
export function isEventTriggerConfig(config: unknown): config is EventTriggerConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'eventType' in config &&
    typeof (config as EventTriggerConfig).eventType === 'string'
  );
}

/**
 * Type guard to check if trigger is a date trigger
 */
export function isDateReviewTrigger(trigger: ReviewTrigger): trigger is ReviewTrigger & { config: DateTriggerConfig } {
  return trigger.type === 'date' && isDateTriggerConfig(trigger.config);
}

/**
 * Type guard to check if trigger is an event trigger
 */
export function isEventReviewTrigger(trigger: ReviewTrigger): trigger is ReviewTrigger & { config: EventTriggerConfig } {
  return trigger.type === 'event' && isEventTriggerConfig(trigger.config);
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for POST /api/workflows/request-review
 */
export interface RequestReviewWithTriggersRequest {
  workflowId: string;
  triggers: ReviewTrigger[];
  logic?: TriggerLogic;
  reviewerId: string; // User ID to request review from
  reason?: string;
}

/**
 * Response from POST /api/workflows/request-review
 */
export interface RequestReviewWithTriggersResponse {
  success: boolean;
  message: string;
  workflowId: string;
  triggerCount: number;
  reviewRequested: string; // Reviewer user ID or name
  willNotify: string; // Human-readable summary
}

/**
 * Request body for POST /api/workflows/approve-review
 */
export interface ApproveReviewRequest {
  workflowId: string;
  comments?: string;
  stepIndex?: number; // If reviewing specific step
}

/**
 * Response from POST /api/workflows/approve-review
 */
export interface ApproveReviewResponse {
  success: boolean;
  message: string;
  workflowId: string;
}

/**
 * Request body for POST /api/workflows/request-changes
 */
export interface RequestChangesRequest {
  workflowId: string;
  comments: string; // Required for requesting changes
  stepIndex?: number; // If reviewing specific step
}

/**
 * Response from POST /api/workflows/request-changes
 */
export interface RequestChangesResponse {
  success: boolean;
  message: string;
  workflowId: string;
}

/**
 * Response from GET /api/workflows/pending-review
 */
export interface PendingReviewWorkflowsResponse {
  workflows: WorkflowExecutionWithReviewTriggers[];
  count: number;
}

/**
 * Request body for POST /api/workflows/request-step-review
 */
export interface RequestStepReviewRequest {
  workflowExecutionId: string;
  stepIndex: number;
  reviewerId: string;
  reason?: string;
}

/**
 * Response from POST /api/workflows/request-step-review
 */
export interface RequestStepReviewResponse {
  success: boolean;
  message: string;
  stepIndex: number;
}

// =====================================================
// Backward Compatibility (Escalate → Review aliases)
// =====================================================

/**
 * @deprecated Use ReviewTrigger instead
 */
export type EscalateTrigger = ReviewTrigger;

/**
 * @deprecated Use RequestReviewWithTriggersRequest instead
 */
export type EscalateWithTriggersRequest = RequestReviewWithTriggersRequest;

/**
 * @deprecated Use RequestReviewWithTriggersResponse instead
 */
export type EscalateWithTriggersResponse = RequestReviewWithTriggersResponse;
