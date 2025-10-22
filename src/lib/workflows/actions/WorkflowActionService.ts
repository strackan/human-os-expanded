/**
 * Workflow Action Service
 *
 * Handles workflow state management and saved actions:
 * - Snooze: Temporarily hide workflow until a future date
 * - Skip: Permanently skip workflow
 * - Escalate: Reassign workflow to another user
 * - Resume: Reactivate snoozed/abandoned workflows
 * - Complete/Reject/Lose: Terminal state transitions
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkflowStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'snoozed'
  | 'abandoned'
  | 'rejected'
  | 'lost'
  | 'skipped'
  | 'escalated';

export type WorkflowActionType =
  | 'snooze'
  | 'unsnooze'
  | 'skip'
  | 'escalate'
  | 'resume'
  | 'complete'
  | 'reject'
  | 'lose'
  | 'start';

export interface SnoozeOptions {
  until: Date;
  reason?: string;
  days?: number;
}

export interface EscalateOptions {
  toUserId: string;
  reason?: string;
}

export interface SkipOptions {
  reason: string;
}

export interface RejectOptions {
  reason: string;
}

export interface LoseOptions {
  reason: string;
}

export interface WorkflowAction {
  id: string;
  execution_id: string;
  performed_by: string;
  action_type: WorkflowActionType;
  previous_status: WorkflowStatus | null;
  new_status: WorkflowStatus;
  action_data: Record<string, any>;
  notes: string | null;
  created_at: string;
}

export class WorkflowActionService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
  }

  /**
   * Snooze a workflow until a future date
   * Workflow will reappear in active list after snooze_until
   */
  async snoozeWorkflow(
    executionId: string,
    userId: string,
    options: SnoozeOptions
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      // Update workflow_executions
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'snoozed',
          snooze_until: options.until.toISOString(),
          snooze_days: options.days,
          snoozed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      // Record action
      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'snooze',
          new_status: 'snoozed',
          action_data: {
            until: options.until.toISOString(),
            days: options.days,
            reason: options.reason,
          },
          notes: options.reason,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Snooze error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume a snoozed workflow (unsnooze)
   */
  async resumeWorkflow(
    executionId: string,
    userId: string
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'in_progress',
          snooze_until: null,
          snooze_days: null,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'unsnooze',
          new_status: 'in_progress',
          action_data: {},
          notes: 'Workflow resumed from snooze',
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Resume error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Skip a workflow permanently
   * Workflow will not appear in active list
   */
  async skipWorkflow(
    executionId: string,
    userId: string,
    options: SkipOptions
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'skipped',
          skip_reason: options.reason,
          skipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'skip',
          new_status: 'skipped',
          action_data: { reason: options.reason },
          notes: options.reason,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Skip error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Escalate a workflow to another user
   * Original user can monitor but not manage
   */
  async escalateWorkflow(
    executionId: string,
    fromUserId: string,
    options: EscalateOptions
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'escalated',
          escalation_user_id: options.toUserId,
          escalated_from: fromUserId,
          escalated_at: new Date().toISOString(),
          assigned_csm_id: options.toUserId, // Reassign ownership
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: fromUserId,
          action_type: 'escalate',
          new_status: 'escalated',
          action_data: {
            to_user_id: options.toUserId,
            from_user_id: fromUserId,
            reason: options.reason,
          },
          notes: options.reason,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Escalate error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete a workflow
   */
  async completeWorkflow(
    executionId: string,
    userId: string,
    notes?: string
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_percentage: 100,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'complete',
          new_status: 'completed',
          action_data: {},
          notes,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Complete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a workflow
   */
  async rejectWorkflow(
    executionId: string,
    userId: string,
    options: RejectOptions
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_reason: options.reason,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'reject',
          new_status: 'rejected',
          action_data: { reason: options.reason },
          notes: options.reason,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Reject error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark workflow as lost
   */
  async loseWorkflow(
    executionId: string,
    userId: string,
    options: LoseOptions
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from('workflow_executions')
        .update({
          status: 'lost',
          lost_at: new Date().toISOString(),
          lost_reason: options.reason,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.supabase
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: 'lose',
          new_status: 'lost',
          action_data: { reason: options.reason },
          notes: options.reason,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Lose error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get action history for a workflow
   */
  async getWorkflowActions(
    executionId: string
  ): Promise<{ success: boolean; actions?: WorkflowAction[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_actions')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, actions: data as WorkflowAction[] };
    } catch (error: any) {
      console.error('[WorkflowActionService] Get actions error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get actions performed by a user
   */
  async getUserActions(
    userId: string,
    limit: number = 50
  ): Promise<{ success: boolean; actions?: WorkflowAction[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_actions')
        .select('*')
        .eq('performed_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, actions: data as WorkflowAction[] };
    } catch (error: any) {
      console.error('[WorkflowActionService] Get user actions error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Convenience function for creating a service instance
export function createWorkflowActionService(supabase?: SupabaseClient) {
  return new WorkflowActionService(supabase);
}
