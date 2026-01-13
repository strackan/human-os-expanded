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
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Verify task ownership
    const { data: existingTask } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!existingTask || existingTask.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

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
