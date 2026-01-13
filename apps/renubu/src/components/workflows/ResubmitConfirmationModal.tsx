'use client';

/**
 * ResubmitConfirmationModal Component
 *
 * Confirmation modal for re-submitting a rejected workflow/step.
 * Provides checklist and optional notes field.
 *
 * Features:
 * - Clear confirmation message with reviewer name
 * - Iteration number display
 * - Checklist reminder for addressing feedback
 * - Optional notes field for change summary
 * - Success toast notification
 */

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface ResubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  reviewerName: string;
  iteration: number;
  isStep?: boolean;
  stepLabel?: string;
  className?: string;
}

// =====================================================
// ResubmitConfirmationModal Component
// =====================================================

export const ResubmitConfirmationModal: React.FC<ResubmitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reviewerName,
  iteration,
  isStep = false,
  stepLabel,
  className = '',
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState({
    addressedFeedback: false,
    reviewedComments: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');

    // Validation - ensure checklist is complete
    if (!checklist.addressedFeedback || !checklist.reviewedComments) {
      setError('Please confirm you have addressed the feedback and reviewed all comments');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(notes || undefined);
      // Success handling done by parent component
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resubmit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes('');
      setChecklist({ addressedFeedback: false, reviewedComments: false });
      setError('');
      onClose();
    }
  };

  const itemType = isStep && stepLabel ? `step (${stepLabel})` : 'workflow';
  const allChecked = checklist.addressedFeedback && checklist.reviewedComments;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 relative ${className}`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Re-Submit for Review?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-[52px]">
            You're about to re-submit this {itemType} to{' '}
            <span className="font-semibold text-gray-900">{reviewerName}</span>{' '}
            for iteration <span className="font-semibold text-gray-900">{iteration}</span>
          </p>
        </div>

        {/* Checklist */}
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <h4 className="text-sm font-semibold text-orange-900">
              Before you resubmit, please confirm:
            </h4>
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checklist.addressedFeedback}
                onChange={(e) =>
                  setChecklist({ ...checklist, addressedFeedback: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I have addressed all feedback from the rejection
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checklist.reviewedComments}
                onChange={(e) =>
                  setChecklist({ ...checklist, reviewedComments: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I have reviewed all rejection comments and made necessary changes
              </span>
            </label>
          </div>
        </div>

        {/* Optional Notes Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            What did you change? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly describe the changes you made to address the feedback..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes will be visible to the reviewer
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allChecked}
            className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Re-Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Re-Submit for Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
