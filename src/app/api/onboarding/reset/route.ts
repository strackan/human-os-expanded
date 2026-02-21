/**
 * Onboarding Reset API
 *
 * POST /api/onboarding/reset — Delete the user's current onboarding session
 * so they can start fresh. Deletes all in_progress sessions for the user.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DB_TABLES } from '@/lib/constants/database';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all sessions for this user (in_progress, completed, skipped)
    // so onboarding can restart completely fresh
    const { error } = await supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('[Onboarding Reset API] delete error:', error);
      return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Onboarding Reset API] error:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
