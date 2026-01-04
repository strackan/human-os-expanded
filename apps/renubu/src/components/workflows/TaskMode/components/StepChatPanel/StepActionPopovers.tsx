'use client';

/**
 * StepActionPopovers - Compact inline popovers for step snooze/skip actions
 *
 * Replaces the full-screen modals with subtle, contextual popovers
 * that appear next to the action buttons.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, SkipForward } from 'lucide-react';
import { WorkflowStepActionService } from '@/lib/workflows/actions/WorkflowStepActionService';

interface SnoozePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  executionId: string;
  userId: string;
  stepIndex: number;
  stepId: string;
  stepLabel: string;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function SnoozePopover({
  isOpen,
  onClose,
  onSuccess,
  executionId,
  userId,
  stepIndex,
  stepId,
  stepLabel,
}: SnoozePopoverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSnooze = useCallback(async (days: number) => {
    setError('');
    setIsProcessing(true);

    try {
      const service = new WorkflowStepActionService();
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const result = await service.snoozeStep(
        executionId,
        stepIndex,
        stepId,
        stepLabel,
        userId,
        { until, days }
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsProcessing(false);
    }
  }, [executionId, stepIndex, stepId, stepLabel, userId, onSuccess, onClose]);

  if (!isOpen) return null;

  const options = [
    { label: 'Tomorrow', days: 1 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
        Snooze until
      </div>
      {options.map((opt) => (
        <button
          key={opt.days}
          onClick={() => handleSnooze(opt.days)}
          disabled={isProcessing}
          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Clock className="w-3 h-3" />
          {opt.label}
        </button>
      ))}
      {error && (
        <div className="px-3 py-1.5 text-xs text-red-600 border-t border-gray-100">
          {error}
        </div>
      )}
    </div>
  );
}

interface SkipPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  executionId: string;
  userId: string;
  stepIndex: number;
  stepId: string;
  stepLabel: string;
}

export function SkipPopover({
  isOpen,
  onClose,
  onSuccess,
  executionId,
  userId,
  stepIndex,
  stepId,
  stepLabel,
}: SkipPopoverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSkip = useCallback(async (reason: string) => {
    setError('');
    setIsProcessing(true);

    try {
      const service = new WorkflowStepActionService();
      const result = await service.skipStep(
        executionId,
        stepIndex,
        stepId,
        stepLabel,
        userId,
        { reason }
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsProcessing(false);
    }
  }, [executionId, stepIndex, stepId, stepLabel, userId, onSuccess, onClose]);

  if (!isOpen) return null;

  const quickReasons = [
    'Not relevant',
    'Already done',
    'Will do later',
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
        Skip reason
      </div>
      {quickReasons.map((reason) => (
        <button
          key={reason}
          onClick={() => handleSkip(reason)}
          disabled={isProcessing}
          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <SkipForward className="w-3 h-3" />
          {reason}
        </button>
      ))}
      {error && (
        <div className="px-3 py-1.5 text-xs text-red-600 border-t border-gray-100">
          {error}
        </div>
      )}
    </div>
  );
}
