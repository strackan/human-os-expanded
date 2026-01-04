/**
 * Escalate Trigger Types
 *
 * Type definitions for the unified workflow escalate trigger architecture.
 * Mirrors wake-triggers.ts and skip-triggers.ts architecture for escalate actions.
 * Key insight: DATE and EVENTS are both "triggers" - when a trigger fires, the escalated user is notified.
 *
 * Phase 1.2: Escalate Enhanced
 * Phase 1.4: Review Rejection Enhancement
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
// Core Escalate Trigger Types
// =====================================================

/**
 * Unified escalate trigger interface
 * All escalate triggers (date and event) share this base structure
 */
export interface EscalateTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

// =====================================================
// Review Status and Rejection Types (Phase 1.4)
// =====================================================

/**
 * Review status values
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
 * workflow_escalate_triggers table row type
 * History and debugging log for escalate trigger evaluations
 */
export interface WorkflowEscalateTrigger {
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
 * Extended workflow execution type with escalate trigger fields
 * (Augments existing WorkflowExecution type)
 * Updated in Phase 1.4 to include review rejection fields
 */
export interface WorkflowExecutionWithEscalateTriggers {
  id: string;
  escalate_triggers: EscalateTrigger[];
  escalate_trigger_logic?: TriggerLogic; // How to combine triggers (defaults to 'OR')
  escalate_last_evaluated_at: string | null;
  escalate_trigger_fired_at: string | null;
  escalate_fired_trigger_type: 'date' | 'event' | null;
  escalate_to_user_id: string | null;
  status: string;
  customer_id: string;
  user_id: string;
  escalate_reason?: string;
  escalated_at?: string;
  review_status?: ReviewStatus;
  review_iteration?: number;
  review_rejection_history?: ReviewRejectionHistory;
  // ... other workflow_executions columns
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
export function isDateEscalateTrigger(trigger: EscalateTrigger): trigger is EscalateTrigger & { config: DateTriggerConfig } {
  return trigger.type === 'date' && isDateTriggerConfig(trigger.config);
}

/**
 * Type guard to check if trigger is an event trigger
 */
export function isEventEscalateTrigger(trigger: EscalateTrigger): trigger is EscalateTrigger & { config: EventTriggerConfig } {
  return trigger.type === 'event' && isEventTriggerConfig(trigger.config);
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for POST /api/workflows/escalate-with-triggers
 */
export interface EscalateWithTriggersRequest {
  workflowId: string;
  triggers: EscalateTrigger[];
  logic?: TriggerLogic;
  escalateToUserId: string;
  reason?: string;
}

/**
 * Response from POST /api/workflows/escalate-with-triggers
 */
export interface EscalateWithTriggersResponse {
  success: boolean;
  message: string;
  workflowId: string;
  triggerCount: number;
  escalatedTo: string;
  willNotify: string; // Human-readable summary
}

/**
 * Request body for POST /api/workflows/resolve-now
 */
export interface ResolveNowRequest {
  workflowId: string;
  reason?: string;
}

/**
 * Response from POST /api/workflows/resolve-now
 */
export interface ResolveNowResponse {
  success: boolean;
  message: string;
  workflowId: string;
}

/**
 * Response from GET /api/workflows/escalated
 */
export interface EscalatedWorkflowsResponse {
  workflows: WorkflowExecutionWithEscalateTriggers[];
  count: number;
}

// =====================================================
// Review Rejection API Types (Phase 1.4)
// =====================================================

/**
 * Request body for POST /api/workflows/reject-review
 */
export interface RejectReviewRequest {
  workflowId: string;
  reason: string;
  comments?: string;
}

/**
 * Response from POST /api/workflows/reject-review
 */
export interface RejectReviewResponse {
  success: boolean;
  message: string;
  workflowId: string;
  iteration: number;
  rejectionEntry: RejectionHistoryEntry;
}

/**
 * Request body for POST /api/workflows/resubmit-after-rejection
 */
export interface ResubmitAfterRejectionRequest {
  workflowId: string;
  resubmissionNotes?: string;
}

/**
 * Response from POST /api/workflows/resubmit-after-rejection
 */
export interface ResubmitAfterRejectionResponse {
  success: boolean;
  message: string;
  workflowId: string;
  newIteration: number;
}
