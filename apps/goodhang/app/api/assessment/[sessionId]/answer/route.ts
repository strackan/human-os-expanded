// POST /api/assessment/[sessionId]/answer
// Saves answer to interview_transcript with auto-save functionality

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AnswerRequestBody {
  question_id: string;
  question_text?: string;
  answer: string;
  // Support both naming conventions
  current_section_index?: number;
  current_question_index?: number;
  section_index?: number;
  question_index?: number;
}

interface TranscriptEntry {
  role: 'assistant' | 'user';
  content: string;
  question_id?: string;
  timestamp: string;
}

export async function POST(
  request: NextRequest,
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
    const body: AnswerRequestBody = await request.json();
    const { question_id, question_text, answer } = body;
    // Support both naming conventions from frontend
    const sectionIndex = body.current_section_index ?? body.section_index;
    const questionIndex = body.current_question_index ?? body.question_index;

    if (!question_id || !answer) {
      return NextResponse.json(
        { error: 'Missing question_id or answer' },
        { status: 400 }
      );
    }

    // Fetch existing session
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
      return NextResponse.json(
        { error: 'Cannot modify completed assessment' },
        { status: 400 }
      );
    }

    // Get existing transcript
    const transcript: TranscriptEntry[] = session.interview_transcript || [];
    const now = new Date().toISOString();

    // Check if this question was already answered (for updates/edits)
    const existingQuestionIndex = transcript.findIndex(
      (entry) => entry.role === 'assistant' && entry.question_id === question_id
    );

    if (existingQuestionIndex !== -1) {
      // Update existing answer (the user entry follows the assistant entry)
      const answerIndex = existingQuestionIndex + 1;
      const existingAnswer = transcript[answerIndex];
      if (answerIndex < transcript.length && existingAnswer && existingAnswer.role === 'user') {
        transcript[answerIndex] = {
          role: 'user',
          content: answer,
          timestamp: now,
        };
      }
    } else {
      // Add new Q&A pair to transcript
      transcript.push({
        role: 'assistant',
        content: question_text || question_id,
        question_id,
        timestamp: now,
      });
      transcript.push({
        role: 'user',
        content: answer,
        timestamp: now,
      });
    }

    // Build update object
    const updateData: {
      interview_transcript: TranscriptEntry[];
      status: string;
      last_activity_at: string;
      current_section_index?: number;
      current_question_index?: number;
    } = {
      interview_transcript: transcript,
      status: 'in_progress',
      last_activity_at: now,
    };

    if (sectionIndex !== undefined) {
      updateData.current_section_index = sectionIndex;
    }

    if (questionIndex !== undefined) {
      updateData.current_question_index = questionIndex;
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      saved_at: now,
    });
  } catch (error) {
    console.error('Error in /api/assessment/[sessionId]/answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
