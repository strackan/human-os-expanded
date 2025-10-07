/**
 * Pending Tasks API
 *
 * GET /api/workflows/tasks/pending
 * - Get all pending tasks for the current user or a specific customer
 *
 * Query params:
 * - customerId: Filter by customer ID (optional)
 * - userId: Get tasks for specific user (optional, defaults to current user)
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/lib/services/WorkflowTaskService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const userId = searchParams.get('userId') || user.id;

    let tasks;

    if (customerId) {
      // Get all pending tasks for a specific customer (cross-workflow)
      tasks = await WorkflowTaskService.getPendingTasksForCustomer(customerId, supabase);
    } else {
      // Get all tasks assigned to the user
      tasks = await WorkflowTaskService.getTasksForUser(userId, supabase, false);
    }

    return NextResponse.json({
      tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pending tasks' },
      { status: 500 }
    );
  }
}
