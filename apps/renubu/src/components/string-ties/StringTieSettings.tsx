'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Loader2, Check } from 'lucide-react';
import { useStringTieSettings, useUpdateStringTieSettings } from '@/lib/hooks/useStringTies';
import { useToast } from '@/components/ui/ToastProvider';

/**
 * StringTieSettings Component
 *
 * User preferences for string-tie reminders:
 * - Default reminder time offset
 * - Save with toast notification
 */

interface StringTieSettingsProps {
  className?: string;
}

const DEFAULT_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '1 day', value: 1440 },
  { label: '1 week', value: 10080 },
];

export function StringTieSettings({ className = '' }: StringTieSettingsProps) {
  const [selectedValue, setSelectedValue] = useState<number>(60); // Default 1 hour
  const [customMinutes, setCustomMinutes] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useStringTieSettings();
  const updateMutation = useUpdateStringTieSettings();
  const { showToast } = useToast();

  // Initialize from settings
  useEffect(() => {
    if (settings?.string_tie_default_offset_minutes) {
      const value = settings.string_tie_default_offset_minutes;
      const predefinedOption = DEFAULT_OPTIONS.find((opt) => opt.value === value);

      if (predefinedOption) {
        setSelectedValue(value);
        setIsCustom(false);
      } else {
        setSelectedValue(value);
        setCustomMinutes(String(value));
        setIsCustom(true);
      }
    }
  }, [settings]);

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      setHasChanges(true);
    } else {
      const numValue = parseInt(value, 10);
      setSelectedValue(numValue);
      setIsCustom(false);
      setHasChanges(true);
    }
  };

  const handleCustomChange = (value: string) => {
    setCustomMinutes(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedValue(numValue);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      // Validate custom input if custom mode
      if (isCustom) {
        const numValue = parseInt(customMinutes, 10);
        if (isNaN(numValue) || numValue <= 0) {
          showToast({
            message: 'Please enter a valid number of minutes',
            type: 'error',
            icon: 'alert',
            duration: 3000,
          });
          return;
        }
      }

      await updateMutation.mutateAsync({
        string_tie_default_offset_minutes: selectedValue,
      });

      showToast({
        message: 'Settings saved successfully',
        type: 'success',
        icon: 'check',
        duration: 3000,
      });

      setHasChanges(false);
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to save settings',
        type: 'error',
        icon: 'alert',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Default Reminder Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default reminder time
          </label>
          <p className="text-xs text-gray-500 mb-3">
            When no time is specified, reminders will default to this duration
          </p>

          <select
            value={isCustom ? 'custom' : String(selectedValue)}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {DEFAULT_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
            <option value="custom">Custom...</option>
          </select>
        </div>

        {/* Custom Input */}
        {isCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom duration (minutes)
            </label>
            <input
              type="number"
              value={customMinutes}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Enter minutes"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {customMinutes && !isNaN(parseInt(customMinutes))
                ? `= ${Math.floor(parseInt(customMinutes) / 60)} hours ${parseInt(customMinutes) % 60} minutes`
                : 'Enter a positive number'}
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending || (isCustom && (!customMinutes || isNaN(parseInt(customMinutes))))}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>

        {hasChanges && !updateMutation.isPending && (
          <p className="text-xs text-amber-600 text-center">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}
