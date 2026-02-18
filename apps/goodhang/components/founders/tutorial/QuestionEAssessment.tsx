'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  QUESTION_E_SET,
  type QuestionEItem,
  type GapFinalData,
} from '@/lib/founders/question-e-data';

interface QuestionEAssessmentProps {
  gapFinalData: GapFinalData | null;
  onComplete: (answers: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
  isLoading?: boolean;
}

export function QuestionEAssessment({
  gapFinalData,
  onComplete,
  initialAnswers = {},
  isLoading = false,
}: QuestionEAssessmentProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter questions based on gap-final data (outstanding questions)
  const questions: QuestionEItem[] = QUESTION_E_SET.filter((q) => {
    if (!gapFinalData || gapFinalData.status === 'partial') return true;
    return gapFinalData.outstanding_questions.includes(q.id);
  });

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isMultipleChoice = currentQuestion?.options != null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-green-400 text-lg font-medium mb-2">
            All questions answered!
          </p>
          <button
            onClick={() => onComplete(answers)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          Personality Baseline
        </h3>
        <p className="text-sm text-gray-400">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <div className="mt-2 h-1 bg-[var(--gh-dark-600)] rounded-full">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
          <p className="text-white text-base font-medium">{currentQuestion.text}</p>
        </div>

        {isMultipleChoice ? (
          <div className="space-y-3">
            {currentQuestion.options!.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  answers[currentQuestion.id] === option
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'border-[var(--gh-dark-600)] text-gray-300 hover:border-gray-500 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-[var(--gh-dark-700)] text-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 pt-4 flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-[var(--gh-dark-600)] text-gray-300 hover:text-white hover:border-gray-500 font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {currentIndex < questions.length - 1 ? 'Next' : 'Complete'}
        </button>
      </div>
    </div>
  );
}
