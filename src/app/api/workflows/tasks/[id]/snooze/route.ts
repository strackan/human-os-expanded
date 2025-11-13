/**
 * Task Snooze API
 *
 * POST /api/workflows/tasks/[id]/snooze
 * - Snooze a task (enforces 7-day max limit)
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
    const { snoozedUntil } = body;

    // Validate required fields
    if (!snoozedUntil) {
      return NextResponse.json(
        { error: 'Missing required field: snoozedUntil' },
        { status: 400 }
      );
    }

    // Parse date
    const snoozedUntilDate = new Date(snoozedUntil);

    if (isNaN(snoozedUntilDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for snoozedUntil' },
        { status: 400 }
      );
    }

    // Validate snooze date (this will throw if invalid)
    const validation = await WorkflowTaskService.validateSnooze(
      taskId,
      snoozedUntilDate,
      supabase
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          maxSnoozeDate: validation.maxSnoozeDate,
          daysRemaining: validation.daysRemaining
        },
        { status: 400 }
      );
    }

    // Snooze the task
    const task = await WorkflowTaskService.snoozeTask(
      { taskId, snoozedUntil: snoozedUntilDate },
      supabase
    );

    return NextResponse.json({
      task,
      message: 'Task snoozed successfully',
      daysRemaining: validation.daysRemaining
    });

  } catch (error) {
    console.error('Error snoozing task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to snooze task' },
      { status: 500 }
    );
  }
}
