// POST /api/assessment/[sessionId]/complete
// Triggers Claude AI scoring and completes the assessment
// Generates an activation key for desktop app access

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { AssessmentScoringService } from '@/lib/services/AssessmentScoringService';

export async function POST(
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

    // Generate scoring using Claude AI
    console.log(`Starting Claude AI scoring for session ${sessionId}...`);

    const scoringResults = await AssessmentScoringService.scoreAssessment({
      session_id: sessionId,
      user_id: user.id,
      transcript: session.interview_transcript,
    });

    console.log(`Scoring complete for session ${sessionId}`);

    // Save results to database (V2: D&D-style character generation)
    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        analyzed_at: scoringResults.analyzed_at,
        overall_score: scoringResults.overall_score,
        // V2 Character Profile
        character_profile: scoringResults.profile,
        attributes: scoringResults.attributes,
        signals: scoringResults.signals,
        matching: scoringResults.matching,
        question_scores: scoringResults.question_scores,
        // Keep archetype for backwards compatibility (use class name)
        archetype: scoringResults.profile.class,
        tier: scoringResults.overall_score >= 70 ? 'top_1' : scoringResults.overall_score >= 50 ? 'benched' : 'passed',
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

    // Generate activation key for desktop app
    let activationKey = null;
    try {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: keyData, error: keyError } = await serviceClient.rpc('create_activation_key', {
        p_product: 'goodhang',
        p_session_id: sessionId,
        p_expires_in_days: 30, // Longer expiry since they're already authenticated
        p_metadata: {
          // V2 Character info
          character_class: scoringResults.profile.class,
          race: scoringResults.profile.race,
          alignment: scoringResults.profile.alignment,
          overall_score: scoringResults.overall_score,
          user_id: user.id,
        },
      });

      if (!keyError && keyData && keyData.length > 0) {
        activationKey = {
          code: keyData[0].code,
          deepLink: keyData[0].deep_link,
          expiresAt: keyData[0].expires_at,
        };
        console.log(`Generated activation key ${keyData[0].code} for session ${sessionId}`);
      } else if (keyError) {
        console.error('Error generating activation key:', keyError);
      }
    } catch (keyGenError) {
      console.error('Error generating activation key:', keyGenError);
      // Don't fail the completion if key generation fails
    }

    return NextResponse.json({
      session_id: sessionId,
      status: 'completed',
      redirect_url: `/assessment/results/${sessionId}`,
      activation_key: activationKey,
    });
  } catch (error) {
    console.error('Error in /api/assessment/[sessionId]/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
