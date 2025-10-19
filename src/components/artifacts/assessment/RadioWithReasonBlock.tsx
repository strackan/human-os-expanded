'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { RadioWithReasonBlock as RadioWithReasonBlockType } from './types';

interface RadioWithReasonBlockProps {
  config: RadioWithReasonBlockType;
  value: { value: string; reason: string } | null;
  onChange: (value: { value: string; reason: string }) => void;
  questionNumber: number;
  onMicClick?: () => void;
  autoFocus?: boolean;
}

export default function RadioWithReasonBlock({
  config,
  value,
  onChange,
  questionNumber,
  onMicClick,
  autoFocus = false
}: RadioWithReasonBlockProps) {
  const selectedValue = value?.value || '';
  const reason = value?.reason || '';

  const handleRadioChange = (newValue: string) => {
    onChange({
      value: newValue,
      reason: reason
    });
  };

  const handleReasonChange = (newReason: string) => {
    onChange({
      value: selectedValue,
      reason: newReason
    });
  };

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

      {/* Radio Options */}
      <div className="pl-11 space-y-2 mb-4">
        {config.options.map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedValue === option.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={config.id}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={(e) => handleRadioChange(e.target.value)}
              className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 block">
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-gray-600 mt-0.5 block">
                  {option.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Reason Text Area */}
      {selectedValue && (
        <div className="pl-11">
          <label className="text-sm font-medium text-gray-700 block mb-2">Why?</label>
          <textarea
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            placeholder={config.reasonPlaceholder || 'Explain your reasoning...'}
            rows={config.reasonRows || 3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
            autoFocus={autoFocus}
          />
          {config.helpText && (
            <p className="text-xs text-gray-500 mt-2">{config.helpText}</p>
          )}
        </div>
      )}
    </div>
  );
}
