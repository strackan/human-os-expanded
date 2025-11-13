/**
 * Daily Trigger Evaluation Cron Job
 *
 * Supabase Edge Function that evaluates workflow triggers daily.
 * Processes snoozed workflows in batches and surfaces those with fired triggers.
 *
 * Schedule: Run daily at 8:00 AM UTC via pg_cron
 * Also available for manual invocation via HTTP POST
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Types (inline for Edge Function)
// =====================================================

interface EvaluationResults {
  evaluated: number;
  surfaced: number;
  errors: number;
  errorDetails?: Array<{ workflowId: string; error: string }>;
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
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
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

    console.log('[daily-trigger-evaluation] Starting trigger evaluation...');

    // Run the evaluation
    const results = await evaluateAllSnoozedWorkflows(supabase);

    console.log(
      `[daily-trigger-evaluation] Complete: ${results.evaluated} evaluated, ${results.surfaced} surfaced, ${results.errors} errors`
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        evaluated: results.evaluated,
        surfaced: results.surfaced,
        errors: results.errors,
        errorDetails: results.errorDetails,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('[daily-trigger-evaluation] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

// =====================================================
// Core Evaluation Logic (inline for Edge Function)
// =====================================================

/**
 * Evaluate all snoozed workflows
 * Simplified version of WorkflowSnoozeService.evaluateAllSnoozedWorkflows()
 */
async function evaluateAllSnoozedWorkflows(supabase: any): Promise<EvaluationResults> {
  const startTime = Date.now();
  let evaluated = 0;
  let surfaced = 0;
  let errors = 0;
  const errorDetails: Array<{ workflowId: string; error: string }> = [];

  try {
    // Get workflows needing evaluation (using the database helper function)
    const { data: workflows, error: fetchError } = await supabase
      .rpc('get_snoozed_workflows_for_evaluation', {
        p_evaluation_interval_minutes: 5
      });

    if (fetchError) {
      throw new Error(`Failed to fetch workflows: ${fetchError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log('[daily-trigger-evaluation] No workflows to evaluate');
      return { evaluated: 0, surfaced: 0, errors: 0 };
    }

    console.log(`[daily-trigger-evaluation] Evaluating ${workflows.length} workflows`);

    // Process each workflow
    for (const workflow of workflows) {
      try {
        evaluated++;

        const triggers = workflow.wake_triggers || [];

        if (triggers.length === 0) {
          continue;
        }

        // Evaluate triggers (simplified logic)
        let shouldSurface = false;
        let firedTriggerType: string | null = null;

        for (const trigger of triggers) {
          const result = await evaluateTrigger(trigger, workflow.workflow_execution_id, supabase);

          if (result.triggered) {
            shouldSurface = true;
            firedTriggerType = trigger.type;
            break; // First trigger to fire wins (ANY logic)
          }
        }

        // Update last_evaluated_at
        const now = new Date().toISOString();
        await supabase
          .from('workflow_executions')
          .update({ last_evaluated_at: now })
          .eq('id', workflow.workflow_execution_id);

        // If trigger fired, surface the workflow
        if (shouldSurface) {
          await supabase
            .from('workflow_executions')
            .update({
              status: 'in_progress',
              trigger_fired_at: now,
              fired_trigger_type: firedTriggerType,
              snoozed_until: null
            })
            .eq('id', workflow.workflow_execution_id);

          surfaced++;
          console.log(`[daily-trigger-evaluation] Surfaced workflow ${workflow.workflow_execution_id}`);
        }
      } catch (error) {
        errors++;
        errorDetails.push({
          workflowId: workflow.workflow_execution_id,
          error: error.message
        });
        console.error(`[daily-trigger-evaluation] Error evaluating workflow ${workflow.workflow_execution_id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[daily-trigger-evaluation] Completed in ${duration}ms`);

    return {
      evaluated,
      surfaced,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };
  } catch (error) {
    console.error('[daily-trigger-evaluation] Fatal error:', error);
    throw error;
  }
}

/**
 * Evaluate a single trigger (simplified)
 */
async function evaluateTrigger(trigger: any, workflowId: string, supabase: any): Promise<{ triggered: boolean }> {
  try {
    if (trigger.type === 'date') {
      // Date trigger - check if date has passed
      const triggerDate = new Date(trigger.config.date);
      const now = new Date();
      return { triggered: now >= triggerDate };
    } else if (trigger.type === 'event') {
      // Event trigger - simplified evaluation
      // For now, just return false - full event evaluation requires more context
      // The main app's TriggerEvaluator service handles this comprehensively
      return { triggered: false };
    }

    return { triggered: false };
  } catch (error) {
    console.error(`[daily-trigger-evaluation] Error evaluating trigger:`, error);
    return { triggered: false };
  }
}
