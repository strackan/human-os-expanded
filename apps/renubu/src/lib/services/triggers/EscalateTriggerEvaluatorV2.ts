/**
 * Escalate Trigger Evaluator V2
 *
 * Refactored version using BaseTriggerEvaluator.
 * Reduces code from 568 lines to ~100 lines by extending shared base class.
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
  EscalateTrigger,
  TriggerEvaluationResult as EscalateTriggerEvaluationResult
} from '@/types/escalate-triggers';

/**
 * Escalate-specific trigger evaluator
 * Extends BaseTriggerEvaluator and provides Escalate-specific configuration
 */
class EscalateTriggerEvaluatorV2Class extends BaseTriggerEvaluator<EscalateTrigger> {
  /**
   * Provide Escalate-specific configuration
   */
  protected getConfig(): TriggerEvaluatorConfig {
    return {
      tableName: DB_TABLES.WORKFLOW_ESCALATE_TRIGGERS,
      fieldPrefix: 'escalate',
      resultPropertyName: 'shouldNotify',
      shouldUpdateStatus: false // Escalate doesn't update status, only sets trigger fields
    };
  }
}

/**
 * Static wrapper class for backward compatibility with existing code
 * Provides the same API as the original EscalateTriggerEvaluator
 */
export class EscalateTriggerEvaluatorV2 {
  private static instance = new EscalateTriggerEvaluatorV2Class();

  /**
   * Evaluate a trigger to determine if it should fire
   */
  static async evaluateTrigger(
    trigger: EscalateTrigger,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<EscalateTriggerEvaluationResult> {
    return this.instance.evaluateTrigger(trigger, workflowExecutionId, supabase);
  }

  /**
   * Evaluate all triggers for a workflow execution
   * Returns the first trigger that fires (ANY logic)
   */
  static async evaluateAllTriggers(
    workflowExecutionId: string,
    triggers: EscalateTrigger[],
    supabase: SupabaseClient
  ): Promise<{
    shouldNotify: boolean;
    firedTrigger?: EscalateTrigger;
    evaluationResults: Array<{ trigger: EscalateTrigger; result: TriggerEvaluationResult }>;
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
    firedTrigger: EscalateTrigger | undefined,
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
   */
  static async logTriggerEvaluation(
    workflowExecutionId: string,
    trigger: EscalateTrigger,
    result: EscalateTriggerEvaluationResult,
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
