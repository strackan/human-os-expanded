'use client';

/**
 * TriggerBuilder Component
 *
 * Allows CSMs to configure date or event triggers for workflow wake conditions.
 * Supports multiple triggers with OR logic (any trigger fires = workflow wakes).
 *
 * Features:
 * - Add/remove triggers dynamically
 * - Date trigger with timezone support
 * - Event trigger with type selection
 * - Event-specific configuration fields
 * - Validation (at least 1 trigger required)
 * - Clear, non-technical labels
 */

import React, { useState } from 'react';
import { Calendar, Zap, Plus, X, AlertCircle } from 'lucide-react';
import type {
  WakeTrigger,
  DateTriggerConfig,
  EventTriggerConfig,
  EventType,
  WorkflowActionCompletedConfig,
  UsageThresholdConfig,
  ManualEventConfig,
} from '@/types/wake-triggers';

// =====================================================
// Types
// =====================================================

export interface TriggerBuilderProps {
  triggers: WakeTrigger[];
  onChange: (triggers: WakeTrigger[]) => void;
  maxTriggers?: number;
  className?: string;
}

interface TriggerFormData {
  id: string;
  type: 'date' | 'event';
  // Date fields
  dateValue?: string;
  timeValue?: string;
  timezone?: string;
  // Event fields
  eventType?: EventType;
  eventConfig?: Record<string, unknown>;
}

// =====================================================
// TriggerBuilder Component
// =====================================================

