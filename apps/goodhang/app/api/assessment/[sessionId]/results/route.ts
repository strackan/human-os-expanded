// GET /api/assessment/[sessionId]/results
// Returns full assessment results including all enhanced fields
// Supports both cookie-based auth (web) and Bearer token auth (desktop)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { AssessmentResults, Badge } from '@/lib/assessment/types';
import { BadgeEvaluatorService } from '@/lib/services/BadgeEvaluatorService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    let userId: string | null = null;

    // Check for Bearer token (desktop app)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Verify token with Supabase
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: { user }, error } = await serviceClient.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // Fall back to cookie-based auth (web)
    if (!userId) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for data fetching since we've verified auth
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { sessionId } = await params;

    // Fetch session
    const { data: session, error: fetchError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
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

    // Construct AssessmentResults object - supports both V1 and V3 formats
    const results: AssessmentResults = {
      session_id: session.id,
      user_id: session.user_id,
      overall_score: session.overall_score,
      analyzed_at: session.analyzed_at,

      // V1 fields (work assessment)
      archetype: session.archetype,
      archetype_confidence: session.archetype_confidence,
      dimensions: session.dimensions,
      tier: session.tier,
      flags: session.flags,
      recommendation: session.recommendation,
      best_fit_roles: session.best_fit_roles,
      personality_profile: session.personality_profile,
      ai_orchestration_scores: session.ai_orchestration_scores,
      category_scores: session.category_scores,
      badges: badges,
      public_summary: session.public_summary,
      detailed_summary: session.detailed_summary,
      is_published: session.is_published,

      // V3 fields (D&D character profile)
      character_profile: session.character_profile,
      attributes: session.attributes,
      signals: session.signals,
      matching: session.matching,
      question_scores: session.question_scores,
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
