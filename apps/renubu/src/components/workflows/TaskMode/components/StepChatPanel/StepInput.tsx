'use client';

/**
 * StepInput - Chat input for the active step
 *
 * Only shown inside expanded active step containers.
 */

import React, { useCallback, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { StepInputProps } from '../../types/step-chat';

export function StepInput({
  value,
  onChange,
  onSubmit,
  inputRef,
  isGenerating = false,
  placeholder = 'Type a message...',
}: StepInputProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && value.trim() && !isGenerating) {
        e.preventDefault();
        onSubmit();
      }
    },
    [value, isGenerating, onSubmit]
  );

  const handleSendClick = useCallback(() => {
    if (value.trim() && !isGenerating) {
      onSubmit();
    }
  }, [value, isGenerating, onSubmit]);

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border-t border-gray-100">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isGenerating}
        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                   disabled:bg-gray-100 disabled:cursor-not-allowed
                   transition-colors"
      />
      <button
        onClick={handleSendClick}
        disabled={!value.trim() || isGenerating}
        className="p-2 rounded-lg bg-blue-500 text-white
                   hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors"
        aria-label="Send message"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default StepInput;
