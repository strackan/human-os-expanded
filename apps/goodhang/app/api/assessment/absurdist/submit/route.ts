// POST /api/assessment/absurdist/submit
// Saves absurdist question answers and marks assessment as complete

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const submitSchema = z.object({
  session_id: z.string().uuid(),
  answers: z.record(z.string(), z.string()), // question_id -> answer
});

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = submitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { session_id, answers } = validationResult.data;

    // Fetch session
    const { data: session, error: fetchError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !session) {
      console.error('Error fetching session:', fetchError);
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Ensure session is completed (absurdist questions come after main assessment)
    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Main assessment must be completed before absurdist questions' },
        { status: 400 }
      );
    }

    // Store absurdist answers in the answers JSONB field with 'absurdist-' prefix
    const existingAnswers = session.answers || {};
    const updatedAnswers = { ...existingAnswers };

    // Add absurdist answers with prefix
    Object.entries(answers).forEach(([questionId, answer]) => {
      updatedAnswers[`absurdist-${questionId}`] = answer;
    });

    const answersCount = Object.keys(answers).length;

    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        answers: updatedAnswers,
        absurdist_questions_answered: answersCount,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session with absurdist answers:', updateError);
      return NextResponse.json(
        { error: 'Failed to save absurdist answers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id,
      answers_saved: answersCount,
      redirect_url: `/assessment/results/${session_id}`,
    });
  } catch (error) {
    console.error('Error in /api/assessment/absurdist/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
