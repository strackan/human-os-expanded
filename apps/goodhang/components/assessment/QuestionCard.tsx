/**
 * QuestionCard Component
 *
 * Displays a single assessment question with follow-up text.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */

'use client';

import { memo } from 'react';
import type { AssessmentQuestion } from '@/lib/assessment/types';

interface QuestionCardProps {
  question: AssessmentQuestion;
}

function QuestionCardComponent({ question }: QuestionCardProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
        {question.text}
      </h2>
      {question.followUp && (
        <p className="text-gray-400 text-sm italic">{question.followUp}</p>
      )}
    </div>
  );
}

// Memoize to prevent re-renders when question hasn't changed
export const QuestionCard = memo(QuestionCardComponent, (prevProps, nextProps) => {
  return prevProps.question.id === nextProps.question.id;
});

QuestionCard.displayName = 'QuestionCard';
