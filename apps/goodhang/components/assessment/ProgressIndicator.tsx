/**
 * ProgressIndicator Component
 *
 * Displays overall progress and section information.
 * Optimized with React.memo.
 */

'use client';

import { memo } from 'react';

interface ProgressIndicatorProps {
  sectionTitle: string;
  progress: number;
  onExit?: () => void;
}

function ProgressIndicatorComponent({
  sectionTitle,
  progress,
  onExit,
}: ProgressIndicatorProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{sectionTitle}</span>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Save &amp; Exit to Members Area
            </button>
          )}
        </div>
        <span className="text-sm text-purple-400">{Math.round(progress)}% Complete</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Memoize to prevent re-renders
export const ProgressIndicator = memo(ProgressIndicatorComponent);

ProgressIndicator.displayName = 'ProgressIndicator';
