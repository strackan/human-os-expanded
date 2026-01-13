/**
 * Workflow Snooze Service
 *
 * Service layer for workflow snoozing with trigger evaluation.
 * Handles batch processing of 1000+ workflows efficiently.
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';
import { WakeTrigger, TriggerEvaluationResult } from '@/types/wake-triggers';
import { TriggerEvaluator } from './TriggerEvaluator';
import { WorkflowExecution } from './WorkflowExecutionService';

// =====================================================
// Types
// =====================================================

/**
 * Extended workflow execution with trigger fields and customer data
 */
export interface WorkflowExecutionWithTriggers extends WorkflowExecution {
  wake_triggers?: WakeTrigger[];
  last_evaluated_at?: string | null;
  trigger_fired_at?: string | null;
  fired_trigger_type?: 'date' | 'event' | null;
  customer?: {
    arr?: number;
    health_score?: number;
  };
}

/**
 * Result of evaluating all snoozed workflows
 */
export interface EvaluationResults {
  evaluated: number;
  surfaced: number;
  errors: number;
  errorDetails?: Array<{ workflowId: string; error: string }>;
}

/**
 * Reason for surfacing a workflow
 */
export type SurfaceReason = 'trigger_fired' | 'manual_wake';

// =====================================================
// WorkflowSnoozeService
// =====================================================

