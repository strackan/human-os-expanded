import { createClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Priority } from '@/lib/constants/status-enums';

/**
 * WorkloadAnalysisService
 *
 * Analyzes existing Renubu data to surface work commitments for weekly planning.
 * Integrates with customer workflows, snoozed tasks, and priorities.
 *
 * Key features:
 * - Pull snoozed workflows that need attention
 * - Surface upcoming customer renewals
 * - Identify high-priority customers (risk + opportunity)
 * - Find incomplete workflow tasks
 * - Categorize and prioritize workload
 */

export interface SnoozedWorkflow {
  workflow_execution_id: string;
  workflow_name: string;
  workflow_type: string;
  customer_id: string;
  customer_name: string;
  snoozed_until: string;
  days_snoozed: number;
  status: string;
}

export interface UpcomingRenewal {
  customer_id: string;
  customer_name: string;
  renewal_date: string;
  days_until_renewal: number;
  arr: number;
  renewal_stage?: string;
  health_score?: number;
  last_contact_date?: string;
}

export interface PriorityCustomer {
  customer_id: string;
  customer_name: string;
  reason: string;
  risk_score?: number;
  opportunity_score?: number;
  arr: number;
  suggested_action?: string;
}

export interface IncompleteTask {
  task_id: string;
  workflow_execution_id: string;
  customer_id?: string;
  customer_name?: string;
  task_type: string;
  task_status: string;
  description?: string;
  due_date?: string;
  priority?: string;
}

export interface WorkloadCategory {
  urgent: WorkloadItem[];
  important: WorkloadItem[];
  routine: WorkloadItem[];
  suggested: WorkloadItem[];
}

export interface WorkloadItem {
  type: 'snoozed_workflow' | 'renewal' | 'priority_customer' | 'incomplete_task';
  id: string;
  title: string;
  description: string;
  customer_name?: string;
  customer_id?: string;
  suggested_duration_minutes?: number;
  due_date?: string;
  priority_score: number; // 0-100 for sorting
  metadata?: any;
}

export interface UpcomingWorkload {
  snoozed: SnoozedWorkflow[];
  renewals: UpcomingRenewal[];
  priorities: PriorityCustomer[];
  incomplete: IncompleteTask[];
  categorized: WorkloadCategory;
  summary: {
    total_items: number;
    estimated_hours: number;
    customer_count: number;
  };
}

export class WorkloadAnalysisService {
  /**
   * Get comprehensive workload analysis for a user's upcoming week
   */
  static async getUpcomingWorkload(
    userId: string,
    weekStart: Date,
    options: {
      renewalWindowDays?: number;
      includeCompleted?: boolean;
      supabaseClient?: SupabaseClient;
    } = {}
  ): Promise<UpcomingWorkload> {
    try {
      const supabase = options.supabaseClient || createClient();
      const renewalWindowDays = options.renewalWindowDays || 60;

      // Fetch all workload components in parallel
      const [snoozed, renewals, priorities, incomplete] = await Promise.all([
        this.getSnoozedWorkflows(userId, weekStart, supabase),
        this.getUpcomingRenewals(userId, renewalWindowDays, supabase),
        this.getHighPriorityCustomers(userId, supabase),
        this.getIncompleteWorkflowTasks(userId, supabase),
      ]);

      // Categorize workload by urgency
      const categorized = this.categorizeWorkload({
        snoozed,
        renewals,
        priorities,
        incomplete,
      });

      // Calculate summary metrics
      const summary = this.calculateWorkloadSummary(categorized);

      return {
        snoozed,
        renewals,
        priorities,
        incomplete,
        categorized,
        summary,
      };
    } catch (error) {
      console.error('WorkloadAnalysisService.getUpcomingWorkload error:', error);
      throw error;
    }
  }

