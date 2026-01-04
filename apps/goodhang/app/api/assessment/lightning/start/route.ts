// POST /api/assessment/lightning/start
// Starts a new lightning round challenge with random questions

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  StartLightningRoundRequest,
  StartLightningRoundResponse,
  LightningRoundQuestion,
  LightningDifficulty,
} from '@/lib/assessment/types';

// Configuration
const QUESTIONS_PER_ROUND = 15;
const DURATION_SECONDS = 120; // 2 minutes

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

    // Parse request body
    let body: StartLightningRoundRequest;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { session_id, difficulty } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .select('id, user_id, lightning_round_completed_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if lightning round already completed
    if (session.lightning_round_completed_at) {
      return NextResponse.json(
        { error: 'Lightning round already completed for this session' },
        { status: 400 }
      );
    }

    // Fetch random questions from database
    const questions = await fetchRandomQuestions(supabase, difficulty);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available for this difficulty' },
        { status: 500 }
      );
    }

    // Update session with difficulty selected
    if (difficulty) {
      await supabase
        .from('cs_assessment_sessions')
        .update({ lightning_round_difficulty: difficulty })
        .eq('id', session_id);
    }

    const response: StartLightningRoundResponse = {
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        question_type: q.question_type,
        difficulty: q.difficulty,
      })),
      duration_seconds: DURATION_SECONDS,
      started_at: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/assessment/lightning/start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Fetch random questions from the database
 * If difficulty is specified, fetch questions of that difficulty or mixed difficulties
 * If no difficulty specified, fetch a mix of all difficulties
 */
async function fetchRandomQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  difficulty?: LightningDifficulty
): Promise<LightningRoundQuestion[]> {
  try {
    let query = supabase.from('lightning_round_questions').select('*');

    if (difficulty) {
      // If specific difficulty selected, fetch questions of that difficulty
      query = query.eq('difficulty', difficulty);
    }
    // Otherwise, fetch from all difficulties (no filter)

    // Fetch more questions than needed, then shuffle and select
    const { data: allQuestions, error } = await query;

    if (error) {
      console.error('Error fetching lightning questions:', error);
      return [];
    }

    if (!allQuestions || allQuestions.length === 0) {
      return [];
    }

    // Shuffle questions using Fisher-Yates algorithm
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Select the first N questions
    const selected = shuffled.slice(0, QUESTIONS_PER_ROUND);

    return selected;
  } catch (error) {
    console.error('Error in fetchRandomQuestions:', error);
    return [];
  }
}
