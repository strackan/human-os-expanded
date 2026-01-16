/**
 * Good Hang D&D Assessment
 *
 * Interview-style assessment with 10 personality questions.
 * Matches the existing interview format with:
 * - Section timeline showing progress
 * - Voice dictation support
 * - Progress bar with percentage
 * - Previous/Next navigation
 * - Completion card at the end
 * - Submits to scoring API
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Mic, MicOff, Check, X } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';

const STORAGE_KEY = 'goodhang-dnd-assessment-progress';

// Assessment sections with questions
const SECTIONS = [
  {
    id: 'your-story',
    title: 'Your Story',
    transitionMessage: "Let's start with some moments that have shaped who you are.",
    questions: [
      {
        id: 'a1-turning-point',
        text: 'Describe a moment or experience that fundamentally changed who you are or how you see the world.',
        followUp: 'Be specific about what happened and how it changed you.',
      },
      {
        id: 'a2-happiest-memory',
        text: 'Tell me about your single happiest memory.',
        followUp: 'What made this moment so special?',
      },
      {
        id: 'a3-difficult-time',
        text: 'Tell me about a difficult time in your life and how you got through it.',
        followUp: 'What did you learn about yourself?',
      },
      {
        id: 'a4-redemption',
        text: 'Tell me about something bad that happened to you that ultimately led to something good.',
        followUp: 'How did the transformation happen?',
      },
    ],
  },
  {
    id: 'who-you-are',
    title: 'Who You Are',
    transitionMessage: "Now let's explore your core identity and values.",
    questions: [
      {
        id: 'b1-failed-someone',
        text: 'Tell me about a time you failed someone you care about.',
        followUp: 'How did it affect your relationship?',
      },
      {
        id: 'b2-core-identity',
        text: "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?",
        followUp: 'What defines you beyond external factors?',
      },
      {
        id: 'b3-simple-thing',
        text: "What's a simple thing that matters a lot to you?",
        followUp: 'Why does this resonate so deeply?',
      },
    ],
  },
  {
    id: 'how-you-connect',
    title: 'How You Connect',
    transitionMessage: "Finally, let's understand how you relate to others.",
    questions: [
      {
        id: 'c1-relationship-need',
        text: 'What do you need from close relationships that you rarely ask for directly?',
        followUp: "What makes it hard to ask?",
      },
      {
        id: 'c2-intellectual-gap',
        text: "What's something you believe in intellectually but can't fully commit to in practice?",
        followUp: 'What holds you back?',
      },
      {
        id: 'c3-happiness-barrier',
        text: "What's really keeping you from being happy?",
        followUp: 'Be honest with yourself.',
      },
    ],
  },
];

// Flatten questions for easy navigation
const ALL_QUESTIONS = SECTIONS.flatMap((section, sectionIndex) =>
  section.questions.map((q, questionIndex) => ({
    ...q,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIndex,
    questionIndexInSection: questionIndex,
    transitionMessage: questionIndex === 0 ? section.transitionMessage : undefined,
  }))
);

const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

export default function GoodHangAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, userId } = useAuthStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const returnPath = searchParams.get('return') || '/founder-os/tutorial';
  const currentQuestion = ALL_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1;
  const canProceed = currentAnswer.trim().length > 10;
  const progress = ((Object.keys(answers).length) / TOTAL_QUESTIONS) * 100;

  const loadingMessages = [
    "Analyzing your responses...",
    "Calculating your archetype...",
    "Mapping personality dimensions...",
    "Generating your D&D profile...",
  ];

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { answers: savedAnswers, currentIndex: savedIndex } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
          setCurrentIndex(savedIndex || 0);
          console.log('[Assessment] Restored progress:', Object.keys(savedAnswers).length, 'answers');
        }
      }
    } catch (err) {
      console.warn('[Assessment] Failed to load saved progress:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever answers change
  useEffect(() => {
    if (!isLoaded) return; // Don't save until we've loaded
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        currentIndex,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[Assessment] Failed to save progress:', err);
    }
  }, [answers, currentIndex, isLoaded]);

  // Append transcript to current answer when dictation completes
  useEffect(() => {
    if (transcript) {
      setCurrentAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Load existing answer when navigating to a question
  useEffect(() => {
    const existing = answers[currentQuestion.id];
    setCurrentAnswer(existing || '');
  }, [currentIndex, currentQuestion.id, answers]);

  // Rotate loading messages during completion
  useEffect(() => {
    if (isCompleting) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isCompleting, loadingMessages.length]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const saveCurrentAnswer = useCallback(() => {
    if (currentAnswer.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.trim(),
      }));
    }
  }, [currentAnswer, currentQuestion.id]);

  // Save progress and exit
  const handleExit = useCallback(() => {
    // Save current answer before exiting
    if (currentAnswer.trim()) {
      const updatedAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer.trim(),
      };
      // Save to localStorage before navigating
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          answers: updatedAnswers,
          currentIndex,
          updatedAt: new Date().toISOString(),
        }));
        console.log('[Assessment] Saved progress before exit:', Object.keys(updatedAnswers).length, 'answers');
      } catch (err) {
        console.warn('[Assessment] Failed to save on exit:', err);
      }
    }
    navigate(returnPath);
  }, [answers, currentAnswer, currentQuestion.id, currentIndex, navigate, returnPath]);

  const handleNext = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    saveCurrentAnswer();

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 200));

    if (isLastQuestion) {
      // Save answer and show completion card
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.trim(),
      }));
      setShowCompletion(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }

    setIsSubmitting(false);
  };

  const handleBack = () => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      navigate(returnPath);
    }
  };

  const handleSectionNavigate = (sectionIndex: number) => {
    // Find the first question in the target section
    const targetQuestionIndex = ALL_QUESTIONS.findIndex(
      q => q.sectionIndex === sectionIndex
    );
    if (targetQuestionIndex >= 0) {
      saveCurrentAnswer();
      setCurrentIndex(targetQuestionIndex);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      // Build transcript in the format the scoring API expects
      const transcript = ALL_QUESTIONS.flatMap(q => [
        { role: 'assistant', content: q.text },
        { role: 'user', content: answers[q.id] || '' },
      ]);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';

      const response = await fetch(`${baseUrl}/api/assessment/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          transcript,
          source: 'desktop_app',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to score assessment');
      }

      const result = await response.json();
      console.log('[Assessment] Scored:', result);

      // Clear saved progress on successful completion
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Assessment] Cleared saved progress after completion');

      // Return to tutorial - the character tab should now show results
      navigate(returnPath, { replace: true });
    } catch (err) {
      console.error('[Assessment] Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCompleting(false);
    }
  };

  // Check if a section is completed
  const isSectionCompleted = (sectionIndex: number) => {
    const section = SECTIONS[sectionIndex];
    return section.questions.every(q => !!answers[q.id]);
  };

  // Completing screen
  if (isCompleting) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {loadingMessages[loadingMessageIndex]}
            </h2>
            <p className="text-gray-400 text-sm">
              This usually takes 5-10 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Progress Bar & Section Timeline */}
      <div className="border-b border-purple-500/30 bg-gray-900/95 relative">
        {/* Close Button - Modal Style */}
        <button
          onClick={handleExit}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 border border-gray-700 hover:border-gray-600"
          title="Save & Exit"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Section Timeline */}
        <div className="flex justify-center items-center gap-3 py-4 px-4 pr-16 border-b border-purple-500/20 bg-gray-900/50">
          {SECTIONS.map((section, index) => {
            const isCompleted = isSectionCompleted(index);
            const isActive = currentQuestion.sectionIndex === index;
            const isPast = index < currentQuestion.sectionIndex;

            return (
              <button
                key={section.id}
                onClick={() => handleSectionNavigate(index)}
                disabled={!isPast && !isActive && !isCompleted}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  disabled:cursor-not-allowed
                  ${isActive && 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'}
                  ${!isActive && isCompleted && 'bg-green-600/20 text-green-400 hover:bg-green-600/30'}
                  ${!isActive && !isCompleted && isPast && 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                  ${!isActive && !isCompleted && !isPast && 'bg-gray-800 text-gray-500'}
                `}
              >
                {isCompleted && !isActive && <Check className="w-3 h-3 inline mr-1" />}
                {section.title}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{currentQuestion.sectionTitle}</span>
              <button
                onClick={handleExit}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Save & Exit
              </button>
            </div>
            <span className="text-sm text-purple-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-8 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!showCompletion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Section Transition Message */}
                {currentQuestion.transitionMessage && (
                  <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-purple-300">{currentQuestion.transitionMessage}</p>
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
                        value={currentAnswer + (interimTranscript ? ` ${interimTranscript}` : '')}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here or use the microphone to dictate..."
                        rows={8}
                        className="w-full px-4 py-3 pr-14 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        autoFocus
                      />
                      <div className="absolute bottom-3 right-3">
                        <button
                          type="button"
                          onClick={handleMicToggle}
                          disabled={isSubmitting}
                          className={`
                            p-2 rounded-lg transition-all duration-200 border
                            ${isListening
                              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                              : isSupported
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                              : 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                          title={isListening ? 'Stop recording' : 'Start dictation'}
                        >
                          {isListening ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Interim transcript preview */}
                    {interimTranscript && (
                      <div className="px-3 py-2 bg-purple-900/40 border border-purple-500/30 rounded-lg text-sm text-purple-200">
                        <div className="text-xs text-purple-400 mb-1">Listening...</div>
                        {interimTranscript}
                      </div>
                    )}

                    {/* Character count hint */}
                    <p className="text-xs text-gray-500">
                      {currentAnswer.length < 10
                        ? 'Write at least a few sentences'
                        : `${currentAnswer.length} characters`}
                    </p>

                    {(error || speechError) && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-400 text-sm">{error || speechError}</p>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {currentIndex === 0 ? 'Cancel' : 'Previous'}
                      </button>

                      <button
                        onClick={handleNext}
                        disabled={!canProceed || isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : isLastQuestion ? (
                          'Save Answer'
                        ) : (
                          <>
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Completion Card */
              <motion.div
                key="completion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8 text-center"
              >
                <h3 className="text-2xl font-semibold text-white mb-4">
                  You've completed all questions!
                </h3>
                <p className="text-gray-300 mb-6">
                  Click below to submit your assessment and generate your D&D character profile.
                  Our AI will analyze your responses and map your personality to a unique race,
                  class, and alignment.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowCompletion(false)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Review Answers
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/50 text-lg"
                  >
                    Submit & Generate Profile
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
