/**
 * Dashboard Today Workflows API
 *
 * GET /api/dashboard/today-workflows
 * - Returns priority workflow from database (Obsidian Black)
 * - Fetches real customer data for priority card
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    // Query for Obsidian Black customer data
    const obsidianBlackId = '550e8400-e29b-41d4-a716-446655440001';

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', obsidianBlackId)
      .single();

    if (customerError) {
      console.error('[Dashboard API] Error fetching customer:', customerError);
      throw new Error('Failed to fetch customer data');
    }

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate days until renewal
    const renewalDate = new Date(customer.renewal_date);
    const today = new Date();
    const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Determine due date label
    let dueDateLabel = 'Today';
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

    // Format ARR
    const arrFormatted = customer.current_arr
      ? `$${(customer.current_arr / 1000).toFixed(0)}K`
      : '$0';

    // Determine priority based on health score and days until renewal
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (customer.health_score < 50 || daysUntil < 30) {
      priority = 'Critical';
    } else if (customer.health_score < 70 || daysUntil < 60) {
      priority = 'High';
    } else if (customer.health_score < 80) {
      priority = 'Medium';
    } else {
      priority = 'Low';
    }

    // Return priority workflow data
    return NextResponse.json({
      priorityWorkflow: {
        id: 'obsblk-strategic-planning',
        title: `Complete Strategic Account Plan for ${customer.name}`,
        customerId: customer.id,
        customerName: customer.name,
        priority,
        dueDate: dueDateLabel,
        arr: arrFormatted,
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
