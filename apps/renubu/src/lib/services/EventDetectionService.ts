/**
 * Event Detection Service
 * Shared service for detecting business events that trigger workflows and parking lot items
 *
 * Supports:
 * - Customer risk score thresholds
 * - Customer opportunity score thresholds
 * - Renewal proximity (days until renewal)
 * - Workflow milestones (started, completed, blocked)
 * - Lighter day detection (lower workflow load)
 * - Calendar events
 * - Usage spikes / health score drops
 */

import { createClient } from '@/lib/supabase/server';
import type { EventTriggerConfig, LighterDayMetrics } from '@/types/parking-lot';

export class EventDetectionService {
  /**
   * Check if an event trigger condition is met
   */
  static async checkEventTrigger(
    config: EventTriggerConfig,
    userId: string
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    switch (config.event) {
      case 'risk_score_threshold':
        return this.checkRiskScore(config);

      case 'opportunity_score_threshold':
        return this.checkOpportunityScore(config);

      case 'days_to_renewal':
        return this.checkRenewalProximity(config);

      case 'workflow_milestone':
        return this.checkWorkflowMilestone(config);

      case 'lighter_day':
        return this.checkLighterDay(userId);

      case 'health_score_drop':
        return this.checkHealthScoreDrop(config);

      case 'usage_spike':
        return this.checkUsageSpike();

      default:
        console.warn(`[EventDetectionService] Unknown event type: ${config.event}`);
        return { triggered: false };
    }
  }

