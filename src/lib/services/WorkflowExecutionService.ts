/**
 * Workflow Execution Service
 *
 * Manages workflow execution state in the database.
 * Tracks overall workflow progress and individual step completions.
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus, type WorkflowStatus } from '@/lib/constants/status-enums';

/**
 * Workflow Execution record
 */
export interface WorkflowExecution {
  id: string;
  workflow_config_id: string;
  workflow_name: string;
  workflow_type?: string;
  customer_id: string;
  user_id: string;
  status: WorkflowStatus;
  current_step_id?: string;
  current_step_index: number;
  total_steps: number;
  completed_steps_count: number;
  skipped_steps_count: number;
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
  snoozed_until?: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Step Execution record
 */
export interface StepExecution {
  id: string;
  workflow_execution_id: string;
  step_id: string;
  step_index: number;
  step_title: string;
  step_type?: string;
  status: WorkflowStatus;
  branch_path: string[];
  metadata: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Full execution with step history
 */
export interface WorkflowExecutionWithSteps extends WorkflowExecution {
  step_executions: StepExecution[];
}

export class WorkflowExecutionService {
  /**
   * Create a new workflow execution
   */
  static async createExecution(params: {
    workflowConfigId: string;
    workflowName: string;
    workflowType?: string;
    customerId: string;
    userId: string;
    totalSteps: number;
  }, supabaseClient?: SupabaseClient): Promise<WorkflowExecution> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .insert({
<<<<<<< HEAD
        [DB_COLUMNS.WORKFLOW_CONFIG_ID]: params.workflowConfigId,
        [DB_COLUMNS.WORKFLOW_NAME]: params.workflowName,
        [DB_COLUMNS.WORKFLOW_TYPE]: params.workflowType,
        [DB_COLUMNS.CUSTOMER_ID]: params.customerId,
        [DB_COLUMNS.USER_ID]: params.userId,
        [DB_COLUMNS.TOTAL_STEPS]: params.totalSteps,
        [DB_COLUMNS.STATUS]: 'not_started',
        [DB_COLUMNS.CURRENT_STEP_INDEX]: 0,
        [DB_COLUMNS.COMPLETED_STEPS_COUNT]: 0,
        [DB_COLUMNS.SKIPPED_STEPS_COUNT]: 0,
        [DB_COLUMNS.COMPLETION_PERCENTAGE]: 0,
=======
        workflow_config_id: params.workflowConfigId,
        workflow_name: params.workflowName,
        workflow_type: params.workflowType,
        customer_id: params.customerId,
        user_id: params.userId,
        total_steps: params.totalSteps,
        status: WorkflowExecutionStatus.NOT_STARTED,
        current_step_index: 0,
        completed_steps_count: 0,
        skipped_steps_count: 0,
        completion_percentage: 0,
>>>>>>> phase-0.2/agent-2-status-enums
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow execution:', error);
      throw new Error(`Failed to create workflow execution: ${error.message}`);
    }

    return data as WorkflowExecution;
  }

