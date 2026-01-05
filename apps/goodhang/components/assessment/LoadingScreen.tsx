/**
 * LoadingScreen Component
 *
 * Displays loading spinner and rotating messages.
 * Used during assessment initialization and completion.
 * Optimized with React.memo.
 */

'use client';

import { memo } from 'react';

interface LoadingScreenProps {
  message: string;
  subMessage?: string;
}

function LoadingScreenComponent({ message, subMessage }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {message}
        </h2>
        {subMessage && <p className="text-gray-400 text-sm">{subMessage}</p>}
      </div>
    </div>
  );
}

// Memoize to prevent re-renders
export const LoadingScreen = memo(LoadingScreenComponent);

LoadingScreen.displayName = 'LoadingScreen';
