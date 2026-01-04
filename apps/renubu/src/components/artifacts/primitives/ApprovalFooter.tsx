/**
 * ApprovalFooter - Phase approval footer with optional comments
 *
 * Used in the LLM-driven account review workflow (v0.1.12).
 * Provides:
 * - Collapsible notes/comments textarea
 * - Approve & Continue button
 * - Visual state for approved phases
 */

'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

export interface ApprovalFooterProps {
  /** Current phase/tab ID */
  phaseId: string;
  /** Phase display label */
  phaseLabel: string;
  /** Whether this phase is approved */
  isApproved?: boolean;
  /** Timestamp when approved */
  approvedAt?: string;
  /** Existing comments for this phase */
  existingComments?: string;
  /** Callback when phase is approved */
  onApprove: (phaseId: string, comments?: string) => void;
  /** Whether this is the final phase */
  isFinalPhase?: boolean;
  /** Label for the approval button */
  approveLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

export const ApprovalFooter = React.memo(function ApprovalFooter({
  phaseId,
  phaseLabel,
  isApproved = false,
  approvedAt,
  existingComments,
  onApprove,
  isFinalPhase = false,
  approveLabel,
  className = '',
}: ApprovalFooterProps) {
  const [isExpanded, setIsExpanded] = useState(!!existingComments);
  const [comments, setComments] = useState(existingComments || '');

  const handleApprove = () => {
    onApprove(phaseId, comments.trim() || undefined);
  };

  // If already approved, show approved state
  if (isApproved) {
    return (
      <div
        className={`px-6 py-4 border-t border-gray-200 bg-green-50 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">{phaseLabel} approved</span>
            {approvedAt && (
              <span className="text-xs text-green-600">
                {new Date(approvedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          {existingComments && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              View notes
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
        {isExpanded && existingComments && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-green-200 text-sm text-gray-700">
            {existingComments}
          </div>
        )}
      </div>
    );
  }

  // Pending approval state
  const buttonLabel =
    approveLabel ||
    (isFinalPhase ? 'Approve & Generate Strategy' : 'Approve & Continue');

  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
    >
      {/* Collapsible notes toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Add notes (optional)
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsible textarea */}
      {isExpanded && (
        <div className="mb-4">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={`Add notes about ${phaseLabel.toLowerCase()}... These will be included in the strategy synthesis.`}
            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Your notes will help refine the engagement strategy.
          </p>
        </div>
      )}

      {/* Approve button */}
      <div className="flex justify-end">
        <button
          onClick={handleApprove}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
});

ApprovalFooter.displayName = 'ApprovalFooter';
export default ApprovalFooter;
