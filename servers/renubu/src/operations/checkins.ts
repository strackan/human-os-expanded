/**
 * Check-In MCP Operations
 * Operations for Human OS check-ins and learning loop
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CheckInData,
  CreateWorkflowInput,
  WorkflowSummary
} from '../types/renubu.js';

/**
 * Create a new workflow execution
 * Used to start workflows that will later have check-ins
 */
export async function createWorkflowExecution(
  supabase: SupabaseClient,
  userId: string,
  input: CreateWorkflowInput
): Promise<WorkflowSummary> {
  const { workflow_type, customer_id, workflow_data } = input;

  const insertData: any = {
    workflow_type,
    status: 'active',
    assigned_to: userId,
    current_slide_index: 0,
    workflow_data: workflow_data || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (customer_id) {
    insertData.customer_id = customer_id;
  }

  const { data, error } = await supabase
    .from('workflow_executions')
    .insert(insertData)
    .select(`
      id,
      workflow_type,
      status,
      customer_id,
      snoozed_until,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create workflow: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create workflow: no data returned');
  }

  return data;
}

/**
 * Log a check-in for a completed workflow
 * This is the core of the Human OS learning loop
 */
export async function logCheckIn(
  supabase: SupabaseClient,
  workflowId: string,
  checkInData: CheckInData
): Promise<void> {
  const {
    outcome,
    effectiveness_rating,
    what_worked,
    what_didnt,
    next_time_notes
  } = checkInData;

  // Validate outcome
  if (!['success', 'partial', 'failed'].includes(outcome)) {
    throw new Error(`Invalid outcome: ${outcome}. Must be success, partial, or failed`);
  }

  // Validate effectiveness rating if provided
  if (effectiveness_rating !== undefined) {
    if (effectiveness_rating < 1 || effectiveness_rating > 5) {
      throw new Error('Effectiveness rating must be between 1 and 5');
    }
  }

  // Get current workflow to append to workflow_data
  const { data: workflow, error: fetchError } = await supabase
    .from('workflow_executions')
    .select('workflow_data')
    .eq('id', workflowId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to get workflow: ${fetchError.message}`);
  }

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Create check-in object
  const checkIn = {
    outcome,
    effectiveness_rating,
    what_worked,
    what_didnt,
    next_time_notes,
    checked_in_at: new Date().toISOString()
  };

  // Append to workflow_data.check_ins array
  const workflowData = workflow.workflow_data || {};
  const checkIns = workflowData.check_ins || [];
  checkIns.push(checkIn);

  // Update workflow with check-in
  const { error: updateError } = await supabase
    .from('workflow_executions')
    .update({
      workflow_data: {
        ...workflowData,
        check_ins: checkIns
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId);

  if (updateError) {
    throw new Error(`Failed to log check-in: ${updateError.message}`);
  }

  // Future: Trigger pattern detection service
  // This is where the Human OS learning loop kicks in
  // For Phase 3, we'll analyze patterns across check-ins
}
