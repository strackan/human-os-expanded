/**
 * Mark Notification as Read API
 *
 * PATCH /api/notifications/[id]/read
 * - Mark a specific notification as read
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

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

    // Mark as read
    const notification = await NotificationService.markAsRead(notificationId, supabase);

    return NextResponse.json({
      notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
