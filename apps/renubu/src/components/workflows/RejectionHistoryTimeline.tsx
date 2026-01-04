'use client';

/**
 * RejectionHistoryTimeline Component
 *
 * Displays rejection history in a vertical timeline format.
 * Shows all past rejections with reviewer info, dates, reasons, and comments.
 *
 * Features:
 * - Vertical timeline with connected entries
 * - Iteration badges
 * - Reviewer avatars and names
 * - Relative timestamps
 * - Expandable comments for long text
 * - Reason badges with color coding
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { ReviewRejectionHistory } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface RejectionHistoryTimelineProps {
  history: ReviewRejectionHistory;
  className?: string;
  maxVisibleComments?: number; // Characters to show before "Read more"
}

// =====================================================
// Helper Functions
// =====================================================

const getReasonBadgeColor = (reason: string): string => {
  switch (reason.toLowerCase()) {
    case 'incomplete information':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'needs revision':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'missing approvals':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'other':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-purple-100 text-purple-700 border-purple-200';
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
// RejectionEntry Component
// =====================================================

interface RejectionEntryProps {
  entry: ReviewRejectionHistory[number];
  isLast: boolean;
  maxVisibleComments?: number;
}

const RejectionEntry: React.FC<RejectionEntryProps> = ({ entry, isLast, maxVisibleComments = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = entry.comments && entry.comments.length > maxVisibleComments;

  const displayComments = shouldTruncate && !isExpanded
    ? entry.comments?.substring(0, maxVisibleComments) + '...'
    : entry.comments;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-red-200" />
      )}

      {/* Avatar/Icon */}
      <div className="flex-shrink-0 relative">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200">
          <User className="w-5 h-5 text-red-600" />
        </div>
        {/* Iteration badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
          {entry.iteration}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">
                Rejected by {entry.rejectedBy || 'Reviewer'}
              </h4>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(entry.rejectedAt)}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded border font-medium bg-orange-100 text-orange-700 border-orange-200">
              Iteration {entry.iteration}
            </span>
          </div>

          {/* Reason badge */}
          {entry.reason && (
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium ${getReasonBadgeColor(entry.reason)}`}>
                <AlertCircle className="w-3 h-3" />
                {entry.reason}
              </span>
            </div>
          )}

          {/* Comments */}
          {entry.comments && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {displayComments}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Read more
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// RejectionHistoryTimeline Component
// =====================================================

export const RejectionHistoryTimeline: React.FC<RejectionHistoryTimelineProps> = ({
  history,
  className = '',
  maxVisibleComments = 150,
}) => {
  if (!history || history.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No rejection history</p>
      </div>
    );
  }

  // Sort by iteration (newest first)
  const sortedHistory = [...history].sort((a, b) => b.iteration - a.iteration);

  return (
    <div className={`space-y-0 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          Rejection History ({history.length} {history.length === 1 ? 'rejection' : 'rejections'})
        </h3>
      </div>
      <div className="space-y-0">
        {sortedHistory.map((entry, index) => (
          <RejectionEntry
            key={`${entry.iteration}-${entry.rejectedAt}`}
            entry={entry}
            isLast={index === sortedHistory.length - 1}
            maxVisibleComments={maxVisibleComments}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// Compact Rejection History (for cards/summaries)
// =====================================================

export interface CompactRejectionHistoryProps {
  history: ReviewRejectionHistory;
  className?: string;
  onViewFull?: () => void;
}

export const CompactRejectionHistory: React.FC<CompactRejectionHistoryProps> = ({
  history,
  className = '',
  onViewFull,
}) => {
  if (!history || history.length === 0) return null;

  const latestRejection = history.reduce((latest, current) =>
    current.iteration > latest.iteration ? current : latest
  );

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-red-900">
              Last Rejected
            </span>
            {latestRejection.reason && (
              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getReasonBadgeColor(latestRejection.reason)}`}>
                {latestRejection.reason}
              </span>
            )}
          </div>
          <p className="text-xs text-red-700 line-clamp-2">
            {latestRejection.comments || 'No comments provided'}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {formatRelativeTime(latestRejection.rejectedAt)}
            {history.length > 1 && ` • ${history.length} total rejections`}
          </p>
        </div>
      </div>
      {onViewFull && history.length > 0 && (
        <button
          onClick={onViewFull}
          className="mt-2 text-xs text-red-700 hover:text-red-800 font-medium"
        >
          View full history
        </button>
      )}
    </div>
  );
};
