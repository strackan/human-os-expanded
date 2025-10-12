/**
 * Unread Notifications API
 *
 * GET /api/notifications/unread
 * - Get all unread notifications for current user
 *
 * POST /api/notifications/unread
 * - Mark all notifications as read
 *
 * Query params:
 * - limit: Maximum number of notifications to return (optional)
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Get unread notifications
    const notifications = await NotificationService.getUnreadNotifications(
      user.id,
      supabase,
      limit
    );

    return NextResponse.json({
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch unread notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Mark all as read
    const count = await NotificationService.markAllAsRead(user.id, supabase);

    return NextResponse.json({
      message: 'All notifications marked as read',
      count
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark all as read' },
      { status: 500 }
    );
  }
}
