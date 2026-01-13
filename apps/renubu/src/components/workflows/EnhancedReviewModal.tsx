'use client';

/**
 * EnhancedReviewModal Component - Phase 1.2B
 *
 * Review modal with trigger-aware notifications.
 * Allows CSMs to request review from managers with date and event triggers for smart notifications.
 *
 * Review-only semantics: Original user keeps ownership but is blocked until reviewer approves.
 *
 * Features:
 * - Quick review options (1 day, 3 days, 1 week, custom)
 * - Three modes: date-only, event-only, date+events
 * - AND/OR logic for combining triggers
 * - Reviewer selector
 * - Embedded TriggerBuilder for event triggers
 * - Preview of notification conditions
 * - Validation and error handling
 */

import React, { useState } from 'react';
import { X, Clock, Sparkles, Zap, Shield } from 'lucide-react';
import { TriggerBuilder } from './triggers/TriggerBuilder';
import { ReviewTrigger, DateTriggerConfig, TriggerLogic } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface EnhancedReviewModalProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
  onReview: (triggers: ReviewTrigger[], reviewerId: string, logic?: TriggerLogic, reason?: string) => Promise<void>;
  className?: string;
  availableReviewers?: Array<{ id: string; name: string; email: string }>;
}

type ReviewMode = 'date-only' | 'event-only' | 'date-and-events';
type QuickOption = '1day' | '3days' | '1week' | 'custom';

// =====================================================
// EnhancedReviewModal Component
// =====================================================

