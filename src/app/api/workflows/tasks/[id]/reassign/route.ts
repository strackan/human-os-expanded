/**
 * Task Reassignment API
 *
 * POST /api/workflows/tasks/[id]/reassign
 * - Reassign task to another user (escalation)
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/lib/services/WorkflowTaskService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Parse request body
    const body = await request.json();
    const { newAssignee, reason } = body;

    // Validate required fields
    if (!newAssignee || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: newAssignee, reason' },
        { status: 400 }
      );
    }

    // Reassign the task
    const task = await WorkflowTaskService.reassignTask(
      { taskId, newAssignee, reason },
      supabase
    );

    return NextResponse.json({
      task,
      message: 'Task reassigned successfully'
    });

  } catch (error) {
    console.error('Error reassigning task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reassign task' },
      { status: 500 }
    );
  }
}
