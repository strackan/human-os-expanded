/**
 * Workflow Escalate Service
 *
 * Service layer for workflow escalation with trigger evaluation.
 * Handles batch processing of 1000+ workflows efficiently.
 *
 * Phase 1.2: Escalate Enhanced - Services + Daily Cron Job
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';
import { FEATURE_FLAGS } from '@/lib/constants/feature-flags';
import { EscalateTrigger } from '@/types/escalate-triggers';
import { EscalateTriggerEvaluator } from './EscalateTriggerEvaluator';
import { EscalateTriggerEvaluatorV2 } from './triggers/EscalateTriggerEvaluatorV2';
import { WorkflowExecution } from './WorkflowExecutionService';

// Select evaluator based on feature flag
const Evaluator = FEATURE_FLAGS.USE_BASE_TRIGGER_EVALUATOR
  ? EscalateTriggerEvaluatorV2
  : EscalateTriggerEvaluator;

// =====================================================
// Types
// =====================================================

/**
 * Extended workflow execution with escalate trigger fields and customer data
 */
export interface WorkflowExecutionWithEscalateTriggers extends WorkflowExecution {
  escalate_triggers?: EscalateTrigger[];
  escalate_last_evaluated_at?: string | null;
  escalate_trigger_fired_at?: string | null;
  escalate_fired_trigger_type?: 'date' | 'event' | null;
  escalate_to_user_id?: string | null;
  customer?: {
    arr?: number;
    health_score?: number;
  };
}

/**
 * Result of evaluating all escalated workflows
 */
export interface EvaluationResults {
  evaluated: number;
  notified: number;
  errors: number;
  errorDetails?: Array<{ workflowId: string; error: string }>;
}

/**
 * Reason for resolving a workflow
 */
export type ResolutionReason = 'trigger_fired' | 'manual_resolve';

// =====================================================
// WorkflowEscalateService
// =====================================================

