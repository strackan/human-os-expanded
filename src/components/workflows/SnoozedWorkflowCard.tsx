'use client';

/**
 * SnoozedWorkflowCard Component
 *
 * Displays a snoozed workflow with trigger status and actions.
 * Shows all configured triggers, priority score, and wake actions.
 *
 * Features:
 * - Display workflow details
 * - Show all triggers with status
 * - Highlight fired triggers
 * - Priority score badge
 * - Wake Now action
 * - View Details action
 */

import React, { useState } from 'react';
import { Bell, Eye, AlertCircle, TrendingUp, XCircle, RefreshCw } from 'lucide-react';
import { TriggerDisplay } from './triggers/TriggerDisplay';
import { WakeTrigger } from '@/types/wake-triggers';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { ReviewStatus } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface SnoozedWorkflow {
  id: string;
  workflowName: string;
  workflowType: string;
  customerName: string;
  customerId: string;
  snoozedAt: string;
  snoozedBy: string;
  snoozedByName?: string;
  status: string;
  priorityScore?: number;
  wake_triggers?: WakeTrigger[];
  trigger_fired_at?: string;
  fired_trigger_type?: string;
  last_evaluated_at?: string;
  metadata?: Record<string, any>;
}

export interface SnoozedWorkflowCardProps {
  workflow: SnoozedWorkflow;
  onWakeNow: (workflowId: string) => Promise<void>;
  onViewDetails: (workflowId: string) => void;
  className?: string;
}

// =====================================================
// SnoozedWorkflowCard Component
// =====================================================

export const SnoozedWorkflowCard: React.FC<SnoozedWorkflowCardProps> = ({
  workflow,
  onWakeNow,
  onViewDetails,
  className = '',
}) => {
  const [isWaking, setIsWaking] = useState(false);
  const [error, setError] = useState('');

  const handleWakeNow = async () => {
    setError('');
    setIsWaking(true);
    try {
      await onWakeNow(workflow.id);
    } catch (err: any) {
      setError(err.message || 'Failed to wake workflow');
    } finally {
      setIsWaking(false);
    }
  };

  const getPriorityBadge = () => {
    const score = workflow.priorityScore || 0;
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
          <AlertCircle className="w-3 h-3" />
          High Priority
        </span>
      );
    } else if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
          <TrendingUp className="w-3 h-3" />
          Medium Priority
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          Low Priority
        </span>
      );
    }
  };

  const getWorkflowTypeLabel = (type: string): string => {
    switch (type) {
      case 'renewal':
        return 'Renewal';
      case 'strategic':
        return 'Strategic';
      case 'opportunity':
        return 'Opportunity';
      case 'risk':
        return 'Risk';
      default:
        return type;
    }
  };

  const getSnoozedTimeText = (): string => {
    try {
      const snoozedDate = parseISO(workflow.snoozedAt);
      return formatDistanceToNow(snoozedDate, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getTriggerStatus = (trigger: WakeTrigger): 'pending' | 'fired' | 'error' => {
    if (workflow.trigger_fired_at && trigger.id === workflow.fired_trigger_type) {
      return 'fired';
    }
    // Check if there's an error in metadata (this would come from evaluation)
    if (workflow.metadata?.triggerErrors?.[trigger.id]) {
      return 'error';
    }
    return 'pending';
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {workflow.workflowName}
            </h3>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {getWorkflowTypeLabel(workflow.workflowType)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {workflow.customerName}
          </p>
        </div>
        <div>{getPriorityBadge()}</div>
      </div>

      {/* Snooze Info */}
      <div className="text-xs text-gray-500 mb-3">
        Snoozed {getSnoozedTimeText()}
        {workflow.snoozedByName && ` by ${workflow.snoozedByName}`}
      </div>

      {/* Wake Triggers */}
      {workflow.wake_triggers && workflow.wake_triggers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Wake Triggers:</h4>
          <div className="space-y-2">
            {workflow.wake_triggers.map((trigger) => (
              <TriggerDisplay
                key={trigger.id}
                trigger={trigger}
                status={getTriggerStatus(trigger)}
                firedAt={
                  trigger.id === workflow.fired_trigger_type
                    ? workflow.trigger_fired_at
                    : undefined
                }
                errorMessage={workflow.metadata?.triggerErrors?.[trigger.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Priority Score (if available) */}
      {workflow.priorityScore !== undefined && (
        <div className="mb-4 text-sm">
          <span className="text-gray-600">Priority Score: </span>
          <span className="font-semibold text-gray-900">
            {workflow.priorityScore}
          </span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(workflow.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={handleWakeNow}
          disabled={isWaking}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Bell className="w-4 h-4" />
          {isWaking ? 'Waking...' : 'Wake Now'}
        </button>
      </div>
    </div>
  );
};

// =====================================================
// Snoozed Workflows List Component
// =====================================================

export interface SnoozedWorkflowsListProps {
  workflows: SnoozedWorkflow[];
  onWakeNow: (workflowId: string) => Promise<void>;
  onViewDetails: (workflowId: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const SnoozedWorkflowsList: React.FC<SnoozedWorkflowsListProps> = ({
  workflows,
  onWakeNow,
  onViewDetails,
  loading = false,
  error,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600 mt-2">Loading snoozed workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No snoozed workflows</p>
        <p className="text-xs text-gray-500 mt-1">
          Workflows you snooze will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {workflows.map((workflow) => (
        <SnoozedWorkflowCard
          key={workflow.id}
          workflow={workflow}
          onWakeNow={onWakeNow}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

// =====================================================
// Review Status Badge Components (for workflow cards)
// =====================================================

export interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  iteration?: number;
  className?: string;
}

/**
 * Badge showing review/rejection status for workflow cards
 */
export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  iteration = 1,
  className = '',
}) => {
  switch (status) {
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded ${className}`}>
          <XCircle className="w-3 h-3" />
          Rejected
          {iteration > 1 && ` (Iter. ${iteration})`}
        </span>
      );
    case 'pending':
      if (iteration > 1) {
        // Re-submitted for review
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded ${className}`}>
            <RefreshCw className="w-3 h-3" />
            Re-Submitted (Iter. {iteration})
          </span>
        );
      }
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 rounded ${className}`}>
          <AlertCircle className="w-3 h-3" />
          Pending Review
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-200 rounded ${className}`}>
          Approved
        </span>
      );
    case 'changes_requested':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded ${className}`}>
          <AlertCircle className="w-3 h-3" />
          Changes Requested
        </span>
      );
    default:
      return null;
  }
};

/**
 * Compact rejection indicator for workflow list views
 */
export interface RejectionIndicatorProps {
  reviewerName?: string;
  rejectedAt?: string;
  className?: string;
}

export const RejectionIndicator: React.FC<RejectionIndicatorProps> = ({
  reviewerName,
  rejectedAt,
  className = '',
}) => {
  const timeAgo = rejectedAt ? formatDistanceToNow(parseISO(rejectedAt), { addSuffix: true }) : 'recently';

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs text-red-700 ${className}`}
      title={`Rejected by ${reviewerName || 'reviewer'} ${timeAgo}`}
    >
      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
      <span className="font-medium">Rejected</span>
    </div>
  );
};
