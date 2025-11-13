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
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const userId = searchParams.get('userId') || user.id;

    // If customerId provided, verify it belongs to user's company
    if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, company_id')
        .eq('id', customerId)
        .single();

      if (!customer || customer.company_id !== profile.company_id) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
    }

    let tasks;

    if (customerId) {
      // Get all pending tasks for a specific customer (cross-workflow)
      tasks = await WorkflowTaskService.getPendingTasksForCustomer(customerId, supabase);
    } else {
      // Get all tasks assigned to the user
      tasks = await WorkflowTaskService.getTasksForUser(userId, supabase, false);
    }

    // Filter tasks to only those whose customer belongs to user's company
    const filteredTasks = tasks.filter((task: any) => {
      // Tasks from WorkflowTaskService should have customer data
      return task.customer?.company_id === profile.company_id;
    });

    return NextResponse.json({
      tasks: filteredTasks,
      count: filteredTasks.length
    });

  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pending tasks' },
      { status: 500 }
    );
  }
}
