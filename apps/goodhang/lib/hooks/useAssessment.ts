/**
 * useAssessment Hook
 *
 * Manages CS Assessment workflow state:
 * - Starting assessment
 * - Navigating questions
 * - Submitting answers
 * - Completing and scoring
 * - Retrieving results
 *
 * Updated to use local GoodHang APIs instead of Renubu
 */

import { useState, useCallback } from 'react';
import type {
  AssessmentConfig,
  AssessmentQuestion,
  AssessmentSection,
  AssessmentResults,
} from '@/lib/assessment/types';

export interface AssessmentAnswer {
  question_id: string;
  question_text: string;
  answer: string;
}

export type AssessmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitting_answer'
  | 'completing'
  | 'completed'
  | 'error';

export interface UseAssessmentReturn {
  // State
  status: AssessmentStatus;
  sessionId: string | null;
  assessment: AssessmentConfig | null;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: AssessmentAnswer[];
  results: AssessmentResults | null;
  error: string | null;

  // Computed
  currentSection: AssessmentSection | null;
  currentQuestion: AssessmentQuestion | null;
  progress: number; // 0-100
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Actions
  start: () => Promise<void>;
  answerQuestion: (answer: string) => Promise<void>;
  goToNext: () => void;
  goToPrevious: () => void;
  complete: () => Promise<void>;
  loadResults: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export function useAssessment(): UseAssessmentReturn {
  const [status, setStatus] = useState<AssessmentStatus>('not_started');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentConfig | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const currentSection = assessment?.sections[currentSectionIndex] || null;
  const currentQuestion = currentSection?.questions[currentQuestionIndex] || null;

  const totalQuestions = assessment?.sections.reduce((sum, s) => sum + s.questions.length, 0) || 0;
  const answeredCount = answers.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion =
    assessment !== null &&
    currentSectionIndex === assessment.sections.length - 1 &&
    currentQuestion !== null &&
    currentQuestionIndex === currentSection!.questions.length - 1;

  const hasAnsweredCurrent = currentQuestion
    ? answers.some((a) => a.question_id === currentQuestion.id)
    : false;

  const canGoNext = hasAnsweredCurrent && !isLastQuestion;
  const canGoPrevious = !isFirstQuestion && status === 'in_progress';

  // Start assessment (or resume if in-progress session exists)
  const start = useCallback(async () => {
    try {
      setStatus('in_progress');
      setError(null);

      const response = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start assessment');
      }

      const data = await response.json();

      setSessionId(data.session_id);
      setAssessment(data.assessment);
      setCurrentSectionIndex(data.current_section_index || 0);
      setCurrentQuestionIndex(data.current_question_index || 0);

      // If resuming, we don't have the answers array - that's okay
      // They're stored in the database transcript
      if (!data.resume) {
        setAnswers([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start assessment';
      setStatus('error');
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Answer current question
  const answerQuestion = useCallback(
    async (answer: string) => {
      if (!sessionId || !currentQuestion) {
        throw new Error('No active assessment');
      }

      try {
        setStatus('submitting_answer');
        setError(null);

        const response = await fetch(`/api/assessment/${sessionId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            question_text: currentQuestion.text,
            answer,
            section_index: currentSectionIndex,
            question_index: currentQuestionIndex,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to submit answer');
        }

        // Update local answers
        setAnswers((prev) => {
          // Remove existing answer for this question if any
          const filtered = prev.filter((a) => a.question_id !== currentQuestion.id);
          return [
            ...filtered,
            {
              question_id: currentQuestion.id,
              question_text: currentQuestion.text,
              answer,
            },
          ];
        });

        setStatus('in_progress');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
        setStatus('error');
        setError(errorMessage);
        throw err;
      }
    },
    [sessionId, currentQuestion, currentSectionIndex, currentQuestionIndex]
  );

  // Navigate to next question
  const goToNext = useCallback(() => {
    if (!assessment || !currentSection) return;

    // If there are more questions in current section
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
    // Move to next section
    else if (currentSectionIndex < assessment.sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [assessment, currentSection, currentSectionIndex, currentQuestionIndex]);

  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    if (!assessment) return;

    // If not first question in section
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
    // Move to previous section
    else if (currentSectionIndex > 0) {
      const prevSectionIndex = currentSectionIndex - 1;
      const prevSection = assessment.sections[prevSectionIndex];
      if (prevSection) {
      setCurrentSectionIndex(prevSectionIndex);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
      }
  }, [assessment, currentSectionIndex, currentQuestionIndex]);

  // Complete assessment and trigger scoring
  const complete = useCallback(async () => {
    if (!sessionId) {
      throw new Error('No active assessment');
    }

    try {
      setStatus('completing');
      setError(null);

      const response = await fetch(`/api/assessment/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete assessment');
      }

      await response.json();

      setStatus('completed');

      // Load full results
      const resultsResponse = await fetch(`/api/assessment/${sessionId}/results`);

      if (!resultsResponse.ok) {
        const error = await resultsResponse.json();
        throw new Error(error.error || 'Failed to load results');
      }

      const fullResults = await resultsResponse.json();
      setResults(fullResults);

      // TODO: Send email notifications (implement later if needed)
      // For now, just complete the assessment
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete assessment';
      setStatus('error');
      setError(errorMessage);
      throw err;
    }
  }, [sessionId]);

  // Load results for existing assessment
  const loadResults = useCallback(async (sessionId: string) => {
    try {
      setStatus('in_progress');
      setError(null);

      const response = await fetch(`/api/assessment/${sessionId}/results`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load results');
      }

      const results = await response.json();

      setSessionId(sessionId);
      setResults(results);
      setStatus('completed');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
      setStatus('error');
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setStatus('not_started');
    setSessionId(null);
    setAssessment(null);
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResults(null);
    setError(null);
  }, []);

  return {
    // State
    status,
    sessionId,
    assessment,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    results,
    error,

    // Computed
    currentSection,
    currentQuestion,
    progress,
    isFirstQuestion,
    isLastQuestion,
    canGoNext,
    canGoPrevious,

    // Actions
    start,
    answerQuestion,
    goToNext,
    goToPrevious,
    complete,
    loadResults,
    reset,
  };
}
