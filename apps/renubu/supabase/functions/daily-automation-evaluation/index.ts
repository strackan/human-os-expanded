/**
 * Daily Automation Rule Evaluation Cron Job
 *
 * Supabase Edge Function that evaluates automation rules periodically.
 * Checks all active rules and launches workflows when conditions are met.
 *
 * Schedule: Run every 5-15 minutes via pg_cron or external scheduler
 * Also available for manual invocation via HTTP POST
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Types (inline for Edge Function)
// =====================================================

interface EvaluationResults {
  evaluated: number;
  launched: number;
  errors: number;
  errorDetails?: Array<{ ruleId: string; error: string }>;
}

interface AutomationRule {
  id: string;
  user_id: string;
  workflow_config_id: string;
  name: string;
  event_conditions: EventCondition[];
  logic_operator: 'AND' | 'OR' | null;
  is_active: boolean;
  trigger_count: number;
  assign_to_user_id: string | null;
}

interface EventCondition {
  id: string;
  source: string;
  config: Record<string, unknown>;
}

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req) => {
  try {
    // CORS headers for preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[daily-automation-evaluation] Starting automation rule evaluation...');

    // Run the evaluation
    const results = await evaluateAllActiveRules(supabase);

    console.log(
      `[daily-automation-evaluation] Complete: ${results.evaluated} evaluated, ${results.launched} launched, ${results.errors} errors`
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        evaluated: results.evaluated,
        launched: results.launched,
        errors: results.errors,
        errorDetails: results.errorDetails,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[daily-automation-evaluation] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// =====================================================
// Core Evaluation Logic
// =====================================================

/**
 * Evaluate all active automation rules
 */
async function evaluateAllActiveRules(supabase: any): Promise<EvaluationResults> {
  const startTime = Date.now();
  let evaluated = 0;
  let launched = 0;
  let errors = 0;
  const errorDetails: Array<{ ruleId: string; error: string }> = [];

  try {
    // Get all active automation rules
    const { data: rules, error: fetchError } = await supabase
      .rpc('get_active_automation_rules');

    if (fetchError) {
      throw new Error(`Failed to fetch active rules: ${fetchError.message}`);
    }

    if (!rules || rules.length === 0) {
      console.log('[daily-automation-evaluation] No active rules to evaluate');
      return { evaluated: 0, launched: 0, errors: 0 };
    }

    console.log(`[daily-automation-evaluation] Evaluating ${rules.length} active rules`);

    // Process each rule
    for (const rule of rules) {
      try {
        evaluated++;

        const shouldTrigger = await evaluateRule(rule, supabase);

        if (shouldTrigger) {
          // Launch workflow
          const workflowExecutionId = await launchWorkflowFromRule(rule, supabase);
          launched++;
          console.log(`[daily-automation-evaluation] Launched workflow ${workflowExecutionId} from rule ${rule.id}`);
        }
      } catch (error) {
        errors++;
        errorDetails.push({
          ruleId: rule.id,
          error: error.message,
        });
        console.error(`[daily-automation-evaluation] Error evaluating rule ${rule.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[daily-automation-evaluation] Completed in ${duration}ms`);

    return {
      evaluated,
      launched,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    };
  } catch (error) {
    console.error('[daily-automation-evaluation] Fatal error:', error);
    throw error;
  }
}

/**
 * Evaluate a single automation rule
 */
async function evaluateRule(rule: AutomationRule, supabase: any): Promise<boolean> {
  const conditions = rule.event_conditions;
  const logic = rule.logic_operator || 'OR';

  console.log(`[daily-automation-evaluation] Evaluating rule ${rule.id} with ${conditions.length} conditions (${logic} logic)`);

  // Evaluate each condition
  const conditionResults = await Promise.all(
    conditions.map(async (condition) => {
      try {
        return await evaluateCondition(condition, supabase);
      } catch (error) {
        console.error(`[daily-automation-evaluation] Error evaluating condition:`, error);
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

  return shouldTrigger;
}

/**
 * Evaluate a single event condition
 * Simplified version - full implementation would check webhooks, APIs, etc.
 */
async function evaluateCondition(condition: EventCondition, supabase: any): Promise<boolean> {
  console.log(`[daily-automation-evaluation] Evaluating condition: ${condition.source}`);

  // For now, all conditions return false
  // Full implementation would:
  // - Check webhook event storage
  // - Query external APIs (Gmail, Slack, Calendar)
  // - Execute SQL queries
  // - Check platform events (customer_login, usage_threshold, etc.)

  switch (condition.source) {
    case 'manual_event':
      // Could execute SQL query stored in condition.config
      return false;

    case 'gmail_received':
    case 'gmail_sent':
    case 'calendar_event':
    case 'slack_message':
    case 'customer_login':
    case 'usage_threshold':
    case 'workflow_action_completed':
      // Stub - would check webhook events or query APIs
      return false;

    default:
      console.warn(`[daily-automation-evaluation] Unknown condition source: ${condition.source}`);
      return false;
  }
}

/**
 * Launch a workflow from an automation rule
 */
async function launchWorkflowFromRule(rule: AutomationRule, supabase: any): Promise<string> {
  try {
    console.log(`[daily-automation-evaluation] Launching workflow for rule ${rule.id}`);

    // Get workflow config
    const { data: workflowConfig, error: configError } = await supabase
      .from('workflow_configs')
      .select('*')
      .eq('id', rule.workflow_config_id)
      .single();

    if (configError || !workflowConfig) {
      throw new Error(`Workflow config ${rule.workflow_config_id} not found`);
    }

    // Create workflow execution
    // Using placeholder customer_id - would be extracted from event context
    const customerId = 'automation-placeholder';
    const now = new Date().toISOString();

    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_config_id: rule.workflow_config_id,
        workflow_name: workflowConfig.name || 'Automated Workflow',
        workflow_type: workflowConfig.type || 'automation',
        customer_id: customerId,
        user_id: rule.assign_to_user_id || rule.user_id,
        total_steps: workflowConfig.steps?.length || 0,
        status: 'not_started',
        current_step_index: 0,
        completed_steps_count: 0,
        skipped_steps_count: 0,
        completion_percentage: 0,
        created_at: now,
        updated_at: now,
        last_activity_at: now,
      })
      .select()
      .single();

    if (execError) {
      throw new Error(`Failed to create workflow execution: ${execError.message}`);
    }

    // Update rule stats
    await supabase
      .from('automation_rules')
      .update({
        trigger_count: (rule.trigger_count || 0) + 1,
        last_triggered_at: now,
      })
      .eq('id', rule.id);

    // Log execution
    await supabase
      .from('automation_rule_executions')
      .insert({
        automation_rule_id: rule.id,
        workflow_execution_id: execution.id,
        triggered_at: now,
        trigger_conditions: rule.event_conditions,
        success: true,
        error_message: null,
        created_at: now,
      });

    return execution.id;
  } catch (error) {
    console.error('[daily-automation-evaluation] Error launching workflow:', error);

    // Log failed execution
    await supabase
      .from('automation_rule_executions')
      .insert({
        automation_rule_id: rule.id,
        workflow_execution_id: null,
        triggered_at: new Date().toISOString(),
        trigger_conditions: rule.event_conditions,
        success: false,
        error_message: error.message,
        created_at: new Date().toISOString(),
      });

    throw error;
  }
}