export class WorkflowSnoozeService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Snooze a workflow with one or more triggers
   *
   * @param workflowId - The workflow execution ID to snooze
   * @param triggers - Array of wake triggers (date and/or event triggers)
   * @param userId - User ID performing the snooze action
   */
  async snoozeWithTriggers(
    workflowId: string,
    triggers: WakeTrigger[],
    userId: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowSnoozeService] Starting snooze for workflow ${workflowId}, user ${userId}`);
      console.log(`[WorkflowSnoozeService] Triggers:`, JSON.stringify(triggers, null, 2));

      // Validate inputs
      if (!triggers || triggers.length === 0) {
        throw new Error('At least one trigger is required');
      }

      // Update workflow execution with triggers
      const { data, error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.SNOOZED,
          wake_triggers: triggers,
          last_evaluated_at: null, // Reset evaluation timestamp
          trigger_fired_at: null, // Clear any previous trigger
          fired_trigger_type: null
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .select();

      console.log(`[WorkflowSnoozeService] Update result:`, { data, error: updateError });

      if (updateError) {
        throw new Error(`Failed to snooze workflow: ${updateError.message}`);
      }

      if (!data || data.length === 0) {
        console.warn(`[WorkflowSnoozeService] No rows updated for workflow ${workflowId}`);
      }

      // Log the snooze action
      await this.logWorkflowAction(workflowId, 'snooze', userId, {
        trigger_count: triggers.length,
        trigger_types: triggers.map(t => t.type)
      });

      console.log(`[WorkflowSnoozeService] Successfully snoozed workflow ${workflowId} with ${triggers.length} triggers`);
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error snoozing workflow:', error);
      throw error;
    }
  }

  /**
   * Evaluate all snoozed workflows and surface those with fired triggers
   * This is called by the daily cron job
   *
   * @returns Evaluation statistics
   */
  async evaluateAllSnoozedWorkflows(): Promise<EvaluationResults> {
    const startTime = Date.now();
    let evaluated = 0;
    let surfaced = 0;
    let errors = 0;
    const errorDetails: Array<{ workflowId: string; error: string }> = [];

    try {
      // Get workflows needing evaluation in batches
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const workflows = await this.getWorkflowsForEvaluation(batchSize);

        if (!workflows || workflows.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`[WorkflowSnoozeService] Evaluating batch of ${workflows.length} workflows`);

        // Process workflows in parallel within batch
        const batchResults = await Promise.allSettled(
          workflows.map(workflow => this.evaluateWorkflow(workflow))
        );

        // Collect results
        batchResults.forEach((result, index) => {
          const workflow = workflows[index];
          evaluated++;

          if (result.status === 'fulfilled') {
            if (result.value.surfaced) {
              surfaced++;
            }
          } else {
            errors++;
            errorDetails.push({
              workflowId: workflow.id,
              error: result.reason?.message || 'Unknown error'
            });
            console.error(
              `[WorkflowSnoozeService] Error evaluating workflow ${workflow.id}:`,
              result.reason
            );
          }
        });

        // If we got fewer workflows than batch size, we're done
        if (workflows.length < batchSize) {
          hasMore = false;
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[WorkflowSnoozeService] Evaluation complete: ${evaluated} evaluated, ${surfaced} surfaced, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        surfaced,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error in batch evaluation:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single workflow's triggers
   * Returns whether the workflow was surfaced
   */
  private async evaluateWorkflow(
    workflow: WorkflowExecutionWithTriggers
  ): Promise<{ surfaced: boolean }> {
    try {
      const triggers = workflow.wake_triggers || [];

      if (triggers.length === 0) {
        // No triggers to evaluate
        return { surfaced: false };
      }

      // Evaluate all triggers using TriggerEvaluator
      const evaluationResult = await TriggerEvaluator.evaluateAllTriggers(
        workflow.id,
        triggers,
        this.supabase
      );

      // Log each trigger evaluation to workflow_wake_triggers table
      for (const { trigger, result } of evaluationResult.evaluationResults) {
        await TriggerEvaluator.logTriggerEvaluation(
          workflow.id,
          trigger,
          result,
          this.supabase
        );
      }

      // Update last_evaluated_at
      await TriggerEvaluator.updateWorkflowWithEvaluationResults(
        workflow.id,
        evaluationResult.shouldWake,
        evaluationResult.firedTrigger,
        this.supabase
      );

      // If a trigger fired, surface the workflow
      if (evaluationResult.shouldWake && evaluationResult.firedTrigger) {
        await this.surfaceWorkflow(
          workflow.id,
          'trigger_fired',
          evaluationResult.firedTrigger.type
        );
        return { surfaced: true };
      }

      return { surfaced: false };
    } catch (error) {
      console.error(`[WorkflowSnoozeService] Error evaluating workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  /**
   * Surface a workflow (wake it up)
   * Changes status from 'snoozed' to 'in_progress'
   *
   * @param workflowId - The workflow execution ID to surface
   * @param reason - Reason for surfacing ('trigger_fired' or 'manual_wake')
   * @param triggeredBy - Type of trigger that fired (optional)
   */
  async surfaceWorkflow(
    workflowId: string,
    reason: SurfaceReason,
    triggeredBy?: string
  ): Promise<void> {
    try {
      // Update workflow status to in_progress
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.IN_PROGRESS,
          [DB_COLUMNS.SNOOZED_UNTIL]: null // Clear snooze date
        })
        .eq(DB_COLUMNS.ID, workflowId);

      if (updateError) {
        throw new Error(`Failed to surface workflow: ${updateError.message}`);
      }

      // Log the surface action
      await this.logWorkflowAction(workflowId, 'surface', 'system', {
        reason,
        triggered_by: triggeredBy
      });

      console.log(`[WorkflowSnoozeService] Surfaced workflow ${workflowId} - reason: ${reason}`);
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error surfacing workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflows needing evaluation
   * Uses the database helper function from Agent 1's migration
   *
   * @param batchSize - Number of workflows to fetch (default: 100)
   * @returns Array of workflow executions with triggers
   */
  async getWorkflowsForEvaluation(
    batchSize: number = 100
  ): Promise<WorkflowExecutionWithTriggers[]> {
    try {
      // Use the database helper function
      const { data, error } = await this.supabase
        .rpc('get_snoozed_workflows_for_evaluation', {
          p_evaluation_interval_minutes: 5
        });

      if (error) {
        throw new Error(`Failed to get workflows for evaluation: ${error.message}`);
      }

      // Transform the result to match our interface
      const workflows: WorkflowExecutionWithTriggers[] = (data || []).map((row: any) => ({
        id: row.workflow_execution_id,
        wake_triggers: row.wake_triggers,
        last_evaluated_at: row.last_evaluated_at,
        customer_id: row.customer_id,
        user_id: row.user_id,
        // Add other required fields with defaults
        workflow_config_id: '',
        workflow_name: '',
        status: 'snoozed',
        current_step_index: 0,
        total_steps: 0,
        completed_steps_count: 0,
        skipped_steps_count: 0,
        completion_percentage: 0,
        last_activity_at: '',
        created_at: '',
        updated_at: ''
      }));

      return workflows.slice(0, batchSize);
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error getting workflows for evaluation:', error);
      throw error;
    }
  }

  /**
   * Get all snoozed workflows for a user
   * Optionally include those with fired triggers
   *
   * @param userId - User ID to filter by
   * @param includeTriggered - Include workflows with fired triggers (default: false)
   * @returns Array of snoozed workflow executions
   */
  async getSnoozedWorkflows(
    userId: string,
    includeTriggered: boolean = false
  ): Promise<WorkflowExecutionWithTriggers[]> {
    try {
      console.log(`[WorkflowSnoozeService] getSnoozedWorkflows for user: ${userId}, includeTriggered: ${includeTriggered}`);
      console.log(`[WorkflowSnoozeService] Query status filter: ${WorkflowExecutionStatus.SNOOZED}`);

      let query = this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select(`
          *,
          customer:customers (
            current_arr,
            health_score
          )
        `)
        .eq(DB_COLUMNS.USER_ID, userId)
        .eq(DB_COLUMNS.STATUS, WorkflowExecutionStatus.SNOOZED)
        .order(DB_COLUMNS.LAST_EVALUATED_AT, { ascending: true, nullsFirst: true });

      // Optionally filter out workflows with fired triggers
      if (!includeTriggered) {
        query = query.is('trigger_fired_at', null);
      }

      const { data, error } = await query;

      console.log(`[WorkflowSnoozeService] getSnoozedWorkflows result:`, { count: data?.length, error });
      if (data && data.length > 0) {
        console.log(`[WorkflowSnoozeService] Found snoozed workflows:`, data.map(w => ({ id: w.id, status: w.status, wake_triggers: w.wake_triggers })));
      }

      if (error) {
        throw new Error(`Failed to get snoozed workflows: ${error.message}`);
      }

      return data as WorkflowExecutionWithTriggers[];
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error getting snoozed workflows:', error);
      throw error;
    }
  }

  /**
   * Log a workflow action to the workflow_actions table
   *
   * @param workflowId - The workflow execution ID
   * @param actionType - Type of action (snooze, surface, etc.)
   * @param userId - User ID performing the action
   * @param metadata - Additional metadata
   */
  private async logWorkflowAction(
    workflowId: string,
    actionType: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(DB_TABLES.WORKFLOW_ACTIONS)
        .insert({
          execution_id: workflowId,
          action_type: actionType,
          user_id: userId,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        // Log error but don't throw - action logging is not critical
        console.error('[WorkflowSnoozeService] Error logging workflow action:', error);
      }
    } catch (error) {
      console.error('[WorkflowSnoozeService] Error logging workflow action:', error);
    }
  }
}