  /**
   * Get snoozed workflows that are due to resurface
   */
  static async getSnoozedWorkflows(
    userId: string,
    weekStart: Date,
    supabase: SupabaseClient
  ): Promise<SnoozedWorkflow[]> {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data, error } = await supabase
        .from('workflow_executions')
        .select(`
          id,
          workflow_name,
          workflow_type,
          status,
          snoozed_until,
          customer_id,
          customers (
            id,
            domain
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'snoozed')
        .lte('snoozed_until', weekEnd.toISOString())
        .order('snoozed_until', { ascending: true });

      if (error) {
        console.error('Error fetching snoozed workflows:', error);
        return [];
      }

      return (data || []).map((item: any) => {
        const snoozedDate = new Date(item.snoozed_until);
        const now = new Date();
        const daysSnoozed = Math.ceil((now.getTime() - snoozedDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          workflow_execution_id: item.id,
          workflow_name: item.workflow_name,
          workflow_type: item.workflow_type,
          customer_id: item.customer_id,
          customer_name: item.customers?.domain || 'Unknown',
          snoozed_until: item.snoozed_until,
          days_snoozed: daysSnoozed,
          status: item.status,
        };
      });
    } catch (error) {
      console.error('WorkloadAnalysisService.getSnoozedWorkflows error:', error);
      return [];
    }
  }

  /**
   * Get customers with renewals coming up
   */
  static async getUpcomingRenewals(
    userId: string,
    daysAhead: number,
    supabase: SupabaseClient
  ): Promise<UpcomingRenewal[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      // Get user's company_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (!profile?.company_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          domain,
          renewal_date,
          current_arr,
          renewal_stage,
          health_score,
          last_contact_date
        `)
        .eq('company_id', profile.company_id)
        .gte('renewal_date', today.toISOString().split('T')[0])
        .lte('renewal_date', futureDate.toISOString().split('T')[0])
        .order('renewal_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming renewals:', error);
        return [];
      }

      return (data || []).map((customer: any) => {
        const renewalDate = new Date(customer.renewal_date);
        const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          customer_id: customer.id,
          customer_name: customer.domain,
          renewal_date: customer.renewal_date,
          days_until_renewal: daysUntil,
          arr: customer.current_arr || 0,
          renewal_stage: customer.renewal_stage,
          health_score: customer.health_score,
          last_contact_date: customer.last_contact_date,
        };
      });
    } catch (error) {
      console.error('WorkloadAnalysisService.getUpcomingRenewals error:', error);
      return [];
    }
  }

  /**
   * Get high-priority customers (high risk or high opportunity)
   */
  static async getHighPriorityCustomers(
    userId: string,
    supabase: SupabaseClient
  ): Promise<PriorityCustomer[]> {
    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (!profile?.company_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          domain,
          current_arr,
          customer_properties (
            risk_score,
            opportunity_score,
            usage_score,
            health_score
          )
        `)
        .eq('company_id', profile.company_id)
        .or('customer_properties.risk_score.gte.4,customer_properties.opportunity_score.gte.4')
        .order('current_arr', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching priority customers:', error);
        return [];
      }

      return (data || []).map((customer: any) => {
        const props = customer.customer_properties?.[0] || {};
        const riskScore = props.risk_score || 0;
        const opportunityScore = props.opportunity_score || 0;

        let reason = '';
        let suggestedAction = '';

        if (riskScore >= 4) {
          reason = `High risk score (${riskScore}/5)`;
          suggestedAction = 'Risk mitigation check-in';
        } else if (opportunityScore >= 4) {
          reason = `High opportunity score (${opportunityScore}/5)`;
          suggestedAction = 'Expansion discussion';
        }

        if (props.usage_score < 50) {
          reason += reason ? ', Low usage' : 'Low usage';
          suggestedAction = suggestedAction || 'Usage review';
        }

        return {
          customer_id: customer.id,
          customer_name: customer.domain,
          reason,
          risk_score: riskScore,
          opportunity_score: opportunityScore,
          arr: customer.current_arr || 0,
          suggested_action: suggestedAction,
        };
      });
    } catch (error) {
      console.error('WorkloadAnalysisService.getHighPriorityCustomers error:', error);
      return [];
    }
  }

  /**
   * Get incomplete workflow tasks
   */
  static async getIncompleteWorkflowTasks(
    userId: string,
    supabase: SupabaseClient
  ): Promise<IncompleteTask[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_tasks')
        .select(`
          id,
          workflow_execution_id,
          task_type,
          status,
          description,
          due_date,
          priority,
          workflow_executions (
            customer_id,
            customers (
              domain
            )
          )
        `)
        .eq('assigned_to', userId)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(20);

      if (error) {
        console.error('Error fetching incomplete tasks:', error);
        return [];
      }

      return (data || []).map((task: any) => ({
        task_id: task.id,
        workflow_execution_id: task.workflow_execution_id,
        customer_id: task.workflow_executions?.customer_id,
        customer_name: task.workflow_executions?.customers?.domain,
        task_type: task.task_type,
        task_status: task.status,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
      }));
    } catch (error) {
      console.error('WorkloadAnalysisService.getIncompleteWorkflowTasks error:', error);
      return [];
    }
  }

  /**
   * Categorize workload by urgency (urgent, important, routine, suggested)
   */
  static categorizeWorkload(data: {
    snoozed: SnoozedWorkflow[];
    renewals: UpcomingRenewal[];
    priorities: PriorityCustomer[];
    incomplete: IncompleteTask[];
  }): WorkloadCategory {
    const categorized: WorkloadCategory = {
      urgent: [],
      important: [],
      routine: [],
      suggested: [],
    };

    // Categorize snoozed workflows
    data.snoozed.forEach((item) => {
      const workloadItem: WorkloadItem = {
        type: 'snoozed_workflow',
        id: item.workflow_execution_id,
        title: `${item.workflow_name} - ${item.customer_name}`,
        description: `Snoozed ${item.days_snoozed} days ago`,
        customer_name: item.customer_name,
        customer_id: item.customer_id,
        suggested_duration_minutes: 60,
        priority_score: 80 + item.days_snoozed, // More urgent the longer it's been snoozed
        metadata: item,
      };

      if (item.days_snoozed > 7) {
        categorized.urgent.push(workloadItem);
      } else {
        categorized.important.push(workloadItem);
      }
    });

    // Categorize renewals
    data.renewals.forEach((renewal) => {
      const workloadItem: WorkloadItem = {
        type: 'renewal',
        id: renewal.customer_id,
        title: `${renewal.customer_name} - Renewal prep`,
        description: `Renewal in ${renewal.days_until_renewal} days ($${renewal.arr.toLocaleString()} ARR)`,
        customer_name: renewal.customer_name,
        customer_id: renewal.customer_id,
        suggested_duration_minutes: renewal.arr > 100000 ? 120 : 60,
        due_date: renewal.renewal_date,
        priority_score: 100 - renewal.days_until_renewal, // More urgent as date approaches
        metadata: renewal,
      };

      if (renewal.days_until_renewal <= 30) {
        categorized.urgent.push(workloadItem);
      } else {
        categorized.important.push(workloadItem);
      }
    });

    // Categorize priority customers
    data.priorities.forEach((priority) => {
      const workloadItem: WorkloadItem = {
        type: 'priority_customer',
        id: priority.customer_id,
        title: `${priority.customer_name} - ${priority.suggested_action}`,
        description: priority.reason,
        customer_name: priority.customer_name,
        customer_id: priority.customer_id,
        suggested_duration_minutes: 30,
        priority_score: (priority.risk_score || 0) * 10 + (priority.opportunity_score || 0) * 8,
        metadata: priority,
      };

      if (priority.risk_score && priority.risk_score >= 4) {
        categorized.important.push(workloadItem);
      } else {
        categorized.suggested.push(workloadItem);
      }
    });

    // Categorize incomplete tasks
    data.incomplete.forEach((task) => {
      const workloadItem: WorkloadItem = {
        type: 'incomplete_task',
        id: task.task_id,
        title: task.description || `${task.task_type} task`,
        description: `Status: ${task.task_status}${task.customer_name ? ` - ${task.customer_name}` : ''}`,
        customer_name: task.customer_name,
        customer_id: task.customer_id,
        suggested_duration_minutes: 30,
        due_date: task.due_date,
        priority_score: task.priority === Priority.HIGH ? 70 : task.priority === Priority.MEDIUM ? 50 : 30,
        metadata: task,
      };

      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 3) {
          categorized.urgent.push(workloadItem);
        } else if (daysUntilDue <= 7) {
          categorized.important.push(workloadItem);
        } else {
          categorized.routine.push(workloadItem);
        }
      } else {
        categorized.routine.push(workloadItem);
      }
    });

    // Sort each category by priority score
    categorized.urgent.sort((a, b) => b.priority_score - a.priority_score);
    categorized.important.sort((a, b) => b.priority_score - a.priority_score);
    categorized.routine.sort((a, b) => b.priority_score - a.priority_score);
    categorized.suggested.sort((a, b) => b.priority_score - a.priority_score);

    return categorized;
  }

  /**
   * Calculate workload summary metrics
   */
  static calculateWorkloadSummary(categorized: WorkloadCategory) {
    const allItems = [
      ...categorized.urgent,
      ...categorized.important,
      ...categorized.routine,
      ...categorized.suggested,
    ];

    const totalEstimatedMinutes = allItems.reduce(
      (sum, item) => sum + (item.suggested_duration_minutes || 0),
      0
    );

    const uniqueCustomerIds = new Set(
      allItems
        .filter((item) => item.customer_id)
        .map((item) => item.customer_id)
    );

    return {
      total_items: allItems.length,
      estimated_hours: Math.round(totalEstimatedMinutes / 60 * 10) / 10, // Round to 1 decimal
      customer_count: uniqueCustomerIds.size,
    };
  }
}
