/**
 * Workflow Task Service
 *
 * Handles all task lifecycle operations with 7-day snooze enforcement:
 * - Task creation and assignment
 * - Snooze management (max 7 days from FIRST SNOOZE - HYBRID APPROACH)
 * - Task completion and skipping
 * - Reassignment/escalation
 * - Cross-workflow task retrieval
 *
 * Phase 3.3: Task State Management (HYBRID APPROACH)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types
// =====================================================

export type TaskType =
  | 'review_contract'
  | 'draft_email'
  | 'schedule_meeting'
  | 'analyze_usage'
  | 'prepare_proposal'
  | 'follow_up'
  | 'escalate'
  | 'update_crm'
  | 'get_transcript'
  | 'review_recommendation'
  | 'custom';

export type TaskCategory = 'ai_generated' | 'csm_manual' | 'system';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'snoozed'
  | 'completed'
  | 'skipped'
  | 'reassigned';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkflowTask {
  id: string;
  workflow_execution_id: string | null;
  step_execution_id: string | null;
  original_workflow_execution_id: string | null;
  customer_id: string;
  assigned_to: string;
  created_by: string;
  recommendation_id: string | null;
  task_type: TaskType;
  task_category: TaskCategory | null;
  action: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  first_snoozed_at: string | null; // HYBRID: When first snoozed (starts 7-day countdown)
  max_snooze_date: string | null; // HYBRID: first_snoozed_at + 7 days (set by trigger)
  snoozed_until: string | null;
  snooze_count: number;
  force_action: boolean;
  auto_skip_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  reassigned_from: string | null;
  reassigned_at: string | null;
  reassignment_reason: string | null;
  surfaced_in_workflows: string[];
  metadata: Record<string, any>;
  updated_at: string;
}

export interface CreateTaskParams {
  workflowExecutionId?: string;
  stepExecutionId?: string;
  originalWorkflowExecutionId?: string;
  customerId: string;
  assignedTo: string;
  createdBy: string;
  recommendationId?: string;
  taskType: TaskType;
  taskCategory?: TaskCategory;
  action: string;
  description: string;
  priority?: TaskPriority;
  metadata?: Record<string, any>;
}

export interface SnoozeTaskParams {
  taskId: string;
  snoozedUntil: Date;
}

export interface SnoozeValidationResult {
  isValid: boolean;
  error?: string;
  maxSnoozeDate?: Date;
  daysRemaining?: number;
}

export interface ReassignTaskParams {
  taskId: string;
  newAssignee: string;
  reason: string;
}

export interface PendingTask {
  task_id: string;
  task_type: TaskType;
  action: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  snoozed_until: string | null;
  force_action: boolean;
  days_until_deadline: number;
}

// =====================================================
// WorkflowTaskService
// =====================================================

export class WorkflowTaskService {
  /**
   * Create a new workflow task
   */
  static async createTask(
    params: CreateTaskParams,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const {
      workflowExecutionId,
      stepExecutionId,
      originalWorkflowExecutionId,
      customerId,
      assignedTo,
      createdBy,
      recommendationId,
      taskType,
      taskCategory,
      action,
      description,
      priority = 'medium',
      metadata = {}
    } = params;

    const { data, error} = await supabase
      .from('workflow_tasks')
      .insert({
        workflow_execution_id: workflowExecutionId || null,
        step_execution_id: stepExecutionId || null,
        original_workflow_execution_id: originalWorkflowExecutionId || null,
        customer_id: customerId,
        assigned_to: assignedTo,
        created_by: createdBy,
        recommendation_id: recommendationId || null,
        task_type: taskType,
        task_category: taskCategory || null,
        action,
        description,
        priority,
        status: 'pending',
        metadata
        // first_snoozed_at and max_snooze_date are set automatically by trigger when first snoozed
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a task by ID
   */
  static async getTask(
    taskId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask | null> {
    const { data, error } = await supabase
      .from('workflow_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate snooze request against 7-day max limit
   * HYBRID APPROACH: 7 days from FIRST SNOOZE
   */
  static async validateSnooze(
    taskId: string,
    requestedSnoozeUntil: Date,
    supabase: SupabaseClient
  ): Promise<SnoozeValidationResult> {
    const task = await this.getTask(taskId, supabase);

    if (!task) {
      return {
        isValid: false,
        error: 'Task not found'
      };
    }

    // HYBRID APPROACH: If task has never been snoozed, max_snooze_date is null
    // Trigger will set it to first_snoozed_at + 7 days when task is first snoozed
    if (!task.max_snooze_date) {
      // First snooze - always valid, trigger will set max_snooze_date
      return {
        isValid: true,
        daysRemaining: 7  // Will have 7 days from this snooze
      };
    }

    const maxSnoozeDate = new Date(task.max_snooze_date);
    const now = new Date();

    // Check if we're past the 7-day deadline
    if (now >= maxSnoozeDate) {
      return {
        isValid: false,
        error: 'Task has passed the 7-day snooze deadline (from first snooze). You must complete or skip this task.',
        maxSnoozeDate,
        daysRemaining: 0
      };
    }

    // Check if requested snooze date is beyond max_snooze_date
    if (requestedSnoozeUntil > maxSnoozeDate) {
      const daysRemaining = Math.ceil(
        (maxSnoozeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        isValid: false,
        error: `You can only snooze until ${maxSnoozeDate.toLocaleDateString()} (${daysRemaining} days remaining from first snooze). Please choose an earlier date.`,
        maxSnoozeDate,
        daysRemaining
      };
    }

    return {
      isValid: true,
      maxSnoozeDate,
      daysRemaining: Math.ceil(
        (maxSnoozeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * Snooze a task (enforces 7-day max limit)
   * HYBRID APPROACH: Trigger automatically sets first_snoozed_at, max_snooze_date, and increments snooze_count
   */
  static async snoozeTask(
    params: SnoozeTaskParams,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const { taskId, snoozedUntil } = params;

    // Validate snooze request
    const validation = await this.validateSnooze(taskId, snoozedUntil, supabase);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Update task - trigger will handle first_snoozed_at, max_snooze_date, and snooze_count
    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        status: 'snoozed',
        snoozed_until: snoozedUntil.toISOString()
        // Trigger automatically:
        // - Sets first_snoozed_at (if null)
        // - Sets max_snooze_date to first_snoozed_at + 7 days (if null)
        // - Increments snooze_count
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to snooze task: ${error.message}`);
    }

    return data;
  }

  /**
   * Complete a task
   */
  static async completeTask(
    taskId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }

    return data;
  }

  /**
   * Skip a task with reason
   */
  static async skipTask(
    taskId: string,
    reason: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        status: 'skipped',
        skipped_at: new Date().toISOString(),
        skip_reason: reason
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to skip task: ${error.message}`);
    }

    return data;
  }

  /**
   * Reassign a task to another user (escalation)
   */
  static async reassignTask(
    params: ReassignTaskParams,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const { taskId, newAssignee, reason } = params;

    // Get current task to capture current assignee
    const task = await this.getTask(taskId, supabase);

    if (!task) {
      throw new Error('Task not found');
    }

    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        assigned_to: newAssignee,
        reassigned_from: task.assigned_to,
        reassigned_at: new Date().toISOString(),
        reassignment_reason: reason,
        status: 'reassigned'
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reassign task: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all pending tasks for a customer (cross-workflow)
   */
  static async getPendingTasksForCustomer(
    customerId: string,
    supabase: SupabaseClient
  ): Promise<PendingTask[]> {
    const { data, error } = await supabase.rpc('get_pending_tasks_for_customer', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to fetch pending tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks assigned to a specific user
   */
  static async getTasksForUser(
    userId: string,
    supabase: SupabaseClient,
    includeCompleted = false
  ): Promise<WorkflowTask[]> {
    let query = supabase
      .from('workflow_tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (!includeCompleted) {
      query = query.in('status', ['pending', 'snoozed', 'in_progress']);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Surface a task in a new workflow execution
   * (Adds workflow_execution_id to surfaced_in_workflows array)
   */
  static async surfaceTaskInWorkflow(
    taskId: string,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    // Get current task
    const task = await this.getTask(taskId, supabase);

    if (!task) {
      throw new Error('Task not found');
    }

    // Add workflow execution to surfaced_in_workflows array
    const surfacedWorkflows = task.surfaced_in_workflows || [];
    if (!surfacedWorkflows.includes(workflowExecutionId)) {
      surfacedWorkflows.push(workflowExecutionId);
    }

    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        surfaced_in_workflows: surfacedWorkflows
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to surface task in workflow: ${error.message}`);
    }

    return data;
  }

  /**
   * Set force_action flag with configurable grace period (called when task passes 7-day deadline)
   * HYBRID APPROACH: Grace period configured per task type in task_type_config table
   */
  static async setForceAction(
    taskId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    // Get task to check task_type
    const task = await this.getTask(taskId, supabase);
    if (!task) {
      throw new Error('Task not found');
    }

    // Get task type configuration for grace period
    const { data: config } = await supabase
      .from('task_type_config')
      .select('auto_skip_enabled, auto_skip_grace_hours, requires_manual_escalation')
      .eq('task_type', task.task_type)
      .single();

    const graceHours = config?.auto_skip_grace_hours || 24;  // Default 24 hours
    const autoSkipEnabled = config?.auto_skip_enabled !== false;  // Default true

    const now = new Date();
    const autoSkipAt = autoSkipEnabled
      ? new Date(now.getTime() + graceHours * 60 * 60 * 1000)
      : null;

    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        force_action: true,
        auto_skip_at: autoSkipAt ? autoSkipAt.toISOString() : null
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set force action: ${error.message}`);
    }

    return data;
  }

  /**
   * Auto-skip a task (called by cron after grace period)
   * HYBRID APPROACH: Grace period varies by task type (24-48 hours)
   */
  static async autoSkipTask(
    taskId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    // Get task to determine grace period
    const task = await this.getTask(taskId, supabase);
    if (!task) {
      throw new Error('Task not found');
    }

    // Get task type configuration
    const { data: config } = await supabase
      .from('task_type_config')
      .select('auto_skip_grace_hours')
      .eq('task_type', task.task_type)
      .single();

    const graceHours = config?.auto_skip_grace_hours || 24;

    return this.skipTask(
      taskId,
      `Auto-skipped after ${graceHours}-hour warning period (no action taken)`,
      supabase
    );
  }

  /**
   * Get tasks that need force_action flag set
   * (Past 7-day deadline but not yet flagged)
   */
  static async getTasksRequiringForceAction(
    supabase: SupabaseClient
  ): Promise<WorkflowTask[]> {
    const { data, error } = await supabase.rpc('get_tasks_requiring_force_action');

    if (error) {
      throw new Error(`Failed to fetch tasks requiring force action: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks ready for auto-skip
   * (force_action = true and auto_skip_at has passed)
   */
  static async getTasksForAutoSkip(
    supabase: SupabaseClient
  ): Promise<WorkflowTask[]> {
    const { data, error } = await supabase.rpc('get_tasks_for_auto_skip');

    if (error) {
      throw new Error(`Failed to fetch tasks for auto-skip: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks with snoozed_until in the past (ready to resurface)
   */
  static async getSnoozedTasksToResurface(
    supabase: SupabaseClient
  ): Promise<WorkflowTask[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('workflow_tasks')
      .select('*')
      .eq('status', 'snoozed')
      .lte('snoozed_until', now);

    if (error) {
      throw new Error(`Failed to fetch snoozed tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Resurface a snoozed task (set status back to pending)
   */
  static async resurfaceTask(
    taskId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTask> {
    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({
        status: 'pending',
        snoozed_until: null
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resurface task: ${error.message}`);
    }

    return data;
  }
}
