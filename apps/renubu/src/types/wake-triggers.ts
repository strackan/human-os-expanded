/**
 * Wake Trigger Types
 *
 * Type definitions for the unified workflow trigger architecture.
 * Key insight: DATE and EVENTS are both "triggers" - when a trigger fires, the workflow wakes up.
 *
 * Phase 1.0: Trigger Framework Foundation
 */

// =====================================================
// Core Trigger Types
// =====================================================

/**
 * How multiple triggers should be combined
 * - 'OR': Wake when ANY trigger fires (default for backward compatibility)
 * - 'AND': Wake only when ALL triggers have fired
 */
export type TriggerLogic = 'OR' | 'AND';

/**
 * Unified trigger interface
 * All triggers (date and event) share this base structure
 */
export interface WakeTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

/**
 * Date trigger configuration
 * Fires when the specified date/time is reached
 */
export interface DateTriggerConfig {
  date: string; // ISO 8601 format (e.g., "2025-11-25T10:00:00Z")
  timezone?: string; // IANA timezone (e.g., "America/New_York"), defaults to UTC
}

/**
 * Event trigger configuration
 * Fires when the specified event occurs
 */
export interface EventTriggerConfig {
  eventType: EventType;
  eventConfig?: Record<string, unknown>; // Additional event-specific configuration
}

/**
 * Supported event types for workflow wake triggers
 */
export type EventType =
  | 'workflow_action_completed'   // When a specific workflow action is completed
  | 'customer_login'              // When customer logs into the platform
  | 'usage_threshold_crossed'     // When usage metrics cross a threshold
  | 'manual_event'                // Manual trigger by user/system
  // Human-OS External Wake Triggers (0.2.0)
  | 'company_funding_event'       // When company raises funding (from Human-OS)
  | 'contact_job_change'          // When contact changes jobs (from Human-OS)
  | 'linkedin_activity_spike'     // When contact has unusual LinkedIn activity (from Human-OS)
  | 'company_news_event'          // When company appears in news (from Human-OS)
  | 'relationship_opinion_added'; // When new opinion/insight is added (from Human-OS)

// =====================================================
// Trigger Evaluation Types
// =====================================================

/**
 * Result of evaluating a trigger
 * Used by TriggerEvaluator service
 */
export interface TriggerEvaluationResult {
  triggered: boolean;       // True if trigger condition is met
  evaluatedAt: string;      // ISO 8601 timestamp of evaluation
  reason?: string;          // Human-readable reason (for debugging/logging)
  error?: string;           // Error message if evaluation failed
}

// =====================================================
// Database Types
// =====================================================

/**
 * workflow_wake_triggers table row type
 * History and debugging log for trigger evaluations
 */
export interface WorkflowWakeTrigger {
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
 * Extended workflow execution type with trigger fields
 * (Augments existing WorkflowExecution type)
 */
export interface WorkflowExecutionWithTriggers {
  id: string;
  wake_triggers: WakeTrigger[];
  wake_trigger_logic?: TriggerLogic; // How to combine triggers (defaults to 'OR')
  last_evaluated_at: string | null;
  trigger_fired_at: string | null;
  fired_trigger_type: 'date' | 'event' | null;
  status: string;
  customer_id: string;
  user_id: string;
  // ... other workflow_executions columns
}

// =====================================================
// Event-Specific Configuration Types
// =====================================================

/**
 * Configuration for workflow_action_completed event
 */
export interface WorkflowActionCompletedConfig {
  workflowExecutionId: string;
  actionId?: string;          // Specific action to wait for (optional)
  actionType?: string;        // Type of action to wait for (optional)
}

/**
 * Configuration for usage_threshold_crossed event
 */
export interface UsageThresholdConfig {
  metricName: string;         // e.g., "active_users", "api_calls"
  threshold: number;          // Threshold value
  operator: '>' | '>=' | '<' | '<=';  // Comparison operator
}

/**
 * Configuration for manual_event trigger
 */
export interface ManualEventConfig {
  eventKey: string;           // Unique key to identify this manual trigger
  description?: string;       // Human-readable description
}

// =====================================================
// Human-OS External Event Configuration Types (0.2.0)
// =====================================================

/**
 * Configuration for company_funding_event trigger
 * Fires when a company raises funding
 */
export interface CompanyFundingEventConfig {
  companyName?: string;       // Company to watch (optional, uses workflow customer if not set)
  minAmount?: number;         // Minimum funding amount to trigger (in USD)
  fundingRounds?: string[];   // Specific rounds to watch (e.g., ['Series A', 'Series B'])
}

/**
 * Configuration for contact_job_change trigger
 * Fires when a contact changes jobs
 */
export interface ContactJobChangeConfig {
  contactName?: string;       // Contact to watch (optional)
  contactEmail?: string;      // Contact email to match
  watchedTitles?: string[];   // Specific titles to watch for (e.g., ['VP', 'Director'])
}

/**
 * Configuration for linkedin_activity_spike trigger
 * Fires when contact has unusual LinkedIn activity
 */
export interface LinkedInActivitySpikeConfig {
  contactName?: string;       // Contact to watch
  minPostsPerWeek?: number;   // Threshold for "spike" (default: 3)
}

/**
 * Configuration for company_news_event trigger
 * Fires when company appears in news
 */
export interface CompanyNewsEventConfig {
  companyName?: string;       // Company to watch
  keywords?: string[];        // Keywords to filter news (e.g., ['acquisition', 'layoff'])
  sentiment?: 'positive' | 'negative' | 'any';  // News sentiment filter
}

/**
 * Configuration for relationship_opinion_added trigger
 * Fires when new opinion/insight is added in Human-OS
 */
export interface RelationshipOpinionAddedConfig {
  entityType?: 'contact' | 'company' | 'any';  // What entity type to watch
  entityName?: string;        // Specific entity to watch
  opinionTypes?: string[];    // Types of opinions to watch (e.g., ['relationship_strength', 'risk'])
}

/**
 * External wake trigger event payload from Human-OS webhook
 */
export interface ExternalWakeEvent {
  eventId: string;            // Unique event ID from Human-OS
  eventType: EventType;       // Type of external event
  timestamp: string;          // When event occurred (ISO 8601)
  source: 'human_os';         // Source system
  payload: {
    companyName?: string;
    companyDomain?: string;
    contactName?: string;
    contactEmail?: string;
    details: Record<string, unknown>;
  };
}

/**
 * Stored external event for trigger matching
 */
export interface ExternalEventRecord {
  id: string;
  event_type: EventType;
  event_payload: ExternalWakeEvent['payload'];
  received_at: string;
  processed: boolean;
  matched_workflow_ids: string[];
  created_at: string;
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
export function isDateTrigger(trigger: WakeTrigger): trigger is WakeTrigger & { config: DateTriggerConfig } {
  return trigger.type === 'date' && isDateTriggerConfig(trigger.config);
}

/**
 * Type guard to check if trigger is an event trigger
 */
export function isEventTrigger(trigger: WakeTrigger): trigger is WakeTrigger & { config: EventTriggerConfig } {
  return trigger.type === 'event' && isEventTriggerConfig(trigger.config);
}