export class WorkflowEscalateService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Escalate a workflow with one or more triggers
   *
   * @param workflowId - The workflow execution ID to escalate
   * @param triggers - Array of escalate triggers (date and/or event triggers)
   * @param userId - User ID performing the escalate action
   * @param escalateToUserId - User ID who should receive escalation notifications
   * @param reason - Optional reason for escalation
   */
  async escalateWithTriggers(
    workflowId: string,
    triggers: EscalateTrigger[],
    userId: string,
    escalateToUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowEscalateService] Starting escalate for workflow ${workflowId}, user ${userId}, escalate to ${escalateToUserId}`);
      console.log(`[WorkflowEscalateService] Triggers:`, JSON.stringify(triggers, null, 2));

      // Validate inputs
      if (!triggers || triggers.length === 0) {
        throw new Error('At least one trigger is required');
      }

      if (!escalateToUserId) {
        throw new Error('escalateToUserId is required');
      }

      const now = new Date().toISOString();

      // Update workflow execution with triggers
      const { data, error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.ESCALATED,
          escalate_triggers: triggers,
          escalate_last_evaluated_at: null, // Reset evaluation timestamp
          escalate_trigger_fired_at: null, // Clear any previous trigger
          escalate_fired_trigger_type: null,
          escalate_to_user_id: escalateToUserId,
          escalated_at: now,
          escalate_reason: reason || null
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .select();

      console.log(`[WorkflowEscalateService] Update result:`, { data, error: updateError });

      if (updateError) {
        throw new Error(`Failed to escalate workflow: ${updateError.message}`);
      }

      if (!data || data.length === 0) {
        console.warn(`[WorkflowEscalateService] No rows updated for workflow ${workflowId}`);
      }

      // Log the escalate action
      await this.logWorkflowAction(workflowId, 'escalate', userId, {
        trigger_count: triggers.length,
        trigger_types: triggers.map(t => t.type),
        escalate_to_user_id: escalateToUserId,
        reason
      });

      console.log(`[WorkflowEscalateService] Successfully escalated workflow ${workflowId} with ${triggers.length} triggers to user ${escalateToUserId}`);
    } catch (error) {
      console.error('[WorkflowEscalateService] Error escalating workflow:', error);
      throw error;
    }
  }

  /**
   * Evaluate all escalated workflows and notify when triggers fire
   * This is called by the daily cron job
   *
   * @returns Evaluation statistics
   */
  async evaluateAllEscalatedWorkflows(): Promise<EvaluationResults> {
    const startTime = Date.now();
    let evaluated = 0;
    let notified = 0;
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

        console.log(`[WorkflowEscalateService] Evaluating batch of ${workflows.length} workflows`);

        // Process workflows in parallel within batch
        const batchResults = await Promise.allSettled(
          workflows.map(workflow => this.evaluateWorkflow(workflow))
        );

        // Collect results
        batchResults.forEach((result, index) => {
          const workflow = workflows[index];
          evaluated++;

          if (result.status === 'fulfilled') {
            if (result.value.notified) {
              notified++;
            }
          } else {
            errors++;
            errorDetails.push({
              workflowId: workflow.id,
              error: result.reason?.message || 'Unknown error'
            });
            console.error(
              `[WorkflowEscalateService] Error evaluating workflow ${workflow.id}:`,
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
        `[WorkflowEscalateService] Evaluation complete: ${evaluated} evaluated, ${notified} notified, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        notified,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error) {
      console.error('[WorkflowEscalateService] Error in batch evaluation:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single workflow's triggers
   * Returns whether notifications were sent
   */
  private async evaluateWorkflow(
    workflow: WorkflowExecutionWithEscalateTriggers
  ): Promise<{ notified: boolean }> {
    try {
      const triggers = workflow.escalate_triggers || [];

      if (triggers.length === 0) {
        // No triggers to evaluate
        return { notified: false };
      }

      // Evaluate all triggers using selected Evaluator (based on feature flag)
      const evaluationResult = await Evaluator.evaluateAllTriggers(
        workflow.id,
        triggers,
        this.supabase
      );

      // Log each trigger evaluation to workflow_escalate_triggers table
      for (const { trigger, result } of evaluationResult.evaluationResults) {
        await Evaluator.logTriggerEvaluation(
          workflow.id,
          trigger,
          result,
          this.supabase
        );
      }

      // Update escalate_last_evaluated_at
      await Evaluator.updateWorkflowWithEvaluationResults(
        workflow.id,
        evaluationResult.shouldNotify,
        evaluationResult.firedTrigger,
        this.supabase
      );

      // If a trigger fired, send notification to escalated user
      if (evaluationResult.shouldNotify && evaluationResult.firedTrigger && workflow.escalate_to_user_id) {
        await this.notifyEscalatedUser(
          workflow.id,
          workflow.escalate_to_user_id,
          evaluationResult.firedTrigger.type
        );
        return { notified: true };
      }

      return { notified: false };
    } catch (error) {
      console.error(`[WorkflowEscalateService] Error evaluating workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  /**
   * Notify the escalated user that a trigger has fired
   * Creates an in-product notification
   *
   * @param workflowId - The workflow execution ID
   * @param escalatedUserId - User ID to notify
   * @param triggerType - Type of trigger that fired
   */
  private async notifyEscalatedUser(
    workflowId: string,
    escalatedUserId: string,
    triggerType: string
  ): Promise<void> {
    try {
      // Create in-product notification
      const { error } = await this.supabase
        .from(DB_TABLES.IN_PRODUCT_NOTIFICATIONS)
        .insert({
          user_id: escalatedUserId,
          notification_type: 'escalation_trigger_fired',
          message: `Escalation trigger (${triggerType}) fired for workflow`,
          link_url: `/workflows/${workflowId}`,
          link_text: 'View Workflow',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[WorkflowEscalateService] Error creating notification:', error);
      } else {
        console.log(`[WorkflowEscalateService] Notified user ${escalatedUserId} for workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('[WorkflowEscalateService] Error notifying escalated user:', error);
      // Don't throw - notification failures shouldn't break trigger evaluation
    }
  }

  /**
   * Resolve a workflow (remove escalation)
   * Changes status from 'escalated' to 'in_progress'
   *
   * @param workflowId - The workflow execution ID to resolve
   * @param reason - Reason for resolution ('trigger_fired' or 'manual_resolve')
   * @param resolvedBy - User ID who resolved (optional)
   */
  async resolveWorkflow(
    workflowId: string,
    reason: ResolutionReason,
    resolvedBy?: string
  ): Promise<void> {
    try {
      // Update workflow status to in_progress
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: WorkflowExecutionStatus.IN_PROGRESS,
          escalated_at: null, // Clear escalate timestamp
          escalate_reason: null, // Clear escalate reason
          escalate_to_user_id: null // Clear escalated user
        })
        .eq(DB_COLUMNS.ID, workflowId);

      if (updateError) {
        throw new Error(`Failed to resolve workflow: ${updateError.message}`);
      }

      // Log the resolution action
      await this.logWorkflowAction(workflowId, 'resolve', resolvedBy || 'system', {
        reason
      });

      console.log(`[WorkflowEscalateService] Resolved workflow ${workflowId} - reason: ${reason}`);
    } catch (error) {
      console.error('[WorkflowEscalateService] Error resolving workflow:', error);
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
  ): Promise<WorkflowExecutionWithEscalateTriggers[]> {
    try {
      // Use the database helper function
      const { data, error } = await this.supabase
        .rpc('get_escalated_workflows_for_evaluation', {
          p_evaluation_interval_minutes: 5
        });

      if (error) {
        throw new Error(`Failed to get workflows for evaluation: ${error.message}`);
      }

      // Transform the result to match our interface
      const workflows: WorkflowExecutionWithEscalateTriggers[] = (data || []).map((row: any) => ({
        id: row.workflow_execution_id,
        escalate_triggers: row.escalate_triggers,
        escalate_last_evaluated_at: row.escalate_last_evaluated_at,
        escalate_to_user_id: row.escalate_to_user_id,
        customer_id: row.customer_id,
        user_id: row.user_id,
        // Add other required fields with defaults
        workflow_config_id: '',
        workflow_name: '',
        status: 'escalated',
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
      console.error('[WorkflowEscalateService] Error getting workflows for evaluation:', error);
      throw error;
    }
  }

  /**
   * Get all escalated workflows for a user
   * Optionally include those with fired triggers
   *
   * @param userId - User ID to filter by
   * @param includeTriggered - Include workflows with fired triggers (default: false)
   * @returns Array of escalated workflow executions
   */
  async getEscalatedWorkflows(
    userId: string,
    includeTriggered: boolean = false
  ): Promise<WorkflowExecutionWithEscalateTriggers[]> {
    try {
      console.log(`[WorkflowEscalateService] getEscalatedWorkflows for user: ${userId}, includeTriggered: ${includeTriggered}`);
      console.log(`[WorkflowEscalateService] Query status filter: ${WorkflowExecutionStatus.ESCALATED}`);

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
        .eq(DB_COLUMNS.STATUS, WorkflowExecutionStatus.ESCALATED)
        .order('escalate_last_evaluated_at', { ascending: true, nullsFirst: true });

      // Optionally filter out workflows with fired triggers
      if (!includeTriggered) {
        query = query.is('escalate_trigger_fired_at', null);
      }

      const { data, error } = await query;

      console.log(`[WorkflowEscalateService] getEscalatedWorkflows result:`, { count: data?.length, error });
      if (data && data.length > 0) {
        console.log(`[WorkflowEscalateService] Found escalated workflows:`, data.map(w => ({ id: w.id, status: w.status, escalate_triggers: w.escalate_triggers })));
      }

      if (error) {
        throw new Error(`Failed to get escalated workflows: ${error.message}`);
      }

      return data as WorkflowExecutionWithEscalateTriggers[];
    } catch (error) {
      console.error('[WorkflowEscalateService] Error getting escalated workflows:', error);
      throw error;
    }
  }

  /**
   * Log a workflow action to the workflow_actions table
   *
   * @param workflowId - The workflow execution ID
   * @param actionType - Type of action (escalate, resolve, etc.)
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
        console.error('[WorkflowEscalateService] Error logging workflow action:', error);
      }
    } catch (error) {
      console.error('[WorkflowEscalateService] Error logging workflow action:', error);
    }
  }
}
