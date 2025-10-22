/**
 * Workflow Execution Helper
 *
 * Creates workflow_executions records for testing Phase 3E actions
 */

import { createClient } from '@/lib/supabase/client';

export interface CreateExecutionParams {
  workflowConfigId: string;
  workflowName: string;
  workflowType: string;
  customerId: string;
  userId: string;
  assignedCsmId: string;
  totalSteps?: number;
}

export interface CreateExecutionResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

/**
 * Create a workflow execution record in the database
 * This is used to test workflow actions (snooze, skip, escalate)
 */
export async function createWorkflowExecution(
  params: CreateExecutionParams
): Promise<CreateExecutionResult> {
  try {
    const supabase = createClient();

    const executionData = {
      workflow_config_id: params.workflowConfigId,
      workflow_name: params.workflowName,
      workflow_type: params.workflowType,
      customer_id: params.customerId,
      user_id: params.userId,
      assigned_csm_id: params.assignedCsmId,
      status: 'in_progress',
      current_step_id: 'step-0',
      current_step_index: 0,
      total_steps: params.totalSteps || 6,
      completed_steps_count: 0,
      completion_percentage: 0,
      priority_score: 85,
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert(executionData)
      .select('id')
      .single();

    if (error) {
      console.error('[createWorkflowExecution] Error:', error);
      return { success: false, error: error.message };
    }

    console.log('[createWorkflowExecution] Created execution:', data.id);
    return { success: true, executionId: data.id };
  } catch (err: any) {
    console.error('[createWorkflowExecution] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get test user ID for demo purposes
 * In production, this would come from auth session
 */
export async function getTestUserId(): Promise<string | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[getTestUserId] No user found, using placeholder');
      // Return a placeholder UUID for demo purposes
      return '00000000-0000-0000-0000-000000000001';
    }

    return data.id;
  } catch (err) {
    console.warn('[getTestUserId] Error fetching user:', err);
    return '00000000-0000-0000-0000-000000000001';
  }
}
