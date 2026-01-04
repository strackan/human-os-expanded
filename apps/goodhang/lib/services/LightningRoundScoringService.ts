// LightningRoundScoringService - Scoring logic for 2-minute Lightning Round challenge

import { createClient } from '@/lib/supabase/server';
import {
  LightningRoundAnswer,
  LightningRoundQuestion,
  LightningDifficulty,
} from '../assessment/types';

export interface ScoringResult {
  score: number;
  accuracy: number;
  correct_count: number;
  total_questions: number;
  time_bonus: number;
  difficulty_achieved: LightningDifficulty;
}

export class LightningRoundScoringService {
  // Difficulty multipliers for scoring
  private static readonly DIFFICULTY_MULTIPLIERS: Record<LightningDifficulty, number> = {
    easy: 1.0,
    intermediate: 1.5,
    advanced: 2.0,
    insane: 3.0,
  };

  // Base points per correct answer
  private static readonly BASE_POINTS = 10;

  // Maximum time bonus per question (in ms)
  private static readonly MAX_TIME_PER_QUESTION_MS = 8000; // 8 seconds per question
  private static readonly TIME_BONUS_MULTIPLIER = 0.5;

  /**
   * Check if a user's answer is correct
   * Uses fuzzy matching to be lenient with formatting
   */
  static scoreAnswer(userAnswer: string, correctAnswer: string): boolean {
    if (!userAnswer || !correctAnswer) return false;

    // Normalize both answers
    const normalizedUser = this.normalizeAnswer(userAnswer);
    const normalizedCorrect = this.normalizeAnswer(correctAnswer);

    // Exact match after normalization
    if (normalizedUser === normalizedCorrect) return true;

    // Check if the correct answer is contained in the user's answer
    // This handles cases like "42" vs "The answer is 42"
    if (normalizedUser.includes(normalizedCorrect)) return true;

    // Check if user answer is contained in correct answer
    // This handles cases where correct answer has more detail
    if (normalizedCorrect.includes(normalizedUser)) return true;

    return false;
  }

  /**
   * Calculate overall score based on answers and time taken
   */
  static calculateScore(
    questions: LightningRoundQuestion[],
    answers: LightningRoundAnswer[],
    difficulty: LightningDifficulty
  ): ScoringResult {
    let correctCount = 0;
    let totalTimeMs = 0;

    // Create a map for quick lookup
    // new Map(questions.map((q) => [q.id, q]));
    const answerMap = new Map(answers.map((a) => [a.question_id, a]));

    // Score each question
    for (const question of questions) {
      const answer = answerMap.get(question.id);
      if (!answer) continue; // Question not answered

      totalTimeMs += answer.time_taken_ms;

      if (this.scoreAnswer(answer.answer, question.correct_answer)) {
        correctCount++;
      }
    }

    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Calculate base score
    const difficultyMultiplier = this.DIFFICULTY_MULTIPLIERS[difficulty];
    const baseScore = correctCount * this.BASE_POINTS * difficultyMultiplier;

    // Calculate time bonus (faster = more points)
    const timeBonus = this.calculateTimeBonus(totalTimeMs, totalQuestions, correctCount);

    // Final score is base score + time bonus
    const finalScore = Math.round(baseScore + timeBonus);

    return {
      score: finalScore,
      accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
      correct_count: correctCount,
      total_questions: totalQuestions,
      time_bonus: Math.round(timeBonus),
      difficulty_achieved: difficulty as LightningDifficulty,
    };
  }

  /**
   * Calculate percentile rank for a user's lightning round score
   */
  static async calculatePercentile(sessionId: string): Promise<number> {
    try {
      const supabase = await createClient();

      // Get the user's score
      const { data: session, error: sessionError } = await supabase
        .from('cs_assessment_sessions')
        .select('lightning_round_score, user_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session?.lightning_round_score) {
        console.error('Error fetching session for percentile:', sessionError);
        return 0;
      }

      const userScore = session.lightning_round_score;

      // Count how many users have a lower score
      const { count: lowerCount, error: lowerError } = await supabase
        .from('cs_assessment_sessions')
        .select('*', { count: 'exact', head: true })
        .not('lightning_round_score', 'is', null)
        .lt('lightning_round_score', userScore);

      if (lowerError) {
        console.error('Error counting lower scores:', lowerError);
        return 0;
      }

      // Count total users with lightning round scores
      const { count: totalCount, error: totalError } = await supabase
        .from('cs_assessment_sessions')
        .select('*', { count: 'exact', head: true })
        .not('lightning_round_score', 'is', null);

      if (totalError) {
        console.error('Error counting total scores:', totalError);
        return 0;
      }

      // Calculate percentile (0-100, where 100 is top performer)
      if (!totalCount || totalCount === 0) return 100; // If no other scores, you're at 100th percentile

      const percentile = ((lowerCount || 0) / totalCount) * 100;
      return Math.round(percentile * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating percentile:', error);
      return 0;
    }
  }

  /**
   * Calculate time bonus based on speed
   * Faster answers get more bonus points
   */
  private static calculateTimeBonus(
    totalTimeMs: number,
    totalQuestions: number,
    correctCount: number
  ): number {
    if (correctCount === 0) return 0; // No bonus if no correct answers

    const avgTimePerQuestion = totalTimeMs / totalQuestions;
    const maxTime = this.MAX_TIME_PER_QUESTION_MS;

    // If average time is less than max, award bonus
    if (avgTimePerQuestion < maxTime) {
      const timeRatio = 1 - avgTimePerQuestion / maxTime;
      const bonus = timeRatio * correctCount * this.BASE_POINTS * this.TIME_BONUS_MULTIPLIER;
      return Math.max(0, bonus);
    }

    return 0;
  }

  /**
   * Normalize an answer for comparison
   * Removes extra whitespace, converts to lowercase, removes punctuation
   */
  private static normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Determine difficulty achieved based on score and accuracy
   * Used for badge evaluation
   */
  static determineDifficultyAchieved(
    // score: number,
    accuracy: number,
    selectedDifficulty: LightningDifficulty
  ): LightningDifficulty {
    // If accuracy is very high (>90%), they achieved the selected difficulty
    if (accuracy >= 90) return selectedDifficulty;

    // Otherwise, downgrade based on accuracy
    if (accuracy >= 75) {
      // Achieved one level below selected
      const levels: LightningDifficulty[] = ['easy', 'intermediate', 'advanced', 'insane'];
      const index = levels.indexOf(selectedDifficulty);
      return (index > 0 ? levels[index - 1] : 'easy') as LightningDifficulty;
    }

    if (accuracy >= 60) {
      return 'intermediate';
    }

    return 'easy';
  }
}
