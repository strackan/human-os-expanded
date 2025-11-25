'use client';

/**
 * AutomationRuleCard Component
 *
 * Displays a single automation rule in card format.
 * Shows rule details, conditions, status, and actions.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import React, { useState } from 'react';
import { Edit, Trash2, Zap, Clock } from 'lucide-react';
import type { AutomationRule, EventCondition } from '@/types/automation-rules';
import { formatDistanceToNow, parseISO } from 'date-fns';

// =====================================================
// Types
// =====================================================

export interface AutomationRuleCardProps {
  rule: AutomationRule;
  workflowName?: string;
  onToggle: (ruleId: string) => Promise<void>;
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => Promise<void>;
  className?: string;
}

// =====================================================
// Helper Functions
// =====================================================

function getEventSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    gmail_received: 'Gmail Received',
    gmail_sent: 'Gmail Sent',
    calendar_event: 'Calendar Event',
    slack_message: 'Slack Message',
    customer_login: 'Customer Login',
    usage_threshold: 'Usage Threshold',
    workflow_action_completed: 'Workflow Action',
    manual_event: 'Manual Event',
  };
  return labels[source] || source;
}

function getEventSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    gmail_received: '📧',
    gmail_sent: '📤',
    calendar_event: '📅',
    slack_message: '💬',
    customer_login: '👤',
    usage_threshold: '📊',
    workflow_action_completed: '✅',
    manual_event: '🔘',
  };
  return icons[source] || '⚡';
}

function formatConditionSummary(condition: EventCondition): string {
  const source = getEventSourceLabel(condition.source);
  const config = condition.config;

  // Create a short summary based on the config
  const parts: string[] = [];

  if (config.from) parts.push(`from ${config.from}`);
  if (config.subject) parts.push(`subject: "${config.subject}"`);
  if (config.channelId) parts.push(`in ${config.channelId}`);
  if (config.metricName) parts.push(`${config.metricName} ${config.operator} ${config.threshold}`);
  if (config.eventType) parts.push(String(config.eventType));

  if (parts.length === 0) {
    return source;
  }

  return `${source} (${parts.join(', ')})`;
}

// =====================================================
// AutomationRuleCard Component
// =====================================================

export const AutomationRuleCard: React.FC<AutomationRuleCardProps> = ({
  rule,
  workflowName,
  onToggle,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(rule.id);
    } catch (err) {
      console.error('Error toggling rule:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(rule.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting rule:', err);
      setIsDeleting(false);
    }
  };

  const getLastTriggeredText = (): string => {
    if (!rule.last_triggered_at) {
      return 'Never triggered';
    }
    try {
      const date = parseISO(rule.last_triggered_at);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div
      className={`border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {rule.name}
            </h3>
            {rule.is_active ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                <Zap className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                Inactive
              </span>
            )}
          </div>
          {rule.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {rule.description}
            </p>
          )}
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${rule.is_active ? 'bg-blue-600' : 'bg-gray-200'}
          `}
          role="switch"
          aria-checked={rule.is_active}
          aria-label="Toggle rule active status"
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${rule.is_active ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Event Conditions */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          When
        </h4>
        <div className="space-y-1">
          {rule.event_conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-start gap-2">
              {index > 0 && rule.logic_operator && (
                <span className="text-xs font-semibold text-purple-600 px-1.5 py-0.5 bg-purple-50 rounded">
                  {rule.logic_operator}
                </span>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md flex-1">
                <span className="text-lg">{getEventSourceIcon(condition.source)}</span>
                <span className="truncate">{formatConditionSummary(condition)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow to Launch */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Then Launch
        </h4>
        <div className="flex items-center gap-2 text-sm text-gray-900 bg-blue-50 px-3 py-1.5 rounded-md">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{workflowName || rule.workflow_config_id}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          <span>
            <span className="font-semibold text-gray-900">{rule.trigger_count}</span> triggers
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{getLastTriggeredText()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(rule.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
