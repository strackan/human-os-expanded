/**
 * NavigationButtons Component
 *
 * Handles previous/next/submit navigation.
 * Optimized with React.memo and useCallback.
 */

'use client';

import { memo } from 'react';

interface NavigationButtonsProps {
  canGoPrevious: boolean;
  
  canGoNext: boolean;
  isLastQuestion: boolean;
  isLoading: boolean;
  hasAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function NavigationButtonsComponent({
  // canGoNext is not used in the component
  canGoPrevious,
  canGoNext: _canGoNext,
  isLastQuestion,
  isLoading,
  hasAnswer,
  onPrevious,
  onNext,
  onSubmit,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        ← Previous
      </button>

      {!isLastQuestion ? (
        <button
          onClick={onNext}
          disabled={!hasAnswer || isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
        >
          {isLoading ? 'Saving...' : 'Next →'}
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!hasAnswer || isLoading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
        >
          {isLoading ? 'Saving...' : 'Save Answer'}
        </button>
      )}
    </div>
  );
}

// Memoize to prevent re-renders
export const NavigationButtons = memo(NavigationButtonsComponent);

NavigationButtons.displayName = 'NavigationButtons';
