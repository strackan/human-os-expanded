/**
 * Step Action Modals
 *
 * Snooze and Skip modals for individual workflow steps
 */

'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { WorkflowStepActionService } from '@/lib/workflows/actions';

interface StepSnoozeModalProps {
  executionId: string;
  userId: string;
  stepIndex: number;
  stepId: string;
  stepLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function StepSnoozeModal({
  executionId,
  userId,
  stepIndex,
  stepId,
  stepLabel,
  onClose,
  onSuccess
}: StepSnoozeModalProps) {
  const [snoozeOption, setSnoozeOption] = useState<'1day' | '1week' | 'custom'>('1day');
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSnooze = async () => {
    setError('');
    setIsProcessing(true);

    try {
      const service = new WorkflowStepActionService();

      let until: Date;
      let days: number;

      if (snoozeOption === '1day') {
        until = new Date(Date.now() + 24 * 60 * 60 * 1000);
        days = 1;
      } else if (snoozeOption === '1week') {
        until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        days = 7;
      } else {
        if (!customDate) {
          setError('Please select a date');
          setIsProcessing(false);
          return;
        }
        until = new Date(customDate);
        days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      }

      const result = await service.snoozeStep(
        executionId,
        stepIndex,
        stepId,
        stepLabel,
        userId,
        { until, days, reason }
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to snooze step');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900">Snooze Step: {stepLabel}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Snooze until:
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="1day"
                  checked={snoozeOption === '1day'}
                  onChange={(e) => setSnoozeOption(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900">Tomorrow</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="1week"
                  checked={snoozeOption === '1week'}
                  onChange={(e) => setSnoozeOption(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900">Next week</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="custom"
                  checked={snoozeOption === 'custom'}
                  onChange={(e) => setSnoozeOption(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900">Custom date</span>
              </label>
            </div>
          </div>

          {snoozeOption === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Select date:
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Reason (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you snoozing this step?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSnooze}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {isProcessing ? 'Snoozing...' : 'Snooze'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface StepSkipModalProps {
  executionId: string;
  userId: string;
  stepIndex: number;
  stepId: string;
  stepLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function StepSkipModal({
  executionId,
  userId,
  stepIndex,
  stepId,
  stepLabel,
  onClose,
  onSuccess
}: StepSkipModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSkip = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for skipping');
      return;
    }

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
      } else {
        setError(result.error || 'Failed to skip step');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900">Skip Step: {stepLabel}</h3>

        <p className="text-sm text-gray-600 mb-4">
          Skipping this step will mark it as skipped. You can continue with other steps.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Reason for skipping: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Not relevant for this customer, Already handled, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSkip}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {isProcessing ? 'Skipping...' : 'Skip Step'}
          </button>
        </div>
      </div>
    </div>
  );
}
