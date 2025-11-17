/**
 * Workflow Skip Service
 *
 * Service layer for workflow skipping with trigger evaluation.
 * Handles batch processing of 1000+ workflows efficiently.
 *
 * Phase 1.1: Skip Enhanced - Services + Daily Cron Job
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';
import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';
import { SkipTrigger } from '@/types/skip-triggers';
import { SkipTriggerEvaluator } from './SkipTriggerEvaluator';
import { SkipTriggerEvaluatorV2 } from './triggers/SkipTriggerEvaluatorV2';
import { WorkflowExecution } from './WorkflowExecutionService';

// Select evaluator based on feature flag
const Evaluator = FEATURE_FLAGS.USE_BASE_TRIGGER_EVALUATOR
  ? SkipTriggerEvaluatorV2
  : SkipTriggerEvaluator;

// =====================================================
// Types
// =====================================================

/**
 * Extended workflow execution with skip trigger fields and customer data
 */
export interface WorkflowExecutionWithSkipTriggers extends WorkflowExecution {
  skip_triggers?: SkipTrigger[];
  skip_last_evaluated_at?: string | null;
  skip_trigger_fired_at?: string | null;
  skip_fired_trigger_type?: 'date' | 'event' | null;
  customer?: {
    arr?: number;
    health_score?: number;
  };
}

/**
 * Result of evaluating all skipped workflows
 */
export interface EvaluationResults {
  evaluated: number;
  reactivated: number;
  errors: number;
  errorDetails?: Array<{ workflowId: string; error: string }>;
}

/**
 * Reason for reactivating a workflow
 */
export type ReactivationReason = 'trigger_fired' | 'manual_reactivate';

// =====================================================
// WorkflowSkipService
// =====================================================

