'use client';

/**
 * CS Assessment Interview Page
 *
 * Main interview interface where members answer questions
 * - Displays current question
 * - Shows progress
 * - Handles navigation
 * - Submits answers
 * - Voice dictation support
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/hooks/useAssessment';
import { MicrophoneButton } from '@/components/assessment/MicrophoneButton';
import { SectionTimeline } from '@/components/assessment/SectionTimeline';

export default function AssessmentInterviewPage() {
  const router = useRouter();
  const {
    status,
    currentQuestion,
    currentSection,
    currentSectionIndex,
    assessment,
    progress,
    isFirstQuestion,
    isLastQuestion,
    canGoNext,
    canGoPrevious,
    answers,
    sessionId,
    start,
    answerQuestion,
    goToNext,
    goToPrevious,
    complete,
    error,
  } = useAssessment();

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [currentSectionIndexState, setCurrentSectionIndexState] = useState(0);

  const loadingMessages = [
    "Analyzing your responses...",
    "Calculating your archetype...",
    "Evaluating your scores across 12 dimensions...",
    "Preparing your results...",
  ];

  const handleNavigateToSection = (sectionIndex: number) => {
    setCurrentSectionIndexState(sectionIndex);
    // The actual navigation is handled by the useAssessment hook
  };

  // Auto-start assessment if not started
  useEffect(() => {
    if (status === 'not_started') {
      start().catch((err) => {
        console.error('Failed to start assessment:', err);
        // If start fails, redirect to start page
        router.push('/assessment/start');
      });
    }
  }, [status, start, router]);

  // Load existing answer if revisiting question
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.find((a) => a.question_id === currentQuestion.id);
      setCurrentAnswer(existingAnswer?.answer || '');
    }
  }, [currentQuestion, answers]);

  // Redirect to results when completed
  useEffect(() => {
    if (status === 'completed' && sessionId) {
      router.push(`/assessment/results/${sessionId}`);
    }
  }, [status, sessionId, router]);

  // Rotate loading messages while completing
  useEffect(() => {
    if (status === 'completing') {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(interval);
    }
  }, [status, loadingMessages.length]);

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    try {
      await answerQuestion(currentAnswer);

      // After submitting, don't auto-navigate on last question
      // This will trigger the completion card to show
      if (!isLastQuestion) {
        goToNext();
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await complete();
    } catch (err) {
      console.error('Failed to complete assessment:', err);
    }
  };

  const isLoading = status === 'submitting_answer' || status === 'completing';
  const hasAnsweredCurrent = currentQuestion
    ? answers.some((a) => a.question_id === currentQuestion.id)
    : false;

  // Show loading screen while completing assessment
  if (status === 'completing') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {loadingMessages[loadingMessageIndex]}
          </h2>
          <p className="text-gray-400 text-sm">
            This usually takes 5-10 seconds
          </p>
          {/* TODO (v1.1): Replace with interactive GoodHang tour */}
        </div>
      </div>
    );
  }

  if (!currentQuestion || !currentSection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/30">
        {/* Section Timeline */}
        {assessment && (
          <SectionTimeline
            sections={assessment.sections}
            currentSectionIndex={currentSectionIndex}
            answers={answers}
            onNavigate={handleNavigateToSection}
          />
        )}

        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{currentSection.title}</span>
              <button
                onClick={() => router.push('/members')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Save & Exit to Members Area
              </button>
            </div>
            <span className="text-sm text-purple-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Transition Message */}
          {currentSection.transitionMessage && (
            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-purple-300">{currentSection.transitionMessage}</p>
            </div>
          )}

          {/* Question Card */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
                {currentQuestion.text}
              </h2>
              {currentQuestion.followUp && (
                <p className="text-gray-400 text-sm italic">{currentQuestion.followUp}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here or use the microphone to dictate..."
                  rows={8}
                  className="w-full px-4 py-3 pr-14 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <MicrophoneButton
                    value={currentAnswer}
                    onChange={setCurrentAnswer}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  disabled={!canGoPrevious || isLoading}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  ← Previous
                </button>

                {!isLastQuestion ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                  >
                    {isLoading ? 'Saving...' : 'Next →'}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                  >
                    {isLoading ? 'Saving...' : 'Save Answer'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Complete Button (shown after last question answered) */}
          {isLastQuestion && hasAnsweredCurrent && (
            <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-semibold text-white mb-4">
                You've completed all questions!
              </h3>
              <p className="text-gray-300 mb-6">
                Click below to submit your assessment and see your results. Our AI will analyze your
                responses and provide personalized insights.
              </p>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/50 text-lg"
              >
                {status === 'completing' ? 'Analyzing Your Responses...' : 'Submit & See Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
