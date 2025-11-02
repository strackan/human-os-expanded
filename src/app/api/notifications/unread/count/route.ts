/**
 * Unread Notification Count API
 *
 * GET /api/notifications/unread/count
 * - Get count of unread notifications for current user (for red badge)
 *
 * Phase 3.3: Task State Management
 */

import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET() {
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

    // Get unread count
    const count = await NotificationService.getUnreadCount(user.id, supabase);

    return NextResponse.json({ count });

  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
