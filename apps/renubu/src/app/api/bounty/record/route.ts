/**
 * Bounty Record API
 *
 * POST /api/bounty/record - Record a workflow completion
 * Body: { priorityScore: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { BountyService } from '@/lib/services/BountyService';
import { BOUNTY_CONFIG } from '@/lib/workflows/bounty';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const priorityScore = typeof body.priorityScore === 'number' ? body.priorityScore : 0;

    const bountyService = new BountyService(supabase);

    const updatedLog = await bountyService.recordCompletion(user.id, priorityScore);
    const streak = await bountyService.getStreak(user.id);

    return NextResponse.json({
      earned: updatedLog.points_earned,
      goal: BOUNTY_CONFIG.dailyGoal,
      workflowsCompleted: updatedLog.workflows_completed,
      streak,
    });
  } catch (error) {
    console.error('[Bounty API] POST record error:', error);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}
