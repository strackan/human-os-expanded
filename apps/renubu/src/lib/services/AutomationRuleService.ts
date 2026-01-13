/**
 * Automation Rule Service
 *
 * Service layer for Event-Driven Workflow Launcher.
 * Manages automation rules that automatically launch workflows when external events occur.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';
import {
  AutomationRule,
  AutomationRuleExecution,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
  EventCondition,
  EventSource,
  TriggerLogic,
} from '@/types/automation-rules';
import { WorkflowExecutionService } from './WorkflowExecutionService';

// =====================================================
// Types
// =====================================================

/**
 * Result of evaluating automation rules
 */
export interface AutomationEvaluationResults {
  evaluated: number;
  launched: number;
  errors: number;
  errorDetails?: Array<{ ruleId: string; error: string }>;
}

/**
 * Result of evaluating a single rule
 */
export interface RuleEvaluationResult {
  triggered: boolean;
  matchedConditions: string[];
  error?: string;
}

// =====================================================
// AutomationRuleService
// =====================================================

export class AutomationRuleService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // =====================================================
  // CRUD Operations
  // =====================================================

  /**
   * Create a new automation rule
   *
   * @param userId - User ID creating the rule
   * @param input - Rule creation data
   * @returns Created automation rule
   */
  async createRule(
    userId: string,
    input: CreateAutomationRuleInput
  ): Promise<AutomationRule> {
    try {
      console.log(`[AutomationRuleService] Creating rule for user ${userId}:`, input);

      // Validate inputs
      if (!input.workflow_config_id) {
        throw new Error('workflow_config_id is required');
      }

      if (!input.name || input.name.trim().length === 0) {
        throw new Error('name is required');
      }

      if (!input.event_conditions || input.event_conditions.length === 0) {
        throw new Error('At least one event condition is required');
      }

      if (input.event_conditions.length > 2) {
        throw new Error('Maximum 2 event conditions allowed per rule');
      }

      // If multiple conditions, require logic operator
      if (input.event_conditions.length > 1 && !input.logic_operator) {
        throw new Error('logic_operator is required when multiple conditions are specified');
      }

      const now = new Date().toISOString();

      // Insert the rule
      const { data, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .insert({
          user_id: userId,
          workflow_config_id: input.workflow_config_id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          event_conditions: input.event_conditions,
          logic_operator: input.logic_operator || null,
          assign_to_user_id: input.assign_to_user_id || null,
          is_active: input.is_active !== undefined ? input.is_active : true,
          trigger_count: 0,
          last_triggered_at: null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create automation rule: ${error.message}`);
      }

      console.log(`[AutomationRuleService] Created rule ${data.id}`);
      return data as AutomationRule;
    } catch (error) {
      console.error('[AutomationRuleService] Error creating rule:', error);
      throw error;
    }
  }

  /**
   * Update an automation rule
   *
   * @param ruleId - Rule ID to update
   * @param userId - User ID performing the update
   * @param updates - Fields to update
   * @returns Updated automation rule
   */
  async updateRule(
    ruleId: string,
    userId: string,
    updates: UpdateAutomationRuleInput
  ): Promise<AutomationRule> {
    try {
      console.log(`[AutomationRuleService] Updating rule ${ruleId} for user ${userId}:`, updates);

      // Build update object
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          throw new Error('name cannot be empty');
        }
        updateData.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }

      if (updates.event_conditions !== undefined) {
        if (updates.event_conditions.length === 0) {
          throw new Error('At least one event condition is required');
        }
        if (updates.event_conditions.length > 2) {
          throw new Error('Maximum 2 event conditions allowed per rule');
        }
        updateData.event_conditions = updates.event_conditions;
      }

      if (updates.logic_operator !== undefined) {
        updateData.logic_operator = updates.logic_operator;
      }

      if (updates.assign_to_user_id !== undefined) {
        updateData.assign_to_user_id = updates.assign_to_user_id || null;
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      // Update the rule (RLS ensures user_id match)
      const { data, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .update(updateData)
        .eq(DB_COLUMNS.ID, ruleId)
        .eq(DB_COLUMNS.USER_ID, userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update automation rule: ${error.message}`);
      }

      if (!data) {
        throw new Error('Automation rule not found or access denied');
      }

      console.log(`[AutomationRuleService] Updated rule ${ruleId}`);
      return data as AutomationRule;
    } catch (error) {
      console.error('[AutomationRuleService] Error updating rule:', error);
      throw error;
    }
  }

  /**
   * Delete an automation rule
   *
   * @param ruleId - Rule ID to delete
   * @param userId - User ID performing the delete
   */
  async deleteRule(ruleId: string, userId: string): Promise<void> {
    try {
      console.log(`[AutomationRuleService] Deleting rule ${ruleId} for user ${userId}`);

      const { error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .delete()
        .eq(DB_COLUMNS.ID, ruleId)
        .eq(DB_COLUMNS.USER_ID, userId);

      if (error) {
        throw new Error(`Failed to delete automation rule: ${error.message}`);
      }

      console.log(`[AutomationRuleService] Deleted rule ${ruleId}`);
    } catch (error) {
      console.error('[AutomationRuleService] Error deleting rule:', error);
      throw error;
    }
  }

  /**
   * Toggle active status of a rule
   *
   * @param ruleId - Rule ID to toggle
   * @param userId - User ID performing the toggle
   * @param isActive - New active status
   * @returns Updated automation rule
   */
  async toggleActive(
    ruleId: string,
    userId: string,
    isActive: boolean
  ): Promise<AutomationRule> {
    try {
      console.log(`[AutomationRuleService] Toggling rule ${ruleId} to ${isActive}`);

      const { data, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, ruleId)
        .eq(DB_COLUMNS.USER_ID, userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to toggle automation rule: ${error.message}`);
      }

      if (!data) {
        throw new Error('Automation rule not found or access denied');
      }

      console.log(`[AutomationRuleService] Toggled rule ${ruleId} to ${isActive}`);
      return data as AutomationRule;
    } catch (error) {
      console.error('[AutomationRuleService] Error toggling rule:', error);
      throw error;
    }
  }

  /**
   * Get a specific automation rule
   *
   * @param ruleId - Rule ID to fetch
   * @param userId - User ID requesting the rule
   * @returns Automation rule or null if not found
   */
  async getRule(ruleId: string, userId: string): Promise<AutomationRule | null> {
    try {
      const { data, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .select('*')
        .eq(DB_COLUMNS.ID, ruleId)
        .eq(DB_COLUMNS.USER_ID, userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch automation rule: ${error.message}`);
      }

      return data as AutomationRule;
    } catch (error) {
      console.error('[AutomationRuleService] Error fetching rule:', error);
      throw error;
    }
  }

  /**
   * List automation rules for a user
   *
   * @param userId - User ID to filter by
   * @param filters - Optional filters
   * @returns Array of automation rules
   */
  async listRules(
    userId: string,
    filters?: { isActive?: boolean }
  ): Promise<AutomationRule[]> {
    try {
      let query = this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .select('*')
        .eq(DB_COLUMNS.USER_ID, userId)
        .order('created_at', { ascending: false });

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list automation rules: ${error.message}`);
      }

      return (data || []) as AutomationRule[];
    } catch (error) {
      console.error('[AutomationRuleService] Error listing rules:', error);
      throw error;
    }
  }

  /**
   * Get execution history for a rule
   *
   * @param ruleId - Rule ID to fetch executions for
   * @param userId - User ID requesting the history
   * @param limit - Maximum number of executions to return (default: 50)
   * @returns Array of rule executions
   */
  async getRuleExecutionHistory(
    ruleId: string,
    userId: string,
    limit: number = 50
  ): Promise<AutomationRuleExecution[]> {
    try {
      // First verify the rule belongs to the user
      const rule = await this.getRule(ruleId, userId);
      if (!rule) {
        throw new Error('Automation rule not found or access denied');
      }

      const { data, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULE_EXECUTIONS)
        .select('*')
        .eq('automation_rule_id', ruleId)
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch rule executions: ${error.message}`);
      }

      return (data || []) as AutomationRuleExecution[];
    } catch (error) {
      console.error('[AutomationRuleService] Error fetching executions:', error);
      throw error;
    }
  }

  // =====================================================
  // Evaluation Operations
  // =====================================================

  /**
   * Evaluate all active automation rules
   * Called by cron job to check if any rules should trigger
   *
   * @returns Evaluation statistics
   */
  async evaluateAllActiveRules(): Promise<AutomationEvaluationResults> {
    const startTime = Date.now();
    let evaluated = 0;
    let launched = 0;
    let errors = 0;
    const errorDetails: Array<{ ruleId: string; error: string }> = [];

    try {
      console.log('[AutomationRuleService] Starting evaluation of all active rules');

      // Get all active rules using database helper function
      const { data: rules, error: fetchError } = await this.supabase
        .rpc('get_active_automation_rules');

      if (fetchError) {
        throw new Error(`Failed to fetch active rules: ${fetchError.message}`);
      }

      if (!rules || rules.length === 0) {
        console.log('[AutomationRuleService] No active rules to evaluate');
        return { evaluated: 0, launched: 0, errors: 0 };
      }

      console.log(`[AutomationRuleService] Evaluating ${rules.length} active rules`);

      // Evaluate each rule
      for (const rule of rules) {
        try {
          evaluated++;

          const result = await this.evaluateRuleById(rule.id);

          if (result) {
            // Rule triggered - launch workflow
            const workflowExecutionId = await this.launchWorkflowFromRule(rule);
            launched++;
            console.log(`[AutomationRuleService] Launched workflow ${workflowExecutionId} from rule ${rule.id}`);
          }
        } catch (error) {
          errors++;
          errorDetails.push({
            ruleId: rule.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error(`[AutomationRuleService] Error evaluating rule ${rule.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[AutomationRuleService] Evaluation complete: ${evaluated} evaluated, ${launched} launched, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        launched,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      };
    } catch (error) {
      console.error('[AutomationRuleService] Error in batch evaluation:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single rule to check if it should trigger
   *
   * @param ruleId - Rule ID to evaluate
   * @returns True if rule triggered, false otherwise
   */
  async evaluateRuleById(ruleId: string): Promise<boolean> {
    try {
      // Fetch the rule
      const { data: rule, error } = await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .select('*')
        .eq(DB_COLUMNS.ID, ruleId)
        .single();

      if (error || !rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      if (!rule.is_active) {
        console.log(`[AutomationRuleService] Rule ${ruleId} is not active, skipping`);
        return false;
      }

      const conditions = rule.event_conditions as EventCondition[];
      const logic = (rule.logic_operator as TriggerLogic) || 'OR';

      console.log(`[AutomationRuleService] Evaluating rule ${ruleId} with ${conditions.length} conditions (${logic} logic)`);

      // Evaluate each condition
      const conditionResults = await Promise.all(
        conditions.map(async (condition) => {
          try {
            return await this.evaluateCondition(condition);
          } catch (error) {
            console.error(`[AutomationRuleService] Error evaluating condition:`, error);
            return false;
          }
        })
      );

      // Apply logic operator
      let shouldTrigger = false;
      if (logic === 'AND') {
        shouldTrigger = conditionResults.every((result) => result);
      } else {
        // OR logic (default)
        shouldTrigger = conditionResults.some((result) => result);
      }

      console.log(`[AutomationRuleService] Rule ${ruleId} evaluation result: ${shouldTrigger}`);
      return shouldTrigger;
    } catch (error) {
      console.error('[AutomationRuleService] Error evaluating rule:', error);
      throw error;
    }
  }

  /**
   * Launch a workflow from an automation rule
   *
   * @param rule - Automation rule that triggered
   * @returns Workflow execution ID
   */
  async launchWorkflowFromRule(rule: AutomationRule): Promise<string> {
    try {
      console.log(`[AutomationRuleService] Launching workflow for rule ${rule.id}`);

      // Get workflow config to determine required parameters
      const { data: workflowConfig, error: configError } = await this.supabase
        .from('workflow_configs')
        .select('*')
        .eq('id', rule.workflow_config_id)
        .single();

      if (configError || !workflowConfig) {
        throw new Error(`Workflow config ${rule.workflow_config_id} not found`);
      }

      // For now, we'll need a customer_id - this would come from the event in a real implementation
      // As a placeholder, we'll use a system marker that needs to be handled by the UI
      const customerId = 'automation-placeholder'; // TODO: Extract from event context

      // Create workflow execution
      const execution = await WorkflowExecutionService.createExecution(
        {
          workflowConfigId: rule.workflow_config_id,
          workflowName: workflowConfig.name || 'Automated Workflow',
          workflowType: workflowConfig.type || 'automation',
          customerId: customerId,
          userId: rule.assign_to_user_id || rule.user_id,
          totalSteps: workflowConfig.steps?.length || 0,
        },
        this.supabase
      );

      // Update rule stats
      await this.supabase
        .from(DB_TABLES.AUTOMATION_RULES)
        .update({
          trigger_count: (rule.trigger_count || 0) + 1,
          last_triggered_at: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, rule.id);

      // Log execution
      await this.logRuleExecution(rule.id, execution.id, rule.event_conditions, true, null);

      console.log(`[AutomationRuleService] Launched workflow execution ${execution.id}`);
      return execution.id;
    } catch (error) {
      console.error('[AutomationRuleService] Error launching workflow:', error);

      // Log failed execution
      await this.logRuleExecution(
        rule.id,
        null,
        rule.event_conditions,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  // =====================================================
  // Event Condition Evaluators
  // =====================================================

  /**
   * Evaluate a single event condition
   *
   * @param condition - Event condition to evaluate
   * @param event - Optional event data for webhook-based conditions
   * @returns True if condition is met, false otherwise
   */
  private async evaluateCondition(
    condition: EventCondition,
    event?: any
  ): Promise<boolean> {
    console.log(`[AutomationRuleService] Evaluating condition: ${condition.source}`);

    switch (condition.source) {
      case 'manual_event':
        return await this.evaluateSQLCondition(condition);

      case 'gmail_received':
      case 'gmail_sent':
        return await this.evaluateGmailCondition(condition, event);

      case 'calendar_event':
        return await this.evaluateCalendarCondition(condition, event);

      case 'slack_message':
        return await this.evaluateSlackCondition(condition, event);

      case 'customer_login':
      case 'usage_threshold':
      case 'workflow_action_completed':
        return await this.evaluateCRMCondition(condition, event);

      default:
        console.warn(`[AutomationRuleService] Unknown condition source: ${condition.source}`);
        return false;
    }
  }

  /**
   * Evaluate SQL-based condition
   * For manual_event source - executes user-provided SQL query
   *
   * @param condition - Event condition with SQL config
   * @returns True if SQL query returns any rows, false otherwise
   */
  async evaluateSQLCondition(condition: EventCondition): Promise<boolean> {
    try {
      const config = condition.config as { sql?: string };

      if (!config.sql) {
        console.warn('[AutomationRuleService] SQL condition missing sql config');
        return false;
      }

      // For safety, we'll use a database function to execute SQL
      // This would need to be implemented in the database
      console.log('[AutomationRuleService] SQL evaluation not yet implemented:', config.sql);

      // TODO: Implement safe SQL execution via database function
      // For now, return false
      return false;
    } catch (error) {
      console.error('[AutomationRuleService] Error evaluating SQL condition:', error);
      return false;
    }
  }

  /**
   * Evaluate Slack event condition
   * Stub implementation - will be enhanced with webhook integration
   *
   * @param condition - Event condition with Slack config
   * @param event - Optional webhook event data
   * @returns True if condition is met, false otherwise
   */
  async evaluateSlackCondition(
    condition: EventCondition,
    event?: any
  ): Promise<boolean> {
    console.log('[AutomationRuleService] Slack condition evaluation (stub):', condition.config);
    // TODO: Implement Slack webhook integration
    // For now, return false
    return false;
  }

  /**
   * Evaluate Gmail event condition
   * Stub implementation - will be enhanced with webhook integration
   *
   * @param condition - Event condition with Gmail config
   * @param event - Optional webhook event data
   * @returns True if condition is met, false otherwise
   */
  async evaluateGmailCondition(
    condition: EventCondition,
    event?: any
  ): Promise<boolean> {
    console.log('[AutomationRuleService] Gmail condition evaluation (stub):', condition.config);
    // TODO: Implement Gmail webhook integration
    // For now, return false
    return false;
  }

  /**
   * Evaluate Calendar event condition
   * Stub implementation - will be enhanced with webhook integration
   *
   * @param condition - Event condition with Calendar config
   * @param event - Optional webhook event data
   * @returns True if condition is met, false otherwise
   */
  async evaluateCalendarCondition(
    condition: EventCondition,
    event?: any
  ): Promise<boolean> {
    console.log('[AutomationRuleService] Calendar condition evaluation (stub):', condition.config);
    // TODO: Implement Calendar webhook integration
    // For now, return false
    return false;
  }

  /**
   * Evaluate CRM/platform event condition
   * Stub implementation - will be enhanced with event system integration
   *
   * @param condition - Event condition with CRM config
   * @param event - Optional event data
   * @returns True if condition is met, false otherwise
   */
  async evaluateCRMCondition(
    condition: EventCondition,
    event?: any
  ): Promise<boolean> {
    console.log('[AutomationRuleService] CRM condition evaluation (stub):', condition.config);
    // TODO: Implement platform event integration
    // For now, return false
    return false;
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Log an automation rule execution
   *
   * @param ruleId - Automation rule ID
   * @param workflowExecutionId - Workflow execution ID (null if failed)
   * @param triggerConditions - Conditions that triggered
   * @param success - Whether execution was successful
   * @param errorMessage - Error message if failed
   */
  private async logRuleExecution(
    ruleId: string,
    workflowExecutionId: string | null,
    triggerConditions: EventCondition[],
    success: boolean,
    errorMessage: string | null
  ): Promise<void> {
    try {
      await this.supabase
        .from(DB_TABLES.AUTOMATION_RULE_EXECUTIONS)
        .insert({
          automation_rule_id: ruleId,
          workflow_execution_id: workflowExecutionId,
          triggered_at: new Date().toISOString(),
          trigger_conditions: triggerConditions,
          success,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      // Don't throw - logging failures shouldn't break rule execution
      console.error('[AutomationRuleService] Error logging rule execution:', error);
    }
  }
}
