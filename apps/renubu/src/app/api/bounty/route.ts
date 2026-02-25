/**
 * Bounty API
 *
 * GET /api/bounty - Get today's bounty log + streak for authenticated user
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BountyService } from '@/lib/services/BountyService';
import { BOUNTY_CONFIG } from '@/lib/workflows/bounty';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bountyService = new BountyService(supabase);

    const [todayLog, streak] = await Promise.all([
      bountyService.getTodayLog(user.id),
      bountyService.getStreak(user.id),
    ]);

    return NextResponse.json({
      earned: todayLog.points_earned,
      goal: BOUNTY_CONFIG.dailyGoal,
      workflowsCompleted: todayLog.workflows_completed,
      streak,
    });
  } catch (error) {
    console.error('[Bounty API] GET error:', error);
    // Return defaults on error so dashboard doesn't break
    return NextResponse.json({
      earned: 0,
      goal: BOUNTY_CONFIG.dailyGoal,
      workflowsCompleted: 0,
      streak: 0,
    });
  }
}
