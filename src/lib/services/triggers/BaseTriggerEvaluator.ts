/**
 * Base Trigger Evaluator Service
 *
 * Consolidated base class for all workflow trigger evaluators.
 * Eliminates 95% code duplication across Skip, Review, and Escalate evaluators.
 *
 * Release 0.1.8.1 - Phase 1: Trigger Evaluator Consolidation
 * Reduces 1,707 lines (3 files) to ~700 lines total
 *
 * =====================================================
 * ANALYSIS OF DUPLICATE CODE (completed by Agent 1)
 * =====================================================
 *
 * Files Analyzed:
 * 1. SkipTriggerEvaluator.ts (571 lines)
 * 2. ReviewTriggerEvaluator.ts (568 lines)
 * 3. EscalateTriggerEvaluator.ts (568 lines)
 *
 * Code Structure (IDENTICAL across all 3):
 * - evaluateTrigger() - Lines 33-81 (100% identical logic)
 * - evaluateDateTrigger() - Lines 87-122 (100% identical)
 * - evaluateEventTrigger() - Lines 128-175 (100% identical)
 * - evaluateWorkflowActionCompleted() - Lines 185-233 (100% identical)
 * - evaluateCustomerLogin() - Lines 239-299 (differs only in field name)
 * - evaluateUsageThreshold() - Lines 305-394 (100% identical)
 * - evaluateManualEvent() - Lines 400-443 (differs only in table name)
 * - evaluateAllTriggers() - Lines 453-481 (differs only in return property name)
 * - updateWorkflowWithEvaluationResults() - Lines 487-514 (differs in field prefix)
 * - logTriggerEvaluation() - Lines 520-570 (differs only in table name)
 *
 * Differences Identified:
 * 1. Database table names:
 *    - Skip: workflow_skip_triggers
 *    - Review: workflow_escalate_triggers (NOTE: bug in ReviewTriggerEvaluator)
 *    - Escalate: workflow_escalate_triggers
 *
 * 2. Field prefixes in workflow_executions:
 *    - Skip: skip_last_evaluated_at, skip_trigger_fired_at, skip_fired_trigger_type
 *    - Review: review_last_evaluated_at, review_trigger_fired_at, review_fired_trigger_type
 *    - Escalate: escalate_last_evaluated_at, escalate_trigger_fired_at, escalate_fired_trigger_type
 *
 * 3. Return property name in evaluateAllTriggers():
 *    - Skip: shouldReactivate
 *    - Review: shouldNotify
 *    - Escalate: shouldNotify
 *
 * 4. Status update behavior in updateWorkflowWithEvaluationResults():
 *    - Skip: Sets status to 'in_progress' when trigger fires
 *    - Review/Escalate: Only updates trigger fields, doesn't change status
 *
 * Code Reduction:
 * - Before: 3 files × ~568 lines = 1,707 lines (95% duplicate)
 * - After: 1 base class (~400 lines) + 3 subclasses (~50 lines each) = ~550 lines
 * - Savings: 1,157 lines (68% reduction)
 *
 * =====================================================
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import type { DateTriggerConfig, EventTriggerConfig } from '@/types/wake-triggers';

/**
 * Generic trigger type that works for all evaluators
 */
export interface BaseTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

/**
 * Workflow action completed config
 */
export interface WorkflowActionCompletedConfig {
  workflowExecutionId: string;
  actionId?: string;
}

/**
 * Usage threshold config
 */
export interface UsageThresholdConfig {
  metricName: string;
  threshold: number;
  operator: '>' | '>=' | '<' | '<=';
}

/**
 * Manual event config
 */
export interface ManualEventConfig {
  eventKey: string;
}

/**
 * Trigger evaluation result
 */
export interface TriggerEvaluationResult {
  triggered: boolean;
  evaluatedAt: string;
  reason?: string;
  error?: string;
}

/**
 * Configuration interface that subclasses must implement
 */
export interface TriggerEvaluatorConfig {
  tableName: string;
  fieldPrefix: string;
  resultPropertyName: 'shouldReactivate' | 'shouldNotify';
  shouldUpdateStatus: boolean; // Skip updates status to 'in_progress', Review/Escalate don't
}

/**
 * Base class for all trigger evaluators
 * Implements all shared evaluation logic
 */
export abstract class BaseTriggerEvaluator<T extends BaseTrigger> {
  /**
   * Get the configuration for this evaluator
   * Subclasses must implement this to provide their specific configuration
   */
  protected abstract getConfig(): TriggerEvaluatorConfig;

