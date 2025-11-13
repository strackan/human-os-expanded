'use client';

/**
 * EnhancedSnoozeModal Component
 *
 * Replaces the basic snooze modal with trigger-aware version.
 * Allows CSMs to configure date and event triggers for smart workflow wake.
 *
 * Features:
 * - Quick snooze options (1 day, 3 days, 1 week, custom)
 * - Simple vs. Smart mode toggle
 * - Embedded TriggerBuilder for event triggers
 * - Preview of wake conditions
 * - Validation and error handling
 */

import React, { useState } from 'react';
import { X, Clock, Sparkles } from 'lucide-react';
import { TriggerBuilder } from './triggers/TriggerBuilder';
import { WakeTrigger, DateTriggerConfig } from '@/types/wake-triggers';

// =====================================================
// Types
// =====================================================

export interface EnhancedSnoozeModalProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
  onSnooze: (triggers: WakeTrigger[]) => Promise<void>;
  className?: string;
}

type SnoozeMode = 'simple' | 'smart';
type QuickOption = '1day' | '3days' | '1week' | 'custom';

// =====================================================
// EnhancedSnoozeModal Component
// =====================================================

export const EnhancedSnoozeModal: React.FC<EnhancedSnoozeModalProps> = ({
  workflowId,
  isOpen,
  onClose,
  onSnooze,
  className = '',
}) => {
  const [mode, setMode] = useState<SnoozeMode>('simple');
  const [quickOption, setQuickOption] = useState<QuickOption>('1day');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [triggers, setTriggers] = useState<WakeTrigger[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

  const handleSnooze = async () => {
    setError('');
    setIsProcessing(true);

    try {
      let finalTriggers: WakeTrigger[];

      if (mode === 'simple') {
        // Simple mode: only date trigger
        const date = getDateFromQuickOption();
        const dateTrigger: WakeTrigger = {
          id: `trigger-${Date.now()}`,
          type: 'date',
          config: {
            date: date.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } as DateTriggerConfig,
          createdAt: new Date().toISOString(),
        };
        finalTriggers = [dateTrigger];
      } else {
        // Smart mode: date + event triggers
        const date = getDateFromQuickOption();
        const dateTrigger: WakeTrigger = {
          id: `trigger-date-${Date.now()}`,
          type: 'date',
          config: {
            date: date.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } as DateTriggerConfig,
          createdAt: new Date().toISOString(),
        };

        // Combine date trigger with event triggers
        finalTriggers = [dateTrigger, ...triggers];

        if (finalTriggers.length === 1) {
          setError('Please add at least one event trigger in smart mode');
          setIsProcessing(false);
          return;
        }
      }

      await onSnooze(finalTriggers);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to snooze workflow');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewText = (): string => {
    const date = getDateFromQuickOption();
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (mode === 'simple') {
      return `Wake on ${dateStr}`;
    } else {
      if (triggers.length === 0) {
        return `Wake on ${dateStr} OR when [add triggers below]`;
      }
      const eventDescriptions = triggers
        .filter((t) => t.type === 'event')
        .map((t: any) => {
          const eventType = t.config.eventType;
          return eventType.replace(/_/g, ' ');
        });
      return `Wake on ${dateStr} OR when: ${eventDescriptions.join(', ')}`;
    }
  };

  const today = new Date().toISOString().split('T')[0];

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
          <Clock className="w-5 h-5" />
          Snooze Workflow
        </h3>

        <div className="space-y-6">
          {/* Quick Options */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              How long should this workflow snooze?
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

          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Wake this workflow when:
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'simple'}
                  onChange={() => setMode('simple')}
                  className="mr-3"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Date reached only (simple)
                  </div>
                  <div className="text-xs text-gray-500">
                    Wake at the specified date and time
                  </div>
                </div>
              </label>
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'smart'}
                  onChange={() => setMode('smart')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    Date OR condition met (smart)
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Wake early if important events happen
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Trigger Builder (Smart Mode) */}
          {mode === 'smart' && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Additional Wake Conditions
              </h4>
              <TriggerBuilder
                triggers={triggers}
                onChange={setTriggers}
                maxTriggers={2}
              />
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
            onClick={handleSnooze}
            disabled={isProcessing || (quickOption === 'custom' && !customDate)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {isProcessing ? 'Snoozing...' : 'Snooze Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
};