export const EnhancedReviewModal: React.FC<EnhancedReviewModalProps> = ({
  workflowId,
  isOpen,
  onClose,
  onReview,
  className = '',
  availableReviewers = [],
}) => {
  const [mode, setMode] = useState<ReviewMode>('date-only');
  const [quickOption, setQuickOption] = useState<QuickOption>('1day');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [triggers, setTriggers] = useState<ReviewTrigger[]>([]);
  const [triggerLogic, setTriggerLogic] = useState<TriggerLogic>('OR');
  const [reviewerId, setReviewerId] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  console.log('[EnhancedReviewModal] Render - isOpen:', isOpen, 'workflowId:', workflowId);

  if (!isOpen) {
    console.log('[EnhancedReviewModal] Not open - returning null');
    return null;
  }

  console.log('[EnhancedReviewModal] Modal is open - rendering...');

  const getDateFromQuickOption = (): Date => {
    const now = new Date();
    switch (quickOption) {
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '1week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'custom':
        if (!customDate) return now;
        return new Date(`${customDate}T${customTime}`);
      default:
        return now;
    }
  };

  const handleReview = async () => {
    setError('');
    setIsProcessing(true);

    try {
      // Validate reviewer
      if (!reviewerId) {
        setError('Please select a reviewer');
        setIsProcessing(false);
        return;
      }

      let finalTriggers: ReviewTrigger[];
      let finalLogic: TriggerLogic = triggerLogic;

      if (mode === 'date-only') {
        // Date-only mode: only date trigger
        const date = getDateFromQuickOption();
        const dateTrigger: ReviewTrigger = {
          id: `trigger-date-${Date.now()}`,
          type: 'date',
          config: {
            date: date.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } as DateTriggerConfig,
          createdAt: new Date().toISOString(),
        };
        finalTriggers = [dateTrigger];
        finalLogic = 'OR'; // Single trigger, logic doesn't matter
      } else if (mode === 'event-only') {
        // Event-only mode: only event triggers
        if (triggers.length === 0) {
          setError('Please add at least one event trigger in event-only mode');
          setIsProcessing(false);
          return;
        }
        finalTriggers = triggers;
      } else {
        // Date + Events mode: combine both
        const date = getDateFromQuickOption();
        const dateTrigger: ReviewTrigger = {
          id: `trigger-date-${Date.now()}`,
          type: 'date',
          config: {
            date: date.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } as DateTriggerConfig,
          createdAt: new Date().toISOString(),
        };

        if (triggers.length === 0) {
          setError('Please add at least one event trigger in date+events mode');
          setIsProcessing(false);
          return;
        }

        finalTriggers = [dateTrigger, ...triggers];
      }

      console.log('[EnhancedReviewModal] Requesting review with triggers:', finalTriggers, 'logic:', finalLogic, 'reviewer:', reviewerId);
      await onReview(finalTriggers, reviewerId, finalLogic, reviewReason || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to request review');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewText = (): string => {
    const selectedReviewer = availableReviewers.find(u => u.id === reviewerId);
    const reviewerName = selectedReviewer ? selectedReviewer.name : 'selected reviewer';

    if (mode === 'date-only') {
      const date = getDateFromQuickOption();
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      return `Notify ${reviewerName} on ${dateStr}`;
    } else if (mode === 'event-only') {
      if (triggers.length === 0) {
        return `Notify ${reviewerName} when [add triggers below]`;
      }
      const eventDescriptions = triggers
        .map((t: any) => t.config.eventType.replace(/_/g, ' '))
        .join(triggerLogic === 'OR' ? ' OR ' : ' AND ');
      return `Notify ${reviewerName} when: ${eventDescriptions}`;
    } else {
      // date-and-events
      const date = getDateFromQuickOption();
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (triggers.length === 0) {
        return `Notify ${reviewerName} on ${dateStr} ${triggerLogic} when [add triggers below]`;
      }

      const eventDescriptions = triggers
        .map((t: any) => t.config.eventType.replace(/_/g, ' '))
        .join(triggerLogic === 'OR' ? ' OR ' : ' AND ');

      if (triggerLogic === 'OR') {
        return `Notify ${reviewerName} on ${dateStr} OR when: ${eventDescriptions}`;
      } else {
        return `Notify ${reviewerName} when date reached (${dateStr}) AND: ${eventDescriptions}`;
      }
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const showDatePicker = mode === 'date-only' || mode === 'date-and-events';
  const showEventBuilder = mode === 'event-only' || mode === 'date-and-events';
  const showLogicToggle = mode === 'date-and-events' || (mode === 'event-only' && triggers.length > 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Close Button */}
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
          Request Review
        </h3>

        <div className="space-y-6">
          {/* Reviewer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Request review from:
            </label>
            <select
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reviewer...</option>
              {availableReviewers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Review Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Reason for review (optional):
            </label>
            <input
              type="text"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="e.g., High-value pricing decision"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              You&apos;ll keep ownership of this workflow but won&apos;t be able to complete it until approved
            </p>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notify reviewer when:
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'date-only'}
                  onChange={() => setMode('date-only')}
                  className="mr-3"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Date reached (simple)
                  </div>
                  <div className="text-xs text-gray-500">
                    Notify at a specific date and time
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'event-only'}
                  onChange={() => setMode('event-only')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    Event occurs (smart)
                  </div>
                  <div className="text-xs text-gray-500">
                    Notify when specific conditions are met (no date required)
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'date-and-events'}
                  onChange={() => setMode('date-and-events')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Date + Events (advanced)
                  </div>
                  <div className="text-xs text-gray-500">
                    Combine date and event triggers with AND/OR logic
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Date Picker Section */}
          {showDatePicker && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {mode === 'date-and-events' ? 'Date trigger:' : 'When should notification be sent?'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickOption('1day')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      quickOption === '1day'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    1 day
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickOption('3days')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      quickOption === '3days'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    3 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickOption('1week')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      quickOption === '1week'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    1 week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickOption('custom')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      quickOption === 'custom'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom Date/Time Picker */}
              {quickOption === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Date:
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Time:
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Trigger Builder (Event Modes) */}
          {showEventBuilder && (
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {mode === 'event-only' ? 'Notification Conditions' : 'Additional Notification Conditions'}
              </h4>
              <TriggerBuilder
                triggers={triggers as any[]}
                onChange={setTriggers as any}
                maxTriggers={3}
              />
            </div>
          )}

          {/* AND/OR Logic Toggle */}
          {showLogicToggle && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Trigger logic:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTriggerLogic('OR')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    triggerLogic === 'OR'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">OR (Any)</div>
                  <div className="text-xs mt-1">Notify when ANY condition is met</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerLogic('AND')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    triggerLogic === 'AND'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">AND (All)</div>
                  <div className="text-xs mt-1">Notify only when ALL conditions are met</div>
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview:</h4>
            <p className="text-sm text-gray-700">{getPreviewText()}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleReview}
            disabled={
              isProcessing ||
              !reviewerId ||
              (showDatePicker && quickOption === 'custom' && !customDate) ||
              (mode === 'event-only' && triggers.length === 0)
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {isProcessing ? 'Requesting Review...' : 'Request Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Backward Compatibility
// =====================================================

/**
 * @deprecated Use EnhancedReviewModal instead
 * Backward compatibility alias for escalate → review transition
 */
export const EnhancedEscalateModal = EnhancedReviewModal;
export type EnhancedEscalateModalProps = EnhancedReviewModalProps;
