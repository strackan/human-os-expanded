/**
 * Status Enums - Centralized status, priority, and severity constants
 *
 * This file consolidates all status-related string literals into TypeScript enums
 * to provide type safety, autocomplete, and prevent typos across the application.
 */

/**
 * Workflow Execution Status
 * Represents the lifecycle states of a workflow execution
 */
export enum WorkflowExecutionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  UNDERWAY = 'underway',
  COMPLETED = 'completed',
  COMPLETED_WITH_PENDING_TASKS = 'completed_with_pending_tasks',
  SNOOZED = 'snoozed',
  ABANDONED = 'abandoned',
  REJECTED = 'rejected',
  LOST = 'lost',
  SKIPPED = 'skipped',
  ESCALATED = 'escalated',
}

/**
 * Workflow Step Status
 * Represents the lifecycle states of individual workflow steps
 */
export enum WorkflowStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  SKIPPED = 'skipped',
}

/**
 * Task Status
 * Represents the lifecycle states of workflow tasks
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  SKIPPED = 'skipped',
  REASSIGNED = 'reassigned',
}

/**
 * Workflow Action Type
 * Available actions that can be performed on workflows
 */
export enum WorkflowActionType {
  SNOOZE = 'snooze',
  UNSNOOZE = 'unsnooze',
  SKIP = 'skip',
  ESCALATE = 'escalate',
  RESUME = 'resume',
  COMPLETE = 'complete',
  REJECT = 'reject',
  LOSE = 'lose',
  START = 'start',
}

/**
 * Priority Levels
 * Used for tasks, notifications, and workflow prioritization
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Severity Levels
 * Used for events, alerts, and issue tracking
 */
export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Risk Level
 * Used for customer risk assessment and workflow prioritization
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Notification Priority
 * Used specifically for notification system
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Type exports for backwards compatibility
export type WorkflowStatus =
  | WorkflowExecutionStatus.NOT_STARTED
  | WorkflowExecutionStatus.IN_PROGRESS
  | WorkflowExecutionStatus.UNDERWAY
  | WorkflowExecutionStatus.COMPLETED
  | WorkflowExecutionStatus.COMPLETED_WITH_PENDING_TASKS
  | WorkflowExecutionStatus.SNOOZED
  | WorkflowExecutionStatus.ABANDONED
  | WorkflowExecutionStatus.REJECTED
  | WorkflowExecutionStatus.LOST
  | WorkflowExecutionStatus.SKIPPED
  | WorkflowExecutionStatus.ESCALATED;

export type StepStatus =
  | WorkflowStepStatus.PENDING
  | WorkflowStepStatus.IN_PROGRESS
  | WorkflowStepStatus.COMPLETED
  | WorkflowStepStatus.SNOOZED
  | WorkflowStepStatus.SKIPPED;

export type TaskStatusType =
  | TaskStatus.PENDING
  | TaskStatus.IN_PROGRESS
  | TaskStatus.COMPLETED
  | TaskStatus.SNOOZED
  | TaskStatus.SKIPPED
  | TaskStatus.REASSIGNED;

export type PriorityLevel =
  | Priority.LOW
  | Priority.NORMAL
  | Priority.MEDIUM
  | Priority.HIGH
  | Priority.URGENT;

export type SeverityLevel =
  | Severity.INFO
  | Severity.LOW
  | Severity.MEDIUM
  | Severity.HIGH
  | Severity.WARNING
  | Severity.ERROR
  | Severity.CRITICAL;
