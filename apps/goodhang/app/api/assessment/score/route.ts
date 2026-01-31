// POST /api/assessment/score
// Direct scoring endpoint for desktop app
// Accepts transcript and user_id, creates session and scores in one step

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { AssessmentScoringService } from '@/lib/services/AssessmentScoringService';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, transcript, source } = body;

    if (!user_id || !transcript) {
      return NextResponse.json(
        { error: 'user_id and transcript are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: 'transcript must be a non-empty array' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use service client to bypass RLS for desktop app scoring
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, assessment_status')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', profileError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create a new assessment session for this scoring
    // Note: Using 'answers' field to store transcript as JSONB (compatible with enhanced schema)
    const { data: session, error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .insert({
        user_id,
        status: 'in_progress',
        answers: { transcript, source: source || 'desktop_app' },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create assessment session' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Created assessment session ${session.id} for user ${user_id} from ${source || 'desktop_app'}`);

    // Score the assessment
    const scoringResults = await AssessmentScoringService.scoreAssessment({
      session_id: session.id,
      user_id,
      transcript,
      mode: 'claude',
    });

    console.log(`Scoring complete for session ${session.id}`);

    // Update session with results
    // Store extended data in dimensions JSONB field (compatible with schema)
    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        analyzed_at: scoringResults.analyzed_at,
        overall_score: scoringResults.overall_score,
        archetype: scoringResults.profile.class,
        tier: scoringResults.overall_score >= 70 ? 'top_1' : scoringResults.overall_score >= 50 ? 'benched' : 'passed',
        // Store extended scoring data in dimensions JSONB
        dimensions: {
          attributes: scoringResults.attributes,
          profile: scoringResults.profile,
          signals: scoringResults.signals,
          matching: scoringResults.matching,
          question_scores: scoringResults.question_scores,
        },
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error saving scoring results:', updateError);
      return NextResponse.json(
        { error: 'Failed to save scoring results' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Update user's profile assessment status
    const newStatus = profile.assessment_status === 'approved' ? 'approved' : 'trial';

    await supabase
      .from('profiles')
      .update({
        assessment_status: newStatus,
        assessment_completed_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    // Update user_status to mark GoodHang assessment as completed
    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('products')
      .eq('user_id', user_id)
      .single();

    if (existingStatus) {
      const products = existingStatus.products || {};
      const goodhang = products.goodhang || {};

      await supabase
        .from('user_status')
        .update({
          products: {
            ...products,
            goodhang: {
              ...goodhang,
              assessment: {
                completed: true,
                completed_at: new Date().toISOString(),
                session_id: session.id,
              },
            },
          },
        })
        .eq('user_id', user_id);
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      profile: {
        ...scoringResults.profile,
        characterClass: scoringResults.profile.class,  // Add for desktop compat
      },
      attributes: scoringResults.attributes,
      overall_score: scoringResults.overall_score,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in /api/assessment/score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
