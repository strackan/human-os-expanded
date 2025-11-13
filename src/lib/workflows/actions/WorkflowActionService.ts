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

import type { SupabaseClient } from '@supabase/supabase-js';
import { SchemaAwareService } from '@/lib/supabase/schema';
import {
  WorkflowExecutionStatus,
  WorkflowActionType as ActionTypeEnum,
  type WorkflowStatus
} from '@/lib/constants/status-enums';
import type { WakeTrigger } from '@/types/wake-triggers';

// Re-export WorkflowStatus type from enums
export { type WorkflowStatus } from '@/lib/constants/status-enums';

export type WorkflowActionType =
  | ActionTypeEnum.SNOOZE
  | ActionTypeEnum.UNSNOOZE
  | ActionTypeEnum.SKIP
  | ActionTypeEnum.ESCALATE
  | ActionTypeEnum.RESUME
  | ActionTypeEnum.COMPLETE
  | ActionTypeEnum.REJECT
  | ActionTypeEnum.LOSE
  | ActionTypeEnum.START;

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

export class WorkflowActionService extends SchemaAwareService {
  constructor(companyId?: string | null, supabase?: SupabaseClient) {
    super(companyId, supabase);
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.SNOOZED,
          snooze_until: options.until.toISOString(),
          snooze_days: options.days,
          snoozed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      // Record action
      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.SNOOZE,
          new_status: WorkflowExecutionStatus.SNOOZED,
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
   * Snooze a workflow with wake triggers
   * Enhanced version that supports event-based wake conditions
   */
  async snoozeWorkflowWithTriggers(
    executionId: string,
    userId: string,
    triggers: WakeTrigger[]
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      if (!triggers || triggers.length === 0) {
        throw new Error('At least one trigger is required');
      }

      // Find the date trigger to set snooze_until
      const dateTrigger = triggers.find(t => t.type === 'date');
      if (!dateTrigger) {
        throw new Error('At least one date trigger is required');
      }

      const snoozeUntil = new Date((dateTrigger.config as any).date);

      // Update workflow_executions with triggers
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.SNOOZED,
          snooze_until: snoozeUntil.toISOString(),
          snoozed_at: new Date().toISOString(),
          wake_triggers: triggers,
          last_evaluated_at: null,
          trigger_fired_at: null,
          fired_trigger_type: null,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      // Create wake_triggers records for tracking
      const triggerRecords = triggers.map(trigger => ({
        workflow_execution_id: executionId,
        trigger_type: trigger.type,
        trigger_config: trigger.config,
        is_fired: false,
        evaluated_at: null,
        evaluation_count: 0,
        fired_at: null,
        error_message: null,
      }));

      const { error: triggerInsertError } = await this.client
        .from('workflow_wake_triggers')
        .insert(triggerRecords);

      if (triggerInsertError) {
        console.error('[WorkflowActionService] Failed to create trigger records:', triggerInsertError);
        // Don't fail the snooze if trigger records fail - they're for tracking only
      }

      // Record action
      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.SNOOZE,
          new_status: WorkflowExecutionStatus.SNOOZED,
          action_data: {
            until: snoozeUntil.toISOString(),
            triggers: triggers,
            triggerCount: triggers.length,
          },
          notes: `Snoozed with ${triggers.length} trigger(s)`,
        })
        .select('id')
        .single();

      if (actionError) throw actionError;

      return { success: true, actionId: action.id };
    } catch (error: any) {
      console.error('[WorkflowActionService] Snooze with triggers error:', error);
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.IN_PROGRESS,
          snooze_until: null,
          snooze_days: null,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.UNSNOOZE,
          new_status: WorkflowExecutionStatus.IN_PROGRESS,
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.SKIPPED,
          skip_reason: options.reason,
          skipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.SKIP,
          new_status: WorkflowExecutionStatus.SKIPPED,
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.ESCALATED,
          escalation_user_id: options.toUserId,
          escalated_from: fromUserId,
          escalated_at: new Date().toISOString(),
          assigned_csm_id: options.toUserId, // Reassign ownership
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: fromUserId,
          action_type: ActionTypeEnum.ESCALATE,
          new_status: WorkflowExecutionStatus.ESCALATED,
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.COMPLETED,
          completed_at: new Date().toISOString(),
          completion_percentage: 100,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.COMPLETE,
          new_status: WorkflowExecutionStatus.COMPLETED,
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.REJECTED,
          rejected_at: new Date().toISOString(),
          rejected_reason: options.reason,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.REJECT,
          new_status: WorkflowExecutionStatus.REJECTED,
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
      const { error: updateError } = await this.client
        .from('workflow_executions')
        .update({
          status: WorkflowExecutionStatus.LOST,
          lost_at: new Date().toISOString(),
          lost_reason: options.reason,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      const { data: action, error: actionError } = await this.client
        .from('workflow_actions')
        .insert({
          execution_id: executionId,
          performed_by: userId,
          action_type: ActionTypeEnum.LOSE,
          new_status: WorkflowExecutionStatus.LOST,
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
      const { data, error } = await this.client
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
      const { data, error } = await this.client
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
export function createWorkflowActionService(
  companyId?: string | null,
  supabase?: SupabaseClient
) {
  return new WorkflowActionService(companyId, supabase);
}
