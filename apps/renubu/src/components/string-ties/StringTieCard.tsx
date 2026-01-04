'use client';

import React, { useState } from 'react';
import { StringTie, StringTieSource } from '@/types/string-ties';
import { X, Clock, Mic, Keyboard, Sparkles } from 'lucide-react';
import { useDismissStringTie, useSnoozeStringTie } from '@/lib/hooks/useStringTies';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDistanceToNow, format, isPast } from 'date-fns';

/**
 * StringTieCard Component
 *
 * Displays a single string-tie reminder with:
 * - Reminder text and original input
 * - Time display (relative or absolute)
 * - Source badge
 * - Dismiss and snooze actions
 */

interface StringTieCardProps {
  stringTie: StringTie;
  className?: string;
}

const SOURCE_CONFIG: Record<StringTieSource, { icon: React.ReactNode; label: string }> = {
  voice: { icon: <Mic className="w-3 h-3" />, label: 'Voice' },
  manual: { icon: <Keyboard className="w-3 h-3" />, label: 'Manual' },
  chat_magic_snippet: { icon: <Sparkles className="w-3 h-3" />, label: 'Magic Snippet' },
};

const SNOOZE_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '1 day', minutes: 1440 },
];

export function StringTieCard({ stringTie, className = '' }: StringTieCardProps) {
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const dismissMutation = useDismissStringTie();
  const snoozeMutation = useSnoozeStringTie();
  const { showToast } = useToast();

  const remindAt = new Date(stringTie.remind_at);
  const isOverdue = isPast(remindAt);
  const sourceConfig = SOURCE_CONFIG[stringTie.source];

  const handleDismiss = async () => {
    try {
      await dismissMutation.mutateAsync(stringTie.id);
      showToast({
        message: 'String tie dismissed',
        type: 'success',
        icon: 'check',
        duration: 3000,
      });
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to dismiss string tie',
        type: 'error',
        icon: 'alert',
        duration: 5000,
      });
    }
  };

  const handleSnooze = async (minutes: number) => {
    try {
      await snoozeMutation.mutateAsync({ id: stringTie.id, minutes });
      showToast({
        message: `Snoozed for ${minutes >= 60 ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''}` : `${minutes} min`}`,
        type: 'success',
        icon: 'clock',
        duration: 3000,
      });
      setShowSnoozeDropdown(false);
      setShowCustomInput(false);
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to snooze string tie',
        type: 'error',
        icon: 'alert',
        duration: 5000,
      });
    }
  };

  const handleCustomSnooze = () => {
    const minutes = parseInt(customMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      showToast({
        message: 'Please enter a valid number of minutes',
        type: 'error',
        icon: 'alert',
        duration: 3000,
      });
      return;
    }
    handleSnooze(minutes);
  };

  return (
    <div
      className={`
        bg-white rounded-lg border shadow-sm p-4 transition-all
        ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:shadow-md'}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Reminder Text */}
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {stringTie.reminder_text}
          </h3>

          {/* Original Input */}
          <p className="text-sm text-gray-500 italic mb-3">
            "{stringTie.content}"
          </p>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time Display */}
            <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              <Clock className="w-4 h-4" />
              {isOverdue ? (
                <span>{formatDistanceToNow(remindAt, { addSuffix: true })}</span>
              ) : (
                <span>in {formatDistanceToNow(remindAt)}</span>
              )}
            </div>

            {/* Absolute Time */}
            <div className="text-xs text-gray-400">
              {format(remindAt, 'EEE, MMM d')} at {format(remindAt, 'h:mm a')}
            </div>

            {/* Source Badge */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
              {sourceConfig.icon}
              <span>{sourceConfig.label}</span>
            </div>

            {/* Created At */}
            <div className="text-xs text-gray-400">
              Created {formatDistanceToNow(new Date(stringTie.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Snooze Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
              disabled={snoozeMutation.isPending}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Snooze"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Snooze Dropdown */}
            {showSnoozeDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                <div className="py-1">
                  {SNOOZE_OPTIONS.map((option) => (
                    <button
                      key={option.minutes}
                      onClick={() => handleSnooze(option.minutes)}
                      disabled={snoozeMutation.isPending}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="w-full px-4 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 border-t border-gray-100"
                  >
                    Custom...
                  </button>

                  {/* Custom Input */}
                  {showCustomInput && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value)}
                          placeholder="Min"
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCustomSnooze();
                            }
                          }}
                        />
                        <button
                          onClick={handleCustomSnooze}
                          disabled={snoozeMutation.isPending}
                          className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            disabled={dismissMutation.isPending}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
