'use client';

import React from 'react';
import { Mic, ChevronDown } from 'lucide-react';
import { DropdownBlock as DropdownBlockType } from './types';

interface DropdownBlockProps {
  config: DropdownBlockType;
  value: string | null;
  onChange: (value: string) => void;
  questionNumber: number;
  onMicClick?: () => void;
  autoFocus?: boolean;
}

export default function DropdownBlock({
  config,
  value,
  onChange,
  questionNumber,
  onMicClick,
  autoFocus = false
}: DropdownBlockProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Question Header */}
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-lg font-bold">
          {questionNumber}
        </span>
        <div className="flex-1">
          <label className="text-2xl font-semibold text-gray-900 block mb-2">
            {config.question}
          </label>
          {config.description && (
            <p className="text-base text-gray-600">
              {config.description}
            </p>
          )}
        </div>
        {onMicClick && (
          <button
            onClick={onMicClick}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Use voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <div className="pl-14 space-y-3">
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            autoFocus={autoFocus}
            className="w-full px-5 py-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base text-gray-900 appearance-none bg-white cursor-pointer"
          >
            <option value="" disabled>
              {config.placeholder || 'Select an option...'}
            </option>
            {config.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {config.helpText && (
          <p className="text-sm text-gray-500">{config.helpText}</p>
        )}
      </div>
    </div>
  );
}
