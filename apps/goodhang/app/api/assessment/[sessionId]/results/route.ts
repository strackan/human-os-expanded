// GET /api/assessment/[sessionId]/results
// Returns full assessment results including all enhanced fields

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssessmentResults, Badge } from '@/lib/assessment/types';
import { BadgeEvaluatorService } from '@/lib/services/BadgeEvaluatorService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Fetch session
    const { data: session, error: fetchError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !session) {
      console.error('Error fetching session:', fetchError);
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment not yet completed' },
        { status: 400 }
      );
    }

    // Format badges with full details
    let badges: Badge[] = [];
    if (session.badges && session.badges.length > 0) {
      badges = BadgeEvaluatorService.formatBadgesForResponse(
        session.badges,
        session.analyzed_at || session.completed_at
      );
    }

    // Construct AssessmentResults object
    const results: AssessmentResults = {
      session_id: session.id,
      user_id: session.user_id,
      archetype: session.archetype,
      archetype_confidence: session.archetype_confidence,
      overall_score: session.overall_score,
      dimensions: session.dimensions,
      tier: session.tier,
      flags: session.flags,
      recommendation: session.recommendation,
      best_fit_roles: session.best_fit_roles,
      analyzed_at: session.analyzed_at,
      // Enhanced fields
      personality_profile: session.personality_profile,
      ai_orchestration_scores: session.ai_orchestration_scores,
      category_scores: session.category_scores,
      badges: badges,
      public_summary: session.public_summary,
      detailed_summary: session.detailed_summary,
      is_published: session.is_published,
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in /api/assessment/[sessionId]/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
