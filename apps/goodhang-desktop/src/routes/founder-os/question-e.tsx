/**
 * Question E Assessment - Personality Baseline Interview
 *
 * Dynamically loads questions from the unified question system database.
 * Fills gaps in founder-os documentation for effective support.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import {
  fetchQuestions,
  saveAnswer,
  groupQuestionsBySubcategory,
  SECTION_DISPLAY_NAMES,
  type Question,
  type QuestionsResponse,
} from '@/lib/api/questions';

// Configuration
const QUESTION_SET_SLUG = 'fos-question-e';
const ENTITY_SLUG = 'scott'; // TODO: Get from user context

interface Answer {
  questionId: string;
  questionSlug: string;
  answer: string;
  timestamp: number;
  saved: boolean;
}

interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function QuestionEPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthStore();

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(null);

  // Assessment state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSectionIntro, setShowSectionIntro] = useState(true);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchQuestions(QUESTION_SET_SLUG, ENTITY_SLUG, false);
      setQuestionsData(data);

      // Skip already-answered questions
      const answeredIds = new Set(
        Object.entries(data.answers || {})
          .filter(([_, a]) => a.answered)
          .map(([id]) => id)
      );

      // Find first unanswered section/question
      if (data.questions.length > 0) {
        const sections = buildSections(data.questions);
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          for (let qIdx = 0; qIdx < sections[sIdx].questions.length; qIdx++) {
            if (!answeredIds.has(sections[sIdx].questions[qIdx].id)) {
              setCurrentSectionIndex(sIdx);
              setCurrentQuestionIndex(qIdx);
              setLoading(false);
              return;
            }
          }
        }
        // All answered - go to complete
        navigate('/founder-os/question-e-complete');
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Build sections from questions grouped by subcategory
  const sections = useMemo((): Section[] => {
    if (!questionsData?.questions) return [];
    return buildSections(questionsData.questions);
  }, [questionsData]);

  function buildSections(questions: Question[]): Section[] {
    const groups = groupQuestionsBySubcategory(questions);
    const sectionOrder = [
      'decision-making',
      'energy-cognitive',
      'communication',
      'crisis-recovery',
      'work-style',
    ];

    const result: Section[] = [];
    for (const key of sectionOrder) {
      const sectionQuestions = groups.get(key);
      if (sectionQuestions && sectionQuestions.length > 0) {
        const display = SECTION_DISPLAY_NAMES[key] || {
          title: key,
          description: '',
        };
        result.push({
          id: key,
          title: display.title,
          description: display.description,
          questions: sectionQuestions.sort((a, b) => a.display_order - b.display_order),
        });
      }
    }

    // Add any remaining sections not in the order
    for (const [key, sectionQuestions] of groups) {
      if (!sectionOrder.includes(key) && sectionQuestions.length > 0) {
        const display = SECTION_DISPLAY_NAMES[key] || {
          title: key,
          description: '',
        };
        result.push({
          id: key,
          title: display.title,
          description: display.description,
          questions: sectionQuestions.sort((a, b) => a.display_order - b.display_order),
        });
      }
    }

    return result;
  }

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0);
  const answeredQuestions = answers.length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    setIsSubmitting(true);

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      questionSlug: currentQuestion.slug,
      answer,
      timestamp: Date.now(),
      saved: false,
    };

    try {
      // Save to API
      await saveAnswer({
        entity_slug: ENTITY_SLUG,
        question_slug: currentQuestion.slug,
        value_text: currentQuestion.question_type === 'open' ? answer : undefined,
        value_choice: currentQuestion.question_type === 'choice' ? answer : undefined,
        source: 'thick-client',
      });

      newAnswer.saved = true;
    } catch (err) {
      console.error('Failed to save answer:', err);
      // Continue anyway - we'll save locally and retry later
    }

    setAnswers((prev) => [...prev, newAnswer]);
    setCurrentAnswer('');
    setIsSubmitting(false);

    // Move to next question
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setShowSectionIntro(true);
    } else {
      // Assessment complete
      handleComplete();
    }
  };

  const handleComplete = async () => {
    // Store completion locally as backup
    localStorage.setItem(
      'question-e-answers',
      JSON.stringify({
        answers,
        completedAt: new Date().toISOString(),
        entitySlug: ENTITY_SLUG,
      })
    );

    // Navigate to completion screen
    navigate('/founder-os/question-e-complete');
  };

  const handleSkip = () => {
    handleAnswer('[SKIPPED]');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading questions...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadQuestions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/founder-os/onboarding')}
              className="px-4 py-2 border border-gray-600 hover:bg-gray-800 rounded-lg text-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No questions state
  if (!currentSection || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No questions available.</p>
          <button
            onClick={() => navigate('/founder-os/onboarding')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Section intro screen
  if (showSectionIntro) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl text-center"
        >
          {/* Progress */}
          <div className="mb-8">
            <div className="text-sm text-gray-400 mb-2">
              Section {currentSectionIndex + 1} of {sections.length}
            </div>
            <div className="w-full h-2 bg-gh-dark-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Section Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-blue-600/20 mx-auto mb-6 flex items-center justify-center"
          >
            <span className="text-3xl text-blue-400">{currentSectionIndex + 1}</span>
          </motion.div>

          {/* Section Title */}
          <h1 className="text-3xl font-bold text-white mb-4">{currentSection.title}</h1>
          <p className="text-gray-400 text-lg mb-8">{currentSection.description}</p>

          {/* Questions count */}
          <p className="text-gray-500 text-sm mb-8">
            {currentSection.questions.length} questions in this section
          </p>

          {/* Start button */}
          <button
            onClick={() => setShowSectionIntro(false)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-lg transition-colors"
          >
            Begin Section
          </button>
        </motion.div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="min-h-screen p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/founder-os/onboarding')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-gray-400 text-sm">
            {currentQuestion.slug} · {currentSection.title}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Question {answeredQuestions + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full h-2 bg-gh-dark-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">{currentQuestion.text}</h2>

            {/* Choice question */}
            {currentQuestion.question_type === 'choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={isSubmitting}
                    className="w-full p-4 bg-gh-dark-800 hover:bg-gh-dark-700 border border-gh-dark-700 hover:border-blue-500/50 rounded-xl text-left text-white transition-all disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Open question */}
            {currentQuestion.question_type === 'open' && (
              <div className="space-y-4">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Take your time. There's no wrong answer..."
                  rows={6}
                  className="w-full p-4 bg-gh-dark-800 border border-gh-dark-700 focus:border-blue-500 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswer(currentAnswer)}
                    disabled={!currentAnswer.trim() || isSubmitting}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gh-dark-800 hover:bg-gh-dark-700 text-gray-400 hover:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer hint */}
        <div className="text-center text-gray-500 text-sm">
          Your answers help build a personalized operating system that actually works for you.
        </div>
      </motion.div>
    </div>
  );
}
