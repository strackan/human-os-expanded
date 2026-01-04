/**
 * Enhanced Question Card Component
 *
 * Improvements:
 * - Better mobile touch targets (48px minimum)
 * - ARIA labels for accessibility
 * - Keyboard navigation support
 * - Help tooltips
 * - Character count
 * - Auto-save indicator
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MicrophoneButton } from './MicrophoneButton';
import { cn } from '@/lib/utils';

interface EnhancedQuestionCardProps {
  questionText: string;
  followUpText?: string;
  helpText?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  isLastQuestion?: boolean;
  canGoPrevious?: boolean;
  minLength?: number;
  maxLength?: number;
  autoSaveEnabled?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export function EnhancedQuestionCard({
  questionText,
  followUpText,
  helpText,
  value,
  onChange,
  onSubmit,
  onPrevious,
  isLoading = false,
  isLastQuestion = false,
  canGoPrevious = true,
  minLength = 10,
  maxLength = 2000,
  autoSaveEnabled = true,
  questionNumber,
  totalQuestions,
}: EnhancedQuestionCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const characterCount = value.length;
  const isValidLength = characterCount >= minLength && characterCount <= maxLength;
  const progressPercent = Math.min((characterCount / minLength) * 100, 100);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [questionText]);

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!autoSaveEnabled || value === '') return;

    clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      // Simulate save (in real implementation, this would call an API)
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 2000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [value, autoSaveEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isValidLength) {
      e.preventDefault();
      onSubmit();
    }
  };

  const formatLastSaved = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div
      className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 md:p-8"
      role="region"
      aria-label={`Question ${questionNumber} of ${totalQuestions}`}
    >
      {/* Question Header */}
      <div className="mb-6">
        {/* Progress indicator */}
        {questionNumber && totalQuestions && (
          <div className="flex items-center justify-between mb-3" aria-label="Question progress">
            <span className="text-sm text-purple-400 font-mono">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round((questionNumber / totalQuestions) * 100)}% complete
            </span>
          </div>
        )}

        {/* Question text */}
        <div className="flex items-start gap-3">
          <h2
            className="text-xl md:text-2xl font-semibold text-white leading-relaxed flex-1"
            id="question-text"
          >
            {questionText}
          </h2>

          {/* Help button */}
          {helpText && (
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                showHelp
                  ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                  : 'border-gray-500 text-gray-400 hover:border-purple-400 hover:text-purple-400'
              )}
              aria-label="Show help"
              aria-expanded={showHelp}
              aria-controls="help-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Follow-up text */}
        {followUpText && (
          <p className="text-gray-400 text-sm md:text-base italic mt-2">{followUpText}</p>
        )}

        {/* Help text (collapsible) */}
        {helpText && showHelp && (
          <div
            id="help-text"
            className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            role="region"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-blue-300 text-sm">{helpText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="answer-input" className="sr-only">
            Your answer
          </label>
          <textarea
            ref={textareaRef}
            id="answer-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here or use the microphone to dictate..."
            rows={8}
            maxLength={maxLength}
            aria-describedby="question-text character-count save-status"
            aria-required="true"
            aria-invalid={!isValidLength && value.length > 0}
            className={cn(
              'w-full px-4 py-3 pr-14 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none',
              'min-h-[200px]', // Minimum height for better mobile UX
              !isValidLength && value.length > 0
                ? 'border-yellow-500/50'
                : 'border-purple-500/30'
            )}
          />

          {/* Microphone button */}
          <div className="absolute bottom-3 right-3">
            <MicrophoneButton value={value} onChange={onChange} disabled={isLoading} />
          </div>
        </div>

        {/* Character count and save status */}
        <div className="flex items-center justify-between text-sm">
          <div id="character-count" aria-live="polite" aria-atomic="true">
            <span
              className={cn(
                'font-mono',
                characterCount < minLength
                  ? 'text-gray-400'
                  : characterCount > maxLength
                  ? 'text-red-400'
                  : 'text-green-400'
              )}
            >
              {characterCount} / {minLength} characters minimum
            </span>

            {/* Progress bar */}
            {characterCount < minLength && (
              <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Answer progress"
                />
              </div>
            )}
          </div>

          {/* Auto-save status */}
          {autoSaveEnabled && (
            <div
              id="save-status"
              className="flex items-center gap-2 text-gray-400"
              aria-live="polite"
              aria-atomic="true"
            >
              {isSaving && (
                <>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Saving...</span>
                </>
              )}
              {!isSaving && lastSaved && (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs">{formatLastSaved(lastSaved)}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-xs text-gray-500 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Ctrl</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd> to submit
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious || isLoading}
            className={cn(
              'min-h-[48px] px-6 py-3 rounded-lg font-semibold transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-gray-800 hover:bg-gray-700 text-white'
            )}
            aria-label="Go to previous question"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </span>
          </button>

          <button
            onClick={onSubmit}
            disabled={!isValidLength || isLoading}
            className={cn(
              'min-h-[48px] px-8 py-3 rounded-lg font-semibold transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
              'disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none',
              'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500',
              'text-white shadow-lg hover:shadow-purple-500/50'
            )}
            aria-label={isLastQuestion ? 'Save answer' : 'Go to next question'}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isLastQuestion ? 'Save Answer' : 'Next'}
                {!isLastQuestion && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
