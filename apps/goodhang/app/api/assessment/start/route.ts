// POST /api/assessment/start
// Creates new assessment session or resumes existing incomplete session

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssessmentConfig } from '@/lib/assessment/types';
import coreQuestions from '@/lib/assessment/core-questions.json';

export async function POST(_request: NextRequest) {
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

    // Check for existing incomplete session
    // Note: Valid statuses are 'in_progress', 'completed', 'abandoned' (no 'not_started')
    const { data: existingSession, error: fetchError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected)
      console.error('Error fetching existing session:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing session' },
        { status: 500 }
      );
    }

    let session;

    if (existingSession) {
      // Resume existing session
      session = existingSession;
    } else {
      // Create new session
      // Note: Table schema uses interview_transcript (not answers), and status must be 'in_progress' (not 'not_started')
      const { data: newSession, error: createError } = await supabase
        .from('cs_assessment_sessions')
        .insert({
          user_id: user.id,
          status: 'in_progress',
          current_section_index: 0,
          current_question_index: 0,
          interview_transcript: [],
        })
        .select()
        .single();

      if (createError || !newSession) {
        console.error('Error creating session:', createError);
        return NextResponse.json(
          { error: 'Failed to create assessment session' },
          { status: 500 }
        );
      }

      session = newSession;
    }

    // Calculate progress based on interview_transcript (array of Q&A pairs)
    const transcript = session.interview_transcript || [];
    const answersCount = Array.isArray(transcript)
      ? transcript.filter((entry: { role?: string }) => entry.role === 'user').length
      : 0;
    const totalQuestions = (coreQuestions as AssessmentConfig).sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );

    const response = {
      session_id: session.id,
      status: session.status,
      assessment: coreQuestions,  // Hook expects 'assessment' not 'config'
      current_section_index: session.current_section_index || 0,
      current_question_index: session.current_question_index || 0,
      resume: existingSession !== null,
      progress: {
        current_section: session.current_section || coreQuestions.sections[0]?.id || '',
        current_question: session.current_question || 0,
        total_questions: totalQuestions,
        percentage: Math.round((answersCount / totalQuestions) * 100),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/assessment/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
