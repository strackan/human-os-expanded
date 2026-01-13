/**
 * Automation Rules Types
 *
 * Type definitions for the Event-Driven Workflow Launcher architecture.
 * Pattern: "When [event] → Launch [workflow]"
 *
 * Phase 1.4: Automation Rules
 */

// Re-export shared trigger types from wake-triggers
import type {
  TriggerLogic,
  EventTriggerConfig,
  EventType,
} from './wake-triggers';

export type {
  TriggerLogic,
  EventTriggerConfig,
  EventType,
};

// =====================================================
// Event Condition Types
// =====================================================

/**
 * Event sources that can trigger automation rules
 */
export type EventSource =
  | 'gmail_received'           // New email received
  | 'gmail_sent'               // Email sent
  | 'calendar_event'           // Calendar event occurred
  | 'slack_message'            // Slack message received
  | 'customer_login'           // Customer logged into platform
  | 'usage_threshold'          // Usage metric crossed threshold
  | 'workflow_action_completed' // Workflow action completed
  | 'manual_event';            // Manual trigger

/**
 * Single event condition for automation rule
 * Max 2 conditions per rule, combined with AND/OR logic
 */
export interface EventCondition {
  id: string;
  source: EventSource;
  config: Record<string, unknown>;  // Event-specific configuration
}

// =====================================================
// Event Source Configuration Types
// =====================================================

/**
 * Configuration for gmail_received event
 */
export interface GmailReceivedConfig {
  from?: string;               // Filter by sender email
  subject?: string;            // Filter by subject keyword
  hasAttachment?: boolean;     // Filter by attachment presence
  labels?: string[];           // Filter by Gmail labels
}

/**
 * Configuration for calendar_event event
 */
export interface CalendarEventConfig {
  calendarId?: string;         // Specific calendar ID
  eventType?: 'meeting' | 'reminder' | 'all-day';
  attendeeEmail?: string;      // Filter by specific attendee
  titleContains?: string;      // Filter by title keyword
}

/**
 * Configuration for slack_message event
 */
export interface SlackMessageConfig {
  channelId?: string;          // Specific Slack channel
  fromUser?: string;           // Filter by user ID
  containsKeyword?: string;    // Filter by message content
  mentionsBot?: boolean;       // Filter by bot mention
}

/**
 * Configuration for customer_login event
 */
export interface CustomerLoginConfig {
  customerId?: string;         // Specific customer ID
  firstLoginOnly?: boolean;    // Only trigger on first login
}

/**
 * Configuration for usage_threshold event
 */
export interface UsageThresholdConfig {
  metricName: string;          // e.g., "active_users", "api_calls"
  threshold: number;           // Threshold value
  operator: '>' | '>=' | '<' | '<=';  // Comparison operator
}

/**
 * Configuration for workflow_action_completed event
 */
export interface WorkflowActionCompletedConfig {
  workflowConfigId?: string;   // Filter by workflow type
  actionId?: string;           // Filter by specific action
  actionType?: string;         // Filter by action type
}

// =====================================================
// Core Automation Rule Types
// =====================================================

/**
 * automation_rules table row type
 * Defines when and how to automatically launch workflows
 */
export interface AutomationRule {
  id: string;
  user_id: string;
  workflow_config_id: string;
  name: string;
  description: string | null;

  // Event conditions (max 2, with AND/OR logic)
  event_conditions: EventCondition[];
  logic_operator: TriggerLogic | null;

  // Workflow launch configuration
  assign_to_user_id: string | null;

  // Status and tracking
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * automation_rule_executions table row type
 * Audit trail for triggered automation rules
 */
export interface AutomationRuleExecution {
  id: string;
  automation_rule_id: string;
  workflow_execution_id: string | null;
  triggered_at: string;
  trigger_conditions: EventCondition[] | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

// =====================================================
// Input Types for CRUD Operations
// =====================================================

/**
 * Input for creating a new automation rule
 */
export interface CreateAutomationRuleInput {
  workflow_config_id: string;
  name: string;
  description?: string;
  event_conditions: EventCondition[];
  logic_operator?: TriggerLogic;  // Required if event_conditions.length > 1
  assign_to_user_id?: string;
  is_active?: boolean;
}

/**
 * Input for updating an automation rule
 */
export interface UpdateAutomationRuleInput {
  name?: string;
  description?: string;
  event_conditions?: EventCondition[];
  logic_operator?: TriggerLogic;
  assign_to_user_id?: string;
  is_active?: boolean;
}

// =====================================================
// Helper Type Guards
// =====================================================

/**
 * Type guard to check if config is a GmailReceivedConfig
 */
export function isGmailReceivedConfig(config: unknown): config is GmailReceivedConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    (('from' in config && typeof (config as GmailReceivedConfig).from === 'string') ||
     ('subject' in config && typeof (config as GmailReceivedConfig).subject === 'string') ||
     ('hasAttachment' in config && typeof (config as GmailReceivedConfig).hasAttachment === 'boolean'))
  );
}

