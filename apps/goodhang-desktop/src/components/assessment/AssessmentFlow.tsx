/**
 * Assessment Flow Component
 *
 * Reusable assessment UI that handles the full question flow.
 * Used by both GoodHang D&D assessment and Work Style assessment.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';
import { TEST_IDS, testId } from '@/lib/test-utils';
import { isDevMode } from '@/lib/api/client';
import { MOCK_ASSESSMENT_ANSWERS } from '@/lib/dev/constants';
import {
  flattenQuestions,
  isSectionCompleted,
  calculateProgress,
  type AssessmentConfig,
  type FlattenedQuestion,
} from '@/lib/types';
import { SectionTimeline } from './SectionTimeline';
import { QuestionCard } from './QuestionCard';
import { CompletionCard } from './CompletionCard';

// =============================================================================
// TYPES
// =============================================================================

interface AssessmentFlowProps {
  config: AssessmentConfig;
  onComplete: (answers: Record<string, string>) => Promise<void>;
  onExit: (answers: Record<string, string>, currentIndex: number) => void;
  /** Skip completion screen and auto-submit when last question is answered */
  autoSubmit?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AssessmentFlow({ config, onComplete, onExit, autoSubmit = false }: AssessmentFlowProps) {
  // Flatten questions for navigation (memoized to prevent re-creation on every render)
  const allQuestions = useMemo(() => flattenQuestions(config.sections), [config.sections]);
  const totalQuestions = allQuestions.length;

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Speech-to-text hook
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechToText({ continuous: true, interimResults: true });

  // Current question
  const currentQuestion = allQuestions[currentIndex] as FlattenedQuestion | undefined;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canProceed = currentQuestion?.isRanking
    ? currentAnswer.length > 0
    : currentAnswer.trim().length > 10;
  const progress = calculateProgress(answers, totalQuestions);

  // =============================================================================
  // PERSISTENCE
  // =============================================================================

  // Load saved progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(config.storageKey);
      if (saved) {
        const { answers: savedAnswers, currentIndex: savedIndex } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
          setCurrentIndex(savedIndex || 0);
          console.log(`[${config.storageKey}] Restored progress:`, Object.keys(savedAnswers).length, 'answers');
        }
      }
    } catch (err) {
      console.warn(`[${config.storageKey}] Failed to load saved progress:`, err);
    }
    setIsLoaded(true);
  }, [config.storageKey]);

  // Save progress on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        config.storageKey,
        JSON.stringify({
          answers,
          currentIndex,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn(`[${config.storageKey}] Failed to save progress:`, err);
    }
  }, [answers, currentIndex, isLoaded, config.storageKey]);

  // =============================================================================
  // SPEECH HANDLING
  // =============================================================================

  // Append transcript to current answer
  useEffect(() => {
    if (transcript && !currentQuestion?.isRanking) {
      setCurrentAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      resetTranscript();
    }
  }, [transcript, resetTranscript, currentQuestion?.isRanking]);

  // Load existing answer when navigating
  useEffect(() => {
    if (!currentQuestion) return;
    const existing = answers[currentQuestion.id];
    setCurrentAnswer(
      existing ||
        (currentQuestion.isRanking
          ? currentQuestion.options?.map((o, i) => `${i + 1}. ${o}`).join('\n') || ''
          : '')
    );
  }, [currentIndex, currentQuestion, answers]);

  // =============================================================================
  // LOADING MESSAGES
  // =============================================================================

  useEffect(() => {
    if (isCompleting) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % config.loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isCompleting, config.loadingMessages.length]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const saveCurrentAnswer = useCallback(() => {
    if (!currentQuestion) return;
    if (currentAnswer.trim()) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.trim(),
      }));
    }
  }, [currentAnswer, currentQuestion]);

  const handleExit = useCallback(() => {
    if (!currentQuestion) {
      onExit(answers, currentIndex);
      return;
    }
    if (currentAnswer.trim()) {
      const updatedAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer.trim(),
      };
      try {
        localStorage.setItem(
          config.storageKey,
          JSON.stringify({
            answers: updatedAnswers,
            currentIndex,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.warn(`[${config.storageKey}] Failed to save on exit:`, err);
      }
      onExit(updatedAnswers, currentIndex);
    } else {
      onExit(answers, currentIndex);
    }
  }, [answers, currentAnswer, currentQuestion, currentIndex, onExit, config.storageKey]);

  const handleNext = async () => {
    if (!canProceed || !currentQuestion) return;

    setIsSubmitting(true);
    saveCurrentAnswer();

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (isLastQuestion) {
      const finalAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer.trim(),
      };
      setAnswers(finalAnswers);

      // If autoSubmit, skip completion screen and call onComplete directly
      if (autoSubmit) {
        setIsSubmitting(false);
        await onComplete(finalAnswers);
        return;
      }

      setShowCompletion(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }

    setIsSubmitting(false);
  };

  const handleBack = () => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      handleExit();
    }
  };

  const handleSectionNavigate = (sectionIndex: number) => {
    const targetQuestionIndex = allQuestions.findIndex((q) => q.sectionIndex === sectionIndex);
    if (targetQuestionIndex >= 0) {
      saveCurrentAnswer();
      setCurrentIndex(targetQuestionIndex);
    }
  };

  const handleComplete = async () => {
    // Prevent double-clicks - if already completing, bail out
    if (isCompleting) return;

    setIsCompleting(true);
    setError(null);

    try {
      await onComplete(answers);
      localStorage.removeItem(config.storageKey);
      // Note: onComplete should navigate away, so we don't need to reset isCompleting on success
    } catch (err) {
      console.error(`[${config.storageKey}] Error:`, err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCompleting(false);
    }
  };

  const checkSectionCompleted = useCallback(
    (sectionIndex: number) => {
      const section = config.sections[sectionIndex];
      return section ? isSectionCompleted(section, answers) : false;
    },
    [config.sections, answers]
  );

  // Dev mode: fill all answers with mock data
  const handleFillMockAnswers = useCallback(() => {
    const mockAnswers: Record<string, string> = {};
    allQuestions.forEach((q) => {
      if (MOCK_ASSESSMENT_ANSWERS[q.id]) {
        mockAnswers[q.id] = MOCK_ASSESSMENT_ANSWERS[q.id];
      }
    });
    setAnswers(mockAnswers);
    setCurrentIndex(totalQuestions - 1);
    setShowCompletion(true);
    console.log('[dev] Filled mock answers:', Object.keys(mockAnswers).length);
  }, [allQuestions, totalQuestions]);

  // =============================================================================
  // LOADING SCREEN
  // =============================================================================

  if (isCompleting) {
    return (
      <div {...testId(TEST_IDS.assessment.loadingScreen)} className="flex flex-col h-screen-titlebar bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className={`animate-spin rounded-full h-16 w-16 border-b-2 ${
                config.themeColor === 'purple' ? 'border-purple-500' : 'border-blue-500'
              } mx-auto mb-6`}
            />
            <h2
              {...testId(TEST_IDS.assessment.loadingMessage)}
              className={`text-2xl font-semibold mb-4 bg-gradient-to-r ${
                config.themeColor === 'purple'
                  ? 'from-purple-400 to-blue-400'
                  : 'from-blue-400 to-purple-400'
              } bg-clip-text text-transparent`}
            >
              {config.loadingMessages[loadingMessageIndex]}
            </h2>
            <p className="text-gray-400 text-sm">This usually takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // NO QUESTION FALLBACK
  // =============================================================================

  if (!currentQuestion) {
    return (
      <div className="flex flex-col h-screen-titlebar bg-black items-center justify-center">
        <p className="text-gray-400">Loading questions...</p>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const borderColor = config.themeColor === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30';
  const textColor = config.themeColor === 'purple' ? 'text-purple-400' : 'text-blue-400';
  const gradientColor =
    config.themeColor === 'purple'
      ? 'from-purple-600 to-blue-600'
      : 'from-blue-600 to-purple-600';

  return (
    <div {...testId(TEST_IDS.assessment.container)} className="flex flex-col h-screen-titlebar bg-black text-white">
      {/* Header with Progress */}
      <div className={`border-b ${borderColor} bg-gray-900/95 relative`}>
        {/* Exit button */}
        <button
          {...testId(TEST_IDS.assessment.exitBtn)}
          onClick={handleExit}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 border border-gray-700 hover:border-gray-600"
          title="Save & Exit"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dev mode: Fill Mock Answers button */}
        {isDevMode() && (
          <button
            onClick={handleFillMockAnswers}
            className="absolute top-4 right-16 z-10 px-3 py-2 rounded-full bg-yellow-600/80 hover:bg-yellow-500 text-white text-xs font-medium transition-all duration-200 border border-yellow-500 flex items-center gap-1"
            title="Fill with mock answers (Dev Mode)"
          >
            <Zap className="w-4 h-4" />
            Mock Fill
          </button>
        )}

        {/* Section Timeline */}
        <SectionTimeline
          sections={config.sections}
          currentSectionIndex={currentQuestion.sectionIndex}
          isSectionCompleted={checkSectionCompleted}
          onSectionNavigate={handleSectionNavigate}
          themeColor={config.themeColor}
        />

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{currentQuestion.sectionTitle}</span>
              <button
                {...testId(TEST_IDS.assessment.saveExitBtn)}
                onClick={handleExit}
                className={`text-xs ${textColor} hover:opacity-80 transition-colors`}
              >
                Save & Exit
              </button>
            </div>
            <span {...testId(TEST_IDS.assessment.progressText)} className={`text-sm ${textColor}`}>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              {...testId(TEST_IDS.assessment.progressBar)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`bg-gradient-to-r ${gradientColor} h-2 transition-all duration-300`}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-8 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!showCompletion ? (
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                onAnswerChange={setCurrentAnswer}
                interimTranscript={interimTranscript}
                isListening={isListening}
                isSupported={isSupported}
                isSubmitting={isSubmitting}
                canProceed={canProceed}
                isLastQuestion={isLastQuestion}
                currentIndex={currentIndex}
                onMicToggle={handleMicToggle}
                onBack={handleBack}
                onNext={handleNext}
                error={error || speechError}
                themeColor={config.themeColor}
              />
            ) : (
              <CompletionCard
                title={config.completionTitle}
                description={config.completionDescription}
                submitButtonText={config.submitButtonText}
                onReview={() => setShowCompletion(false)}
                onComplete={handleComplete}
                themeColor={config.themeColor}
                isLoading={isCompleting}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default AssessmentFlow;