  /**
   * Get a workflow execution by ID with step history
   */
  static async getExecution(
    executionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<WorkflowExecutionWithSteps | null> {
    const supabase = supabaseClient || createClient();

    // Get main execution
    const { data: execution, error: execError } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .select('*')
      .eq(DB_COLUMNS.ID, executionId)
      .single();

    if (execError) {
      if (execError.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching workflow execution:', execError);
      throw new Error(`Failed to fetch workflow execution: ${execError.message}`);
    }

    // Get step executions
    const { data: steps, error: stepsError } = await supabase
      .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
      .select('*')
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, executionId)
      .order(DB_COLUMNS.STEP_INDEX, { ascending: true });

    if (stepsError) {
      console.error('Error fetching step executions:', stepsError);
      throw new Error(`Failed to fetch step executions: ${stepsError.message}`);
    }

    return {
      ...execution,
      step_executions: steps || []
    } as WorkflowExecutionWithSteps;
  }

  /**
   * Update step progress (create or update step execution, track branch path)
   */
  static async updateStepProgress(params: {
    executionId: string;
    stepId: string;
    stepIndex: number;
    stepTitle: string;
    stepType?: string;
    branchValue?: string;
    metadata?: Record<string, any>;
  }, supabaseClient?: SupabaseClient): Promise<StepExecution> {
    const supabase = supabaseClient || createClient();

    // Check if step execution already exists
    const { data: existing } = await supabase
      .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
      .select('*')
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, params.executionId)
      .eq(DB_COLUMNS.STEP_ID, params.stepId)
      .single();

    let stepExecution: StepExecution;

    if (existing) {
      // Update existing step execution
      const updatedBranchPath = params.branchValue
        ? [...existing.branch_path, params.branchValue]
        : existing.branch_path;

      const { data, error } = await supabase
        .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
        .update({
<<<<<<< HEAD
          [DB_COLUMNS.BRANCH_PATH]: updatedBranchPath,
          [DB_COLUMNS.METADATA]: { ...existing.metadata, ...params.metadata },
          [DB_COLUMNS.STATUS]: 'in_progress'
=======
          branch_path: updatedBranchPath,
          metadata: { ...existing.metadata, ...params.metadata },
          status: WorkflowExecutionStatus.IN_PROGRESS
>>>>>>> phase-0.2/agent-2-status-enums
        })
        .eq(DB_COLUMNS.ID, existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating step execution:', error);
        throw new Error(`Failed to update step execution: ${error.message}`);
      }

      stepExecution = data as StepExecution;
    } else {
      // Create new step execution
      const { data, error } = await supabase
        .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
        .insert({
<<<<<<< HEAD
          [DB_COLUMNS.WORKFLOW_EXECUTION_ID]: params.executionId,
          [DB_COLUMNS.STEP_ID]: params.stepId,
          [DB_COLUMNS.STEP_INDEX]: params.stepIndex,
          [DB_COLUMNS.STEP_TITLE]: params.stepTitle,
          [DB_COLUMNS.STEP_TYPE]: params.stepType,
          [DB_COLUMNS.STATUS]: 'in_progress',
          [DB_COLUMNS.BRANCH_PATH]: params.branchValue ? [params.branchValue] : [],
          [DB_COLUMNS.METADATA]: params.metadata || {},
          [DB_COLUMNS.STARTED_AT]: new Date().toISOString()
=======
          workflow_execution_id: params.executionId,
          step_id: params.stepId,
          step_index: params.stepIndex,
          step_title: params.stepTitle,
          step_type: params.stepType,
          status: WorkflowExecutionStatus.IN_PROGRESS,
          branch_path: params.branchValue ? [params.branchValue] : [],
          metadata: params.metadata || {},
          started_at: new Date().toISOString()
>>>>>>> phase-0.2/agent-2-status-enums
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating step execution:', error);
        throw new Error(`Failed to create step execution: ${error.message}`);
      }

      stepExecution = data as StepExecution;

      // Update workflow execution: set current step and status
      await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
<<<<<<< HEAD
          [DB_COLUMNS.CURRENT_STEP_ID]: params.stepId,
          [DB_COLUMNS.CURRENT_STEP_INDEX]: params.stepIndex,
          [DB_COLUMNS.STATUS]: 'in_progress',
          [DB_COLUMNS.STARTED_AT]: new Date().toISOString()
        })
        .eq(DB_COLUMNS.ID, params.executionId)
        .eq(DB_COLUMNS.STATUS, 'not_started'); // Only update if not yet started
=======
          current_step_id: params.stepId,
          current_step_index: params.stepIndex,
          status: WorkflowExecutionStatus.IN_PROGRESS,
          started_at: new Date().toISOString()
        })
        .eq('id', params.executionId)
        .eq('status', WorkflowExecutionStatus.NOT_STARTED); // Only update if not yet started
>>>>>>> phase-0.2/agent-2-status-enums
    }

