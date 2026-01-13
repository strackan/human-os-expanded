'use client';

import React from 'react';
import { Mic, Check } from 'lucide-react';
import { MultipleChoiceBlock as MultipleChoiceBlockType } from './types';

interface MultipleChoiceBlockProps {
  config: MultipleChoiceBlockType;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  questionNumber: number;
  onMicClick?: () => void;
  autoFocus?: boolean;
}

export default function MultipleChoiceBlock({
  config,
  value,
  onChange,
  questionNumber,
  onMicClick,
  autoFocus = false
}: MultipleChoiceBlockProps) {
  const handleSingleChoice = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const handleMultipleChoice = (selectedValue: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (currentValues.includes(selectedValue)) {
      onChange(currentValues.filter(v => v !== selectedValue));
    } else {
      onChange([...currentValues, selectedValue]);
    }
  };

  const isSelected = (optionValue: string) => {
    if (config.allowMultiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

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
          {config.allowMultiple && (
            <p className="text-sm text-purple-600 mt-1">
              Select all that apply
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

      {/* Options */}
      <div className="pl-14 space-y-3">
        {config.options.map((option, index) => {
          const selected = isSelected(option.value);

          return (
            <button
              key={option.value}
              onClick={() => {
                if (config.allowMultiple) {
                  handleMultipleChoice(option.value);
                } else {
                  handleSingleChoice(option.value);
                }
              }}
              autoFocus={autoFocus && index === 0}
              className={`w-full flex items-start gap-4 p-5 border-2 rounded-lg text-left transition-all ${
                selected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
              }`}
            >
              {/* Checkbox/Radio indicator */}
              <div
                className={`flex-shrink-0 w-5 h-5 rounded ${
                  config.allowMultiple ? 'rounded-md' : 'rounded-full'
                } border-2 flex items-center justify-center transition-all ${
                  selected
                    ? 'border-purple-600 bg-purple-600'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selected && (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                )}
              </div>

              {/* Option content */}
              <div className="flex-1 mt-[-2px]">
                <span className="text-base font-medium text-gray-900 block">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-sm text-gray-600 mt-1 block">
                    {option.description}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {config.helpText && (
        <div className="pl-14">
          <p className="text-sm text-gray-500">{config.helpText}</p>
        </div>
      )}
    </div>
  );
}
