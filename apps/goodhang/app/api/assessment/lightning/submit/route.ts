// POST /api/assessment/lightning/submit
// Submits lightning round answers and calculates score

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  SubmitLightningRoundRequest,
  SubmitLightningRoundResponse,
  LightningRoundQuestion,
  LightningDifficulty,
} from '@/lib/assessment/types';
import { LightningRoundScoringService } from '@/lib/services/LightningRoundScoringService';

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
    let body: SubmitLightningRoundRequest;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { session_id, answers } = body;

    if (!session_id || !answers) {
      return NextResponse.json(
        { error: 'Missing session_id or answers' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .select('id, user_id, lightning_round_difficulty, lightning_round_completed_at')
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

    // Get difficulty (default to 'easy' if not set)
    const difficulty: LightningDifficulty = session.lightning_round_difficulty || 'easy';

    // Fetch the questions to verify answers
    const questionIds = answers.map((a) => a.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('lightning_round_questions')
      .select('*')
      .in('id', questionIds);

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: 'Failed to fetch questions for scoring' },
        { status: 500 }
      );
    }

    // Score the answers
    const scoringResult = LightningRoundScoringService.calculateScore(
      questions as LightningRoundQuestion[],
      answers,
      difficulty
    );

    // Determine difficulty achieved
    const difficultyAchieved = LightningRoundScoringService.determineDifficultyAchieved(
      scoringResult.accuracy,
      difficulty
    );

    // Update session with results
    const updateData = {
      lightning_round_score: scoringResult.score,
      lightning_round_difficulty: difficultyAchieved,
      lightning_round_completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update(updateData)
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session with lightning results:', updateError);
      return NextResponse.json(
        { error: 'Failed to save lightning round results' },
        { status: 500 }
      );
    }

    // Calculate percentile rank
    const percentile = await LightningRoundScoringService.calculatePercentile(session_id);

    // Refresh leaderboard if possible (best effort, don't fail if this doesn't work)
    try {
      await supabase.rpc('refresh_assessment_leaderboard');
    } catch (error) {
      // Non-critical error, just log it
      console.warn('Failed to refresh leaderboard:', error);
    }

    const response: SubmitLightningRoundResponse = {
      score: scoringResult.score,
      accuracy: scoringResult.accuracy,
      percentile: percentile,
      difficulty_achieved: difficultyAchieved,
      correct_count: scoringResult.correct_count,
      total_questions: scoringResult.total_questions,
      questions_answered: answers.length,
      time_bonus: scoringResult.time_bonus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/assessment/lightning/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
