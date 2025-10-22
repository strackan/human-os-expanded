/**
 * Workflow Query Service
 *
 * Handles workflow queries for dashboard display:
 * - Active workflows (excludes snoozed/skipped/completed)
 * - Snoozed workflows that are due
 * - Escalated workflows (to me and by me)
 * - Completed/rejected/lost workflows (history)
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WorkflowExecution {
  id: string;
  workflow_config_id: string;
  workflow_name: string;
  workflow_type: string;
  customer_id: string;
  user_id: string;
  assigned_csm_id: string;
  status: string;
  current_step_id: string;
  current_step_index: number;
  total_steps: number;
  completed_steps_count: number;
  completion_percentage: number;
  priority_score: number;
  snooze_until: string | null;
  escalation_user_id: string | null;
  escalated_from: string | null;
  escalated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  // Joined data
  customer_name?: string;
  assigned_csm_name?: string;
  escalated_from_name?: string;
  escalated_to_name?: string;
}

export interface WorkflowFilters {
  status?: string[];
  workflowType?: string[];
  customerId?: string;
  priority?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
}

export class WorkflowQueryService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
  }

  /**
   * Get active workflows for a user
   * Excludes: snoozed (unless due), skipped, escalated (unless assigned to user), completed, abandoned
   */
  async getActiveWorkflows(
    userId: string,
    filters?: WorkflowFilters
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      let query = this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers!inner(name)
        `)
        .eq('assigned_csm_id', userId)
        .in('status', ['not_started', 'in_progress']);

      // Apply filters
      if (filters?.workflowType && filters.workflowType.length > 0) {
        query = query.in('workflow_type', filters.workflowType);
      }

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters?.priority) {
        if (filters.priority.min !== undefined) {
          query = query.gte('priority_score', filters.priority.min);
        }
        if (filters.priority.max !== undefined) {
          query = query.lte('priority_score', filters.priority.max);
        }
      }

      query = query.order('priority_score', { ascending: false });
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include customer_name
      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get active workflows error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get snoozed workflows that are now due
   */
  async getSnoozedWorkflowsDue(
    userId: string
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name)
        `)
        .eq('assigned_csm_id', userId)
        .eq('status', 'snoozed')
        .lte('snooze_until', new Date().toISOString())
        .order('snooze_until', { ascending: true });

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get snoozed workflows due error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all snoozed workflows (including future)
   */
  async getSnoozedWorkflows(
    userId: string
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name)
        `)
        .eq('assigned_csm_id', userId)
        .eq('status', 'snoozed')
        .order('snooze_until', { ascending: true });

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get snoozed workflows error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflows escalated TO this user
   * These need action from the user
   */
  async getEscalatedToMe(
    userId: string
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name),
          profiles!workflow_executions_escalated_from_fkey(full_name)
        `)
        .eq('escalation_user_id', userId)
        .eq('status', 'escalated')
        .order('escalated_at', { ascending: true });

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
        escalated_from_name: w.profiles?.full_name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get escalated to me error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflows escalated BY this user
   * User can monitor but not manage these
   */
  async getEscalatedByMe(
    userId: string
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name),
          profiles!workflow_executions_escalation_user_id_fkey(full_name)
        `)
        .eq('escalated_from', userId)
        .eq('status', 'escalated')
        .order('escalated_at', { ascending: false });

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
        escalated_to_name: w.profiles?.full_name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get escalated by me error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get completed workflows
   */
  async getCompletedWorkflows(
    userId: string,
    limit: number = 50
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name)
        `)
        .eq('assigned_csm_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get completed workflows error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get skipped workflows
   */
  async getSkippedWorkflows(
    userId: string,
    limit: number = 50
  ): Promise<{ success: boolean; workflows?: WorkflowExecution[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name)
        `)
        .eq('assigned_csm_id', userId)
        .eq('status', 'skipped')
        .order('skipped_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const workflows = (data || []).map((w: any) => ({
        ...w,
        customer_name: w.customers?.name,
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get skipped workflows error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow by ID with full details
   */
  async getWorkflowById(
    executionId: string
  ): Promise<{ success: boolean; workflow?: WorkflowExecution; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(`
          *,
          customers(name),
          profiles!workflow_executions_assigned_csm_id_fkey(full_name)
        `)
        .eq('id', executionId)
        .single();

      if (error) throw error;

      const workflow = {
        ...data,
        customer_name: data.customers?.name,
        assigned_csm_name: data.profiles?.full_name,
      };

      return { success: true, workflow };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get workflow by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow counts for dashboard summary
   */
  async getWorkflowCounts(
    userId: string
  ): Promise<{
    success: boolean;
    counts?: {
      active: number;
      snoozed: number;
      snoozedDue: number;
      escalatedToMe: number;
      escalatedByMe: number;
      completed: number;
    };
    error?: string;
  }> {
    try {
      const [active, snoozed, snoozedDue, escalatedToMe, escalatedByMe, completed] =
        await Promise.all([
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_csm_id', userId)
            .in('status', ['not_started', 'in_progress']),
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_csm_id', userId)
            .eq('status', 'snoozed'),
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_csm_id', userId)
            .eq('status', 'snoozed')
            .lte('snooze_until', new Date().toISOString()),
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('escalation_user_id', userId)
            .eq('status', 'escalated'),
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('escalated_from', userId)
            .eq('status', 'escalated'),
          this.supabase
            .from('workflow_executions')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_csm_id', userId)
            .eq('status', 'completed'),
        ]);

      return {
        success: true,
        counts: {
          active: active.count || 0,
          snoozed: snoozed.count || 0,
          snoozedDue: snoozedDue.count || 0,
          escalatedToMe: escalatedToMe.count || 0,
          escalatedByMe: escalatedByMe.count || 0,
          completed: completed.count || 0,
        },
      };
    } catch (error: any) {
      console.error('[WorkflowQueryService] Get workflow counts error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Convenience function for creating a service instance
export function createWorkflowQueryService(supabase?: SupabaseClient) {
  return new WorkflowQueryService(supabase);
}