  /**
   * Evaluate a trigger to determine if it should fire
   * This is the main entry point for trigger evaluation
   */
  async evaluateTrigger(
    trigger: T,
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<TriggerEvaluationResult> {
    const evaluatedAt = new Date().toISOString();

    try {
      let triggered = false;
      let reason: string | undefined;

      if (this.isDateTrigger(trigger)) {
        triggered = await this.evaluateDateTrigger(trigger.config as DateTriggerConfig);
        reason = triggered
          ? `Date trigger fired: ${(trigger.config as DateTriggerConfig).date}`
          : `Date not yet reached: ${(trigger.config as DateTriggerConfig).date}`;
      } else if (this.isEventTrigger(trigger)) {
        const result = await this.evaluateEventTrigger(
          trigger.config as EventTriggerConfig,
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
      console.error(`[${this.constructor.name}] Error evaluating trigger ${trigger.id}:`, errorMessage);

      return {
        triggered: false,
        evaluatedAt,
        error: errorMessage
      };
    }
  }

  /**
   * Type guard to check if trigger is a date trigger
   */
  protected isDateTrigger(trigger: T): trigger is T & { config: DateTriggerConfig } {
    return trigger.type === 'date';
  }

  /**
   * Type guard to check if trigger is an event trigger
   */
  protected isEventTrigger(trigger: T): trigger is T & { config: EventTriggerConfig } {
    return trigger.type === 'event';
  }

  /**
   * Evaluate a date trigger
   * Returns true if the current time has passed the trigger date
   */
  protected async evaluateDateTrigger(config: DateTriggerConfig): Promise<boolean> {
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
      console.error(`[${this.constructor.name}] Error evaluating date trigger:`, error);
      return false;
    }
  }

  /**
   * Evaluate an event trigger
   * Returns true if the specified event has occurred
   */
  protected async evaluateEventTrigger(
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
      console.error(`[${this.constructor.name}] Error evaluating event trigger:`, error);
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
  protected async evaluateWorkflowActionCompleted(
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
  protected async evaluateCustomerLogin(
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{ triggered: boolean; reason?: string }> {
    try {
      const config = this.getConfig();
      const lastEvaluatedField = `${config.fieldPrefix}_last_evaluated_at`;

      // Get the customer_id for this workflow execution
      const { data: workflow, error: workflowError } = await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .select(`customer_id, ${lastEvaluatedField}`)
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
      const lastEvaluatedAt = (workflow as Record<string, unknown>)[lastEvaluatedField];
      const lastEvaluatedDate = lastEvaluatedAt
        ? new Date(lastEvaluatedAt as string)
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
  protected async evaluateUsageThreshold(
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
  protected async evaluateManualEvent(
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
      const evaluatorConfig = this.getConfig();

      // Check the appropriate triggers table for a fired manual event
      const { data, error } = await supabase
        .from(evaluatorConfig.tableName)
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
  async evaluateAllTriggers(
    workflowExecutionId: string,
    triggers: T[],
    supabase: SupabaseClient
  ): Promise<{
    shouldReactivate?: boolean;
    shouldNotify?: boolean;
    firedTrigger?: T;
    evaluationResults: Array<{ trigger: T; result: TriggerEvaluationResult }>;
  }> {
    const config = this.getConfig();
    const evaluationResults: Array<{ trigger: T; result: TriggerEvaluationResult }> = [];
    let firedTrigger: T | undefined;

    // Evaluate all triggers (even if one fires, to log all evaluations)
    for (const trigger of triggers) {
      const result = await this.evaluateTrigger(trigger, workflowExecutionId, supabase);
      evaluationResults.push({ trigger, result });

      // First trigger to fire wins (ANY logic)
      if (result.triggered && !firedTrigger) {
        firedTrigger = trigger;
      }
    }

    const shouldFire = !!firedTrigger;

    // Return with the appropriate property name based on config
    if (config.resultPropertyName === 'shouldReactivate') {
      return {
        shouldReactivate: shouldFire,
        firedTrigger,
        evaluationResults
      };
    } else {
      return {
        shouldNotify: shouldFire,
        firedTrigger,
        evaluationResults
      };
    }
  }

  /**
   * Update workflow execution with trigger evaluation results
   * Called by cron job after evaluating triggers
   */
  async updateWorkflowWithEvaluationResults(
    workflowExecutionId: string,
    shouldFire: boolean,
    firedTrigger: T | undefined,
    supabase: SupabaseClient
  ): Promise<void> {
    const config = this.getConfig();
    const now = new Date().toISOString();
    const prefix = config.fieldPrefix;

    if (shouldFire && firedTrigger) {
      // Build the update object based on configuration
      const updateObj: Record<string, unknown> = {
        [`${prefix}_last_evaluated_at`]: now,
        [`${prefix}_trigger_fired_at`]: now,
        [`${prefix}_fired_trigger_type`]: firedTrigger.type
      };

      // Skip evaluator also updates status and clears skip fields
      if (config.shouldUpdateStatus) {
        updateObj[DB_COLUMNS.STATUS] = 'in_progress';
        updateObj.skipped_at = null;
        updateObj[`${prefix}_reason`] = null;
      }

      await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update(updateObj)
        .eq(DB_COLUMNS.ID, workflowExecutionId);
    } else {
      // No trigger fired - just update last_evaluated_at
      await supabase
        .from(DB_TABLES.WORKFLOW_EXECUTIONS)
        .update({
          [`${prefix}_last_evaluated_at`]: now
        })
        .eq(DB_COLUMNS.ID, workflowExecutionId);
    }
  }

  /**
   * Log trigger evaluation to the appropriate triggers table
   * For debugging and history tracking
   */
  async logTriggerEvaluation(
    workflowExecutionId: string,
    trigger: T,
    result: TriggerEvaluationResult,
    supabase: SupabaseClient
  ): Promise<void> {
    try {
      const config = this.getConfig();

      // Check if a record already exists for this trigger
      const { data: existing } = await supabase
        .from(config.tableName)
        .select('id, evaluation_count')
        .eq('workflow_execution_id', workflowExecutionId)
        .eq('trigger_type', trigger.type)
        .eq('trigger_config', trigger.config)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from(config.tableName)
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
          .from(config.tableName)
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
      console.error(`[${this.constructor.name}] Error logging trigger evaluation:`, error);
      // Don't throw - logging failures shouldn't break trigger evaluation
    }
  }
}