export class WorkflowSkipService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Skip a workflow with one or more triggers
   *
   * @param workflowId - The workflow execution ID to skip
   * @param triggers - Array of skip triggers (date and/or event triggers)
   * @param userId - User ID performing the skip action
   * @param reason - Optional reason for skipping
   */
  async skipWithTriggers(
    workflowId: string,
    triggers: SkipTrigger[],
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowSkipService] Starting skip for workflow ${workflowId}, user ${userId}`);
      console.log(`[WorkflowSkipService] Triggers:`, JSON.stringify(triggers, null, 2));

      // Validate inputs
      if (!triggers || triggers.length === 0) {
        throw new Error('At least one trigger is required');
      }

      const now = new Date().toISOString();

      // Update workflow execution with triggers
      const { data, error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.SKIPPED,
          skip_triggers: triggers,
          skip_last_evaluated_at: null, // Reset evaluation timestamp
          skip_trigger_fired_at: null, // Clear any previous trigger
          skip_fired_trigger_type: null,
          skipped_at: now,
          skip_reason: reason || null
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .select();

      console.log(`[WorkflowSkipService] Update result:`, { data, error: updateError });

      if (updateError) {
        throw new Error(`Failed to skip workflow: ${updateError.message}`);
      }

      if (!data || data.length === 0) {
        console.warn(`[WorkflowSkipService] No rows updated for workflow ${workflowId}`);
      }

      // Log the skip action
      await this.logWorkflowAction(workflowId, 'skip', userId, {
        trigger_count: triggers.length,
        trigger_types: triggers.map(t => t.type),
        reason
      });

      console.log(`[WorkflowSkipService] Successfully skipped workflow ${workflowId} with ${triggers.length} triggers`);
    } catch (error) {
      console.error('[WorkflowSkipService] Error skipping workflow:', error);
      throw error;
    }
  }

  /**
   * Evaluate all skipped workflows and reactivate those with fired triggers
   * This is called by the daily cron job
   *
   * @returns Evaluation statistics
   */
  async evaluateAllSkippedWorkflows(): Promise<EvaluationResults> {
    const startTime = Date.now();
    let evaluated = 0;
    let reactivated = 0;
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

        console.log(`[WorkflowSkipService] Evaluating batch of ${workflows.length} workflows`);

        // Process workflows in parallel within batch
        const batchResults = await Promise.allSettled(
          workflows.map(workflow => this.evaluateWorkflow(workflow))
        );

        // Collect results
        batchResults.forEach((result, index) => {
          const workflow = workflows[index];
          evaluated++;

          if (result.status === 'fulfilled') {
            if (result.value.reactivated) {
              reactivated++;
            }
          } else {
            errors++;
            errorDetails.push({
              workflowId: workflow.id,
              error: result.reason?.message || 'Unknown error'
            });
            console.error(
              `[WorkflowSkipService] Error evaluating workflow ${workflow.id}:`,
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
        `[WorkflowSkipService] Evaluation complete: ${evaluated} evaluated, ${reactivated} reactivated, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        reactivated,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error) {
      console.error('[WorkflowSkipService] Error in batch evaluation:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single workflow's triggers
   * Returns whether the workflow was reactivated
   */
  private async evaluateWorkflow(
    workflow: WorkflowExecutionWithSkipTriggers
  ): Promise<{ reactivated: boolean }> {
    try {
      const triggers = workflow.skip_triggers || [];

      if (triggers.length === 0) {
        // No triggers to evaluate
        return { reactivated: false };
      }

      // Evaluate all triggers using selected Evaluator (based on feature flag)
      const evaluationResult = await Evaluator.evaluateAllTriggers(
        workflow.id,
        triggers,
        this.supabase
      );

      // Log each trigger evaluation to workflow_skip_triggers table
      for (const { trigger, result } of evaluationResult.evaluationResults) {
        await Evaluator.logTriggerEvaluation(
          workflow.id,
          trigger,
          result,
          this.supabase
        );
      }

      // Update skip_last_evaluated_at
      await Evaluator.updateWorkflowWithEvaluationResults(
        workflow.id,
        evaluationResult.shouldReactivate,
        evaluationResult.firedTrigger,
        this.supabase
      );

      // If a trigger fired, reactivate the workflow
      if (evaluationResult.shouldReactivate && evaluationResult.firedTrigger) {
        await this.reactivateWorkflow(
          workflow.id,
          'trigger_fired',
          evaluationResult.firedTrigger.type
        );
        return { reactivated: true };
      }

      return { reactivated: false };
    } catch (error) {
      console.error(`[WorkflowSkipService] Error evaluating workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  /**
   * Reactivate a workflow (bring it back from skip)
   * Changes status from 'skipped' to 'in_progress'
   *
   * @param workflowId - The workflow execution ID to reactivate
   * @param reason - Reason for reactivation ('trigger_fired' or 'manual_reactivate')
   * @param triggeredBy - Type of trigger that fired (optional)
   */
  async reactivateWorkflow(
    workflowId: string,
    reason: ReactivationReason,
    triggeredBy?: string
  ): Promise<void> {
    try {
      // Update workflow status to in_progress
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.IN_PROGRESS,
          skipped_at: null, // Clear skip timestamp
          skip_reason: null // Clear skip reason
        })
        .eq(DB_COLUMNS.ID, workflowId);

      if (updateError) {
        throw new Error(`Failed to reactivate workflow: ${updateError.message}`);
      }

      // Log the reactivation action
      await this.logWorkflowAction(workflowId, 'reactivate', 'system', {
        reason,
        triggered_by: triggeredBy
      });

      console.log(`[WorkflowSkipService] Reactivated workflow ${workflowId} - reason: ${reason}`);
    } catch (error) {
      console.error('[WorkflowSkipService] Error reactivating workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflows needing evaluation
   * Uses the database helper function from migration
   *
   * @param batchSize - Number of workflows to fetch (default: 100)
   * @returns Array of workflow executions with triggers
   */
  async getWorkflowsForEvaluation(
    batchSize: number = 100
  ): Promise<WorkflowExecutionWithSkipTriggers[]> {
    try {
      // Use the database helper function
      const { data, error } = await this.supabase
        .rpc('get_skipped_workflows_for_evaluation', {
          p_evaluation_interval_minutes: 5
        });

      if (error) {
        throw new Error(`Failed to get workflows for evaluation: ${error.message}`);
      }

      // Transform the result to match our interface
      const workflows: WorkflowExecutionWithSkipTriggers[] = (data || []).map((row: any) => ({
        id: row.workflow_execution_id,
        skip_triggers: row.skip_triggers,
        skip_last_evaluated_at: row.skip_last_evaluated_at,
        customer_id: row.customer_id,
        user_id: row.user_id,
        // Add other required fields with defaults
        workflow_config_id: '',
        workflow_name: '',
        status: 'skipped',
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
      console.error('[WorkflowSkipService] Error getting workflows for evaluation:', error);
      throw error;
    }
  }

  /**
   * Get all skipped workflows for a user
   * Optionally include those with fired triggers
   *
   * @param userId - User ID to filter by
   * @param includeTriggered - Include workflows with fired triggers (default: false)
   * @returns Array of skipped workflow executions
   */
  async getSkippedWorkflows(
    userId: string,
    includeTriggered: boolean = false
  ): Promise<WorkflowExecutionWithSkipTriggers[]> {
    try {
      console.log(`[WorkflowSkipService] getSkippedWorkflows for user: ${userId}, includeTriggered: ${includeTriggered}`);
      console.log(`[WorkflowSkipService] Query status filter: ${WorkflowExecutionStatus.SKIPPED}`);

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
        .eq(DB_COLUMNS.STATUS, WorkflowExecutionStatus.SKIPPED)
        .order('skip_last_evaluated_at', { ascending: true, nullsFirst: true });

      // Optionally filter out workflows with fired triggers
      if (!includeTriggered) {
        query = query.is('skip_trigger_fired_at', null);
      }

      const { data, error } = await query;

      console.log(`[WorkflowSkipService] getSkippedWorkflows result:`, { count: data?.length, error });
      if (data && data.length > 0) {
        console.log(`[WorkflowSkipService] Found skipped workflows:`, data.map(w => ({ id: w.id, status: w.status, skip_triggers: w.skip_triggers })));
      }

      if (error) {
        throw new Error(`Failed to get skipped workflows: ${error.message}`);
      }

      return data as WorkflowExecutionWithSkipTriggers[];
    } catch (error) {
      console.error('[WorkflowSkipService] Error getting skipped workflows:', error);
      throw error;
    }
  }

  /**
   * Log a workflow action to the workflow_actions table
   *
   * @param workflowId - The workflow execution ID
   * @param actionType - Type of action (skip, reactivate, etc.)
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
        console.error('[WorkflowSkipService] Error logging workflow action:', error);
      }
    } catch (error) {
      console.error('[WorkflowSkipService] Error logging workflow action:', error);
    }
  }
}
