/**
 * Founder OS Work Style Assessment
 *
 * Interview-style assessment with 10 onboarding questions.
 * Simplified wrapper using the shared AssessmentFlow component.
 *
 * After all questions are answered, the LLM reviews answers as a set.
 * If C+ quality, accepts them. Only asks clarifications if genuinely needed.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth';
import { AssessmentFlow } from '@/components/assessment';
import { post } from '@/lib/api';
import type { AssessmentConfig, AssessmentSection } from '@/lib/types';
import { Loader2, Send, Mic } from 'lucide-react';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'founder-os-work-style-progress';

const SECTIONS: AssessmentSection[] = [
  {
    id: 'performance',
    title: 'Performance',
    transitionMessage: "Let's start with understanding when you're at your best and worst.",
    questions: [
      {
        id: 'peak-performance',
        text: "Tell me about when you're at your best. Time of day, environment, conditions - what does that look like? And the flip side - when are you at your worst?",
        followUp: 'Be specific about the conditions that help or hurt your performance.',
      },
      {
        id: 'struggle-signals',
        text: "What does it look like when you're overwhelmed, stuck, or avoiding something? How does that spiral usually start for you?",
        followUp: 'Understanding your patterns helps us catch them early.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    transitionMessage: "Now let's understand what helps when things get tough.",
    questions: [
      {
        id: 'recovery-support',
        text: 'When things get hard, what actually helps? What makes it worse? What kind of support do you want from the people around you?',
        followUp: 'Think about specific examples of helpful vs unhelpful support.',
      },
      {
        id: 'decisions-priorities',
        text: 'How do you like decisions and priorities presented to you? Do you want options, a recommendation, or just the call made? What kinds of decisions drain you versus energize you?',
        followUp: 'Consider both big strategic decisions and small daily ones.',
      },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    transitionMessage: "Let's talk about how you work with others.",
    questions: [
      {
        id: 'feedback-leadership',
        text: 'How do you prefer to give and receive feedback? As a leader, do you share everything with your team or filter to protect focus?',
        followUp: 'What works and what definitely does not?',
      },
      {
        id: 'social-rapport',
        text: 'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
        followUp: 'This helps calibrate tone and rapport.',
      },
      {
        id: 'challenge-style',
        text: 'How do you prefer to be disagreed with or challenged? When do you appreciate someone standing their ground vs it feeling confrontational?',
        followUp: 'Think about examples of pushback that landed well vs poorly.',
      },
    ],
  },
  {
    id: 'ai-preferences',
    title: 'AI Preferences',
    transitionMessage: "Finally, let's customize how your AI assistant should work with you.",
    questions: [
      {
        id: 'ideal-ai',
        text: 'If you could build an ideal AI assistant - what would be the 3-4 most important considerations?',
        followUp: 'Think about what would make it actually useful vs annoying.',
      },
      {
        id: 'ai-role-ranking',
        text: 'Rank these AI assistant roles in order of most desirable to you:',
        followUp: 'Drag to reorder, or type your ranking.',
        isRanking: true,
        options: [
          'Strategic Thought Partner',
          'Deferential Assistant',
          'Coach & Accountability Partner',
          'Friend & Confidante',
        ],
      },
      {
        id: 'anything-else',
        text: "Is there anything else you'd like me to know or take into account before creating your assistant?",
        followUp: "This is your chance to add anything we haven't covered.",
      },
    ],
  },
];

const LOADING_MESSAGES = [
  "Processing your answers...",
  "Building your work style profile...",
  "Configuring your AI assistant...",
  "Finalizing your Founder OS...",
];

const ASSESSMENT_CONFIG: AssessmentConfig = {
  storageKey: STORAGE_KEY,
  sections: SECTIONS,
  loadingMessages: LOADING_MESSAGES,
  themeColor: 'blue',
  title: 'Work Style Assessment',
  subtitle: 'Founder OS Setup',
  completionTitle: "You've completed all questions!",
  completionDescription:
    "Click below to finalize your work style profile and configure your Founder OS assistant.",
  submitButtonText: 'Complete Setup',
};

// =============================================================================
// TYPES
// =============================================================================

interface ReviewResponse {
  accepted: boolean;
  clarification?: {
    context: string;
    question: string;
    relatedQuestionIds: string[];
  };
  message?: string;
}

interface ClarificationState {
  question: string;
  answers: Record<string, string>;
  previousClarifications: { question: string; response: string }[];
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function WorkStyleAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();

  const returnPath = searchParams.get('return') || '/founder-os/tutorial';
  const sessionId = searchParams.get('session');

  // Review/clarification state
  const [isReviewing, setIsReviewing] = useState(false);
  const [clarificationState, setClarificationState] = useState<ClarificationState | null>(null);
  const [clarificationInput, setClarificationInput] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  // Speech-to-text for clarification input
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ continuous: true, interimResults: true });

  // Append transcript to clarification input
  useEffect(() => {
    if (transcript && clarificationState) {
      setClarificationInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      resetTranscript();
    }
  }, [transcript, clarificationState, resetTranscript]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Review answers with LLM before saving
  const reviewAnswers = async (
    answers: Record<string, string>,
    previousClarifications?: { question: string; response: string }[]
  ): Promise<ReviewResponse> => {
    const response = await post<ReviewResponse>(
      '/api/tutorial/review-answers',
      {
        session_id: sessionId,
        answers,
        previous_clarifications: previousClarifications,
      },
      token
    );
    return response;
  };

  // Save answers to database
  const saveAnswers = async (
    answers: Record<string, string>,
    clarifications?: { question: string; response: string }[]
  ) => {
    await post(
      `/api/sculptor/sessions/${sessionId}/answers`,
      {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer,
        })),
        source: 'work_style_assessment',
        clarifications,
      },
      token
    );
  };

  const handleComplete = async (answers: Record<string, string>) => {
    setIsReviewing(true);

    try {
      // Review answers with LLM
      const reviewResult = await reviewAnswers(answers);

      if (reviewResult.accepted) {
        // Answers accepted - save and proceed
        await saveAnswers(answers);
        console.log('[WorkStyle] Answers accepted and saved');
        localStorage.setItem('founder-os-work-style-completed', new Date().toISOString());
        navigate(returnPath, { replace: true });
      } else {
        // LLM wants clarification
        console.log('[WorkStyle] LLM requested clarification:', reviewResult.clarification);
        setClarificationState({
          question: reviewResult.clarification?.question || reviewResult.message || 'Could you clarify?',
          answers,
          previousClarifications: [],
        });
        setIsReviewing(false);
      }
    } catch (error) {
      console.error('[WorkStyle] Review failed, saving anyway:', error);
      // If review fails, just save the answers
      await saveAnswers(answers);
      localStorage.setItem('founder-os-work-style-completed', new Date().toISOString());
      navigate(returnPath, { replace: true });
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationInput.trim() || !clarificationState) return;

    setIsSubmittingClarification(true);

    try {
      const newClarifications = [
        ...clarificationState.previousClarifications,
        { question: clarificationState.question, response: clarificationInput.trim() },
      ];

      // Review again with clarification
      const reviewResult = await reviewAnswers(
        clarificationState.answers,
        newClarifications
      );

      if (reviewResult.accepted) {
        // Answers accepted - save and proceed (include clarifications)
        await saveAnswers(clarificationState.answers, newClarifications);
        console.log('[WorkStyle] Answers accepted after clarification');
        localStorage.setItem('founder-os-work-style-completed', new Date().toISOString());
        navigate(returnPath, { replace: true });
      } else {
        // Another clarification needed (unusual, but handle it)
        console.log('[WorkStyle] Another clarification requested');
        setClarificationState({
          ...clarificationState,
          question: reviewResult.clarification?.question || reviewResult.message || 'Could you clarify further?',
          previousClarifications: newClarifications,
        });
        setClarificationInput('');
      }
    } catch (error) {
      console.error('[WorkStyle] Clarification review failed, saving anyway:', error);
      // Save with clarifications we have so far
      const currentClarifications = [
        ...clarificationState.previousClarifications,
        { question: clarificationState.question, response: clarificationInput.trim() },
      ];
      await saveAnswers(clarificationState.answers, currentClarifications);
      localStorage.setItem('founder-os-work-style-completed', new Date().toISOString());
      navigate(returnPath, { replace: true });
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  const handleExit = (_answers: Record<string, string>, _currentIndex: number) => {
    navigate(returnPath);
  };

  // Show reviewing state
  if (isReviewing) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Reviewing your answers...
            </h2>
            <p className="text-gray-400 text-sm">Just a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Show clarification UI
  if (clarificationState) {
    return (
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-blue-500/30 bg-gray-900/95 px-6 py-4">
          <h1 className="text-lg font-medium text-white">Quick Clarification</h1>
          <p className="text-sm text-gray-400">Just one more thing before we finalize</p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Previous clarifications */}
            {clarificationState.previousClarifications.map((clarification, index) => (
              <div key={index} className="space-y-3">
                {/* AI question */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">AI</span>
                  </div>
                  <div className="bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <p className="text-gray-100">{clarification.question}</p>
                  </div>
                </div>
                {/* User response */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-blue-600 rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                    <p className="text-white">{clarification.response}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Current clarification question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={clarificationState.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">AI</span>
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                  <p className="text-gray-100">{clarificationState.question}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-800 bg-gray-900/95 px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleClarificationSubmit();
                    }
                  }}
                  placeholder="Type your response..."
                  disabled={isSubmittingClarification}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-2">
                {isSupported && (
                  <button
                    onClick={handleMicToggle}
                    disabled={isSubmittingClarification}
                    className={`p-3 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    } disabled:opacity-50`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleClarificationSubmit}
                  disabled={!clarificationInput.trim() || isSubmittingClarification}
                  className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  {isSubmittingClarification ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AssessmentFlow
      config={ASSESSMENT_CONFIG}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
