'use client';

/**
 * TriggerDisplay Component
 *
 * Displays a human-readable trigger description with status indicators.
 * Shows date and event triggers with appropriate icons and color coding.
 *
 * Features:
 * - Icon-based trigger type indicators
 * - Color-coded status (pending, fired, error)
 * - Relative time display
 * - Tooltip with full details
 */

import React from 'react';
import { Calendar, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { WakeTrigger, isDateTrigger, isEventTrigger } from '@/types/wake-triggers';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

// =====================================================
// Types
// =====================================================

export interface TriggerDisplayProps {
  trigger: WakeTrigger;
  status: 'pending' | 'fired' | 'error';
  firedAt?: string;
  errorMessage?: string;
}

// =====================================================
// TriggerDisplay Component
// =====================================================

export const TriggerDisplay: React.FC<TriggerDisplayProps> = ({
  trigger,
  status,
  firedAt,
  errorMessage,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'fired':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'fired':
        return 'text-green-700 bg-green-50';
      case 'error':
        return 'text-red-700 bg-red-50';
      case 'pending':
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const formatTriggerDescription = (): string => {
    if (isDateTrigger(trigger)) {
      const date = parseISO(trigger.config.date);
      const formattedDate = format(date, 'MMM d, yyyy');
      const formattedTime = format(date, 'h:mm a');

      if (status === 'fired' && firedAt) {
        const firedDate = parseISO(firedAt);
        return `Woke on ${format(firedDate, 'MMM d')} at ${format(firedDate, 'h:mm a')}`;
      }

      if (status === 'pending') {
        const now = new Date();
        const distance = formatDistanceToNow(date, { addSuffix: true });
        return `Wake on ${formattedDate} at ${formattedTime} (${distance})`;
      }

      return `Wake on ${formattedDate} at ${formattedTime}`;
    }

    if (isEventTrigger(trigger)) {
      const eventType = trigger.config.eventType;
      const eventLabel = getEventTypeLabel(eventType);

      if (status === 'fired' && firedAt) {
        const firedDate = parseISO(firedAt);
        return `Woke on ${format(firedDate, 'MMM d')} - ${eventLabel}`;
      }

      if (status === 'error' && errorMessage) {
        return `Error: ${errorMessage}`;
      }

      return `Wake when ${eventLabel.toLowerCase()} (pending)`;
    }

    return 'Unknown trigger type';
  };

  const getEventTypeLabel = (eventType: string): string => {
    switch (eventType) {
      case 'workflow_action_completed':
        return 'Workflow action completed';
      case 'customer_login':
        return 'Customer logs in';
      case 'usage_threshold_crossed':
        return 'Usage threshold crossed';
      case 'manual_event':
        return 'Manual event';
      default:
        return eventType;
    }
  };

  const getTriggerIcon = () => {
    if (isDateTrigger(trigger)) {
      return <Calendar className="w-4 h-4" />;
    }
    if (isEventTrigger(trigger)) {
      return <Zap className="w-4 h-4" />;
    }
    return null;
  };

  const getTooltipContent = (): string => {
    let content = `ID: ${trigger.id}\nType: ${trigger.type}\n`;

    if (isDateTrigger(trigger)) {
      content += `Date: ${trigger.config.date}\n`;
      if (trigger.config.timezone) {
        content += `Timezone: ${trigger.config.timezone}\n`;
      }
    }

    if (isEventTrigger(trigger)) {
      content += `Event Type: ${trigger.config.eventType}\n`;
      if (trigger.config.eventConfig) {
        content += `Config: ${JSON.stringify(trigger.config.eventConfig, null, 2)}\n`;
      }
    }

    content += `Status: ${status}\n`;
    if (firedAt) {
      content += `Fired At: ${firedAt}\n`;
    }
    if (errorMessage) {
      content += `Error: ${errorMessage}\n`;
    }

    return content;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor()} transition-colors`}
      title={getTooltipContent()}
    >
      <div className="flex-shrink-0">{getTriggerIcon()}</div>
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      <div className="text-sm font-medium flex-1 min-w-0">
        <span className="truncate">{formatTriggerDescription()}</span>
      </div>
    </div>
  );
};

// =====================================================
// Compact Version for Lists
// =====================================================

export interface TriggerDisplayCompactProps {
  trigger: WakeTrigger;
  status: 'pending' | 'fired' | 'error';
}

export const TriggerDisplayCompact: React.FC<TriggerDisplayCompactProps> = ({
  trigger,
  status,
}) => {
  const icon = isDateTrigger(trigger) ? '🕐' : '⚡';
  const statusEmoji = status === 'fired' ? '✅' : status === 'error' ? '❌' : '⏳';

  const getLabel = (): string => {
    if (isDateTrigger(trigger)) {
      const date = parseISO(trigger.config.date);
      return format(date, 'MMM d, yyyy');
    }
    if (isEventTrigger(trigger)) {
      return trigger.config.eventType.replace(/_/g, ' ');
    }
    return 'Unknown';
  };

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span>{icon}</span>
      <span>{statusEmoji}</span>
      <span>{getLabel()}</span>
    </span>
  );
};
