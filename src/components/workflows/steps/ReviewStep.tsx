/**
 * Review Step Component
 *
 * Displays a summary of all collected workflow data for review and confirmation.
 * Allows users to go back and edit previous steps or confirm and complete.
 *
 * Phase 2.4: Step Components
 */

'use client';

import React, { useState } from 'react';
import { CheckCircle, Edit, AlertCircle, ChevronRight } from 'lucide-react';
import { StepComponentProps } from '../StepRenderer';

// =====================================================
// Types
// =====================================================

export interface ReviewSection {
  title: string;
  stepNumber?: number;
  fields: Array<{
    label: string;
    value: any;
    format?: 'text' | 'date' | 'currency' | 'list' | 'boolean';
  }>;
  allowEdit?: boolean;
}

export interface ReviewStepConfig {
  sections: ReviewSection[];
  confirmationText?: string;
  submitLabel?: string;
  showTasksSummary?: boolean;
}

// =====================================================
// ReviewStep Component
// =====================================================

export const ReviewStep: React.FC<StepComponentProps> = ({
  data = {},
  executionId,
  customerId,
  onDataChange,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Get config from data or use defaults
  const config: ReviewStepConfig = data._config || {
    sections: [
      {
        title: 'Workflow Summary',
        fields: [
          { label: 'Status', value: 'Ready for completion', format: 'text' }
        ]
      }
    ],
    confirmationText: 'I confirm that all information is correct',
    submitLabel: 'Complete Workflow',
    showTasksSummary: true
  };

  // Format value based on type
  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'list':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value);

      default:
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Sections */}
      {config.sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {/* Section Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {section.stepNumber && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {section.stepNumber}
                </span>
              )}
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>

            {section.allowEdit && (
              <button
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => {
                  // TODO: Navigate to edit step
                  console.log('[ReviewStep] Edit section:', section.title);
                }}
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Section Content */}
          <div className="p-6">
            <dl className="space-y-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="flex justify-between items-start">
                  <dt className="text-sm font-medium text-gray-600 w-1/3">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-gray-900 w-2/3 text-right font-medium">
                    {formatValue(field.value, field.format)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ))}

      {/* Tasks Summary (if enabled) */}
      {config.showTasksSummary && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Tasks Created</h4>
              <p className="text-sm text-blue-800 mb-3">
                This workflow has created tasks that require follow-up. You can view and manage them in the Tasks panel.
              </p>
              <button
                onClick={() => {
                  // TODO: Open tasks panel
                  console.log('[ReviewStep] Open tasks panel');
                }}
                className="inline-flex items-center space-x-1 text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                <span>View Tasks</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Checkbox */}
      {config.confirmationText && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm text-gray-700 select-none">
              {config.confirmationText}
            </span>
          </label>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center space-x-3 pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (config.confirmationText && !confirmed)}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {config.submitLabel || 'Complete Workflow'}
            </>
          )}
        </button>
      </div>

      {/* Disabled state helper text */}
      {config.confirmationText && !confirmed && (
        <p className="text-sm text-gray-500 text-center">
          Please confirm the information above to continue
        </p>
      )}
    </div>
  );
};

export default ReviewStep;
