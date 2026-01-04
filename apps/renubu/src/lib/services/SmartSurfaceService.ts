/**
 * Smart Surface Service
 *
 * Provides intelligent prioritization for surfacing snoozed workflows.
 * Uses a multi-factor scoring algorithm to determine which workflows
 * should be surfaced first when multiple triggers fire.
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { WorkflowExecutionWithTriggers } from './WorkflowSnoozeService';

// =====================================================
// Types
// =====================================================

/**
 * Workflow with calculated priority score
 */
export interface PrioritizedWorkflow extends WorkflowExecutionWithTriggers {
  priorityScore: number;
  scoreBreakdown?: {
    daysOverdue: number;
    arrScore: number;
    healthScore: number;
    workflowTypeScore: number;
    triggerBonus: number;
  };
}

// =====================================================
// SmartSurfaceService
// =====================================================

export class SmartSurfaceService {
  /**
   * Calculate priority score for a workflow
   *
   * Scoring algorithm:
   * - Days overdue: 10 points per day past snoozed_until
   * - Customer ARR: 0-50 points (scaled by $10k increments)
   * - Customer health: 0-30 points (inverse - lower health = higher score)
   * - Workflow type: 20 (renewal), 15 (expansion), 10 (other)
   * - Trigger fired: +50 bonus points
   *
   * @param workflow - Workflow execution to score
   * @returns Priority score (higher = more urgent)
   */
  async calculateSurfacePriority(workflow: WorkflowExecutionWithTriggers): Promise<number> {
    let score = 0;
    const breakdown = {
      daysOverdue: 0,
      arrScore: 0,
      healthScore: 0,
      workflowTypeScore: 0,
      triggerBonus: 0
    };

    // 1. Days overdue (10 points per day)
    if (workflow.snoozed_until) {
      const snoozedDate = new Date(workflow.snoozed_until);
      const now = new Date();
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - snoozedDate.getTime()) / (1000 * 60 * 60 * 24)));
      breakdown.daysOverdue = daysOverdue * 10;
      score += breakdown.daysOverdue;
    }

    // 2. Customer ARR (0-50 points, scaled by $10k)
    const customerArr = workflow.customer?.arr || 0;
    breakdown.arrScore = Math.min(Math.floor(customerArr / 10000), 50);
    score += breakdown.arrScore;

    // 3. Customer health (inverse, 0-30 points)
    // Lower health score = higher priority
    const healthScore = workflow.customer?.health_score || 50; // Default to middle
    breakdown.healthScore = Math.round((100 - healthScore) * 0.3);
    score += breakdown.healthScore;

    // 4. Workflow type priority
    if (workflow.workflow_type === 'renewal') {
      breakdown.workflowTypeScore = 20;
    } else if (workflow.workflow_type === 'expansion') {
      breakdown.workflowTypeScore = 15;
    } else {
      breakdown.workflowTypeScore = 10;
    }
    score += breakdown.workflowTypeScore;

    // 5. Trigger fired bonus
    if (workflow.trigger_fired_at) {
      breakdown.triggerBonus = 50;
      score += breakdown.triggerBonus;
    }

    return Math.round(score);
  }

  /**
   * Rank snoozed workflows by priority
   * Sorts workflows from highest to lowest priority
   *
   * @param workflows - Array of workflow executions
   * @returns Workflows sorted by priority (highest first)
   */
  async rankSnoozedWorkflows(
    workflows: WorkflowExecutionWithTriggers[]
  ): Promise<PrioritizedWorkflow[]> {
    // Calculate priority scores for all workflows
    const prioritizedWorkflows: PrioritizedWorkflow[] = await Promise.all(
      workflows.map(async (workflow) => {
        const priorityScore = await this.calculateSurfacePriority(workflow);
        return {
          ...workflow,
          priorityScore
        };
      })
    );

    // Sort by priority score (descending)
    prioritizedWorkflows.sort((a, b) => b.priorityScore - a.priorityScore);

    return prioritizedWorkflows;
  }

  /**
   * Get top N highest priority snoozed workflows
   *
   * @param workflows - Array of workflow executions
   * @param topN - Number of top workflows to return (default: 10)
   * @returns Top N workflows by priority
   */
  async getTopPriorityWorkflows(
    workflows: WorkflowExecutionWithTriggers[],
    topN: number = 10
  ): Promise<PrioritizedWorkflow[]> {
    const ranked = await this.rankSnoozedWorkflows(workflows);
    return ranked.slice(0, topN);
  }

  /**
   * Calculate detailed priority score with breakdown
   * Useful for debugging and displaying to users
   *
   * @param workflow - Workflow execution to score
   * @returns Priority score with detailed breakdown
   */
  async calculateDetailedPriority(
    workflow: WorkflowExecutionWithTriggers
  ): Promise<{ score: number; breakdown: PrioritizedWorkflow['scoreBreakdown'] }> {
    const breakdown = {
      daysOverdue: 0,
      arrScore: 0,
      healthScore: 0,
      workflowTypeScore: 0,
      triggerBonus: 0
    };

    // 1. Days overdue
    if (workflow.snoozed_until) {
      const snoozedDate = new Date(workflow.snoozed_until);
      const now = new Date();
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - snoozedDate.getTime()) / (1000 * 60 * 60 * 24)));
      breakdown.daysOverdue = daysOverdue * 10;
    }

    // 2. Customer ARR
    const customerArr = workflow.customer?.arr || 0;
    breakdown.arrScore = Math.min(Math.floor(customerArr / 10000), 50);

    // 3. Customer health (inverse)
    const healthScore = workflow.customer?.health_score || 50;
    breakdown.healthScore = Math.round((100 - healthScore) * 0.3);

    // 4. Workflow type
    if (workflow.workflow_type === 'renewal') {
      breakdown.workflowTypeScore = 20;
    } else if (workflow.workflow_type === 'expansion') {
      breakdown.workflowTypeScore = 15;
    } else {
      breakdown.workflowTypeScore = 10;
    }

    // 5. Trigger fired bonus
    if (workflow.trigger_fired_at) {
      breakdown.triggerBonus = 50;
    }

    const score = Math.round(
      breakdown.daysOverdue +
      breakdown.arrScore +
      breakdown.healthScore +
      breakdown.workflowTypeScore +
      breakdown.triggerBonus
    );

    return { score, breakdown };
  }

  /**
   * Filter workflows that should be auto-surfaced
   * Applies business rules to determine which workflows should be automatically surfaced
   *
   * @param workflows - Array of workflow executions
   * @param minScore - Minimum priority score for auto-surfacing (default: 50)
   * @returns Workflows that meet auto-surface criteria
   */
  async getAutoSurfaceCandidates(
    workflows: WorkflowExecutionWithTriggers[],
    minScore: number = 50
  ): Promise<PrioritizedWorkflow[]> {
    const prioritized = await this.rankSnoozedWorkflows(workflows);

    // Filter by minimum score
    return prioritized.filter(w => w.priorityScore >= minScore);
  }

  /**
   * Calculate days since a date
   * Helper method for date calculations
   *
   * @param dateString - ISO date string
   * @returns Number of days since the date
   */
  private daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
