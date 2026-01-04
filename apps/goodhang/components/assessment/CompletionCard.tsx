/**
 * CompletionCard Component
 *
 * Displays completion message and submit button.
 * Shown when user has answered all questions.
 * Optimized with React.memo.
 */

'use client';

import { memo } from 'react';

interface CompletionCardProps {
  isLoading: boolean;
  onComplete: () => void;
}

function CompletionCardComponent({ isLoading, onComplete }: CompletionCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8 text-center">
      <h3 className="text-2xl font-semibold text-white mb-4">
        You&apos;ve completed all questions!
      </h3>
      <p className="text-gray-300 mb-6">
        Click below to submit your assessment and see your results. Our AI will analyze your
        responses and provide personalized insights.
      </p>
      <button
        onClick={onComplete}
        disabled={isLoading}
        className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/50 text-lg"
      >
        {isLoading ? 'Analyzing Your Responses...' : 'Submit & See Results'}
      </button>
    </div>
  );
}

// Memoize to prevent re-renders
export const CompletionCard = memo(CompletionCardComponent);

CompletionCard.displayName = 'CompletionCard';
