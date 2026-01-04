/**
 * AnswerInput Component
 *
 * Text area with voice dictation support.
 * Optimized with React.memo and lazy loading for MicrophoneButton.
 */

'use client';

import { memo, lazy, Suspense } from 'react';

// Lazy load the microphone component (not needed until user clicks)
const MicrophoneButton = lazy(() =>
  import('./MicrophoneButton').then((mod) => ({ default: mod.MicrophoneButton }))
);

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function AnswerInputComponent({
  value,
  onChange,
  disabled = false,
  placeholder = 'Type your answer here or use the microphone to dictate...',
}: AnswerInputProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        disabled={disabled}
        className="w-full px-4 py-3 pr-14 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="absolute bottom-3 right-3">
        <Suspense
          fallback={
            <div className="p-2 bg-gray-700/30 border border-gray-600/30 rounded-lg">
              <svg className="w-5 h-5 text-gray-500 animate-pulse" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
              </svg>
            </div>
          }
        >
          <MicrophoneButton value={value} onChange={onChange} disabled={disabled} />
        </Suspense>
      </div>
    </div>
  );
}

// Memoize to prevent re-renders
export const AnswerInput = memo(AnswerInputComponent);

AnswerInput.displayName = 'AnswerInput';
