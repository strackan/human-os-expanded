/**
 * Workflow Execution Detail API
 *
 * GET /api/workflows/executions/[id]
 * - Get workflow execution by ID with step history
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutionService } from '@/lib/services/WorkflowExecutionService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get workflow execution with step history
    const execution = await WorkflowExecutionService.getExecution(resolvedParams.id, supabase);

    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ execution });

  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflow execution' },
      { status: 500 }
    );
  }
}
