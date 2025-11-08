/**
 * Type definitions for Renubu domain objects
 * These mirror the types from the main Renubu application
 */

export interface WorkflowSummary {
  id: string;
  workflow_type: string;
  status: string;
  customer_id?: string;
  snoozed_until?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail extends WorkflowSummary {
  current_slide_index: number;
  workflow_data: any;
  tasks: TaskSummary[];
  actions: WorkflowAction[];
}

export interface TaskSummary {
  id: string;
  workflow_execution_id: string;
  title: string;
  description?: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  snoozed_until?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  id: string;
  workflow_execution_id: string;
  action_type: string;
  action_data: any;
  created_at: string;
}

export interface CheckInData {
  outcome: 'success' | 'partial' | 'failed';
  effectiveness_rating?: number; // 1-5
  what_worked?: string;
  what_didnt?: string;
  next_time_notes?: string;
}

export interface CreateWorkflowInput {
  workflow_type: string;
  customer_id?: string;
  workflow_data?: any;
}

export interface TaskFilters {
  status?: string;
  assigned_to?: string;
  customer_id?: string;
  due_before?: string;
}

export interface SnoozeWorkflowInput {
  workflow_id: string;
  snoozed_until: string; // ISO date string
  condition?: string;
  snooze_reason?: string;
}

export interface UpdateTaskStatusInput {
  task_id: string;
  status: string;
  notes?: string;
}
