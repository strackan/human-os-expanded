/**
 * Database-Backed Workflow Orchestrator
 *
 * Phase 2C: Orchestrator Architecture
 *
 * This is the new orchestrator that works with the workflow_definitions and
 * workflow_executions tables in the database. It supports both:
 * - Demo Mode: Fixed sequence from workflowSequences.ts
 * - Production Mode: Signal-based priority ranking
 *
 * Key differences from old orchestrator.ts:
 * - Database-first instead of in-memory
 * - Supports snooze/skip/escalation
 * - Priority calculation matches PostgreSQL function
 * - Demo sequencer for fixed workflow order
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  workflow_type: 'opportunity' | 'risk' | 'strategic' | 'renewal' | 'custom';
  description: string | null;
  trigger_conditions: Record<string, any>;
  priority_weight: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_definition_id: string;
  customer_id: string;
  assigned_csm_id: string | null;
  escalation_user_id: string | null;
  status: 'not_started' | 'underway' | 'completed' | 'snoozed' | 'skipped';
  snooze_until: string | null;
  snooze_days: number | null;
  snoozed_at: string | null;
  priority_score: number;
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  execution_data: Record<string, any>;
  skip_reason: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecutionWithDetails extends WorkflowExecution {
  workflow_definition: WorkflowDefinition;
  customer: {
    id: string;
    domain: string;
    current_arr: number;
    renewal_date: string | null;
    assigned_to: string | null;
  };
  customer_properties?: {
    revenue_impact_tier: number | null;
    churn_risk_score: number | null;
    usage_score: number | null;
    opportunity_score: number | null;
  };
}

export interface CustomerSignals {
  customer_id: string;
  revenue_impact_tier: number | null;
  churn_risk_score: number | null;
  usage_score: number | null;
  opportunity_score: number | null;
  utilization_percent: number | null;
  market_price_average: number | null;
  relationship_strength: string | null;
}

// ============================================================================
// Signal Interpreter
// ============================================================================

/**
 * Calculate opportunity score from customer signals
 * Used to determine if customer should get an opportunity workflow
 *
 * Factors (0-10 scale):
 * - utilization_percent >= 100: +3
 * - yoy_growth > 50%: +2
 * - market_price gap (underpriced): +2
 * - adoption_rate > 80%: +2
 * - revenue_impact_tier >= 4: +1
 */
export async function calculateOpportunityScore(customerId: string): Promise<number> {
  const supabase = await createClient();

  const { data: props, error } = await supabase
    .from('customer_properties')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error || !props) return 0;

  let score = 0;

  // High utilization = strong expansion signal
  if (props.utilization_percent && props.utilization_percent >= 100) {
    score += 3;
  }

  // Strong growth = expansion opportunity
  if (props.yoy_growth && props.yoy_growth > 50) {
    score += 2;
  }

  // Underpriced = pricing opportunity
  if (props.market_percentile && props.market_percentile <= 25) {
    score += 2;
  }

  // High adoption = successful customer ready to expand
  if (props.adoption_rate && props.adoption_rate > 80) {
    score += 2;
  }

  // High revenue tier = strategic importance
  if (props.revenue_impact_tier && props.revenue_impact_tier >= 4) {
    score += 1;
  }

  return Math.min(score, 10); // Cap at 10
}

/**
 * Calculate risk score from customer signals
 * Used to determine if customer should get a risk workflow
 *
 * Factors (0-10 scale):
 * - churn_risk_score from customer_properties (direct)
 * - relationship_strength = 'weak': +2
 * - declining usage: +2
 * - revenue_impact_tier >= 4: +1 (high value at risk)
 */
export async function calculateRiskScore(customerId: string): Promise<number> {
  const supabase = await createClient();

  const { data: props, error: propsError } = await supabase
    .from('customer_properties')
    .select('churn_risk_score, revenue_impact_tier, last_month_growth')
    .eq('customer_id', customerId)
    .single();

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('relationship_strength')
    .eq('customer_id', customerId);

  if (propsError && contactsError) return 0;

  let score = props?.churn_risk_score || 0;

  // Weak relationships = risk
  const hasWeakRelationship = contacts?.some(c => c.relationship_strength === 'weak');
  if (hasWeakRelationship) {
    score += 2;
  }

  // Declining usage = risk
  if (props?.last_month_growth && props.last_month_growth < -10) {
    score += 2;
  }

  // High value customer at risk = critical
  if (props?.revenue_impact_tier && props.revenue_impact_tier >= 4) {
    score += 1;
  }

  return Math.min(score, 10); // Cap at 10
}

/**
 * Interpret customer signals and determine which workflows should be created
 * This is the "signal interpreter" that replaces the old determination.ts logic
 *
 * @param customerId - Customer ID to analyze
 * @returns Array of workflow_definition_ids that should be created
 */