    return stepExecution;
  }

  /**
   * Mark a step as completed
   */
  static async completeStep(params: {
    executionId: string;
    stepId: string;
  }, supabaseClient?: SupabaseClient): Promise<void> {
    const supabase = supabaseClient || createClient();

    // Update step execution
    const { error: stepError } = await supabase
      .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
      .update({
<<<<<<< HEAD
        [DB_COLUMNS.STATUS]: 'completed',
        [DB_COLUMNS.COMPLETED_AT]: new Date().toISOString()
=======
        status: WorkflowExecutionStatus.COMPLETED,
        completed_at: new Date().toISOString()
>>>>>>> phase-0.2/agent-2-status-enums
      })
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, params.executionId)
      .eq(DB_COLUMNS.STEP_ID, params.stepId);

    if (stepError) {
      console.error('Error completing step:', stepError);
      throw new Error(`Failed to complete step: ${stepError.message}`);
    }

    // Recalculate workflow completion
    await this.recalculateCompletion(params.executionId, supabase);
  }

  /**
   * Mark a step as skipped
   */
  static async skipStep(params: {
    executionId: string;
    stepId: string;
    stepIndex: number;
    stepTitle: string;
  }, supabaseClient?: SupabaseClient): Promise<void> {
    const supabase = supabaseClient || createClient();

    // Upsert step execution with skipped status
    const { error } = await supabase
      .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
      .upsert({
<<<<<<< HEAD
        [DB_COLUMNS.WORKFLOW_EXECUTION_ID]: params.executionId,
        [DB_COLUMNS.STEP_ID]: params.stepId,
        [DB_COLUMNS.STEP_INDEX]: params.stepIndex,
        [DB_COLUMNS.STEP_TITLE]: params.stepTitle,
        [DB_COLUMNS.STATUS]: 'skipped',
        [DB_COLUMNS.COMPLETED_AT]: new Date().toISOString()
=======
        workflow_execution_id: params.executionId,
        step_id: params.stepId,
        step_index: params.stepIndex,
        step_title: params.stepTitle,
        status: WorkflowExecutionStatus.SKIPPED,
        completed_at: new Date().toISOString()
>>>>>>> phase-0.2/agent-2-status-enums
      }, {
        onConflict: `${DB_COLUMNS.WORKFLOW_EXECUTION_ID},${DB_COLUMNS.STEP_ID}`
      });

    if (error) {
      console.error('Error skipping step:', error);
      throw new Error(`Failed to skip step: ${error.message}`);
    }

    // Recalculate workflow completion
    await this.recalculateCompletion(params.executionId, supabase);
  }

  /**
   * Complete entire workflow (checks for pending tasks)
   * Phase 3.3: Now supports WorkflowExecutionStatus.COMPLETED_WITH_PENDING_TASKS status
   */
  static async completeWorkflow(
    executionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    const supabase = supabaseClient || createClient();

    // Check if there are pending tasks for this workflow
    const hasPendingTasks = await this.hasPendingTasks(executionId, supabase);

    const status = hasPendingTasks ? WorkflowExecutionStatus.COMPLETED_WITH_PENDING_TASKS : WorkflowExecutionStatus.COMPLETED;

    const { error } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .update({
        [DB_COLUMNS.STATUS]: status,
        [DB_COLUMNS.COMPLETED_AT]: new Date().toISOString(),
        [DB_COLUMNS.COMPLETION_PERCENTAGE]: 100
      })
      .eq(DB_COLUMNS.ID, executionId);

    if (error) {
      console.error('Error completing workflow:', error);
      throw new Error(`Failed to complete workflow: ${error.message}`);
    }
  }

  /**
   * Check if workflow has pending tasks
   * Phase 3.3: Task State Management
   */
  static async hasPendingTasks(
    executionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<boolean> {
    const supabase = supabaseClient || createClient();

    const { count, error } = await supabase
      .from(DB_TABLES.WORKFLOW_TASKS)
      .select('*', { count: 'exact', head: true })
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, executionId)
      .in(DB_COLUMNS.STATUS, ['pending', 'snoozed', 'in_progress']);

    if (error) {
      console.error('Error checking pending tasks:', error);
      return false; // Fail safe: don't block workflow completion
    }

    return (count || 0) > 0;
  }

  /**
   * Get pending tasks for a workflow execution
   * Phase 3.3: Task State Management
   */
  static async getPendingTasks(
    executionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<any[]> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from(DB_TABLES.WORKFLOW_TASKS)
      .select('*')
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, executionId)
      .in(DB_COLUMNS.STATUS, ['pending', 'snoozed', 'in_progress'])
      .order(DB_COLUMNS.CREATED_AT, { ascending: true });

    if (error) {
      console.error('Error fetching pending tasks:', error);
      throw new Error(`Failed to fetch pending tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Snooze a workflow until a specific time
   */
  static async snoozeWorkflow(params: {
    executionId: string;
    snoozeUntil: Date;
  }, supabaseClient?: SupabaseClient): Promise<void> {
    const supabase = supabaseClient || createClient();

    const { error } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .update({
<<<<<<< HEAD
        [DB_COLUMNS.STATUS]: 'snoozed',
        [DB_COLUMNS.SNOOZED_UNTIL]: params.snoozeUntil.toISOString()
=======
        status: WorkflowExecutionStatus.SNOOZED,
        snoozed_until: params.snoozeUntil.toISOString()
>>>>>>> phase-0.2/agent-2-status-enums
      })
      .eq(DB_COLUMNS.ID, params.executionId);

    if (error) {
      console.error('Error snoozing workflow:', error);
      throw new Error(`Failed to snooze workflow: ${error.message}`);
    }
  }

  /**
   * Get incomplete workflows for a customer
   * Phase 3.3: Now includes WorkflowExecutionStatus.COMPLETED_WITH_PENDING_TASKS
   */
  static async getIncompleteWorkflows(
    customerId: string,
    supabaseClient?: SupabaseClient
  ): Promise<WorkflowExecution[]> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .select('*')
<<<<<<< HEAD
      .eq(DB_COLUMNS.CUSTOMER_ID, customerId)
      .in(DB_COLUMNS.STATUS, ['not_started', 'in_progress', 'snoozed', 'completed_with_pending_tasks'])
      .order(DB_COLUMNS.LAST_ACTIVITY_AT, { ascending: false });
=======
      .eq('customer_id', customerId)
      .in('status', [WorkflowExecutionStatus.NOT_STARTED, 'in_progress', 'snoozed', WorkflowExecutionStatus.COMPLETED_WITH_PENDING_TASKS])
      .order('last_activity_at', { ascending: false });
>>>>>>> phase-0.2/agent-2-status-enums

    if (error) {
      console.error('Error fetching incomplete workflows:', error);
      throw new Error(`Failed to fetch incomplete workflows: ${error.message}`);
    }

    return (data || []) as WorkflowExecution[];
  }

  /**
   * Recalculate completion percentage based on step statuses
   */
  private static async recalculateCompletion(
    executionId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    // Get workflow execution
    const { data: execution } = await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .select(DB_COLUMNS.TOTAL_STEPS)
      .eq(DB_COLUMNS.ID, executionId)
      .single();

    if (!execution) return;

    // Count completed and skipped steps
    const { data: steps } = await supabase
      .from(DB_TABLES.WORKFLOW_STEP_EXECUTIONS)
      .select(DB_COLUMNS.STATUS)
      .eq(DB_COLUMNS.WORKFLOW_EXECUTION_ID, executionId);

    if (!steps) return;

    const completedCount = steps.filter(s => s.status === WorkflowExecutionStatus.COMPLETED).length;
    const skippedCount = steps.filter(s => s.status === 'skipped').length;
    const totalFinished = completedCount + skippedCount;

    const completionPercentage = Math.round((totalFinished / execution.total_steps) * 100);

    // Update workflow execution
    await supabase
      .from(DB_TABLES.WORKFLOW_EXECUTIONS)
      .update({
        [DB_COLUMNS.COMPLETED_STEPS_COUNT]: completedCount,
        [DB_COLUMNS.SKIPPED_STEPS_COUNT]: skippedCount,
        [DB_COLUMNS.COMPLETION_PERCENTAGE]: completionPercentage
      })
      .eq(DB_COLUMNS.ID, executionId);
  }
}
