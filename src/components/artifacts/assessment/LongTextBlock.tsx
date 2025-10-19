'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { LongTextBlock as LongTextBlockType } from './types';

interface LongTextBlockProps {
  config: LongTextBlockType;
  value: string;
  onChange: (value: string) => void;
  questionNumber: number;
  onMicClick?: () => void;
  autoFocus?: boolean;
}

export default function LongTextBlock({
  config,
  value,
  onChange,
  questionNumber,
  onMicClick,
  autoFocus = false
}: LongTextBlockProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
          {questionNumber}
        </span>
        <div className="flex-1">
          <label className="text-lg font-semibold text-gray-900 block mb-1">
            {config.question}
          </label>
          {config.description && (
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          )}
        </div>
        {onMicClick && (
          <button
            onClick={onMicClick}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Use voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Text Area */}
      <div className="pl-11">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder || 'Enter your response...'}
          rows={config.rows || 4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
          maxLength={config.maxLength}
          autoFocus={autoFocus}
        />
        {(config.helpText || config.maxLength) && (
          <div className="mt-2 flex justify-between items-center">
            {config.helpText && (
              <p className="text-xs text-gray-500">{config.helpText}</p>
            )}
            {config.maxLength && (
              <p className="text-xs text-gray-500 ml-auto">
                {value.length} / {config.maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