export const TriggerBuilder: React.FC<TriggerBuilderProps> = ({
  triggers,
  onChange,
  maxTriggers = 3,
  className = '',
}) => {
  const [formTriggers, setFormTriggers] = useState<TriggerFormData[]>(() => {
    if (triggers.length === 0) {
      return [createEmptyTrigger()];
    }
    return triggers.map((t) => convertTriggerToForm(t));
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert internal trigger to form data
  function convertTriggerToForm(trigger: WakeTrigger): TriggerFormData {
    if (trigger.type === 'date') {
      const config = trigger.config as DateTriggerConfig;
      const [dateValue, timeValue] = config.date.split('T');
      return {
        id: trigger.id,
        type: 'date',
        dateValue,
        timeValue: timeValue?.split('.')[0] || '09:00:00',
        timezone: config.timezone,
      };
    } else {
      const config = trigger.config as EventTriggerConfig;
      return {
        id: trigger.id,
        type: 'event',
        eventType: config.eventType,
        eventConfig: config.eventConfig,
      };
    }
  }

  // Convert form data to internal trigger
  function convertFormToTrigger(form: TriggerFormData): WakeTrigger | null {
    if (form.type === 'date') {
      if (!form.dateValue || !form.timeValue) return null;
      const config: DateTriggerConfig = {
        date: `${form.dateValue}T${form.timeValue}Z`,
        timezone: form.timezone || 'UTC',
      };
      return {
        id: form.id,
        type: 'date',
        config,
        createdAt: new Date().toISOString(),
      };
    } else {
      if (!form.eventType) return null;
      const config: EventTriggerConfig = {
        eventType: form.eventType,
        eventConfig: form.eventConfig,
      };
      return {
        id: form.id,
        type: 'event',
        config,
        createdAt: new Date().toISOString(),
      };
    }
  }

  function createEmptyTrigger(): TriggerFormData {
    return {
      id: `trigger-${Date.now()}-${Math.random()}`,
      type: 'date',
      dateValue: '',
      timeValue: '09:00:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const handleTriggerChange = (index: number, updates: Partial<TriggerFormData>) => {
    const newTriggers = [...formTriggers];
    newTriggers[index] = { ...newTriggers[index], ...updates };
    setFormTriggers(newTriggers);

    // Convert to internal format and notify parent
    const validTriggers = newTriggers
      .map((t) => convertFormToTrigger(t))
      .filter((t): t is WakeTrigger => t !== null);
    onChange(validTriggers);

    // Clear error for this trigger
    const newErrors = { ...errors };
    delete newErrors[newTriggers[index].id];
    setErrors(newErrors);
  };

  const addTrigger = () => {
    if (formTriggers.length >= maxTriggers) {
      return;
    }
    const newTrigger = createEmptyTrigger();
    setFormTriggers([...formTriggers, newTrigger]);
  };

  const removeTrigger = (index: number) => {
    if (formTriggers.length === 1) {
      return; // Must have at least 1 trigger
    }
    const newTriggers = formTriggers.filter((_, i) => i !== index);
    setFormTriggers(newTriggers);

    const validTriggers = newTriggers
      .map((t) => convertFormToTrigger(t))
      .filter((t): t is WakeTrigger => t !== null);
    onChange(validTriggers);
  };

  const validateTrigger = (trigger: TriggerFormData): string | null => {
    if (trigger.type === 'date') {
      if (!trigger.dateValue) return 'Date is required';
      if (!trigger.timeValue) return 'Time is required';
    } else if (trigger.type === 'event') {
      if (!trigger.eventType) return 'Event type is required';
    }
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        {formTriggers.map((trigger, index) => (
          <TriggerRow
            key={trigger.id}
            trigger={trigger}
            index={index}
            onChange={(updates) => handleTriggerChange(index, updates)}
            onRemove={() => removeTrigger(index)}
            canRemove={formTriggers.length > 1}
            error={errors[trigger.id]}
          />
        ))}
      </div>

      {/* Add Trigger Button */}
      {formTriggers.length < maxTriggers && (
        <button
          type="button"
          onClick={addTrigger}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Another Trigger (OR logic)
        </button>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 italic">
        The workflow will wake when ANY of these triggers fires (OR logic).
      </div>
    </div>
  );
};

// =====================================================
// TriggerRow Component
// =====================================================

interface TriggerRowProps {
  trigger: TriggerFormData;
  index: number;
  onChange: (updates: Partial<TriggerFormData>) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: string;
}

const TriggerRow: React.FC<TriggerRowProps> = ({
  trigger,
  index,
  onChange,
  onRemove,
  canRemove,
  error,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          Trigger {index + 1}
        </label>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Remove trigger"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Trigger Type Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ type: 'date' })}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            trigger.type === 'date'
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Date
        </button>
        <button
          type="button"
          onClick={() => onChange({ type: 'event' })}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            trigger.type === 'event'
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Event
        </button>
      </div>

      {/* Date Configuration */}
      {trigger.type === 'date' && (
        <DateTriggerConfig
          dateValue={trigger.dateValue || ''}
          timeValue={trigger.timeValue || '09:00:00'}
          timezone={trigger.timezone}
          onChange={(updates) => onChange(updates)}
        />
      )}

      {/* Event Configuration */}
      {trigger.type === 'event' && (
        <EventTriggerConfig
          eventType={trigger.eventType}
          eventConfig={trigger.eventConfig}
          onChange={(updates) => onChange(updates)}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

// =====================================================
// Date Trigger Configuration
// =====================================================

interface DateTriggerConfigProps {
  dateValue: string;
  timeValue: string;
  timezone?: string;
  onChange: (updates: Partial<TriggerFormData>) => void;
}

const DateTriggerConfig: React.FC<DateTriggerConfigProps> = ({
  dateValue,
  timeValue,
  timezone,
  onChange,
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Wake on:
        </label>
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onChange({ dateValue: e.target.value })}
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
          value={timeValue}
          onChange={(e) => onChange({ timeValue: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Timezone:
        </label>
        <select
          value={timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            Auto-detect ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </option>
        </select>
      </div>
    </div>
  );
};

// =====================================================
// Event Trigger Configuration
// =====================================================

interface EventTriggerConfigProps {
  eventType?: EventType;
  eventConfig?: Record<string, unknown>;
  onChange: (updates: Partial<TriggerFormData>) => void;
}

const EventTriggerConfig: React.FC<EventTriggerConfigProps> = ({
  eventType,
  eventConfig,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Event Type:
        </label>
        <select
          value={eventType || ''}
          onChange={(e) => onChange({ eventType: e.target.value as EventType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select event type...</option>
          <option value="workflow_action_completed">
            Workflow action completed
          </option>
          <option value="customer_login">Customer logs in</option>
          <option value="usage_threshold_crossed">
            Usage threshold crossed
          </option>
          <option value="manual_event">Manual event</option>
        </select>
      </div>

      {/* Event-specific configuration */}
      {eventType === 'workflow_action_completed' && (
        <WorkflowActionCompletedConfigFields
          config={eventConfig as WorkflowActionCompletedConfig | undefined}
          onChange={(config) => onChange({ eventConfig: config as unknown as Record<string, unknown> })}
        />
      )}

      {eventType === 'usage_threshold_crossed' && (
        <UsageThresholdConfigFields
          config={eventConfig as UsageThresholdConfig | undefined}
          onChange={(config) => onChange({ eventConfig: config as unknown as Record<string, unknown> })}
        />
      )}

      {eventType === 'manual_event' && (
        <ManualEventConfigFields
          config={eventConfig as ManualEventConfig | undefined}
          onChange={(config) => onChange({ eventConfig: config as unknown as Record<string, unknown> })}
        />
      )}
    </div>
  );
};

// =====================================================
// Event-Specific Config Fields
// =====================================================

interface WorkflowActionCompletedConfigFieldsProps {
  config?: WorkflowActionCompletedConfig;
  onChange: (config: WorkflowActionCompletedConfig) => void;
}

const WorkflowActionCompletedConfigFields: React.FC<
  WorkflowActionCompletedConfigFieldsProps
> = ({ config, onChange }) => {
  return (
    <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
      <p>This workflow will wake when a specific workflow action is completed.</p>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Workflow Execution ID (optional):
        </label>
        <input
          type="text"
          value={config?.workflowExecutionId || ''}
          onChange={(e) =>
            onChange({
              workflowExecutionId: e.target.value,
              actionId: config?.actionId,
              actionType: config?.actionType,
            })
          }
          placeholder="Leave blank to watch any workflow"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

interface UsageThresholdConfigFieldsProps {
  config?: UsageThresholdConfig;
  onChange: (config: UsageThresholdConfig) => void;
}

const UsageThresholdConfigFields: React.FC<
  UsageThresholdConfigFieldsProps
> = ({ config, onChange }) => {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Metric Name:
        </label>
        <input
          type="text"
          value={config?.metricName || ''}
          onChange={(e) =>
            onChange({
              metricName: e.target.value,
              threshold: config?.threshold || 0,
              operator: config?.operator || '>',
            })
          }
          placeholder="e.g., active_users, api_calls"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Operator:
          </label>
          <select
            value={config?.operator || '>'}
            onChange={(e) =>
              onChange({
                metricName: config?.metricName || '',
                threshold: config?.threshold || 0,
                operator: e.target.value as UsageThresholdConfig['operator'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value=">">Greater than</option>
            <option value=">=">Greater than or equal</option>
            <option value="<">Less than</option>
            <option value="<=">Less than or equal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Threshold:
          </label>
          <input
            type="number"
            value={config?.threshold || ''}
            onChange={(e) =>
              onChange({
                metricName: config?.metricName || '',
                threshold: parseFloat(e.target.value),
                operator: config?.operator || '>',
              })
            }
            placeholder="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

interface ManualEventConfigFieldsProps {
  config?: ManualEventConfig;
  onChange: (config: ManualEventConfig) => void;
}

const ManualEventConfigFields: React.FC<ManualEventConfigFieldsProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Event Key:
        </label>
        <input
          type="text"
          value={config?.eventKey || ''}
          onChange={(e) =>
            onChange({
              eventKey: e.target.value,
              description: config?.description,
            })
          }
          placeholder="e.g., payment_received"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Description (optional):
        </label>
        <input
          type="text"
          value={config?.description || ''}
          onChange={(e) =>
            onChange({
              eventKey: config?.eventKey || '',
              description: e.target.value,
            })
          }
          placeholder="Human-readable description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};