export async function interpretCustomerSignals(customerId: string): Promise<string[]> {
  const supabase = await createClient();

  // Get all active workflow definitions (non-demo)
  const { data: definitions, error } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('is_active', true)
    .eq('is_demo', false);

  if (error || !definitions) return [];

  const workflowsToCreate: string[] = [];

  // Calculate scores
  const opportunityScore = await calculateOpportunityScore(customerId);
  const riskScore = await calculateRiskScore(customerId);

  // Check each workflow definition's trigger conditions
  for (const def of definitions) {
    const conditions = def.trigger_conditions || {};

    switch (def.workflow_type) {
      case 'opportunity':
        if (opportunityScore >= (conditions.opportunity_score_min || 7)) {
          workflowsToCreate.push(def.id);
        }
        break;

      case 'risk':
        if (riskScore >= (conditions.risk_score_min || 7)) {
          workflowsToCreate.push(def.id);
        }
        break;

      case 'strategic':
        // Strategic workflows trigger on account_plan or annual review
        // Implementation depends on customer_properties having account_plan field
        // For now, skip - will be implemented when strategic trigger logic is defined
        break;

      case 'renewal':
        // Renewal workflows trigger based on renewal_date proximity
        // Implementation depends on renewal tracking system
        // For now, skip - will be implemented when renewal trigger logic is defined
        break;

      case 'custom':
        // Custom workflows can have any trigger conditions
        // Skip for now
        break;
    }
  }

  return workflowsToCreate;
}

// ============================================================================
// Priority Ranker
// ============================================================================

/**
 * Calculate priority score for a workflow execution
 * This TypeScript implementation mirrors the PostgreSQL function in the migration
 *
 * Priority tiers:
 * - 1000+: Snoozed workflows due in ≤3 days (CRITICAL)
 * - 900+: Risk workflows
 * - 800+: Opportunity workflows
 * - 700+: Strategic workflows
 * - 600+: Renewal workflows
 * - 500+: Custom workflows
 * - <400: Snoozed workflows due in >3 days (LOW)
 *
 * Signal boosts:
 * - revenue_impact_tier: +0 to +25
 * - churn_risk_score (risk workflows): +0 to +50
 * - usage_score (opportunity workflows): +0 to +10
 */
export async function calculateWorkflowPriorityScore(executionId: string): Promise<number> {
  const supabase = await createClient();

  // Get execution with related data
  const { data: execution, error } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow_definition:workflow_definitions(*),
      customer_properties:customer_properties!workflow_executions_customer_id_fkey(*)
    `)
    .eq('id', executionId)
    .single();

  if (error || !execution) return 0;

  const def = execution.workflow_definition as any;
  const props = execution.customer_properties as any;

  // Handle snoozed workflows
  if (execution.status === 'snoozed' && execution.snooze_until) {
    const snoozeDate = new Date(execution.snooze_until);
    const now = new Date();
    const daysOverdue = Math.floor((now.getTime() - snoozeDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue >= -3) {
      // Due in ≤3 days or already overdue: CRITICAL tier
      return 1000 + daysOverdue;
    } else {
      // Due in >3 days (future): LOW tier
      return 400 - Math.abs(daysOverdue);
    }
  }

  // Active workflows: base priority by type
  let basePriority = 500; // default for custom
  switch (def.workflow_type) {
    case 'risk':
      basePriority = 900;
      break;
    case 'opportunity':
      basePriority = 800;
      break;
    case 'strategic':
      basePriority = 700;
      break;
    case 'renewal':
      basePriority = 600;
      break;
  }

  let result = basePriority;

  // Add revenue impact boost (0-25)
  if (props?.revenue_impact_tier) {
    result += props.revenue_impact_tier * 5;
  }

  // Add churn risk boost for risk workflows (0-50)
  if (def.workflow_type === 'risk' && props?.churn_risk_score) {
    result += props.churn_risk_score * 5;
  }

  // Add usage score boost for opportunity workflows (0-10)
  if (def.workflow_type === 'opportunity' && props?.usage_score) {
    result += Math.floor(props.usage_score / 10);
  }

  return result;
}

/**
 * Get prioritized workflow queue for a CSM
 * Returns top N workflows ordered by priority score
 *
 * In demo mode, returns workflows from demo sequence (order field in trigger_conditions)
 * In production mode, returns workflows ranked by priority score
 *
 * @param csmId - CSM user ID (optional when isDemoCompanyUser is true)
 * @param limit - Max number of workflows to return (default 10)
 * @param demoMode - If true, use demo sequence order instead of priority
 * @param isDemoCompanyUser - If true, show ALL demo workflows regardless of assigned_csm_id
 * @param supabaseClient - Optional Supabase client (use service role client for demo mode)
 * @returns Array of workflow executions with details, sorted by priority
 */
export async function getWorkflowQueueForCSM(
  csmId: string,
  limit: number = 10,
  demoMode: boolean = false,
  isDemoCompanyUser: boolean = false,
  supabaseClient?: SupabaseClient
): Promise<WorkflowExecutionWithDetails[]> {
  const supabase = supabaseClient || await createClient();

  console.log('[Orchestrator] getWorkflowQueueForCSM called with:', {
    csmId,
    limit,
    demoMode,
    isDemoCompanyUser,
    hasCustomClient: !!supabaseClient
  });

  // Build query for workflow executions
  let query = supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow_definition:workflow_definitions(*),
      customer:customers!workflow_executions_customer_id_fkey(id, domain, current_arr, renewal_date, assigned_to)
    `)
    .in('status', ['not_started', 'underway', 'snoozed']);

  // Only filter by CSM if NOT a demo company user
  if (!isDemoCompanyUser) {
    query = query.eq('assigned_csm_id', csmId);
    console.log('[Orchestrator] Filtering by assigned_csm_id:', csmId);
  } else {
    console.log('[Orchestrator] NOT filtering by CSM (demo company user)');
  }

  if (demoMode) {
    // Demo mode: only return demo workflows
    query = query.eq('is_demo', true);
    console.log('[Orchestrator] Filtering for demo workflows only');
  }

  const { data: executions, error } = await query;

  console.log('[Orchestrator] Query result:', {
    count: executions?.length || 0,
    error: error?.message || null
  });

  if (error || !executions) return [];

  // Type cast to proper shape
  const typedExecutions = executions as any[] as WorkflowExecutionWithDetails[];

  if (demoMode) {
    // Sort by demo sequence order (from trigger_conditions.order)
    typedExecutions.sort((a, b) => {
      const orderA = a.workflow_definition.trigger_conditions?.order || 999;
      const orderB = b.workflow_definition.trigger_conditions?.order || 999;
      return orderA - orderB;
    });
  } else {
    // Production mode: sort by priority_score (highest first)
    typedExecutions.sort((a, b) => b.priority_score - a.priority_score);
  }

  return typedExecutions.slice(0, limit);
}

