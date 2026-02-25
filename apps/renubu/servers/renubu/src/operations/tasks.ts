/**
 * Task MCP Operations
 * Operations for managing workflow tasks
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TaskSummary,
  TaskFilters,
  UpdateTaskStatusInput
} from '../types/renubu.js';

/**
 * List tasks with optional filtering
 * Returns minimal task info for efficiency
 */
export async function listTasks(
  supabase: SupabaseClient,
  userId: string,
  filters?: TaskFilters
): Promise<TaskSummary[]> {
  let query = supabase
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
    .eq('assigned_to', userId);

  // Apply filters if provided
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.customer_id) {
    // Join with workflow_executions to filter by customer
    const joinQuery: any = supabase
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
        updated_at,
        workflow_executions!inner(customer_id)
      `)
      .eq('assigned_to', userId)
      .eq('workflow_executions.customer_id', filters.customer_id);
    query = joinQuery;
  }

  if (filters?.due_before) {
    query = query.lte('due_date', filters.due_before);
  }

  // Order by due date (nulls last)
  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }

  // Clean up the data if we did a join
  if (filters?.customer_id && data) {
    return data.map((task: any) => {
      const { workflow_executions, ...taskData } = task;
      return taskData;
    });
  }

  return data || [];
}

/**
 * Update task status with optional notes
 * Common statuses: todo, in_progress, blocked, completed
 */
export async function updateTaskStatus(
  supabase: SupabaseClient,
  input: UpdateTaskStatusInput
): Promise<TaskSummary> {
  const { task_id, status, notes } = input;

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  // If completing the task, set completed_at
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  // Store notes in task_data if provided
  if (notes) {
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('task_data')
      .eq('id', task_id)
      .single();

    const taskData = currentTask?.task_data || {};
    updateData.task_data = {
      ...taskData,
      status_notes: notes,
      last_status_change: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', task_id)
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
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Task ${task_id} not found`);
  }

  return data;
}
