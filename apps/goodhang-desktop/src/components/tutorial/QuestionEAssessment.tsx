/**
 * Question E Assessment Component
 *
 * Typeform-style one-question-at-a-time UX for E01-E24 personality baseline questions.
 * Questions are filtered based on gap_final data (skips already-answered questions).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Brain,
  ArrowRight,
  Mic,
  MicOff,
} from 'lucide-react';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';
import {
  QUESTION_E_SECTIONS,
  getOutstandingQuestions,
  type GapFinalData,
  type QuestionESection,
} from '@/lib/question-e-data';

// =============================================================================
// TYPES
// =============================================================================

export interface QuestionEAssessmentProps {
  /** Gap final data to filter questions (if null, asks all questions) */
  gapFinalData?: GapFinalData | null;
  /** Callback when all questions are answered */
  onComplete: (answers: Record<string, string>) => void;
  /** Callback to skip Question E assessment entirely */
  onSkip?: () => void;
  /** Initial answers (for resuming) */
  initialAnswers?: Record<string, string>;
  /** Whether the component is loading */
  isLoading?: boolean;
}

interface AnswerState {
  [questionId: string]: string;
}

// Check if the "Other" option is selected (answer starts with "Other: " or is exactly "Other")
const isOtherSelected = (answer: string): boolean => {
  return answer === 'Other' || answer.startsWith('Other: ');
};

// Extract the custom text from an "Other" answer
const getOtherText = (answer: string): string => {
  if (answer.startsWith('Other: ')) {
    return answer.substring(7); // Remove "Other: " prefix
  }
  return '';
};

// =============================================================================
// COMPONENT
// =============================================================================

export function QuestionEAssessment({
  gapFinalData = null,
  onComplete,
  onSkip,
  initialAnswers = {},
  isLoading = false,
}: QuestionEAssessmentProps) {
  // Get outstanding questions based on gap_final
  const questions = useMemo(
    () => getOutstandingQuestions(gapFinalData),
    [gapFinalData]
  );

  // Note: sectionGroups could be used for section-based progress display
  // Currently using simple linear progress

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Speech-to-text
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ continuous: true, interimResults: true });

  // Current question
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';

  // Progress tracking
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(
    (id) => answers[id]?.trim()
  ).length;
  const isComplete = answeredCount >= totalQuestions;

  // If no questions to ask, complete immediately
  useEffect(() => {
    if (totalQuestions === 0 && !isLoading) {
      onComplete({});
    }
  }, [totalQuestions, isLoading, onComplete]);

  // Find current section for display
  const getCurrentSection = (): QuestionESection | null => {
    if (!currentQuestion) return null;
    return currentQuestion.section;
  };

  const currentSection = getCurrentSection();
  const sectionMeta = currentSection
    ? QUESTION_E_SECTIONS.find((s) => s.id === currentSection)
    : null;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion]
  );

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (!currentQuestion) return;

      // If selecting "Other", just mark it selected (don't auto-advance)
      if (option === 'Other') {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: 'Other',
        }));
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: option,
      }));
      // Auto-advance after option selection (except for "Other")
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          goToNext();
        }
      }, 300);
    },
    [currentQuestion, currentIndex, totalQuestions]
  );

  // Handle custom "Other" text input
  const handleOtherTextChange = useCallback(
    (text: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: text ? `Other: ${text}` : 'Other',
      }));
    },
    [currentQuestion]
  );

  const goToNext = useCallback(() => {
    if (currentIndex >= totalQuestions - 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 150);
  }, [currentIndex, totalQuestions]);

  const goToPrevious = useCallback(() => {
    if (currentIndex <= 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setIsTransitioning(false);
    }, 150);
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    onComplete(answers);
  }, [answers, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && currentAnswer.trim()) {
        e.preventDefault();
        if (currentIndex < totalQuestions - 1) {
          goToNext();
        } else if (isComplete) {
          handleSubmit();
        }
      }
    },
    [currentAnswer, currentIndex, totalQuestions, isComplete, goToNext, handleSubmit]
  );

  // Append speech transcript to current answer
  useEffect(() => {
    if (transcript && currentQuestion && !currentQuestion.options) {
      setAnswers((prev) => {
        const existing = prev[currentQuestion.id] || '';
        return {
          ...prev,
          [currentQuestion.id]: existing ? `${existing} ${transcript}` : transcript,
        };
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript, currentQuestion]);

  // Stop listening when navigating between questions
  useEffect(() => {
    if (isListening) {
      stopListening();
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading personality questions...</p>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <Brain className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          All questions answered!
        </h2>
        <p className="text-gray-400 text-center mb-6">
          The Sculptor session covered all personality baseline questions.
        </p>
        <button
          onClick={() => onComplete({})}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gh-dark-900 to-gh-dark-800">
      {/* Header with progress */}
      <div className="flex-none px-6 py-4 border-b border-gh-dark-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">
              Personality Baseline
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {totalQuestions}
            </span>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gh-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Section indicator */}
        {sectionMeta && (
          <div className="mt-3">
            <span className="text-xs text-purple-400 uppercase tracking-wide">
              {sectionMeta.title}
            </span>
          </div>
        )}
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isTransitioning ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              {/* Question text */}
              <h2 className="text-2xl font-semibold text-white mb-8 leading-relaxed">
                {currentQuestion.text}
              </h2>

              {/* Answer input or options */}
              {currentQuestion.options ? (
                // Multiple choice
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = option === 'Other'
                      ? isOtherSelected(currentAnswer)
                      : currentAnswer === option;

                    return (
                      <div key={idx}>
                        <button
                          onClick={() => handleOptionSelect(option)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/20 text-white'
                              : 'border-gh-dark-600 bg-gh-dark-800 text-gray-300 hover:border-purple-400 hover:bg-gh-dark-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-500'
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        </button>

                        {/* Show text input when "Other" is selected */}
                        {option === 'Other' && isOtherSelected(currentAnswer) && (
                          <div className="mt-2 ml-9">
                            <input
                              type="text"
                              value={getOtherText(currentAnswer)}
                              onChange={(e) => handleOtherTextChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && getOtherText(currentAnswer).trim()) {
                                  e.preventDefault();
                                  if (currentIndex < totalQuestions - 1) {
                                    goToNext();
                                  }
                                }
                              }}
                              placeholder="Please specify..."
                              className="w-full p-3 bg-gh-dark-800 border border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              autoFocus
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              Press Enter to continue
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Open-ended text area with mic
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={currentAnswer + (interimTranscript ? ` ${interimTranscript}` : '')}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer or use the microphone to dictate..."
                      className="w-full h-40 p-4 pr-14 bg-gh-dark-800 border border-gh-dark-600 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMicToggle}
                        className={`p-2 rounded-lg transition-all duration-200 border ${
                          isListening
                            ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                            : isSupported
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                            : 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isSupported}
                        title={isListening ? 'Stop recording' : 'Start dictation'}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {interimTranscript && (
                    <div className="px-3 py-2 bg-purple-900/40 border border-purple-500/30 rounded-lg text-sm text-purple-200">
                      <div className="text-xs text-purple-400 mb-1">Listening...</div>
                      {interimTranscript}
                    </div>
                  )}
                  {!isListening && (
                    <div className="text-xs text-gray-500 text-right">
                      Press Enter to continue
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="flex-none px-6 py-4 border-t border-gh-dark-700">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={goToNext}
              disabled={!currentAnswer.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isComplete}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionEAssessment;
