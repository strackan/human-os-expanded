/**
 * Task management tools
 *
 * Provides:
 * - get_urgent_tasks: Get tasks by urgency level
 * - add_task: Create new task with deadline
 * - complete_task: Mark task complete
 * - list_all_tasks: List all tasks
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase(url: string, key: string) {
  return createClient(url, key);
}

interface UrgentTask {
  id: string;
  title: string;
  assignee_name?: string;
  due_date?: string;
  days_until_due?: number;
  urgency?: string;
  escalation_message?: string;
}

interface TaskSummary {
  overdue: Array<{
    id: string;
    title: string;
    assignee: string;
    due_date?: string;
    days_until_due?: number;
    message?: string;
  }>;
  critical: Array<{
    id: string;
    title: string;
    assignee: string;
    due_date?: string;
    days_until_due?: number;
    message?: string;
  }>;
  urgent: Array<{
    id: string;
    title: string;
    assignee: string;
    due_date?: string;
    days_until_due?: number;
    message?: string;
  }>;
  upcoming: Array<{
    id: string;
    title: string;
    assignee: string;
    due_date?: string;
    days_until_due?: number;
    message?: string;
  }>;
}

/**
 * Get tasks that need attention, ordered by urgency.
 *
 * Returns tasks that are:
 * - overdue (past due date)
 * - critical (due today)
 * - urgent (due in 1-2 days)
 * - upcoming (due in 3-7 days, if includeUpcoming=true)
 */
export async function getUrgentTasks(
  supabaseUrl: string,
  supabaseKey: string,
  includeUpcoming: boolean = true
): Promise<{
  attention_needed: string[];
  tasks: TaskSummary;
  total_requiring_attention: number;
}> {
  const supabase = getSupabase(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc('get_urgent_tasks', {
    p_include_upcoming: includeUpcoming,
  });

  if (error) {
    throw new Error(`Failed to get urgent tasks: ${error.message}`);
  }

  const tasks: UrgentTask[] = data || [];

  const summary: TaskSummary = {
    overdue: [],
    critical: [],
    urgent: [],
    upcoming: [],
  };

  for (const t of tasks) {
    const urgency = t.urgency || 'normal';
    if (urgency in summary) {
      summary[urgency as keyof TaskSummary].push({
        id: t.id,
        title: t.title,
        assignee: t.assignee_name || 'You',
        due_date: t.due_date,
        days_until_due: t.days_until_due,
        message: t.escalation_message,
      });
    }
  }

  const attention_needed: string[] = [];
  if (summary.overdue.length > 0) {
    attention_needed.push(`🚨 ${summary.overdue.length} OVERDUE task(s)`);
  }
  if (summary.critical.length > 0) {
    attention_needed.push(`⚠️ ${summary.critical.length} task(s) due TODAY`);
  }
  if (summary.urgent.length > 0) {
    attention_needed.push(`📅 ${summary.urgent.length} urgent task(s) due soon`);
  }

  return {
    attention_needed,
    tasks: summary,
    total_requiring_attention: tasks.length,
  };
}

/**
 * Add a new task with a due date.
 */
export async function addTask(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  params: {
    title: string;
    due_date: string;
    assignee_name?: string;
    description?: string;
  }
): Promise<{
  success: boolean;
  task_id?: string;
  title: string;
  due_date: string;
  assignee: string;
  urgency?: string;
  message: string;
  error?: string;
}> {
  const supabase = getSupabase(supabaseUrl, supabaseKey);

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.due_date)) {
    return {
      success: false,
      title: params.title,
      due_date: params.due_date,
      assignee: params.assignee_name || 'You',
      message: '',
      error: `Invalid date format: ${params.due_date}. Use YYYY-MM-DD.`,
    };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      description: params.description,
      due_date: params.due_date,
      assignee_name: params.assignee_name,
      layer,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      title: params.title,
      due_date: params.due_date,
      assignee: params.assignee_name || 'You',
      message: '',
      error: error.message,
    };
  }

  return {
    success: true,
    task_id: data?.id,
    title: params.title,
    due_date: params.due_date,
    assignee: params.assignee_name || 'You',
    urgency: data?.urgency || 'normal',
    message: `Task '${params.title}' added. Will escalate as ${params.due_date} approaches.`,
  };
}

/**
 * Mark a task as completed.
 */
export async function completeTask(
  supabaseUrl: string,
  supabaseKey: string,
  taskId: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  const supabase = getSupabase(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: '',
      error: error.message,
    };
  }

  if (!data) {
    return {
      success: false,
      message: '',
      error: 'Task not found',
    };
  }

  return {
    success: true,
    message: `✅ Task '${data.title}' marked complete!`,
  };
}

/**
 * List all tasks with a given status.
 */
export async function listAllTasks(
  supabaseUrl: string,
  supabaseKey: string,
  status: string = 'pending'
): Promise<{
  status_filter: string;
  count: number;
  tasks: Array<{
    id: string;
    title: string;
    assignee_name?: string;
    due_date?: string;
    urgency?: string;
    status: string;
    created_at: string;
  }>;
}> {
  const supabase = getSupabase(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, assignee_name, due_date, urgency, status, created_at')
    .eq('status', status)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }

  const tasks = data || [];

  return {
    status_filter: status,
    count: tasks.length,
    tasks,
  };
}
