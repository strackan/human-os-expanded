/**
 * Workflow MCP Operations
 * Operations for managing workflow executions, snoozing, and waking
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  WorkflowSummary,
  WorkflowDetail,
  SnoozeWorkflowInput
} from '../types/renubu.js';

/**
 * List all snoozed workflows for a user
 * Returns minimal info to reduce token usage
 */
export async function listSnoozedWorkflows(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkflowSummary[]> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select(`
      id,
      workflow_type,
      status,
      customer_id,
      snoozed_until,
      created_at,
      updated_at
    `)
    .eq('assigned_to', userId)
    .eq('status', 'snoozed')
    .order('snoozed_until', { ascending: true });

  if (error) {
    throw new Error(`Failed to list snoozed workflows: ${error.message}`);
  }

  return data || [];
}

/**
 * Get full workflow details including tasks and actions
 * Use sparingly - returns verbose data
 */
export async function getWorkflowDetails(
  supabase: SupabaseClient,
  workflowId: string
): Promise<WorkflowDetail> {
  // Get workflow execution
  const { data: workflow, error: workflowError } = await supabase
    .from('workflow_executions')
    .select(`
      id,
      workflow_type,
      status,
      customer_id,
      snoozed_until,
      current_slide_index,
      workflow_data,
      created_at,
      updated_at
    `)
    .eq('id', workflowId)
    .single();

  if (workflowError) {
    throw new Error(`Failed to get workflow: ${workflowError.message}`);
  }

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Get tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      id,
      workflow_execution_id,
      title,
      description,
      status,
      assigned_to,
      due_date,
      snoozed_until,
      created_at,
      updated_at
    `)
    .eq('workflow_execution_id', workflowId)
    .order('created_at', { ascending: true });

  if (tasksError) {
    throw new Error(`Failed to get tasks: ${tasksError.message}`);
  }

  // Get actions
  const { data: actions, error: actionsError } = await supabase
    .from('workflow_actions')
    .select(`
      id,
      workflow_execution_id,
      action_type,
      action_data,
      created_at
    `)
    .eq('workflow_execution_id', workflowId)
    .order('created_at', { ascending: true });

  if (actionsError) {
    throw new Error(`Failed to get actions: ${actionsError.message}`);
  }

  return {
    ...workflow,
    tasks: tasks || [],
    actions: actions || []
  };
}

/**
 * Snooze a workflow until a specific date/time
 * Optionally include wake condition for smart re-surfacing
 */
export async function snoozeWorkflow(
  supabase: SupabaseClient,
  input: SnoozeWorkflowInput
): Promise<WorkflowSummary> {
  const { workflow_id, snoozed_until, condition, snooze_reason } = input;

  // Validate date format
  const snoozeDate = new Date(snoozed_until);
  if (isNaN(snoozeDate.getTime())) {
    throw new Error(`Invalid date format: ${snoozed_until}`);
  }

  // Update workflow
  const updateData: any = {
    status: 'snoozed',
    snoozed_until,
    updated_at: new Date().toISOString()
  };

  // Store condition and reason in workflow_data if provided
  if (condition || snooze_reason) {
    const { data: currentWorkflow } = await supabase
      .from('workflow_executions')
      .select('workflow_data')
      .eq('id', workflow_id)
      .single();

    const workflowData = currentWorkflow?.workflow_data || {};
    updateData.workflow_data = {
      ...workflowData,
      snooze_condition: condition,
      snooze_reason: snooze_reason
    };
  }

  const { data, error } = await supabase
    .from('workflow_executions')
    .update(updateData)
    .eq('id', workflow_id)
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
    throw new Error(`Failed to snooze workflow: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Workflow ${workflow_id} not found`);
  }

  return data;
}

/**
 * Wake a snoozed workflow (move back to active)
 */
export async function wakeWorkflow(
  supabase: SupabaseClient,
  workflowId: string
): Promise<WorkflowSummary> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .update({
      status: 'active',
      snoozed_until: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
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
    throw new Error(`Failed to wake workflow: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  return data;
}