/**
 * Update priority scores for all active workflow executions
 * Should be run daily (cron job)
 *
 * @returns Number of executions updated
 */
export async function updateAllWorkflowPriorities(): Promise<number> {
  const supabase = await createClient();

  // Get all active executions
  const { data: executions, error } = await supabase
    .from('workflow_executions')
    .select('id')
    .in('status', ['not_started', 'underway', 'snoozed']);

  if (error || !executions) return 0;

  let updatedCount = 0;

  for (const exec of executions) {
    const newPriority = await calculateWorkflowPriorityScore(exec.id);

    const { error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        priority_score: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', exec.id);

    if (!updateError) {
      updatedCount++;
    }
  }

  return updatedCount;
}

// ============================================================================
// Demo Sequencer
// ============================================================================

/**
 * Create demo workflow executions for Obsidian Black
 * Uses the 3 seeded workflow definitions (IDs: 00000000-0000-0000-0000-000000000001/2/3)
 *
 * This function should be called to initialize the demo experience
 *
 * @param csmId - CSM user ID to assign workflows to
 * @param customerId - Customer ID (should be Obsidian Black's ID)
 * @returns Array of created workflow execution IDs
 */
export async function createDemoWorkflowSequence(
  csmId: string,
  customerId: string
): Promise<string[]> {
  const supabase = await createClient();

  // Get demo workflow definitions in order
  const { data: definitions, error: defError } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('is_demo', true)
    .order('created_at');

  if (defError || !definitions || definitions.length === 0) {
    throw new Error('Demo workflow definitions not found');
  }

  const createdIds: string[] = [];

  for (const def of definitions) {
    // Create workflow execution
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_definition_id: def.id,
        customer_id: customerId,
        assigned_csm_id: csmId,
        status: 'not_started',
        priority_score: def.priority_weight, // Use definition's base priority
        is_demo: true,
        execution_data: {}
      })
      .select('id')
      .single();

    if (!execError && execution) {
      createdIds.push(execution.id);
    }
  }

  return createdIds;
}

/**
 * Get demo workflow sequence status
 * Returns progress through the 3 demo workflows
 *
 * @param csmId - CSM user ID
 * @returns Demo sequence status
 */
export async function getDemoSequenceStatus(csmId: string): Promise<{
  total: number;
  completed: number;
  current: WorkflowExecutionWithDetails | null;
  next: WorkflowExecutionWithDetails | null;
}> {
  const workflows = await getWorkflowQueueForCSM(csmId, 10, true);

  const completed = workflows.filter(w => w.status === 'completed').length;
  const current = workflows.find(w => w.status === 'underway') || null;
  const next = workflows.find(w => w.status === 'not_started') || null;

  return {
    total: workflows.length,
    completed,
    current,
    next
  };
}
