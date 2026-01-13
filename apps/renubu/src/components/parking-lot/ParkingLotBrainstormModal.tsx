'use client';

/**
 * Parking Lot Brainstorm Modal
 * Interactive Q&A to flesh out brainstorm items
 */

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import type { ParkingLotItem, BrainstormAnswer } from '@/types/parking-lot';
import { useSubmitBrainstormAnswers } from '@/lib/hooks/useParkingLot';

interface ParkingLotBrainstormModalProps {
  item: ParkingLotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (expansion: any, nextAction: string) => void;
}

export default function ParkingLotBrainstormModal({
  item,
  isOpen,
  onClose,
  onComplete
}: ParkingLotBrainstormModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const submitMutation = useSubmitBrainstormAnswers();

  // Reset when item changes
  useEffect(() => {
    if (item) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setCurrentAnswer('');
    }
  }, [item?.id]);

  if (!isOpen || !item || !item.brainstorm_questions) return null;

  const questions = item.brainstorm_questions;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    // Save current answer
    if (currentAnswer.trim()) {
      setAnswers({ ...answers, [currentQuestion.id]: currentAnswer });
    }

    if (isLastQuestion) {
      // Submit all answers
      handleSubmit();
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(answers[questions[currentQuestionIndex + 1].id] || '');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer
      if (currentAnswer.trim()) {
        setAnswers({ ...answers, [currentQuestion.id]: currentAnswer });
      }

      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[questions[currentQuestionIndex - 1].id] || '');
    }
  };

  const handleSubmit = async () => {
    // Compile all answers
    const allAnswers: BrainstormAnswer[] = questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] || (q.id === currentQuestion.id ? currentAnswer : ''),
      answeredAt: new Date().toISOString()
    }));

    try {
      const result = await submitMutation.mutateAsync({
        id: item.id,
        answers: allAnswers
      });

      onComplete?.(result.expansion, result.nextAction);
      onClose();
    } catch (error) {
      console.error('Failed to submit brainstorm:', error);
      // Could show error toast
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Brainstorm Session</h2>
              <p className="text-sm text-gray-600 line-clamp-1">{item.cleaned_text}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Question Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
              <span className="capitalize">{currentQuestion.category}</span>
            </div>

            {/* Question Text */}
            <h3 className="text-2xl font-semibold text-gray-900">
              {currentQuestion.question}
            </h3>

            {/* Answer Input */}
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              autoFocus
              disabled={submitMutation.isPending}
            />

            {/* Helper Text */}
            <p className="text-sm text-gray-500">
              Take your time to think through your answer. There are no wrong answers!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 || submitMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitMutation.isPending}
            >
              Save & Exit
            </button>

            <button
              onClick={handleNext}
              disabled={!currentAnswer.trim() || submitMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Complete & Synthesize</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
