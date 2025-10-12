/**
 * Workflow Queue API
 *
 * GET /api/workflows/queue/[csmId]?companyId={companyId}
 * - Returns prioritized workflow queue for a CSM
 * - Uses integrated workflow orchestrator system
 * - Workflows sorted by priority (highest first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getCustomersNeedingWorkflows } from '@/lib/workflows/data-access';
import { getWorkflowQueueForCSM, getWorkflowStats, groupWorkflowsByCustomer } from '@/lib/workflows/orchestrator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ csmId: string }> }
) {
  try {
    const resolvedParams = await params;
    const csmId = resolvedParams.csmId;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId query parameter is required' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user (for auth check)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customers for this CSM from database
    const customers = await getCustomersNeedingWorkflows(companyId, csmId);

    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        csmId,
        companyId,
        totalWorkflows: 0,
        stats: {
          total: 0,
          byType: { renewal: 0, strategic: 0, opportunity: 0, risk: 0 },
          byStage: {},
          byAccountPlan: {},
          uniqueCustomers: 0,
          avgPriority: 0,
          priorityRange: { min: 0, max: 0 }
        },
        workflows: [],
        groupedByCustomer: []
      });
    }

    // Get workflow queue for this CSM
    const workflowQueue = getWorkflowQueueForCSM(customers, {
      includeMetadata: true
    });

    // Get workflow stats
    const stats = getWorkflowStats(workflowQueue);

    // Group by customer (useful for UI)
    const groupedByCustomer = groupWorkflowsByCustomer(workflowQueue);

    return NextResponse.json({
      success: true,
      csmId,
      companyId,
      totalWorkflows: workflowQueue.length,
      stats: {
        total: stats.total_workflows,
        byType: stats.by_type,
        byStage: stats.by_stage,
        byAccountPlan: stats.by_account_plan,
        uniqueCustomers: stats.unique_customers,
        avgPriority: stats.avg_priority,
        priorityRange: stats.priority_range
      },
      workflows: workflowQueue.map((assignment: any) => ({
        // Workflow info
        workflow: {
          id: assignment.workflow.id,
          type: assignment.workflow.type,
          status: assignment.workflow.status,
          priorityScore: assignment.workflow.priority_score,
          priorityFactors: assignment.workflow.priority_factors,
          config: assignment.workflow.config,
          metadata: assignment.workflow.metadata
        },
        // Customer info
        customer: {
          id: assignment.customer.id,
          domain: assignment.customer.domain,
          arr: assignment.customer.arr,
          renewalDate: assignment.customer.renewal_date,
          owner: assignment.customer.owner
        },
        // Context
        context: {
          daysUntilRenewal: assignment.context.days_until_renewal,
          renewalStage: assignment.context.renewal_stage,
          accountPlan: assignment.context.account_plan,
          opportunityScore: assignment.context.opportunity_score,
          riskScore: assignment.context.risk_score
        }
      })),
      groupedByCustomer: Object.entries(groupedByCustomer).map(([customerId, data]: [string, any]) => ({
        customerId,
        customer: data.customer,
        workflows: data.workflows,
        totalPriority: data.total_priority,
        highestPriority: data.highest_priority
      }))
    });

  } catch (error) {
    console.error('Error in workflow queue API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
