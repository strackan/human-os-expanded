'use client';

/**
 * RejectionAlertBanner Component
 *
 * Prominent alert banner for rejected workflows/steps.
 * Displays rejection details and provides actions for addressing feedback.
 *
 * Features:
 * - Red/orange alert styling with icon
 * - Rejection reason and comments display
 * - Reviewer name and rejection date
 * - "Address Feedback & Re-Submit" primary action
 * - "View Full History" secondary action (if multiple rejections)
 * - Collapsible for long comments
 */

import React, { useState } from 'react';
import { AlertCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, History } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { ReviewRejectionHistory } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface RejectionAlertBannerProps {
  reviewerName: string;
  rejectedAt: string;
  reason?: string;
  comments?: string;
  iteration?: number;
  rejectionHistory?: ReviewRejectionHistory;
  onResubmit: () => void;
  onViewHistory?: () => void;
  isStep?: boolean; // True if this is for a step rejection
  stepLabel?: string; // Label for the step
  className?: string;
}

// =====================================================
// Helper Functions
// =====================================================

const getReasonIcon = (reason?: string) => {
  switch (reason?.toLowerCase()) {
    case 'incomplete information':
    case 'missing approvals':
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <XCircle className="w-5 h-5" />;
  }
};

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'recently';
  }
};

// =====================================================
// RejectionAlertBanner Component
// =====================================================

export const RejectionAlertBanner: React.FC<RejectionAlertBannerProps> = ({
  reviewerName,
  rejectedAt,
  reason,
  comments,
  iteration = 1,
  rejectionHistory,
  onResubmit,
  onViewHistory,
  isStep = false,
  stepLabel,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullComments, setShowFullComments] = useState(false);

  const hasMultipleRejections = rejectionHistory && rejectionHistory.length > 1;
  const shouldTruncateComments = comments && comments.length > 200;
  const displayComments = shouldTruncateComments && !showFullComments
    ? comments.substring(0, 200) + '...'
    : comments;

  const title = isStep && stepLabel
    ? `This step (${stepLabel}) was rejected by ${reviewerName}`
    : `This workflow was rejected by ${reviewerName}`;

  return (
    <div className={`bg-red-50 border-l-4 border-red-600 ${className}`}>
      {/* Header - Always visible */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 text-red-600 mt-0.5">
              {getReasonIcon(reason)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-red-900">
                  {title}
                </h3>
                {iteration > 1 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-200 text-orange-900 font-medium">
                    Iteration {iteration}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-red-700">
                <span>Rejected {formatRelativeTime(rejectedAt)}</span>
                {reason && (
                  <>
                    <span>•</span>
                    <span className="font-medium">{reason}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 text-red-600 hover:text-red-700 ml-4"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Comments */}
            {comments && (
              <div className="bg-white border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Feedback:</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {displayComments}
                </p>
                {shouldTruncateComments && (
                  <button
                    onClick={() => setShowFullComments(!showFullComments)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    {showFullComments ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Multiple Rejections Notice */}
            {hasMultipleRejections && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    This {isStep ? 'step' : 'workflow'} has been rejected{' '}
                    <span className="font-semibold">{rejectionHistory.length} times</span>.
                    Please carefully review all feedback before resubmitting.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onResubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Address Feedback & Re-Submit
              </button>
              {hasMultipleRejections && onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <History className="w-4 h-4" />
                  View Full Rejection History
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed preview */}
      {!isExpanded && comments && (
        <div className="px-6 pb-4">
          <p className="text-sm text-red-700 line-clamp-1">
            {comments}
          </p>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Compact Rejection Badge (for cards/lists)
// =====================================================

export interface RejectionBadgeProps {
  iteration?: number;
  className?: string;
}

export const RejectionBadge: React.FC<RejectionBadgeProps> = ({ iteration = 1, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded ${className}`}>
      <XCircle className="w-3 h-3" />
      Rejected
      {iteration > 1 && ` (Iter. ${iteration})`}
    </span>
  );
};

// =====================================================
// Re-Submitted Badge (for pending re-review)
// =====================================================

export interface ResubmittedBadgeProps {
  iteration?: number;
  className?: string;
}

export const ResubmittedBadge: React.FC<ResubmittedBadgeProps> = ({ iteration = 2, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded ${className}`}>
      <RefreshCw className="w-3 h-3" />
      Re-Submitted (Iter. {iteration})
    </span>
  );
};
