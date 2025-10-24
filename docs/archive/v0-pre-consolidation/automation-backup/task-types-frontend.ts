/**
 * Frontend Task Type Definitions
 *
 * TypeScript interfaces for the task system that match the backend schema.
 * These types are used by React components and hooks.
 */

import type { Recommendation } from './recommendation-types';
import type { ActionId } from './action-types';

/**
 * Task Status
 * Matches backend workflow_tasks.status enum
 */
export type TaskStatus =
  | 'pending'      // Task created, not started
  | 'in_progress'  // CSM working on it
  | 'completed'    // Task finished
  | 'snoozed'      // Deferred for later
  | 'skipped'      // CSM chose to skip
  | 'cancelled';   // Task cancelled (e.g., no longer relevant)

/**
 * Task Type
 * Distinguishes between AI-generated vs CSM-owned tasks
 */
export type TaskType = 'AI_TASK' | 'CSM_TASK';

/**
 * Task Owner
 */
export type TaskOwner = 'AI' | 'CSM';

/**
 * Task Priority
 * 1 = Urgent, 5 = Low
 */
export type TaskPriority = 1 | 2 | 3 | 4 | 5;

/**
 * Workflow Task
 * Core task entity that lives in workflow_tasks table
 */
export interface WorkflowTask {
  id: string;

  // Relationships
  workflowExecutionId: string;
  stepExecutionId: string;
  customerId: string;
  originalWorkflowExecutionId?: string; // For cross-workflow tasks
  surfacedInWorkflowIds?: string[];     // Workflows that showed this task

  // Task identification
  taskType: TaskType;
  owner: TaskOwner;
  action: ActionId;
  description: string;

  // Associated recommendation
  recommendationId?: string;
  recommendationType?: string;

  // State
  status: TaskStatus;

  // Snooze tracking
  snoozedUntil?: Date;
  snoozeCount: number;
  firstSnoozedAt?: Date;    // When first snoozed (NEW - for 7-day limit)
  snoozeDeadline?: Date;    // 7 days from first snooze (NEW)
  requiresDecision: boolean; // Force user to choose (NEW)

  // Priority
  priority: TaskPriority;
  autoEscalate: boolean;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

/**
 * Task with embedded recommendation
 * Used in UI to show full context
 */
export interface TaskWithRecommendation extends WorkflowTask {
  recommendation?: Recommendation;
}

/**
 * Task Group
 * For organizing tasks by workflow or priority
 */
export interface TaskGroup {
  groupKey: string;
  groupLabel: string;
  tasks: WorkflowTask[];
  workflowName?: string;
  workflowStatus?: string;
}

/**
 * Pending Tasks Response
 * What the API returns for cross-workflow task queries
 */
export interface PendingTasksResponse {
  tasks: WorkflowTask[];
  groupedByWorkflow: Record<string, WorkflowTask[]>;
  totalCount: number;
}

/**
 * Task Action Request
 * What frontend sends when CSM takes action on task
 */
export interface TaskActionRequest {
  taskId: string;
  action: 'complete' | 'snooze' | 'skip' | 'cancel' | 'dismiss_without_choice';
  snoozedUntil?: Date;
  skipReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Task Creation Request
 * What frontend sends when creating task from recommendation
 */
export interface CreateTaskRequest {
  workflowExecutionId: string;
  stepExecutionId: string;
  customerId: string;
  taskType: TaskType;
  owner: TaskOwner;
  action: ActionId;
  description: string;
  recommendationId?: string;
  recommendationType?: string;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
}

/**
 * Snooze Eligibility
 * Determines if task can be snoozed and for how long
 */
export interface SnoozeEligibility {
  canSnooze: boolean;
  reason?: string;
  daysRemaining?: number;      // Days until snooze deadline
  deadlineReached: boolean;    // Has 7-day limit been hit?
  requiresDecision: boolean;   // Must user choose action vs skip?
}

/**
 * Task Statistics
 * Summary counts for dashboard/progress tracking
 */
export interface TaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  snoozedTasks: number;
  completedTasks: number;
  skippedTasks: number;
  tasksRequiringDecision: number;
}

/**
 * Helper: Calculate snooze eligibility
 */
export function calculateSnoozeEligibility(task: WorkflowTask): SnoozeEligibility {
  const now = new Date();

  // Check if task already requires decision (hit 7-day limit)
  if (task.requiresDecision) {
    return {
      canSnooze: false,
      reason: 'Task has reached 7-day snooze limit and requires decision',
      deadlineReached: true,
      requiresDecision: true
    };
  }

  // Check if task has a snooze deadline set
  if (task.snoozeDeadline) {
    const deadline = new Date(task.snoozeDeadline);
    const msRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        canSnooze: false,
        reason: 'Task has reached 7-day snooze limit',
        daysRemaining: 0,
        deadlineReached: true,
        requiresDecision: true
      };
    }

    return {
      canSnooze: true,
      daysRemaining: daysRemaining,
      deadlineReached: false,
      requiresDecision: false
    };
  }

  // First snooze - can snooze
  return {
    canSnooze: true,
    deadlineReached: false,
    requiresDecision: false
  };
}

/**
 * Helper: Calculate snooze deadline
 * Returns date 7 days from first snooze
 */
export function calculateSnoozeDeadline(firstSnoozedAt?: Date): Date {
  const baseDate = firstSnoozedAt || new Date();
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

/**
 * Helper: Calculate next snooze date
 * Always 1 week from now
 */
export function calculateNextSnoozeDate(): Date {
  const nextSnooze = new Date();
  nextSnooze.setDate(nextSnooze.getDate() + 7);
  return nextSnooze;
}

/**
 * Helper: Group tasks by workflow
 */
export function groupTasksByWorkflow(tasks: WorkflowTask[]): TaskGroup[] {
  const grouped: Record<string, WorkflowTask[]> = {};

  for (const task of tasks) {
    const key = task.workflowExecutionId || 'orphaned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  }

  return Object.entries(grouped).map(([workflowId, tasks]) => ({
    groupKey: workflowId,
    groupLabel: workflowId === 'orphaned' ? 'Tasks from Previous Workflows' : `Workflow ${workflowId}`,
    tasks
  }));
}

/**
 * Helper: Group tasks by priority
 */
export function groupTasksByPriority(tasks: WorkflowTask[]): TaskGroup[] {
  const grouped: Record<TaskPriority, WorkflowTask[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };

  for (const task of tasks) {
    grouped[task.priority].push(task);
  }

  const priorityLabels: Record<TaskPriority, string> = {
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Lowest'
  };

  return Object.entries(grouped)
    .filter(([_, tasks]) => tasks.length > 0)
    .map(([priority, tasks]) => ({
      groupKey: priority,
      groupLabel: priorityLabels[priority as unknown as TaskPriority],
      tasks
    }));
}

/**
 * Helper: Get task statistics
 */
export function getTaskStatistics(tasks: WorkflowTask[]): TaskStatistics {
  return {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    snoozedTasks: tasks.filter(t => t.status === 'snoozed').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    skippedTasks: tasks.filter(t => t.status === 'skipped').length,
    tasksRequiringDecision: tasks.filter(t => t.requiresDecision).length
  };
}

/**
 * Helper: Sort tasks by priority and date
 */
export function sortTasksByPriority(tasks: WorkflowTask[]): WorkflowTask[] {
  return [...tasks].sort((a, b) => {
    // First, sort by requiresDecision (true first)
    if (a.requiresDecision !== b.requiresDecision) {
      return a.requiresDecision ? -1 : 1;
    }

    // Then by priority (1 = highest)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // Then by created date (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
