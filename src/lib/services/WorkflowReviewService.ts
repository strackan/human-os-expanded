/**
 * Workflow Review Service
 *
 * Service layer for workflow review with trigger evaluation.
 * Handles batch processing of 1000+ workflows efficiently.
 *
 * Phase 1.2B: Review-Only Mode - Services + Daily Cron Job
 * Review semantics: Original user keeps ownership but is blocked until reviewer approves.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';
import { ReviewTrigger, TriggerEvaluationResult, ReviewStatus } from '@/types/review-triggers';
import { ReviewTriggerEvaluator } from './ReviewTriggerEvaluator';
import { WorkflowExecution } from './WorkflowExecutionService';

// =====================================================
// Types
// =====================================================

/**
 * Extended workflow execution with review trigger fields and customer data
 */
export interface WorkflowExecutionWithReviewTriggers extends WorkflowExecution {
  review_triggers?: ReviewTrigger[];
  review_last_evaluated_at?: string | null;
  review_trigger_fired_at?: string | null;
  review_fired_trigger_type?: 'date' | 'event' | null;
  reviewer_id?: string | null;
  review_status?: ReviewStatus | null;
  review_requested_at?: string | null;
  reviewed_at?: string | null;
  reviewer_comments?: string | null;
  customer?: {
    arr?: number;
    health_score?: number;
  };
}

/**
 * Result of evaluating all workflows pending review
 */
export interface EvaluationResults {
  evaluated: number;
  notified: number;
  errors: number;
  errorDetails?: Array<{ workflowId: string; error: string }>;
}

// =====================================================
// WorkflowReviewService
// =====================================================

