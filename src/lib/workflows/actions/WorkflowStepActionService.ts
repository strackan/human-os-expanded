/**
 * Workflow Step Action Service
 *
 * Handles step-level actions:
 * - Snooze individual steps
 * - Skip individual steps
 * - Resume snoozed steps
 * - Track step completion
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  WorkflowStepStatus,
  WorkflowActionType as ActionTypeEnum,
  type StepStatus
} from '@/lib/constants/status-enums';

export interface StepSnoozeOptions {
  until: Date;
  days: number;
  reason?: string;
}

export interface StepSkipOptions {
  reason: string;
}

export interface StepState {
  id: string;
  execution_id: string;
  step_id: string;
  step_index: number;
  step_label: string;
  status: StepStatus;
  snooze_until: string | null;
  snooze_days: number | null;
  snoozed_at: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class WorkflowStepActionService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
  }

  /**
   * Snooze a workflow step until a future date
   */
  async snoozeStep(
    executionId: string,
    stepIndex: number,
    stepId: string,
    stepLabel: string,
    userId: string,
    options: StepSnoozeOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Upsert step state
      const { error: upsertError } = await this.supabase
        .from('workflow_step_states')
        .upsert({
          execution_id: executionId,
          step_id: stepId,
          step_index: stepIndex,
          step_label: stepLabel,
          status: WorkflowStepStatus.SNOOZED,
          snooze_until: options.until.toISOString(),
          snooze_days: options.days,
          snoozed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'execution_id,step_index'
        });

      if (upsertError) throw upsertError;

      // Record action in audit log
      const { error: actionError } = await this.supabase
        .from('workflow_step_actions')
        .insert({
          execution_id: executionId,
          step_id: stepId,
          step_index: stepIndex,
          step_label: stepLabel,
          performed_by: userId,
          action_type: ActionTypeEnum.SNOOZE,
          new_status: WorkflowStepStatus.SNOOZED,
          action_data: {
            until: options.until.toISOString(),
            days: options.days,
            reason: options.reason,
          },
          notes: options.reason,
        });

      if (actionError) throw actionError;

      console.log('[WorkflowStepActionService] Step snoozed:', { executionId, stepIndex, until: options.until });
      return { success: true };
    } catch (error: any) {
      console.error('[WorkflowStepActionService] Snooze step error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume a snoozed step
   */
  async resumeStep(
    executionId: string,
    stepIndex: number,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update step state
      const { error: updateError } = await this.supabase
        .from('workflow_step_states')
        .update({
          status: WorkflowStepStatus.PENDING,
          snooze_until: null,
          snooze_days: null,
          updated_at: new Date().toISOString(),
        })
        .eq('execution_id', executionId)
        .eq('step_index', stepIndex);

      if (updateError) throw updateError;

      // Record action
      const { error: actionError } = await this.supabase
        .from('workflow_step_actions')
        .insert({
          execution_id: executionId,
          step_index: stepIndex,
          performed_by: userId,
          action_type: ActionTypeEnum.UNSNOOZE,
          new_status: WorkflowStepStatus.PENDING,
        });

      if (actionError) throw actionError;

      console.log('[WorkflowStepActionService] Step resumed:', { executionId, stepIndex });
      return { success: true };
    } catch (error: any) {
      console.error('[WorkflowStepActionService] Resume step error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Skip a workflow step permanently
   */
  async skipStep(
    executionId: string,
    stepIndex: number,
    stepId: string,
    stepLabel: string,
    userId: string,
    options: StepSkipOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Upsert step state
      const { error: upsertError } = await this.supabase
        .from('workflow_step_states')
        .upsert({
          execution_id: executionId,
          step_id: stepId,
          step_index: stepIndex,
          step_label: stepLabel,
          status: WorkflowStepStatus.SKIPPED,
          skipped_at: new Date().toISOString(),
          skip_reason: options.reason,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'execution_id,step_index'
        });

      if (upsertError) throw upsertError;

      // Record action in audit log
      const { error: actionError } = await this.supabase
        .from('workflow_step_actions')
        .insert({
          execution_id: executionId,
          step_id: stepId,
          step_index: stepIndex,
          step_label: stepLabel,
          performed_by: userId,
          action_type: ActionTypeEnum.SKIP,
          new_status: WorkflowStepStatus.SKIPPED,
          action_data: { reason: options.reason },
          notes: options.reason,
        });

      if (actionError) throw actionError;

      console.log('[WorkflowStepActionService] Step skipped:', { executionId, stepIndex });
      return { success: true };
    } catch (error: any) {
      console.error('[WorkflowStepActionService] Skip step error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get step states for a workflow execution
   */
  async getStepStates(
    executionId: string
  ): Promise<{ success: boolean; states?: StepState[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_step_states')
        .select('*')
        .eq('execution_id', executionId)
        .order('step_index', { ascending: true });

      if (error) throw error;

      return { success: true, states: data || [] };
    } catch (error: any) {
      console.error('[WorkflowStepActionService] Get step states error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get snoozed steps that are now due
   */
  async getSnoozedStepsDue(
    userId: string
  ): Promise<{ success: boolean; steps?: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_steps_due')
        .select('*')
        .eq('assigned_csm_id', userId);

      if (error) throw error;

      return { success: true, steps: data || [] };
    } catch (error: any) {
      console.error('[WorkflowStepActionService] Get snoozed steps due error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Convenience function for creating a service instance
export function createWorkflowStepActionService(supabase?: SupabaseClient) {
  return new WorkflowStepActionService(supabase);
}