/**
 * Type guard to check if config is a CalendarEventConfig
 */
export function isCalendarEventConfig(config: unknown): config is CalendarEventConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    (('calendarId' in config && typeof (config as CalendarEventConfig).calendarId === 'string') ||
     ('eventType' in config && typeof (config as CalendarEventConfig).eventType === 'string'))
  );
}

/**
 * Type guard to check if config is a SlackMessageConfig
 */
export function isSlackMessageConfig(config: unknown): config is SlackMessageConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    (('channelId' in config && typeof (config as SlackMessageConfig).channelId === 'string') ||
     ('fromUser' in config && typeof (config as SlackMessageConfig).fromUser === 'string'))
  );
}

/**
 * Type guard to check if config is a UsageThresholdConfig
 */
export function isUsageThresholdConfig(config: unknown): config is UsageThresholdConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'metricName' in config &&
    'threshold' in config &&
    'operator' in config &&
    typeof (config as UsageThresholdConfig).metricName === 'string' &&
    typeof (config as UsageThresholdConfig).threshold === 'number' &&
    typeof (config as UsageThresholdConfig).operator === 'string'
  );
}

/**
 * Type guard to check if config is a WorkflowActionCompletedConfig
 */
export function isWorkflowActionCompletedConfig(config: unknown): config is WorkflowActionCompletedConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    (('workflowConfigId' in config && typeof (config as WorkflowActionCompletedConfig).workflowConfigId === 'string') ||
     ('actionId' in config && typeof (config as WorkflowActionCompletedConfig).actionId === 'string'))
  );
}

/**
 * Type guard to check if event condition has valid structure
 */
export function isValidEventCondition(condition: unknown): condition is EventCondition {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    'id' in condition &&
    'source' in condition &&
    'config' in condition &&
    typeof (condition as EventCondition).id === 'string' &&
    typeof (condition as EventCondition).source === 'string' &&
    typeof (condition as EventCondition).config === 'object'
  );
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for POST /api/automation-rules
 */
export interface CreateAutomationRuleRequest {
  workflowConfigId: string;
  name: string;
  description?: string;
  eventConditions: EventCondition[];
  logicOperator?: TriggerLogic;
  assignToUserId?: string;
  isActive?: boolean;
}

/**
 * Response from POST /api/automation-rules
 */
export interface CreateAutomationRuleResponse {
  success: boolean;
  message: string;
  rule: AutomationRule;
}

/**
 * Request body for PATCH /api/automation-rules/:id
 */
export interface UpdateAutomationRuleRequest {
  name?: string;
  description?: string;
  eventConditions?: EventCondition[];
  logicOperator?: TriggerLogic;
  assignToUserId?: string;
  isActive?: boolean;
}

/**
 * Response from PATCH /api/automation-rules/:id
 */
export interface UpdateAutomationRuleResponse {
  success: boolean;
  message: string;
  rule: AutomationRule;
}

/**
 * Response from GET /api/automation-rules
 */
export interface ListAutomationRulesResponse {
  rules: AutomationRule[];
  count: number;
}

/**
 * Response from GET /api/automation-rules/:id
 */
export interface GetAutomationRuleResponse {
  rule: AutomationRule;
  recentExecutions?: AutomationRuleExecution[];
}

/**
 * Response from DELETE /api/automation-rules/:id
 */
export interface DeleteAutomationRuleResponse {
  success: boolean;
  message: string;
}

/**
 * Response from GET /api/automation-rules/:id/executions
 */
export interface GetAutomationRuleExecutionsResponse {
  executions: AutomationRuleExecution[];
  count: number;
  successRate: number;  // Percentage of successful executions
}

/**
 * Response from POST /api/automation-rules/:id/test
 */
export interface TestAutomationRuleResponse {
  success: boolean;
  message: string;
  wouldTrigger: boolean;
  matchedConditions: string[];
  workflowWouldLaunch: string; // workflow_config_id
}
