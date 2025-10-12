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