export class WorkflowReviewService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Request review for a workflow with one or more triggers
   *
   * @param workflowId - The workflow execution ID to request review for
   * @param triggers - Array of review triggers (date and/or event triggers)
   * @param userId - User ID performing the review request action
   * @param reviewerId - User ID who should review this workflow
   * @param reason - Optional reason for review request
   * @param logic - How to combine triggers: 'OR' (any fires) or 'AND' (all fire)
   */
  async requestReviewWithTriggers(
    workflowId: string,
    triggers: ReviewTrigger[],
    userId: string,
    reviewerId: string,
    reason?: string,
    logic?: 'OR' | 'AND'
  ): Promise<void> {
    try {
      console.log(`[WorkflowReviewService] Requesting review for workflow ${workflowId}, user ${userId}, reviewer ${reviewerId}`);
      console.log(`[WorkflowReviewService] Triggers:`, JSON.stringify(triggers, null, 2));

      // Validate inputs
      if (!triggers || triggers.length === 0) {
        throw new Error('At least one trigger is required');
      }

      if (!reviewerId) {
        throw new Error('reviewerId is required');
      }

      const now = new Date().toISOString();

      // Update workflow execution with review triggers and status
      const { data, error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          review_triggers: triggers,
          review_trigger_logic: logic || 'OR',
          review_last_evaluated_at: null, // Reset evaluation timestamp
          review_trigger_fired_at: null, // Clear any previous trigger
          review_fired_trigger_type: null,
          reviewer_id: reviewerId,
          review_status: 'pending' as ReviewStatus,
          review_requested_at: now,
          review_reason: reason || null,
          reviewed_at: null,
          reviewer_comments: null
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .select();

      console.log(`[WorkflowReviewService] Update result:`, { data, error: updateError });

      if (updateError) {
        throw new Error(`Failed to request review: ${updateError.message}`);
      }

      if (!data || data.length === 0) {
        console.warn(`[WorkflowReviewService] No rows updated for workflow ${workflowId}`);
      }

      // Log the review request action
      await this.logWorkflowAction(workflowId, 'request_review', userId, {
        trigger_count: triggers.length,
        trigger_types: triggers.map(t => t.type),
        reviewer_id: reviewerId,
        reason
      });

      console.log(`[WorkflowReviewService] Successfully requested review for workflow ${workflowId} with ${triggers.length} triggers from reviewer ${reviewerId}`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error requesting review:', error);
      throw error;
    }
  }

  /**
   * Evaluate all workflows pending review and notify when triggers fire
   * This is called by the daily cron job
   *
   * @returns Evaluation statistics
   */
  async evaluateAllPendingReviews(): Promise<EvaluationResults> {
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

        console.log(`[WorkflowReviewService] Evaluating batch of ${workflows.length} workflows`);

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
              `[WorkflowReviewService] Error evaluating workflow ${workflow.id}:`,
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
        `[WorkflowReviewService] Evaluation complete: ${evaluated} evaluated, ${notified} notified, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        notified,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error) {
      console.error('[WorkflowReviewService] Error in batch evaluation:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single workflow's triggers
   * Returns whether notifications were sent
   */
  private async evaluateWorkflow(
    workflow: WorkflowExecutionWithReviewTriggers
  ): Promise<{ notified: boolean }> {
    try {
      const triggers = workflow.review_triggers || [];

      if (triggers.length === 0) {
        // No triggers to evaluate
        return { notified: false };
      }

      // Evaluate all triggers using ReviewTriggerEvaluator
      const evaluationResult = await ReviewTriggerEvaluator.evaluateAllTriggers(
        workflow.id,
        triggers,
        this.supabase
      );

      // Log each trigger evaluation to workflow_review_triggers table
      for (const { trigger, result } of evaluationResult.evaluationResults) {
        await ReviewTriggerEvaluator.logTriggerEvaluation(
          workflow.id,
          trigger,
          result,
          this.supabase
        );
      }

      // Update review_last_evaluated_at
      await ReviewTriggerEvaluator.updateWorkflowWithEvaluationResults(
        workflow.id,
        evaluationResult.shouldNotify,
        evaluationResult.firedTrigger,
        this.supabase
      );

      // If a trigger fired, send notification to reviewer
      if (evaluationResult.shouldNotify && evaluationResult.firedTrigger && workflow.reviewer_id) {
        await this.notifyReviewer(
          workflow.id,
          workflow.reviewer_id,
          evaluationResult.firedTrigger.type
        );
        return { notified: true };
      }

      return { notified: false };
    } catch (error) {
      console.error(`[WorkflowReviewService] Error evaluating workflow ${workflow.id}:`, error);
      throw error;
    }
  }

  /**
   * Notify the reviewer that a trigger has fired
   * Creates an in-product notification
   *
   * @param workflowId - The workflow execution ID
   * @param reviewerId - User ID to notify
   * @param triggerType - Type of trigger that fired
   */
  private async notifyReviewer(
    workflowId: string,
    reviewerId: string,
    triggerType: string
  ): Promise<void> {
    try {
      // Create in-product notification
      const { error } = await this.supabase
        .from(DB_TABLES.IN_PRODUCT_NOTIFICATIONS)
        .insert({
          user_id: reviewerId,
          notification_type: 'review_trigger_fired',
          message: `Review trigger (${triggerType}) fired for workflow`,
          link_url: `/workflows/${workflowId}`,
          link_text: 'Review Workflow',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[WorkflowReviewService] Error creating notification:', error);
      } else {
        console.log(`[WorkflowReviewService] Notified reviewer ${reviewerId} for workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('[WorkflowReviewService] Error notifying reviewer:', error);
      // Don't throw - notification failures shouldn't break trigger evaluation
    }
  }

  /**
   * Approve a review
   * Changes review_status to 'approved' and unblocks the original user
   *
   * @param workflowId - The workflow execution ID to approve
   * @param reviewerId - User ID who is approving
   * @param comments - Optional comments from reviewer
   */
  async approveReview(
    workflowId: string,
    reviewerId: string,
    comments?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Update workflow with approval
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          review_status: 'approved' as ReviewStatus,
          reviewed_at: now,
          reviewer_comments: comments || null
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .eq('reviewer_id', reviewerId); // Ensure only the assigned reviewer can approve

      if (updateError) {
        throw new Error(`Failed to approve review: ${updateError.message}`);
      }

      // Log the approval action
      await this.logWorkflowAction(workflowId, 'approve_review', reviewerId, {
        comments
      });

      console.log(`[WorkflowReviewService] Approved review for workflow ${workflowId}`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error approving review:', error);
      throw error;
    }
  }

  /**
   * Request changes for a review
   * Changes review_status to 'changes_requested' and notifies the original user
   *
   * @param workflowId - The workflow execution ID
   * @param reviewerId - User ID who is requesting changes
   * @param comments - Required comments explaining what changes are needed
   */
  async requestChanges(
    workflowId: string,
    reviewerId: string,
    comments: string
  ): Promise<void> {
    try {
      if (!comments || comments.trim() === '') {
        throw new Error('Comments are required when requesting changes');
      }

      const now = new Date().toISOString();

      // Update workflow with changes requested status
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          review_status: 'changes_requested' as ReviewStatus,
          reviewed_at: now,
          reviewer_comments: comments
        })
        .eq(DB_COLUMNS.ID, workflowId)
        .eq('reviewer_id', reviewerId); // Ensure only the assigned reviewer can request changes

      if (updateError) {
        throw new Error(`Failed to request changes: ${updateError.message}`);
      }

      // Log the request changes action
      await this.logWorkflowAction(workflowId, 'request_changes', reviewerId, {
        comments
      });

      console.log(`[WorkflowReviewService] Requested changes for workflow ${workflowId}`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error requesting changes:', error);
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
  ): Promise<WorkflowExecutionWithReviewTriggers[]> {
    try {
      // Use the database helper function
      const { data, error } = await this.supabase
        .rpc('get_workflows_pending_review_for_evaluation', {
          p_evaluation_interval_minutes: 5
        });

      if (error) {
        throw new Error(`Failed to get workflows for evaluation: ${error.message}`);
      }

      // Transform the result to match our interface
      const workflows: WorkflowExecutionWithReviewTriggers[] = (data || []).map((row: any) => ({
        id: row.workflow_execution_id,
        review_triggers: row.review_triggers,
        review_last_evaluated_at: row.review_last_evaluated_at,
        reviewer_id: row.reviewer_id,
        customer_id: row.customer_id,
        user_id: row.user_id,
        // Add other required fields with defaults
        workflow_config_id: '',
        workflow_name: '',
        status: 'pending_review',
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
      console.error('[WorkflowReviewService] Error getting workflows for evaluation:', error);
      throw error;
    }
  }

  /**
   * Get all workflows pending review for a user
   * Optionally include those with fired triggers
   *
   * @param userId - User ID to filter by (reviewer or original user)
   * @param includeTriggered - Include workflows with fired triggers (default: false)
   * @returns Array of workflows pending review
   */
  async getPendingReviewWorkflows(
    userId: string,
    includeTriggered: boolean = false
  ): Promise<WorkflowExecutionWithReviewTriggers[]> {
    try {
      console.log(`[WorkflowReviewService] getPendingReviewWorkflows for user: ${userId}, includeTriggered: ${includeTriggered}`);

      let query = this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select(`
          *,
          customer:customers (
            current_arr,
            health_score
          )
        `)
        .or(`user_id.eq.${userId},reviewer_id.eq.${userId}`)
        .eq('review_status', 'pending')
        .order('review_last_evaluated_at', { ascending: true, nullsFirst: true });

      // Optionally filter out workflows with fired triggers
      if (!includeTriggered) {
        query = query.is('review_trigger_fired_at', null);
      }

      const { data, error } = await query;

      console.log(`[WorkflowReviewService] getPendingReviewWorkflows result:`, { count: data?.length, error });
      if (data && data.length > 0) {
        console.log(`[WorkflowReviewService] Found pending review workflows:`, data.map(w => ({ id: w.id, review_status: w.review_status, review_triggers: w.review_triggers })));
      }

      if (error) {
        throw new Error(`Failed to get pending review workflows: ${error.message}`);
      }

      return data as WorkflowExecutionWithReviewTriggers[];
    } catch (error) {
      console.error('[WorkflowReviewService] Error getting pending review workflows:', error);
      throw error;
    }
  }

  /**
   * Reject workflow with comments, keep in original user's queue
   *
   * @param workflowId - The workflow execution ID to reject
   * @param reviewerId - User ID of reviewer who is rejecting
   * @param comments - Required feedback comments
   * @param reason - Optional rejection reason/category
   */
  async rejectWorkflow(
    workflowId: string,
    reviewerId: string,
    comments: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowReviewService] Rejecting workflow ${workflowId} by reviewer ${reviewerId}`);

      // Validate comments
      if (!comments || comments.length < 10) {
        throw new Error('Comments must be at least 10 characters');
      }

      // Get current workflow
      const { data: workflow, error: fetchError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('user_id, review_iteration, review_rejection_history, workflow_config_id, reviewer_id')
        .eq(DB_COLUMNS.ID, workflowId)
        .single();

      if (fetchError || !workflow) {
        throw new Error(`Failed to fetch workflow: ${fetchError?.message || 'Workflow not found'}`);
      }

      // Verify reviewer is authorized
      if (workflow.reviewer_id !== reviewerId) {
        throw new Error('Only the assigned reviewer can reject this workflow');
      }

      // Get reviewer name
      const { data: reviewer } = await this.supabase
        .from(DB_TABLES.PROFILES)
        .select('full_name, email')
        .eq(DB_COLUMNS.ID, reviewerId)
        .single();

      // Build rejection entry
      const rejectionEntry = {
        iteration: workflow.review_iteration,
        rejectedAt: new Date().toISOString(),
        rejectedBy: reviewerId,
        reason: reason || 'other',
        comments
      };

      // Update workflow
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          review_status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewer_comments: comments,
          review_rejection_history: [
            ...(workflow.review_rejection_history || []),
            rejectionEntry
          ]
        })
        .eq(DB_COLUMNS.ID, workflowId);

      if (updateError) {
        throw new Error(`Failed to reject workflow: ${updateError.message}`);
      }

      // Log the rejection action
      await this.logWorkflowAction(workflowId, 'reject_review', reviewerId, {
        reason,
        comments_length: comments.length,
        iteration: workflow.review_iteration
      });

      // Send notification to original user
      await this.notifyUserOfRejection(
        workflowId,
        workflow.user_id,
        reviewer?.full_name || 'Reviewer',
        comments
      );

      console.log(`[WorkflowReviewService] Workflow ${workflowId} rejected by ${reviewer?.full_name || reviewerId}`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error rejecting workflow:', error);
      throw error;
    }
  }

  /**
   * Re-submit workflow after addressing rejection
   *
   * @param workflowId - The workflow execution ID to re-submit
   * @param userId - User ID of the owner re-submitting
   */
  async resubmitWorkflow(
    workflowId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowReviewService] Re-submitting workflow ${workflowId} by user ${userId}`);

      // Get current workflow
      const { data: workflow, error: fetchError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('review_iteration, reviewer_id, review_status, user_id')
        .eq(DB_COLUMNS.ID, workflowId)
        .eq(DB_COLUMNS.USER_ID, userId) // Ensure user owns workflow
        .single();

      if (fetchError || !workflow) {
        throw new Error(`Failed to fetch workflow: ${fetchError?.message || 'Workflow not found or unauthorized'}`);
      }

      // Verify workflow is in rejected state
      if (workflow.review_status !== 'rejected') {
        throw new Error('Workflow must be in rejected state to re-submit');
      }

      // Update workflow
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          review_status: 'pending',
          review_iteration: workflow.review_iteration + 1,
          reviewed_at: null,
          reviewer_comments: null
        })
        .eq(DB_COLUMNS.ID, workflowId);

      if (updateError) {
        throw new Error(`Failed to re-submit workflow: ${updateError.message}`);
      }

      // Log the re-submission action
      await this.logWorkflowAction(workflowId, 'resubmit_review', userId, {
        iteration: workflow.review_iteration + 1,
        previous_iteration: workflow.review_iteration
      });

      // Send notification to reviewer
      await this.notifyReviewerOfResubmission(
        workflowId,
        workflow.reviewer_id,
        workflow.review_iteration + 1
      );

      console.log(`[WorkflowReviewService] Workflow ${workflowId} re-submitted (iteration ${workflow.review_iteration + 1})`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error re-submitting workflow:', error);
      throw error;
    }
  }

  /**
   * Reject step with comments
   *
   * @param executionId - The workflow execution ID
   * @param stepId - The step ID to reject
   * @param reviewerId - User ID of reviewer who is rejecting
   * @param comments - Required feedback comments
   * @param reason - Optional rejection reason/category
   */
  async rejectStep(
    executionId: string,
    stepId: string,
    reviewerId: string,
    comments: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowReviewService] Rejecting step ${stepId} of workflow ${executionId} by reviewer ${reviewerId}`);

      // Validate comments
      if (!comments || comments.length < 10) {
        throw new Error('Comments must be at least 10 characters');
      }

      // Get current step state from workflow_step_states table
      const { data: stepState, error: fetchError } = await this.supabase
        .from('workflow_step_states')
        .select('review_iteration, review_rejection_history, workflow_execution_id')
        .eq('workflow_execution_id', executionId)
        .eq('step_id', stepId)
        .single();

      if (fetchError || !stepState) {
        throw new Error(`Failed to fetch step state: ${fetchError?.message || 'Step state not found'}`);
      }

      // Get reviewer name
      const { data: reviewer } = await this.supabase
        .from(DB_TABLES.PROFILES)
        .select('full_name, email')
        .eq(DB_COLUMNS.ID, reviewerId)
        .single();

      // Build rejection entry
      const rejectionEntry = {
        iteration: stepState.review_iteration || 1,
        rejectedAt: new Date().toISOString(),
        rejectedBy: reviewerId,
        reason: reason || 'other',
        comments
      };

      // Update step state
      const { error: updateError } = await this.supabase
        .from('workflow_step_states')
        .update({
          review_status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewer_comments: comments,
          review_rejection_history: [
            ...(stepState.review_rejection_history || []),
            rejectionEntry
          ]
        })
        .eq('workflow_execution_id', executionId)
        .eq('step_id', stepId);

      if (updateError) {
        throw new Error(`Failed to reject step: ${updateError.message}`);
      }

      // Log the rejection action
      await this.logWorkflowAction(executionId, 'reject_step_review', reviewerId, {
        step_id: stepId,
        reason,
        comments_length: comments.length,
        iteration: stepState.review_iteration || 1
      });

      console.log(`[WorkflowReviewService] Step ${stepId} rejected by ${reviewer?.full_name || reviewerId}`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error rejecting step:', error);
      throw error;
    }
  }

  /**
   * Re-submit step after addressing rejection
   *
   * @param executionId - The workflow execution ID
   * @param stepId - The step ID to re-submit
   * @param userId - User ID of the owner re-submitting
   */
  async resubmitStep(
    executionId: string,
    stepId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log(`[WorkflowReviewService] Re-submitting step ${stepId} of workflow ${executionId} by user ${userId}`);

      // Get workflow to verify ownership
      const { data: workflow, error: workflowError } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('user_id, reviewer_id')
        .eq(DB_COLUMNS.ID, executionId)
        .eq(DB_COLUMNS.USER_ID, userId)
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Failed to verify workflow ownership: ${workflowError?.message || 'Unauthorized'}`);
      }

      // Get current step state
      const { data: stepState, error: fetchError } = await this.supabase
        .from('workflow_step_states')
        .select('review_iteration, review_status')
        .eq('workflow_execution_id', executionId)
        .eq('step_id', stepId)
        .single();

      if (fetchError || !stepState) {
        throw new Error(`Failed to fetch step state: ${fetchError?.message || 'Step state not found'}`);
      }

      // Verify step is in rejected state
      if (stepState.review_status !== 'rejected') {
        throw new Error('Step must be in rejected state to re-submit');
      }

      // Update step state
      const { error: updateError } = await this.supabase
        .from('workflow_step_states')
        .update({
          review_status: 'pending',
          review_iteration: (stepState.review_iteration || 1) + 1,
          reviewed_at: null,
          reviewer_comments: null
        })
        .eq('workflow_execution_id', executionId)
        .eq('step_id', stepId);

      if (updateError) {
        throw new Error(`Failed to re-submit step: ${updateError.message}`);
      }

      // Log the re-submission action
      await this.logWorkflowAction(executionId, 'resubmit_step_review', userId, {
        step_id: stepId,
        iteration: (stepState.review_iteration || 1) + 1,
        previous_iteration: stepState.review_iteration || 1
      });

      console.log(`[WorkflowReviewService] Step ${stepId} re-submitted (iteration ${(stepState.review_iteration || 1) + 1})`);
    } catch (error) {
      console.error('[WorkflowReviewService] Error re-submitting step:', error);
      throw error;
    }
  }

  /**
   * Get rejection history for workflow
   *
   * @param workflowId - The workflow execution ID
   * @param userId - User ID (to verify access)
   * @returns Array of rejection history entries
   */
  async getRejectionHistory(
    workflowId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('review_rejection_history')
        .eq(DB_COLUMNS.ID, workflowId)
        .eq(DB_COLUMNS.USER_ID, userId)
        .single();

      if (error) {
        throw new Error(`Failed to get rejection history: ${error.message}`);
      }

      return data?.review_rejection_history || [];
    } catch (error) {
      console.error('[WorkflowReviewService] Error getting rejection history:', error);
      throw error;
    }
  }

  /**
   * Notify user of workflow rejection
   * Creates an in-product notification
   */
  private async notifyUserOfRejection(
    workflowId: string,
    userId: string,
    reviewerName: string,
    comments: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(DB_TABLES.IN_PRODUCT_NOTIFICATIONS)
        .insert({
          user_id: userId,
          notification_type: 'review_rejected',
          message: `Your workflow was rejected by ${reviewerName}`,
          link_url: `/workflows/${workflowId}`,
          link_text: 'View Feedback',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[WorkflowReviewService] Error creating rejection notification:', error);
      } else {
        console.log(`[WorkflowReviewService] Notified user ${userId} of rejection for workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('[WorkflowReviewService] Error notifying user of rejection:', error);
      // Don't throw - notification failures shouldn't break rejection flow
    }
  }

  /**
   * Notify reviewer of workflow re-submission
   * Creates an in-product notification
   */
  private async notifyReviewerOfResubmission(
    workflowId: string,
    reviewerId: string,
    iteration: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(DB_TABLES.IN_PRODUCT_NOTIFICATIONS)
        .insert({
          user_id: reviewerId,
          notification_type: 'review_resubmitted',
          message: `Workflow re-submitted for review (iteration ${iteration})`,
          link_url: `/workflows/${workflowId}`,
          link_text: 'Review Workflow',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[WorkflowReviewService] Error creating resubmission notification:', error);
      } else {
        console.log(`[WorkflowReviewService] Notified reviewer ${reviewerId} of resubmission for workflow ${workflowId}`);
      }
    } catch (error) {
      console.error('[WorkflowReviewService] Error notifying reviewer of resubmission:', error);
      // Don't throw - notification failures shouldn't break resubmission flow
    }
  }

  /**
   * Log a workflow action to the workflow_actions table
   *
   * @param workflowId - The workflow execution ID
   * @param actionType - Type of action (request_review, approve_review, request_changes, etc.)
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
        console.error('[WorkflowReviewService] Error logging workflow action:', error);
      }
    } catch (error) {
      console.error('[WorkflowReviewService] Error logging workflow action:', error);
    }
  }
}

// =====================================================
// Backward Compatibility
// =====================================================

/**
 * @deprecated Use WorkflowReviewService instead
 * Alias for backward compatibility during escalate → review transition
 */
export const WorkflowEscalateService = WorkflowReviewService;
export type WorkflowExecutionWithEscalateTriggers = WorkflowExecutionWithReviewTriggers;
