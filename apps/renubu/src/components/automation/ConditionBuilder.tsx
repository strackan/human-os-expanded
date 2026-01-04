'use client';

/**
 * ConditionBuilder Component
 *
 * Reusable component for building event conditions.
 * Supports up to 2 conditions with event-specific configuration forms.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import React, { useState } from 'react';
import { Plus, X, Mail, Calendar, MessageSquare, User, TrendingUp, CheckCircle } from 'lucide-react';
import type {
  EventCondition,
  EventSource,
  GmailReceivedConfig,
  CalendarEventConfig,
  SlackMessageConfig,
  UsageThresholdConfig,
  WorkflowActionCompletedConfig,
} from '@/types/automation-rules';

// =====================================================
// Types
// =====================================================

export interface ConditionBuilderProps {
  conditions: EventCondition[];
  onChange: (conditions: EventCondition[]) => void;
  maxConditions?: number;
  className?: string;
}

interface EventSourceOption {
  value: EventSource;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// =====================================================
// Event Source Options
// =====================================================

const EVENT_SOURCE_OPTIONS: EventSourceOption[] = [
  {
    value: 'gmail_received',
    label: 'Gmail Received',
    icon: <Mail className="w-4 h-4" />,
    description: 'Trigger when a new email is received',
  },
  {
    value: 'calendar_event',
    label: 'Calendar Event',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Trigger when a calendar event occurs',
  },
  {
    value: 'slack_message',
    label: 'Slack Message',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Trigger when a Slack message is received',
  },
  {
    value: 'customer_login',
    label: 'Customer Login',
    icon: <User className="w-4 h-4" />,
    description: 'Trigger when a customer logs in',
  },
  {
    value: 'usage_threshold',
    label: 'Usage Threshold',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Trigger when usage metrics cross a threshold',
  },
  {
    value: 'workflow_action_completed',
    label: 'Workflow Action',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Trigger when a workflow action completes',
  },
];

// =====================================================
// ConditionBuilder Component
// =====================================================

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  maxConditions = 2,
  className = '',
}) => {
  const [expandedConditionId, setExpandedConditionId] = useState<string | null>(
    conditions.length > 0 ? conditions[0].id : null
  );

  const addCondition = () => {
    if (conditions.length >= maxConditions) return;

    const newCondition: EventCondition = {
      id: `condition-${Date.now()}`,
      source: 'gmail_received',
      config: {},
    };

    onChange([...conditions, newCondition]);
    setExpandedConditionId(newCondition.id);
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<EventCondition>) => {
    onChange(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Condition List */}
      {conditions.map((condition, index) => (
        <div key={condition.id} className="border border-gray-200 rounded-lg p-4 bg-white">
          {/* Condition Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Condition {index + 1}
            </h4>
            <button
              onClick={() => removeCondition(condition.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Remove condition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Event Source Selector */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Source
            </label>
            <select
              value={condition.source}
              onChange={(e) =>
                updateCondition(condition.id, {
                  source: e.target.value as EventSource,
                  config: {},
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EVENT_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {EVENT_SOURCE_OPTIONS.find((o) => o.value === condition.source)?.description}
            </p>
          </div>

          {/* Event-Specific Configuration */}
          <EventConfigForm
            source={condition.source}
            config={condition.config}
            onChange={(newConfig) =>
              updateCondition(condition.id, { config: newConfig })
            }
          />
        </div>
      ))}

      {/* Add Condition Button */}
      {conditions.length < maxConditions && (
        <button
          onClick={addCondition}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Condition {conditions.length > 0 && `(${conditions.length}/${maxConditions})`}
        </button>
      )}

      {/* Condition Count */}
      {conditions.length > 0 && (
        <p className="text-sm text-gray-600">
          {conditions.length} {conditions.length === 1 ? 'condition' : 'conditions'} configured
        </p>
      )}
    </div>
  );
};

// =====================================================
// Event Config Form Component
// =====================================================

interface EventConfigFormProps {
  source: EventSource;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const EventConfigForm: React.FC<EventConfigFormProps> = ({
  source,
  config,
  onChange,
}) => {
  const updateField = (field: string, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  switch (source) {
    case 'gmail_received':
      return <GmailReceivedForm config={config as GmailReceivedConfig} onChange={updateField} />;
    case 'calendar_event':
      return <CalendarEventForm config={config as CalendarEventConfig} onChange={updateField} />;
    case 'slack_message':
      return <SlackMessageForm config={config as SlackMessageConfig} onChange={updateField} />;
    case 'usage_threshold':
      return <UsageThresholdForm config={config} onChange={updateField} />;
    case 'workflow_action_completed':
      return <WorkflowActionForm config={config as WorkflowActionCompletedConfig} onChange={updateField} />;
    case 'customer_login':
      return <CustomerLoginForm config={config} onChange={updateField} />;
    default:
      return (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
          No additional configuration needed for this event type.
        </div>
      );
  }
};

// =====================================================
// Individual Event Config Forms
// =====================================================

const GmailReceivedForm: React.FC<{
  config: GmailReceivedConfig;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        From Email Address
      </label>
      <input
        type="email"
        value={config.from || ''}
        onChange={(e) => onChange('from', e.target.value)}
        placeholder="john@example.com"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Subject Pattern (optional)
      </label>
      <input
        type="text"
        value={config.subject || ''}
        onChange={(e) => onChange('subject', e.target.value)}
        placeholder="e.g., 'Renewal' or 'Invoice'"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-500 mt-1">
        Leave empty to match any email from the sender
      </p>
    </div>
  </div>
);

const CalendarEventForm: React.FC<{
  config: CalendarEventConfig;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Event Type
      </label>
      <select
        value={config.eventType || 'meeting'}
        onChange={(e) => onChange('eventType', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="meeting">Meeting</option>
        <option value="reminder">Reminder</option>
        <option value="all-day">All-Day Event</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Title Contains (optional)
      </label>
      <input
        type="text"
        value={config.titleContains || ''}
        onChange={(e) => onChange('titleContains', e.target.value)}
        placeholder="e.g., 'Review' or 'Standup'"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-500 mt-1">
        Requires Google Calendar integration
      </p>
    </div>
  </div>
);

const SlackMessageForm: React.FC<{
  config: SlackMessageConfig;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Channel ID
      </label>
      <input
        type="text"
        value={config.channelId || ''}
        onChange={(e) => onChange('channelId', e.target.value)}
        placeholder="#general or C123456"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Contains Keyword (optional)
      </label>
      <input
        type="text"
        value={config.containsKeyword || ''}
        onChange={(e) => onChange('containsKeyword', e.target.value)}
        placeholder="e.g., 'urgent' or '@bot'"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-500 mt-1">
        Requires Slack MCP integration
      </p>
    </div>
  </div>
);

const UsageThresholdForm: React.FC<{
  config: Partial<UsageThresholdConfig> & Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Metric Name
      </label>
      <input
        type="text"
        value={config.metricName || ''}
        onChange={(e) => onChange('metricName', e.target.value)}
        placeholder="e.g., 'active_users' or 'api_calls'"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Operator
        </label>
        <select
          value={config.operator || '>'}
          onChange={(e) => onChange('operator', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value=">">Greater than</option>
          <option value=">=">Greater than or equal</option>
          <option value="<">Less than</option>
          <option value="<=">Less than or equal</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Threshold
        </label>
        <input
          type="number"
          value={config.threshold || ''}
          onChange={(e) => onChange('threshold', Number(e.target.value))}
          placeholder="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  </div>
);

const WorkflowActionForm: React.FC<{
  config: WorkflowActionCompletedConfig;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Workflow Config ID (optional)
      </label>
      <input
        type="text"
        value={config.workflowConfigId || ''}
        onChange={(e) => onChange('workflowConfigId', e.target.value)}
        placeholder="Leave empty to match any workflow"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Action Type (optional)
      </label>
      <input
        type="text"
        value={config.actionType || ''}
        onChange={(e) => onChange('actionType', e.target.value)}
        placeholder="e.g., 'email_sent' or 'contract_signed'"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
);

const CustomerLoginForm: React.FC<{
  config: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={config.firstLoginOnly === true}
          onChange={(e) => onChange('firstLoginOnly', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Only trigger on first login
      </label>
    </div>
  </div>
);
