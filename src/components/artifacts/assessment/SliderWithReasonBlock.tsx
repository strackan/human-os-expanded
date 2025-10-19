'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { SliderWithReasonBlock as SliderWithReasonBlockType } from './types';

interface SliderWithReasonBlockProps {
  config: SliderWithReasonBlockType;
  value: { score: number; reason: string };
  onChange: (value: { score: number; reason: string }) => void;
  questionNumber: number;
  onMicClick?: () => void;
  autoFocus?: boolean;
}

export default function SliderWithReasonBlock({
  config,
  value,
  onChange,
  questionNumber,
  onMicClick,
  autoFocus = false
}: SliderWithReasonBlockProps) {
  const accentColors = {
    purple: {
      slider: 'accent-purple-600',
      text: 'text-purple-700',
      ring: 'focus:ring-purple-500',
      bg: 'bg-purple-100'
    },
    red: {
      slider: 'accent-red-600',
      text: 'text-red-700',
      ring: 'focus:ring-red-500',
      bg: 'bg-red-100'
    },
    blue: {
      slider: 'accent-blue-600',
      text: 'text-blue-700',
      ring: 'focus:ring-blue-500',
      bg: 'bg-blue-100'
    },
    green: {
      slider: 'accent-green-600',
      text: 'text-green-700',
      ring: 'focus:ring-green-500',
      bg: 'bg-green-100'
    }
  };

  const colors = accentColors[config.accentColor || 'purple'];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className={`flex-shrink-0 w-8 h-8 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center text-sm font-bold`}>
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

      {/* Score Slider */}
      <div className="space-y-2 pl-11 mb-4">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step || 1}
          value={value.score}
          onChange={(e) => onChange({ ...value, score: Number(e.target.value) })}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colors.slider}`}
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{config.labels?.min || `${config.min}`}</span>
          <span className={`text-xl font-bold ${colors.text}`}>{value.score}</span>
          <span>{config.labels?.max || `${config.max}`}</span>
        </div>
      </div>

      {/* Reason Text Area */}
      <div className="pl-11">
        <label className="text-sm font-medium text-gray-700 block mb-2">Why?</label>
        <textarea
          value={value.reason}
          onChange={(e) => onChange({ ...value, reason: e.target.value })}
          placeholder={config.reasonPlaceholder || 'Explain your reasoning...'}
          rows={config.reasonRows || 3}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${colors.ring} focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400`}
          autoFocus={autoFocus}
        />
        {config.helpText && (
          <p className="text-xs text-gray-500 mt-2">{config.helpText}</p>
        )}
      </div>
    </div>
  );
}
