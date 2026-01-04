// GET /api/assessment/status
// Returns current user's assessment status

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssessmentStatusResponse } from '@/lib/assessment/types';
import coreQuestions from '@/lib/assessment/core-questions.json';

export async function GET(_request: NextRequest) {
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

    // Fetch latest session for user
    const { data: session, error: fetchError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch assessment status' },
        { status: 500 }
      );
    }

    // No session exists
    if (!session) {
      const response: AssessmentStatusResponse = {
        status: 'not_started',
      };
      return NextResponse.json(response);
    }

    // Calculate total questions
    const sections = coreQuestions.sections as Array<{ questions: unknown[] }>;
    const totalQuestions = sections.reduce(
      (sum: number, section: { questions: unknown[] }) => sum + section.questions.length,
      0
    );

    // Session in progress
    if (session.status === 'in_progress' || session.status === 'not_started') {
      const answersCount = Object.keys(session.answers || {}).length;
      const percentage = Math.round((answersCount / totalQuestions) * 100);

      const response: AssessmentStatusResponse = {
        status: 'in_progress',
        session_id: session.id,
        progress: {
          percentage,
          questions_answered: answersCount,
          total_questions: totalQuestions,
        },
      };
      return NextResponse.json(response);
    }

    // Session completed
    if (session.status === 'completed') {
      const response: AssessmentStatusResponse = {
        status: 'completed',
        session_id: session.id,
        preview: {
          overall_score: session.overall_score,
          archetype: session.archetype,
        },
      };
      return NextResponse.json(response);
    }

    // Unknown status
    return NextResponse.json(
      { error: 'Unknown assessment status' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in /api/assessment/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