  /**
   * Check if customer risk score meets threshold
   * Example: Alert when Acme Corp risk score > 7
   */
  static async checkRiskScore(
    config: EventTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    if (!config.customer || config.threshold === undefined) {
      return { triggered: false };
    }

    try {
      const supabase = await createClient();

      // Fetch customer by name or ID
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, name, risk_score')
        .or(`id.eq.${config.customer},name.ilike.${config.customer}`)
        .single();

      if (error || !customer) {
        return { triggered: false };
      }

      const riskScore = customer.risk_score || 0;
      const operator = config.operator || '>';

      let triggered = false;
      switch (operator) {
        case '>':
          triggered = riskScore > config.threshold;
          break;
        case '>=':
          triggered = riskScore >= config.threshold;
          break;
        case '<':
          triggered = riskScore < config.threshold;
          break;
        case '<=':
          triggered = riskScore <= config.threshold;
          break;
      }

      if (triggered) {
        return {
          triggered: true,
          reason: `${customer.name} risk score (${riskScore}) ${operator} ${config.threshold}`,
          metadata: { customerId: customer.id, customerName: customer.name, riskScore }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('[EventDetectionService] checkRiskScore error:', error);
      return { triggered: false };
    }
  }

  /**
   * Check if customer opportunity score meets threshold
   * Example: Surface when TechCo opportunity score >= 6
   */
  static async checkOpportunityScore(
    config: EventTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    if (!config.customer || config.threshold === undefined) {
      return { triggered: false };
    }

    try {
      const supabase = await createClient();

      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, name, opportunity_score')
        .or(`id.eq.${config.customer},name.ilike.${config.customer}`)
        .single();

      if (error || !customer) {
        return { triggered: false };
      }

      const opportunityScore = customer.opportunity_score || 0;
      const operator = config.operator || '>';

      let triggered = false;
      switch (operator) {
        case '>':
          triggered = opportunityScore > config.threshold;
          break;
        case '>=':
          triggered = opportunityScore >= config.threshold;
          break;
        case '<':
          triggered = opportunityScore < config.threshold;
          break;
        case '<=':
          triggered = opportunityScore <= config.threshold;
          break;
      }

      if (triggered) {
        return {
          triggered: true,
          reason: `${customer.name} opportunity score (${opportunityScore}) ${operator} ${config.threshold}`,
          metadata: { customerId: customer.id, customerName: customer.name, opportunityScore }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('[EventDetectionService] checkOpportunityScore error:', error);
      return { triggered: false };
    }
  }

  /**
   * Check if customer is within X days of renewal
   * Example: Surface when Acme Corp renewal is within 90 days
   */
  static async checkRenewalProximity(
    config: EventTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    if (!config.customer || config.threshold === undefined) {
      return { triggered: false };
    }

    try {
      const supabase = await createClient();

      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, name, contract_end_date')
        .or(`id.eq.${config.customer},name.ilike.${config.customer}`)
        .single();

      if (error || !customer || !customer.contract_end_date) {
        return { triggered: false };
      }

      const now = new Date();
      const renewalDate = new Date(customer.contract_end_date);
      const daysUntilRenewal = Math.floor(
        (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const operator = config.operator || '<=';

      let triggered = false;
      switch (operator) {
        case '<=':
          triggered = daysUntilRenewal <= config.threshold;
          break;
        case '<':
          triggered = daysUntilRenewal < config.threshold;
          break;
        case '>=':
          triggered = daysUntilRenewal >= config.threshold;
          break;
        case '>':
          triggered = daysUntilRenewal > config.threshold;
          break;
      }

      if (triggered) {
        return {
          triggered: true,
          reason: `${customer.name} renewal in ${daysUntilRenewal} days (threshold: ${operator} ${config.threshold})`,
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            daysUntilRenewal,
            renewalDate: customer.contract_end_date
          }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('[EventDetectionService] checkRenewalProximity error:', error);
      return { triggered: false };
    }
  }

  /**
   * Check if workflow milestone has been reached
   * Example: Surface when McDonald's upgrade workflow completes
   */
  static async checkWorkflowMilestone(
    config: EventTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    if (!config.customer || !config.workflow_type || !config.milestone) {
      return { triggered: false };
    }

    try {
      const supabase = await createClient();

      // Find customer
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .or(`id.eq.${config.customer},name.ilike.${config.customer}`)
        .single();

      if (!customer) {
        return { triggered: false };
      }

      // Check for workflow with milestone
      let statusFilter: string[];
      switch (config.milestone) {
        case 'started':
          statusFilter = ['in_progress'];
          break;
        case 'completed':
          statusFilter = ['completed'];
          break;
        case 'blocked':
          statusFilter = ['blocked', 'escalated'];
          break;
        default:
          return { triggered: false };
      }

      const { data: workflows, error } = await supabase
        .from('workflow_executions')
        .select('id, workflow_name, status, completed_at')
        .eq('customer_id', customer.id)
        .eq('workflow_type', config.workflow_type)
        .in('status', statusFilter)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error || !workflows || workflows.length === 0) {
        return { triggered: false };
      }

      const workflow = workflows[0];

      return {
        triggered: true,
        reason: `${customer.name} ${config.workflow_type} workflow ${config.milestone}`,
        metadata: {
          customerId: customer.id,
          customerName: customer.name,
          workflowId: workflow.id,
          workflowName: workflow.workflow_name,
          milestone: config.milestone,
          completedAt: workflow.completed_at
        }
      };
    } catch (error) {
      console.error('[EventDetectionService] checkWorkflowMilestone error:', error);
      return { triggered: false };
    }
  }

  /**
   * Check if today is a "lighter day" for brainstorm items
   * Lighter day = lower workflow load, fewer meetings, more capacity
   */
  static async checkLighterDay(
    userId: string
  ): Promise<{ triggered: boolean; reason?: string; metadata?: LighterDayMetrics }> {
    try {
      const metrics = await this.calculateLighterDayMetrics(userId);

      // Consider it a lighter day if capacity score >= 60
      const isLighterDay = metrics.capacityScore >= 60;

      if (isLighterDay) {
        return {
          triggered: true,
          reason: `Lighter day detected (capacity: ${metrics.capacityScore}/100)`,
          metadata: metrics
        };
      }

      return { triggered: false, metadata: metrics };
    } catch (error) {
      console.error('[EventDetectionService] checkLighterDay error:', error);
      return { triggered: false };
    }
  }

  /**
   * Calculate lighter day metrics
   */
  static async calculateLighterDayMetrics(userId: string): Promise<LighterDayMetrics> {
    try {
      const supabase = await createClient();

      // Count active workflows
      const { count: activeWorkflowCount } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_csm_id', userId)
        .in('status', ['in_progress', 'pending']);

      // Count snoozed items (parking lot + workflows)
      const { count: snoozedItemsCount } = await supabase
        .from('parking_lot_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('wake_triggers', 'is', null);

      // TODO: Integrate with calendar API for meeting count
      const todayMeetingCount = 0;

      // Calculate capacity score (0-100)
      // Lower workload = higher capacity
      let capacityScore = 100;

      // Penalize for active workflows (each workflow -10 points, max -40)
      capacityScore -= Math.min((activeWorkflowCount || 0) * 10, 40);

      // Penalize for snoozed items (each item -5 points, max -20)
      capacityScore -= Math.min((snoozedItemsCount || 0) * 5, 20);

      // Penalize for meetings (each meeting -10 points, max -40)
      capacityScore -= Math.min(todayMeetingCount * 10, 40);

      // Ensure 0-100 range
      capacityScore = Math.max(0, Math.min(100, capacityScore));

      const isLighterDay = capacityScore >= 60;

      return {
        activeWorkflowCount: activeWorkflowCount || 0,
        todayMeetingCount,
        snoozedItemsCount: snoozedItemsCount || 0,
        capacityScore,
        isLighterDay
      };
    } catch (error) {
      console.error('[EventDetectionService] calculateLighterDayMetrics error:', error);
      return {
        activeWorkflowCount: 0,
        todayMeetingCount: 0,
        snoozedItemsCount: 0,
        capacityScore: 50,
        isLighterDay: false
      };
    }
  }

  /**
   * Check for health score drop
   */
  static async checkHealthScoreDrop(
    config: EventTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    if (!config.customer || config.threshold === undefined) {
      return { triggered: false };
    }

    try {
      const supabase = await createClient();

      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, health_score')
        .or(`id.eq.${config.customer},name.ilike.${config.customer}`)
        .single();

      if (!customer) {
        return { triggered: false };
      }

      const healthScore = customer.health_score || 100;
      const operator = config.operator || '<';

      let triggered = false;
      switch (operator) {
        case '<':
          triggered = healthScore < config.threshold;
          break;
        case '<=':
          triggered = healthScore <= config.threshold;
          break;
      }

      if (triggered) {
        return {
          triggered: true,
          reason: `${customer.name} health score dropped to ${healthScore}`,
          metadata: { customerId: customer.id, customerName: customer.name, healthScore }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('[EventDetectionService] checkHealthScoreDrop error:', error);
      return { triggered: false };
    }
  }

  /**
   * Check for usage spike
   */
  static async checkUsageSpike(): Promise<{ triggered: boolean; reason?: string; metadata?: any }> {
    // TODO: Implement when usage tracking is available
    // Would check for X% increase in usage over Y days
     
    // config: EventTriggerConfig parameter will be added when implemented
    return { triggered: false };
  }
}
