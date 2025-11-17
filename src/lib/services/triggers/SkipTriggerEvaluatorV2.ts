/**
 * Skip Trigger Evaluator V2
 *
 * Refactored version using BaseTriggerEvaluator.
 * Reduces code from 571 lines to ~100 lines by extending shared base class.
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
  SkipTrigger,
  TriggerEvaluationResult as SkipTriggerEvaluationResult
} from '@/types/skip-triggers';

/**
 * Skip-specific trigger evaluator
 * Extends BaseTriggerEvaluator and provides Skip-specific configuration
 */
class SkipTriggerEvaluatorV2Class extends BaseTriggerEvaluator<SkipTrigger> {
  /**
   * Provide Skip-specific configuration
   */
  protected getConfig(): TriggerEvaluatorConfig {
    return {
      tableName: DB_TABLES.WORKFLOW_SKIP_TRIGGERS,
      fieldPrefix: 'skip',
      resultPropertyName: 'shouldReactivate',
      shouldUpdateStatus: true // Skip updates status to 'in_progress' when trigger fires
    };
  }
}

/**
 * Static wrapper class for backward compatibility with existing code
 * Provides the same API as the original SkipTriggerEvaluator
 */
export class SkipTriggerEvaluatorV2 {
  private static instance = new SkipTriggerEvaluatorV2Class();

  /**
   * Evaluate a trigger to determine if it should fire
   */
  static async evaluateTrigger(
    trigger: SkipTrigger,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<SkipTriggerEvaluationResult> {
    return this.instance.evaluateTrigger(trigger, workflowExecutionId, supabase);
  }

  /**
   * Evaluate all triggers for a workflow execution
   * Returns the first trigger that fires (ANY logic)
   */
  static async evaluateAllTriggers(
    workflowExecutionId: string,
    triggers: SkipTrigger[],
    supabase: SupabaseClient
  ): Promise<{
    shouldReactivate: boolean;
    firedTrigger?: SkipTrigger;
    evaluationResults: Array<{ trigger: SkipTrigger; result: TriggerEvaluationResult }>;
  }> {
    const result = await this.instance.evaluateAllTriggers(
      workflowExecutionId,
      triggers,
      supabase
    );

    return {
      shouldReactivate: result.shouldReactivate || false,
      firedTrigger: result.firedTrigger,
      evaluationResults: result.evaluationResults
    };
  }

  /**
   * Update workflow execution with trigger evaluation results
   */
  static async updateWorkflowWithEvaluationResults(
    workflowExecutionId: string,
    shouldReactivate: boolean,
    firedTrigger: SkipTrigger | undefined,
    supabase: SupabaseClient
  ): Promise<void> {
    return this.instance.updateWorkflowWithEvaluationResults(
      workflowExecutionId,
      shouldReactivate,
      firedTrigger,
      supabase
    );
  }

  /**
   * Log trigger evaluation to workflow_skip_triggers table
   */
  static async logTriggerEvaluation(
    workflowExecutionId: string,
    trigger: SkipTrigger,
    result: SkipTriggerEvaluationResult,
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
