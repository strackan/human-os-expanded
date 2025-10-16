/**
 * Dashboard Today Workflows API
 *
 * GET /api/dashboard/today-workflows
 * - Returns priority workflow from orchestrator queue
 * - Fetches workflow executions from database with customer data
 *
 * Phase 2C.5: Orchestrator Integration
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getWorkflowQueueForCSM } from '@/lib/workflows/orchestrator-db';

export async function GET() {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    // Get current user or default CSM for demo
    let csmId = process.env.NEXT_PUBLIC_DEMO_CSM_ID || '';

    if (!demoMode && !authBypassEnabled) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        csmId = user.id;
      }
    }

    // Get workflow queue from orchestrator (demo mode enabled)
    const queue = await getWorkflowQueueForCSM(csmId, 1, true); // Get top 1 workflow, demo mode

    if (!queue || queue.length === 0) {
      // Fallback: No workflows in queue
      return NextResponse.json({
        priorityWorkflow: null,
        message: 'No workflows in queue'
      });
    }

    const topWorkflow = queue[0];
    const customer = topWorkflow.customer;
    const definition = topWorkflow.workflow_definition;

    // Calculate days until renewal (if applicable)
    let dueDateLabel = 'Today';
    if (customer.renewal_date) {
      const renewalDate = new Date(customer.renewal_date);
      const today = new Date();
      const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        dueDateLabel = 'Overdue';
      } else if (daysUntil === 0) {
        dueDateLabel = 'Today';
      } else if (daysUntil === 1) {
        dueDateLabel = 'Tomorrow';
      } else if (daysUntil <= 7) {
        dueDateLabel = `${daysUntil} days`;
      } else {
        dueDateLabel = renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    // Format ARR
    const arrFormatted = customer.arr
      ? `$${(customer.arr / 1000).toFixed(0)}K`
      : '$0';

    // Determine priority from workflow type and priority score
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (topWorkflow.priority_score >= 1000) {
      priority = 'Critical'; // Snoozed critical
    } else if (topWorkflow.priority_score >= 900) {
      priority = 'Critical'; // Risk workflows
    } else if (topWorkflow.priority_score >= 800) {
      priority = 'High'; // Opportunity workflows
    } else if (topWorkflow.priority_score >= 700) {
      priority = 'High'; // Strategic workflows
    } else if (topWorkflow.priority_score >= 600) {
      priority = 'Medium'; // Renewal workflows
    } else {
      priority = 'Low';
    }

    // Map workflow_definition trigger_conditions to workflowId
    const workflowId = definition.trigger_conditions?.workflow_id || definition.id;

    // Return priority workflow data
    return NextResponse.json({
      priorityWorkflow: {
        id: workflowId,
        executionId: topWorkflow.id, // Include execution ID for status updates
        title: definition.name,
        customerId: customer.id,
        customerName: customer.domain,
        priority,
        dueDate: dueDateLabel,
        arr: arrFormatted,
        workflowType: definition.workflow_type
      }
    });

  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
