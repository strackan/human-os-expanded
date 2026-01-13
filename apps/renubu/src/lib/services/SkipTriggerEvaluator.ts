/**
 * Skip Trigger Evaluator Service
 *
 * Core service for evaluating workflow skip triggers.
 * Handles both date triggers and event triggers with 90%+ accuracy target.
 *
 * Phase 1.1: Skip Enhanced - Unified Trigger Architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import {
  SkipTrigger,
  DateTriggerConfig,
  EventTriggerConfig,
  TriggerEvaluationResult,
  isDateSkipTrigger,
  isEventSkipTrigger,
  WorkflowActionCompletedConfig,
  UsageThresholdConfig,
  ManualEventConfig
} from '@/types/skip-triggers';

// =====================================================
// SkipTriggerEvaluator Service
// =====================================================

export class SkipTriggerEvaluator {
  /**
   * Evaluate a trigger to determine if it should fire
   * This is the main entry point for trigger evaluation
   */
  static async evaluateTrigger(
    trigger: SkipTrigger,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<TriggerEvaluationResult> {
    const evaluatedAt = new Date().toISOString();

    try {
      let triggered = false;
      let reason: string | undefined;

      if (isDateSkipTrigger(trigger)) {
        triggered = await this.evaluateDateTrigger(trigger.config);
        reason = triggered
          ? `Date trigger fired: ${trigger.config.date}`
          : `Date not yet reached: ${trigger.config.date}`;
      } else if (isEventSkipTrigger(trigger)) {
        const result = await this.evaluateEventTrigger(
          trigger.config,
          workflowExecutionId,
          supabase
        );
        triggered = result.triggered;
        reason = result.reason;
      } else {
        return {
          triggered: false,
          evaluatedAt,
          error: 'Unknown trigger type'
        };
      }

      return {
        triggered,
        evaluatedAt,
        reason
      };
    } catch (error) {
      // Graceful error handling: if evaluation fails, return false + log error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SkipTriggerEvaluator] Error evaluating trigger ${trigger.id}:`, errorMessage);

      return {
        triggered: false,
        evaluatedAt,
        error: errorMessage
      };
    }
  }

  /**
   * Evaluate a date trigger
   * Returns true if the current time has passed the trigger date
   */
  static async evaluateDateTrigger(
    config: DateTriggerConfig
  ): Promise<boolean> {
    try {
      const now = new Date();
      const triggerDate = new Date(config.date);

      // Handle timezone if specified
      if (config.timezone) {
        // For timezone-aware comparison, we use the Intl API
        // This converts the trigger date to the specified timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: config.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        // Get current time in the specified timezone
        const nowInTimezone = new Date(formatter.format(now));
        const triggerDateInTimezone = new Date(formatter.format(triggerDate));

        return nowInTimezone >= triggerDateInTimezone;
      }

      // Default: simple UTC comparison
      return now >= triggerDate;
    } catch (error) {
      console.error('[SkipTriggerEvaluator] Error evaluating date trigger:', error);
      return false;
    }
  }

  /**
   * Evaluate an event trigger
   * Returns true if the specified event has occurred
   */
  static async evaluateEventTrigger(
    config: EventTriggerConfig,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    try {
      switch (config.eventType) {
        case 'workflow_action_completed':
          return await this.evaluateWorkflowActionCompleted(
            config.eventConfig as unknown as WorkflowActionCompletedConfig,
            workflowExecutionId,
            supabase
          );

        case 'customer_login':
          return await this.evaluateCustomerLogin(
            workflowExecutionId,
            supabase
          );

        case 'usage_threshold_crossed':
          return await this.evaluateUsageThreshold(
            config.eventConfig as unknown as UsageThresholdConfig,
            workflowExecutionId,
            supabase
          );

        case 'manual_event':
          return await this.evaluateManualEvent(
            config.eventConfig as unknown as ManualEventConfig,
            workflowExecutionId,
            supabase
          );

        default:
          return {
            triggered: false,
            reason: `Unknown event type: ${config.eventType}`
          };
      }
    } catch (error) {
      console.error('[SkipTriggerEvaluator] Error evaluating event trigger:', error);
      return {
        triggered: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // Event-Specific Evaluation Methods
  // =====================================================

  /**
   * Evaluate workflow_action_completed event
   * Checks if a specific workflow action has been completed
   */
  private static async evaluateWorkflowActionCompleted(
    config: WorkflowActionCompletedConfig,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!config || !config.workflowExecutionId) {
      return {
        triggered: false,
        reason: 'Missing workflowExecutionId in config'
      };
    }

    try {
      // Query workflow_actions table for completed actions
      let query = supabase
        .from(DB_TABLES.WORKFLOW_ACTIONS)
        .select('id, action_type, created_at')
        .eq('execution_id', config.workflowExecutionId)
        .eq('action_type', 'complete');

      // If specific action ID is provided, filter by it
      if (config.actionId) {
        query = query.eq(DB_COLUMNS.ID, config.actionId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          triggered: false,
          reason: `Error querying workflow actions: ${error.message}`
        };
      }

      const hasCompletedAction = data && data.length > 0;

      return {
        triggered: hasCompletedAction,
        reason: hasCompletedAction
          ? `Workflow action completed: ${config.workflowExecutionId}`
          : `Workflow action not yet completed: ${config.workflowExecutionId}`
      };
    } catch (error) {
      return {
        triggered: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Evaluate customer_login event
   * Checks if customer has logged in recently
   */
  private static async evaluateCustomerLogin(
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    try {
      // Get the customer_id for this workflow execution
      const { data: workflow, error: workflowError } = await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('customer_id, skip_last_evaluated_at')
        .eq(DB_COLUMNS.ID, workflowExecutionId)
        .single();

      if (workflowError || !workflow) {
        return {
          triggered: false,
          reason: 'Workflow execution not found'
        };
      }

      // Check profiles table for last_sign_in_at
      const { data: profile, error: profileError } = await supabase
        .from(DB_TABLES.PROFILES)
        .select('last_sign_in_at')
        .eq(DB_COLUMNS.ID, workflow.customer_id)
        .single();

      if (profileError || !profile) {
        return {
          triggered: false,
          reason: 'Customer profile not found'
        };
      }

      // Check if customer logged in since last evaluation
      if (!profile.last_sign_in_at) {
        return {
          triggered: false,
          reason: 'Customer has never logged in'
        };
      }

      const lastLoginDate = new Date(profile.last_sign_in_at);
      const lastEvaluatedDate = workflow.skip_last_evaluated_at
        ? new Date(workflow.skip_last_evaluated_at)
        : new Date(0); // If never evaluated, use epoch

      const loggedInSinceLastEval = lastLoginDate > lastEvaluatedDate;

      return {
        triggered: loggedInSinceLastEval,
        reason: loggedInSinceLastEval
          ? `Customer logged in at ${lastLoginDate.toISOString()}`
          : `Customer last login: ${lastLoginDate.toISOString()}`
      };
    } catch (error) {
      return {
        triggered: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Evaluate usage_threshold_crossed event
   * Checks if usage metrics have crossed a threshold
   */
  private static async evaluateUsageThreshold(
    config: UsageThresholdConfig,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!config || !config.metricName || config.threshold === undefined) {
      return {
        triggered: false,
        reason: 'Invalid usage threshold config'
      };
    }

    try {
      // Get the customer_id for this workflow execution
      const { data: workflow, error: workflowError } = await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select('customer_id')
        .eq(DB_COLUMNS.ID, workflowExecutionId)
        .single();

      if (workflowError || !workflow) {
        return {
          triggered: false,
          reason: 'Workflow execution not found'
        };
      }

      // Query customer_properties view for usage metrics
      const { data: properties, error: propertiesError } = await supabase
        .from(DB_TABLES.CUSTOMER_PROPERTIES)
        .select(`${config.metricName}`)
        .eq(DB_COLUMNS.CUSTOMER_ID, workflow.customer_id)
        .single();

      if (propertiesError || !properties) {
        return {
          triggered: false,
          reason: `Customer properties not found or metric ${config.metricName} does not exist`
        };
      }

      const metricValue = (properties as unknown as Record<string, unknown>)[config.metricName];

      if (metricValue === null || metricValue === undefined) {
        return {
          triggered: false,
          reason: `Metric ${config.metricName} not available`
        };
      }

      // Type guard to ensure metricValue is a number
      const numericValue = typeof metricValue === 'number' ? metricValue : Number(metricValue);

      if (isNaN(numericValue)) {
        return {
          triggered: false,
          reason: `Metric ${config.metricName} is not a valid number: ${metricValue}`
        };
      }

      // Evaluate threshold based on operator
      let thresholdCrossed = false;
      switch (config.operator) {
        case '>':
          thresholdCrossed = numericValue > config.threshold;
          break;
        case '>=':
          thresholdCrossed = numericValue >= config.threshold;
          break;
        case '<':
          thresholdCrossed = numericValue < config.threshold;
          break;
        case '<=':
          thresholdCrossed = numericValue <= config.threshold;
          break;
      }

      return {
        triggered: thresholdCrossed,
        reason: thresholdCrossed
          ? `${config.metricName} (${numericValue}) ${config.operator} ${config.threshold}`
          : `${config.metricName} (${numericValue}) not ${config.operator} ${config.threshold}`
      };
    } catch (error) {
      return {
        triggered: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Evaluate manual_event trigger
   * Checks if a manual trigger flag has been set in the database
   */
  private static async evaluateManualEvent(
    config: ManualEventConfig,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    if (!config || !config.eventKey) {
      return {
        triggered: false,
        reason: 'Missing eventKey in manual event config'
      };
    }

    try {
      // Check workflow_skip_triggers table for a fired manual event
      const { data, error } = await supabase
        .from(DB_TABLES.WORKFLOW_SKIP_TRIGGERS)
        .select('id, is_fired, fired_at')
        .eq('workflow_execution_id', workflowExecutionId)
        .eq('trigger_type', 'event')
        .eq('trigger_config->eventConfig->eventKey', config.eventKey)
        .eq('is_fired', true);

      if (error) {
        return {
          triggered: false,
          reason: `Error querying manual events: ${error.message}`
        };
      }

      const hasFiredEvent = data && data.length > 0;

      return {
        triggered: hasFiredEvent,
        reason: hasFiredEvent
          ? `Manual event fired: ${config.eventKey}`
          : `Manual event not yet fired: ${config.eventKey}`
      };
    } catch (error) {
      return {
        triggered: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // Batch Evaluation Methods (for Cron Job)
  // =====================================================

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
    const evaluationResults: Array<{ trigger: SkipTrigger; result: TriggerEvaluationResult }> = [];
    let firedTrigger: SkipTrigger | undefined;

    // Evaluate all triggers (even if one fires, to log all evaluations)
    for (const trigger of triggers) {
      const result = await this.evaluateTrigger(trigger, workflowExecutionId, supabase);
      evaluationResults.push({ trigger, result });

      // First trigger to fire wins (ANY logic)
      if (result.triggered && !firedTrigger) {
        firedTrigger = trigger;
      }
    }

    return {
      shouldReactivate: !!firedTrigger,
      firedTrigger,
      evaluationResults
    };
  }

  /**
   * Update workflow execution with trigger evaluation results
   * Called by cron job after evaluating triggers
   */
  static async updateWorkflowWithEvaluationResults(
    workflowExecutionId: string,
    shouldReactivate: boolean,
    firedTrigger: SkipTrigger | undefined,
    supabase: SupabaseClient
  ): Promise<void> {
    const now = new Date().toISOString();

    if (shouldReactivate && firedTrigger) {
      // Trigger fired - reactivate the workflow
      await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [DB_COLUMNS.STATUS]: 'in_progress',
          skip_last_evaluated_at: now,
          skip_trigger_fired_at: now,
          skip_fired_trigger_type: firedTrigger.type,
          skipped_at: null, // Clear skip timestamp
          skip_reason: null // Clear skip reason
        })
        .eq(DB_COLUMNS.ID, workflowExecutionId);
    } else {
      // No trigger fired - just update last_evaluated_at
      await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          skip_last_evaluated_at: now
        })
        .eq(DB_COLUMNS.ID, workflowExecutionId);
    }
  }

  /**
   * Log trigger evaluation to workflow_skip_triggers table
   * For debugging and history tracking
   */
  static async logTriggerEvaluation(
    workflowExecutionId: string,
    trigger: SkipTrigger,
    result: TriggerEvaluationResult,
    supabase: SupabaseClient
  ): Promise<void> {
    try {
      // Check if a record already exists for this trigger
      const { data: existing } = await supabase
        .from(DB_TABLES.WORKFLOW_SKIP_TRIGGERS)
        .select('id, evaluation_count')
        .eq('workflow_execution_id', workflowExecutionId)
        .eq('trigger_type', trigger.type)
        .eq('trigger_config', trigger.config)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from(DB_TABLES.WORKFLOW_SKIP_TRIGGERS)
          .update({
            is_fired: result.triggered,
            evaluated_at: result.evaluatedAt,
            evaluation_count: existing.evaluation_count + 1,
            fired_at: result.triggered ? result.evaluatedAt : null,
            error_message: result.error || null
          })
          .eq(DB_COLUMNS.ID, existing.id);
      } else {
        // Create new record
        await supabase
          .from(DB_TABLES.WORKFLOW_SKIP_TRIGGERS)
          .insert({
            workflow_execution_id: workflowExecutionId,
            trigger_type: trigger.type,
            trigger_config: trigger.config,
            is_fired: result.triggered,
            evaluated_at: result.evaluatedAt,
            evaluation_count: 1,
            fired_at: result.triggered ? result.evaluatedAt : null,
            error_message: result.error || null
          });
      }
    } catch (error) {
      console.error('[SkipTriggerEvaluator] Error logging trigger evaluation:', error);
      // Don't throw - logging failures shouldn't break trigger evaluation
    }
  }
}
