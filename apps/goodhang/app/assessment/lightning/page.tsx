/**
 * Lightning Round Assessment Page
 *
 * 2-minute rapid-fire question challenge.
 * Features:
 * - Auto-fetch questions on load
 * - One question at a time with auto-focus
 * - 2-minute countdown timer
 * - Real-time question counter
 * - Skip button (counts as incorrect)
 * - Auto-submit on timer expiration
 * - Results screen with score and percentile
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LightningTimer } from '@/components/assessment/LightningTimer';
import { LightningResults } from '@/components/assessment/LightningResults';
import type {
  LightningRoundQuestion,
  LightningRoundAnswer,
  StartLightningRoundResponse,
  SubmitLightningRoundResponse,
  LightningDifficulty,
} from '@/lib/assessment/types';

type GameState = 'loading' | 'playing' | 'submitting' | 'results';

export default function LightningRoundPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Question state
  const [questions, setQuestions] = useState<LightningRoundQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Timer state
  const [duration, setDuration] = useState(120); // 2 minutes in seconds

  // Answers tracking
  const [answers, setAnswers] = useState<LightningRoundAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Results state
  const [results, setResults] = useState<SubmitLightningRoundResponse | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/assessment/start');
          return;
        }

        // Get or create assessment session
        const { data: assessmentSession, error: sessionError } = await supabase
          .from('cs_assessment_sessions')
          .select('id')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sessionError || !assessmentSession) {
          console.error('Error fetching session:', sessionError);
          router.push('/assessment/start');
          return;
        }

        setSessionId(assessmentSession.id);

        // Start lightning round
        await startLightningRound(assessmentSession.id);
      } catch (error) {
        console.error('Error initializing session:', error);
        router.push('/assessment/start');
      }
    };

    initSession();
  }, [router]);

  // Auto-focus input when question changes
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex, gameState]);

  // Start lightning round - fetch questions
  const startLightningRound = async (sessionId: string) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/assessment/lightning/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          difficulty: 'intermediate' as LightningDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start lightning round');
      }

      const data: StartLightningRoundResponse = await response.json();

      setQuestions(data.questions);
      setDuration(data.duration_seconds);
      setQuestionStartTime(Date.now());
      setGameState('playing');
    } catch (error) {
      console.error('Error starting lightning round:', error);
      alert('Failed to start lightning round. Please try again.');
      router.push('/assessment/interview');
    }
  };

  // Handle answer submission (Next button)
  const handleNext = () => {
    if (!questions[currentQuestionIndex]) return;

    const timeTaken = Date.now() - questionStartTime;
    const answer: LightningRoundAnswer = {
      question_id: questions[currentQuestionIndex].id,
      answer: currentAnswer.trim(),
      time_taken_ms: timeTaken,
    };

    setAnswers((prev) => [...prev, answer]);
    setCurrentAnswer('');

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // All questions answered
      submitAnswers([...answers, answer]);
    }
  };

  // Handle skip (counts as incorrect)
  const handleSkip = () => {
    if (!questions[currentQuestionIndex]) return;

    const timeTaken = Date.now() - questionStartTime;
    const answer: LightningRoundAnswer = {
      question_id: questions[currentQuestionIndex].id,
      answer: '', // Empty answer = incorrect
      time_taken_ms: timeTaken,
    };

    setAnswers((prev) => [...prev, answer]);
    setCurrentAnswer('');

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // All questions answered
      submitAnswers([...answers, answer]);
    }
  };

  // Handle timer expiration
  const handleTimerExpire = () => {
    // Record current answer if any
    const currentAnswers = [...answers];

    if (currentAnswer.trim() && questions[currentQuestionIndex]) {
      const timeTaken = Date.now() - questionStartTime;
      currentAnswers.push({
        question_id: questions[currentQuestionIndex].id,
        answer: currentAnswer.trim(),
        time_taken_ms: timeTaken,
      });
    }

    // Mark remaining questions as unanswered
    const remainingQuestions = questions.slice(currentAnswers.length);
    const unansweredAnswers: LightningRoundAnswer[] = remainingQuestions.map((q) => ({
      question_id: q.id,
      answer: '',
      time_taken_ms: 0,
    }));

    submitAnswers([...currentAnswers, ...unansweredAnswers]);
  };

  // Submit all answers
  const submitAnswers = async (finalAnswers: LightningRoundAnswer[]) => {
    if (!sessionId) return;

    setGameState('submitting');

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/assessment/lightning/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }

      const data: SubmitLightningRoundResponse = await response.json();
      setResults(data);
      setGameState('results');
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert('Failed to submit answers. Please try again.');
      setGameState('playing');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentAnswer.trim()) {
      handleNext();
    }
  };

  // Loading state
  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4" />
          <p className="text-gray-300 text-lg">Loading Lightning Round...</p>
        </div>
      </div>
    );
  }

  // Submitting state
  if (gameState === 'submitting') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4" />
          <p className="text-gray-300 text-lg">Calculating your score...</p>
        </div>
      </div>
    );
  }

  // Results state
  if (gameState === 'results' && results) {
    return (
      <LightningResults
        score={results.score}
        accuracy={results.accuracy}
        percentile={results.percentile}
        difficultyAchieved={results.difficulty_achieved}
        questionsAnswered={results.questions_answered}
        totalQuestions={results.total_questions}
      />
    );
  }

  // Playing state
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-300">No questions available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with timer and progress */}
      <div className="border-b border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-6">
            {/* Question counter */}
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Lightning Round</div>
              <div className="text-2xl font-bold text-white">
                Question {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>

            {/* Timer */}
            <div>
              <LightningTimer duration={duration} onExpire={handleTimerExpire} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Question card */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Answer input */}
            <div className="mb-6">
              <input
                ref={inputRef}
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here..."
                className="w-full px-6 py-4 bg-black/50 border border-purple-500/30 rounded-lg text-white text-xl placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                autoComplete="off"
                autoFocus
              />
              <p className="text-gray-500 text-sm mt-2">
                Press Enter or click Next to submit
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-all duration-200 text-lg border border-gray-700"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-lg"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next →' : 'Finish'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tips footer */}
      <div className="border-t border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <p className="text-gray-400 text-sm">
            💡 Tip: Be concise. Speed matters, but accuracy matters more!
          </p>
        </div>
      </div>
    </div>
  );
}
