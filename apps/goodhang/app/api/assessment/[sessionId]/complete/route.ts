// POST /api/assessment/[sessionId]/complete
// Triggers scoring and completes the assessment
// Supports scoring modes: 'claude' (default), 'hybrid', 'lexicon'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssessmentScoringService, type ScoringMode } from '@/lib/services/AssessmentScoringService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();

    // Parse optional scoring mode from request body
    let scoringMode: ScoringMode = 'claude'; // Default to full Claude scoring
    try {
      const body = await request.json();
      if (body.mode && ['claude', 'hybrid', 'lexicon'].includes(body.mode)) {
        scoringMode = body.mode as ScoringMode;
      }
    } catch {
      // No body or invalid JSON - use default mode
    }

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

    if (session.status === 'completed') {
      // Already completed, just return redirect
      return NextResponse.json({
        session_id: sessionId,
        status: 'completed',
        redirect_url: `/assessment/results/${sessionId}`,
      });
    }

    // Validate that all required questions are answered
    // interview_transcript is an array of {role, content} entries
    // User answers have role: 'user', questions have role: 'assistant'
    const transcript = session.interview_transcript || [];
    const answersCount = Array.isArray(transcript)
      ? transcript.filter((entry: { role?: string }) => entry.role === 'user').length
      : 0;

    // Get actual question count from the assessment config
    const coreQuestions = await import('@/lib/assessment/core-questions.json');
    const totalQuestions = coreQuestions.sections.reduce(
      (sum: number, section: { questions: unknown[] }) => sum + section.questions.length,
      0
    );

    if (answersCount < totalQuestions) {
      return NextResponse.json(
        { error: `Not all required questions have been answered (${answersCount}/${totalQuestions})` },
        { status: 400 }
      );
    }

    // Generate scoring using specified mode
    console.log(`Starting ${scoringMode} scoring for session ${sessionId}...`);

    const scoringResults = await AssessmentScoringService.scoreAssessment({
      session_id: sessionId,
      user_id: user.id,
      transcript: session.interview_transcript,
      mode: scoringMode,
    });

    console.log(`Scoring complete for session ${sessionId} (mode: ${scoringMode})`);

    // Save results to database
    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        analyzed_at: scoringResults.analyzed_at,
        dimensions: scoringResults.dimensions,
        overall_score: scoringResults.overall_score,
        personality_type: scoringResults.personality_profile?.mbti,
        personality_profile: scoringResults.personality_profile,
        category_scores: scoringResults.category_scores,
        ai_orchestration_scores: scoringResults.ai_orchestration_scores,
        archetype: scoringResults.archetype,
        archetype_confidence: scoringResults.archetype_confidence,
        tier: scoringResults.tier,
        flags: scoringResults.flags,
        recommendation: scoringResults.recommendation,
        best_fit_roles: scoringResults.best_fit_roles,
        badges: scoringResults.badges?.map((b) => b.id) || [],
        public_summary: scoringResults.public_summary,
        detailed_summary: scoringResults.detailed_summary,
        is_published: false,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error saving scoring results:', updateError);
      return NextResponse.json(
        { error: 'Failed to save scoring results' },
        { status: 500 }
      );
    }

    // Update profile assessment status
    // Check if user has an invite code (trial) or needs review (pending_review)
    const { data: profile } = await supabase
      .from('profiles')
      .select('invite_code_used, assessment_status')
      .eq('id', user.id)
      .single();

    // Determine the new status based on whether they had an invite code
    const newStatus = profile?.invite_code_used ? 'trial' : 'pending_review';

    // Only update if not already approved
    if (profile?.assessment_status !== 'approved') {
      await supabase
        .from('profiles')
        .update({
          assessment_status: newStatus,
          assessment_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      session_id: sessionId,
      status: 'completed',
      redirect_url: `/assessment/results/${sessionId}`,
    });
  } catch (error) {
    console.error('Error in /api/assessment/[sessionId]/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
