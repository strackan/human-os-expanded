/**
 * Review Approval Modal - Enhanced with Rejection (Release 1.4)
 *
 * Allows reviewers to approve, request changes, or reject workflows/steps.
 * Includes rejection reason dropdown, iteration indicator, and rejection history display.
 */

'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Shield, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { RejectionHistoryTimeline } from './RejectionHistoryTimeline';
import type { ReviewRejectionHistory } from '@/types/review-triggers';

interface ReviewApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comments?: string) => Promise<void>;
  onRequestChanges: (comments: string) => Promise<void>;
  onReject?: (reason: string | undefined, comments: string) => Promise<void>;
  workflowTitle?: string;
  stepLabel?: string;
  requestedBy?: string;
  reason?: string;
  reviewIteration?: number;
  rejectionHistory?: ReviewRejectionHistory;
}

const REJECTION_REASONS = [
  'Incomplete information',
  'Needs revision',
  'Missing approvals',
  'Other',
];

export function ReviewApprovalModal({
  isOpen,
  onClose,
  onApprove,
  onRequestChanges,
  onReject,
  workflowTitle,
  stepLabel,
  requestedBy,
  reason,
  reviewIteration = 1,
  rejectionHistory
}: ReviewApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'changes' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validation
    if (action === 'changes' && !comments.trim()) {
      setError('Please provide comments explaining what changes are needed');
      return;
    }

    if (action === 'reject' && !comments.trim()) {
      setError('Rejection comments are required (minimum 10 characters)');
      return;
    }

    if (action === 'reject' && comments.trim().length < 10) {
      setError('Comments must be at least 10 characters');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      if (action === 'approve') {
        await onApprove(comments || undefined);
      } else if (action === 'changes') {
        await onRequestChanges(comments);
      } else if (action === 'reject' && onReject) {
        await onReject(rejectionReason || undefined, comments);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAction(null);
    setComments('');
    setRejectionReason('');
    setError('');
  };

  const title = stepLabel ? `Review Step: ${stepLabel}` : `Review Workflow: ${workflowTitle || 'Workflow'}`;
  const hasRejectionHistory = rejectionHistory && rejectionHistory.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          {title}
          {reviewIteration > 1 && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-200 text-orange-900 font-medium">
              Iteration {reviewIteration}
            </span>
          )}
        </h3>

        {/* Review Context */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
          {requestedBy && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Requested by:</span>
              <span className="text-gray-900 ml-2">{requestedBy}</span>
            </div>
          )}
          {reason && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Reason:</span>
              <p className="text-gray-900 mt-1">{reason}</p>
            </div>
          )}
        </div>

        {/* Rejection History (if exists) */}
        {hasRejectionHistory && !action && (
          <div className="mb-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  View Rejection History ({rejectionHistory.length})
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-orange-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-orange-600" />
              )}
            </button>
            {showHistory && (
              <div className="mt-3 p-4 bg-white border border-orange-200 rounded-lg">
                <RejectionHistoryTimeline history={rejectionHistory} />
              </div>
            )}
          </div>
        )}

        {/* Action Selection */}
        {!action && (
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Review the {stepLabel ? 'step' : 'workflow'} and choose an action:
            </p>
            <button
              onClick={() => setAction('approve')}
              className="w-full px-4 py-3 text-left text-sm font-medium text-green-700 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Approve</div>
                <div className="text-xs text-green-600">Allow the user to proceed and complete this {stepLabel ? 'step' : 'workflow'}</div>
              </div>
            </button>
            {onReject && (
              <button
                onClick={() => setAction('reject')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-red-700 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Reject</div>
                  <div className="text-xs text-red-600">Send back to user for revisions</div>
                </div>
              </button>
            )}
            <button
              onClick={() => setAction('changes')}
              className="w-full px-4 py-3 text-left text-sm font-medium text-orange-700 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Request Changes</div>
                <div className="text-xs text-orange-600">Ask the user to make changes before completing</div>
              </div>
            </button>
          </div>
        )}

        {/* Rejection Form */}
        {action === 'reject' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">Rejecting Review</span>
              <button
                onClick={handleReset}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700"
              >
                Change action
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Rejection Reason (optional):
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Comments (required, min 10 characters) *
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please explain what needs to be addressed..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Be specific about what needs to change
                </p>
                <p className="text-xs text-gray-500">
                  {comments.length} / 10 min
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Other Actions Form */}
        {(action === 'approve' || action === 'changes') && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              {action === 'approve' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Approving Review</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-700">Requesting Changes</span>
                </>
              )}
              <button
                onClick={handleReset}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700"
              >
                Change action
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                {action === 'approve' ? 'Comments (optional):' : 'What changes are needed? *'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Add any feedback or comments...'
                    : 'Please describe what needs to be changed...'
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          {action && (
            <button
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                (action === 'changes' && !comments.trim()) ||
                (action === 'reject' && (!comments.trim() || comments.trim().length < 10))
              }
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : action === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {action === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {isProcessing ? 'Approving...' : 'Approve'}
                </>
              ) : action === 'reject' ? (
                <>
                  <XCircle className="w-4 h-4" />
                  {isProcessing ? 'Rejecting...' : 'Submit Rejection'}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  {isProcessing ? 'Sending...' : 'Request Changes'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
