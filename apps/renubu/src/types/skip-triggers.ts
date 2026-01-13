/**
 * Skip Trigger Types
 *
 * Type definitions for the unified workflow skip trigger architecture.
 * Mirrors wake-triggers.ts architecture for skip actions.
 * Key insight: DATE and EVENTS are both "triggers" - when a trigger fires, the workflow is reactivated.
 *
 * Phase 1.1: Skip Enhanced
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
// Core Skip Trigger Types
// =====================================================

/**
 * Unified skip trigger interface
 * All skip triggers (date and event) share this base structure
 */
export interface SkipTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

// =====================================================
// Database Types
// =====================================================

/**
 * workflow_skip_triggers table row type
 * History and debugging log for skip trigger evaluations
 */
export interface WorkflowSkipTrigger {
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
 * Extended workflow execution type with skip trigger fields
 * (Augments existing WorkflowExecution type)
 */
export interface WorkflowExecutionWithSkipTriggers {
  id: string;
  skip_triggers: SkipTrigger[];
  skip_trigger_logic?: TriggerLogic; // How to combine triggers (defaults to 'OR')
  skip_last_evaluated_at: string | null;
  skip_trigger_fired_at: string | null;
  skip_fired_trigger_type: 'date' | 'event' | null;
  status: string;
  customer_id: string;
  user_id: string;
  skip_reason?: string;
  skipped_at?: string;
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
export function isDateSkipTrigger(trigger: SkipTrigger): trigger is SkipTrigger & { config: DateTriggerConfig } {
  return trigger.type === 'date' && isDateTriggerConfig(trigger.config);
}

/**
 * Type guard to check if trigger is an event trigger
 */
export function isEventSkipTrigger(trigger: SkipTrigger): trigger is SkipTrigger & { config: EventTriggerConfig } {
  return trigger.type === 'event' && isEventTriggerConfig(trigger.config);
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for POST /api/workflows/skip-with-triggers
 */
export interface SkipWithTriggersRequest {
  workflowId: string;
  triggers: SkipTrigger[];
  logic?: TriggerLogic;
  reason?: string;
}

/**
 * Response from POST /api/workflows/skip-with-triggers
 */
export interface SkipWithTriggersResponse {
  success: boolean;
  message: string;
  workflowId: string;
  triggerCount: number;
  willReactivate: string; // Human-readable summary
}

/**
 * Request body for POST /api/workflows/reactivate-now
 */
export interface ReactivateNowRequest {
  workflowId: string;
  reason?: string;
}

/**
 * Response from POST /api/workflows/reactivate-now
 */
export interface ReactivateNowResponse {
  success: boolean;
  message: string;
  workflowId: string;
}

/**
 * Response from GET /api/workflows/skipped
 */
export interface SkippedWorkflowsResponse {
  workflows: WorkflowExecutionWithSkipTriggers[];
  count: number;
}
