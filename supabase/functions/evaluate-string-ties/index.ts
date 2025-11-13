/**
 * String-Tie Reminder Evaluation Cron Job
 *
 * Supabase Edge Function that evaluates string-tie reminders periodically.
 * Surfaces reminders that are due and sends notifications.
 *
 * Schedule: Run every 5 minutes via pg_cron
 * Also available for manual invocation via HTTP POST
 *
 * Phase 1.4: String-Tie Foundation - Reminder Evaluation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// Types (inline for Edge Function)
// =====================================================

interface EvaluationResults {
  evaluated: number;
  surfaced: number;
  errors: number;
  errorDetails?: Array<{ stringTieId: string; error: string }>;
}

interface StringTieReminder {
  string_tie_id: string;
  user_id: string;
  reminder_text: string;
  remind_at: string;
  content: string;
  source: string;
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

    console.log('[evaluate-string-ties] Starting reminder evaluation...');

    // Run the evaluation
    const results = await evaluateAllDueReminders(supabase);

    console.log(
      `[evaluate-string-ties] Complete: ${results.evaluated} evaluated, ${results.surfaced} surfaced, ${results.errors} errors`
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
    console.error('[evaluate-string-ties] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
// Core Evaluation Logic
// =====================================================

/**
 * Evaluate all due string-tie reminders
 */
async function evaluateAllDueReminders(supabase: any): Promise<EvaluationResults> {
  const startTime = Date.now();
  let evaluated = 0;
  let surfaced = 0;
  let errors = 0;
  const errorDetails: Array<{ stringTieId: string; error: string }> = [];

  try {
    // Get reminders that need to be surfaced (using the database helper function)
    const { data: reminders, error: fetchError } = await supabase
      .rpc('get_string_ties_for_reminder', {
        p_evaluation_interval_minutes: 5
      });

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      console.log('[evaluate-string-ties] No reminders to evaluate');
      return { evaluated: 0, surfaced: 0, errors: 0 };
    }

    console.log(`[evaluate-string-ties] Evaluating ${reminders.length} reminders`);

    // Process each reminder
    for (const reminder of reminders as StringTieReminder[]) {
      try {
        evaluated++;
        await surfaceReminder(reminder, supabase);
        surfaced++;
        console.log(`[evaluate-string-ties] Surfaced reminder ${reminder.string_tie_id}`);
      } catch (error) {
        errors++;
        errorDetails.push({
          stringTieId: reminder.string_tie_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`[evaluate-string-ties] Error surfacing reminder ${reminder.string_tie_id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[evaluate-string-ties] Completed in ${duration}ms`);

    return {
      evaluated,
      surfaced,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };
  } catch (error) {
    console.error('[evaluate-string-ties] Fatal error:', error);
    throw error;
  }
}

/**
 * Surface a single reminder to the user
 */
async function surfaceReminder(reminder: StringTieReminder, supabase: any): Promise<void> {
  const stringTieId = reminder.string_tie_id;
  const userId = reminder.user_id;

  // Mark as reminded
  const { error: updateError } = await supabase
    .from('string_ties')
    .update({
      reminded: true
    })
    .eq('id', stringTieId);

  if (updateError) {
    throw new Error(`Failed to mark reminder as surfaced: ${updateError.message}`);
  }

  // Create in-product notification
  await createReminderNotification(reminder, supabase);
}

/**
 * Create in-product notification for a reminder
 */
async function createReminderNotification(reminder: StringTieReminder, supabase: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('in_product_notifications')
      .insert({
        user_id: reminder.user_id,
        notification_type: 'string_tie_reminder',
        message: reminder.reminder_text,
        link_url: `/string-ties/${reminder.string_tie_id}`,
        link_text: 'View Reminder',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[evaluate-string-ties] Error creating notification:', error);
      // Don't throw - notification failures shouldn't break reminder surfacing
    } else {
      console.log(`[evaluate-string-ties] Created notification for user ${reminder.user_id}`);
    }
  } catch (error) {
    console.error('[evaluate-string-ties] Error creating reminder notification:', error);
    // Don't throw - notification failures shouldn't break reminder surfacing
  }
}
