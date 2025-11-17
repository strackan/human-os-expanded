/**
 * Review Trigger Evaluator V2
 *
 * Refactored version using BaseTriggerEvaluator.
 * Reduces code from 568 lines to ~100 lines by extending shared base class.
 *
 * NOTE: The original ReviewTriggerEvaluator had a bug where it used WORKFLOW_ESCALATE_TRIGGERS
 * table in lines 415, 529, 539, 551. This V2 version preserves that behavior for backward
 * compatibility (to ensure 100% identical behavior). The table should likely be
 * workflow_review_triggers, but we preserve the bug to avoid changing behavior.
 *
 * Release 0.1.8.1 - Phase 1: Trigger Evaluator Consolidation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES } from '@/lib/constants/database';
import {
  BaseTriggerEvaluator,
  TriggerEvaluatorConfig,
  TriggerEvaluationResult
} from './BaseTriggerEvaluator';
import {
  ReviewTrigger,
  TriggerEvaluationResult as ReviewTriggerEvaluationResult
} from '@/types/review-triggers';

/**
 * Review-specific trigger evaluator
 * Extends BaseTriggerEvaluator and provides Review-specific configuration
 */
class ReviewTriggerEvaluatorV2Class extends BaseTriggerEvaluator<ReviewTrigger> {
  /**
   * Provide Review-specific configuration
   *
   * NOTE: Uses WORKFLOW_ESCALATE_TRIGGERS to match original buggy behavior
   */
  protected getConfig(): TriggerEvaluatorConfig {
    return {
      tableName: DB_TABLES.WORKFLOW_ESCALATE_TRIGGERS, // Bug: should be workflow_review_triggers
      fieldPrefix: 'review',
      resultPropertyName: 'shouldNotify',
      shouldUpdateStatus: false // Review doesn't update status, only sets trigger fields
    };
  }
}

/**
 * Static wrapper class for backward compatibility with existing code
 * Provides the same API as the original ReviewTriggerEvaluator
 */
export class ReviewTriggerEvaluatorV2 {
  private static instance = new ReviewTriggerEvaluatorV2Class();

  /**
   * Evaluate a trigger to determine if it should fire
   */
  static async evaluateTrigger(
    trigger: ReviewTrigger,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<ReviewTriggerEvaluationResult> {
    return this.instance.evaluateTrigger(trigger, workflowExecutionId, supabase);
  }

  /**
   * Evaluate all triggers for a workflow execution
   * Returns the first trigger that fires (ANY logic)
   */
  static async evaluateAllTriggers(
    workflowExecutionId: string,
    triggers: ReviewTrigger[],
    supabase: SupabaseClient
  ): Promise<{
    shouldNotify: boolean;
    firedTrigger?: ReviewTrigger;
    evaluationResults: Array<{ trigger: ReviewTrigger; result: TriggerEvaluationResult }>;
  }> {
    const result = await this.instance.evaluateAllTriggers(
      workflowExecutionId,
      triggers,
      supabase
    );

    return {
      shouldNotify: result.shouldNotify || false,
      firedTrigger: result.firedTrigger,
      evaluationResults: result.evaluationResults
    };
  }

  /**
   * Update workflow execution with trigger evaluation results
   */
  static async updateWorkflowWithEvaluationResults(
    workflowExecutionId: string,
    shouldNotify: boolean,
    firedTrigger: ReviewTrigger | undefined,
    supabase: SupabaseClient
  ): Promise<void> {
    return this.instance.updateWorkflowWithEvaluationResults(
      workflowExecutionId,
      shouldNotify,
      firedTrigger,
      supabase
    );
  }

  /**
   * Log trigger evaluation to workflow_escalate_triggers table
   * (Preserves original bug for backward compatibility)
   */
  static async logTriggerEvaluation(
    workflowExecutionId: string,
    trigger: ReviewTrigger,
    result: ReviewTriggerEvaluationResult,
    supabase: SupabaseClient
  ): Promise<void> {
    return this.instance.logTriggerEvaluation(
      workflowExecutionId,
      trigger,
      result,
      supabase
    );
  }
}
