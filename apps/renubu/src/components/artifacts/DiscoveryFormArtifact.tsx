'use client';

import React, { useState } from 'react';
import { Mic, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface DropdownQuestion {
  id: string;
  type: 'dropdown';
  question: string;
  options: string[];
}

interface BooleanQuestion {
  id: string;
  type: 'boolean';
  question: string;
}

type Question = DropdownQuestion | BooleanQuestion;

interface DiscoveryFormArtifactProps {
  title?: string;
  subtitle?: string;
  questions?: Question[];
  onSubmit?: (answers: Record<string, string | boolean>) => void;
  onBack?: () => void;
}

export default function DiscoveryFormArtifact({
  title = 'Discovery Questions',
  subtitle = 'Help us understand your situation to provide the best recommendations',
  questions = [
    {
      id: 'engagement-type',
      type: 'dropdown',
      question: 'Is this a renewal or new business opportunity?',
      options: ['Renewal', 'New Business', 'Expansion', 'Unsure']
    },
    {
      id: 'churn-risk',
      type: 'boolean',
      question: 'Has the customer expressed churn risk or dissatisfaction?'
    },
    {
      id: 'health-score',
      type: 'dropdown',
      question: 'What is the current customer health score category?',
      options: ['High (8-10)', 'Medium (5-7)', 'Low (1-4)', 'Unknown']
    },
    {
      id: 'expansion-opportunity',
      type: 'boolean',
      question: 'Is there a clear expansion opportunity identified?'
    },
    {
      id: 'executive-engagement',
      type: 'dropdown',
      question: 'Level of executive engagement with customer?',
      options: ['Active (weekly contact)', 'Moderate (monthly contact)', 'Low (quarterly contact)', 'None']
    },
    {
      id: 'competitor-threat',
      type: 'boolean',
      question: 'Is the customer actively evaluating competitors?'
    },
    {
      id: 'contract-complexity',
      type: 'dropdown',
      question: 'How complex is the contract situation?',
      options: ['Simple (standard terms)', 'Moderate (some customization)', 'Complex (heavy customization)', 'Very Complex (multi-year, custom SLAs)']
    },
    {
      id: 'technical-issues',
      type: 'boolean',
      question: 'Are there unresolved technical or support issues?'
    }
  ],
  onSubmit,
  onBack
}: DiscoveryFormArtifactProps) {
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});

  const handleDropdownChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleBooleanChange = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMicClick = () => {
    showToast({
      message: 'Voice transcription coming soon!',
      type: 'info',
      icon: 'none',
      duration: 2000
    });
  };

  const handleSubmit = () => {
    // Check if all questions are answered
    const allAnswered = questions.every(q => answers[q.id] !== undefined);

    if (!allAnswered) {
      showToast({
        message: 'Please answer all questions before submitting',
        type: 'error',
        icon: 'alert',
        duration: 3000
      });
      return;
    }

    onSubmit?.(answers);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-2xl">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              {/* Question Label */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <label className="flex-1 text-sm font-medium text-gray-900">
                  {question.question}
                </label>
                <button
                  onClick={handleMicClick}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Use voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Input Field */}
              {question.type === 'dropdown' ? (
                <select
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleDropdownChange(question.id, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
                >
                  <option value="" className="text-gray-400">Select an option...</option>
                  {question.options.map((option) => (
                    <option key={option} value={option} className="text-gray-900">
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBooleanChange(question.id, true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                      answers[question.id] === true
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleBooleanChange(question.id, false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                      answers[question.id] === false
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          Submit & Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
