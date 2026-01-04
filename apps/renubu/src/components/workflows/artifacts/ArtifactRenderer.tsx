/**
 * Artifact Renderer Component
 *
 * Renders different types of artifacts within workflow steps.
 * Supports all backend artifact types with auto-refresh, templates, and actions.
 *
 * Artifact Types:
 * - dashboard: Multi-section dashboard
 * - status_grid: 2x2 or 4-column status display
 * - countdown: Timer display
 * - action_tracker: Task list with progress
 * - timeline: Chronological event display
 * - table: Data table with sorting
 * - checklist: Checkable items with progress
 * - alert: Alert/notification panel
 * - markdown: Rendered markdown content
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertCircle, Timer,
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle,
  Check, Circle, Calendar, User, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resolveTemplate, evaluateCondition } from '@/utils/templateResolver';

// =====================================================
// Types
// =====================================================

export interface ArtifactConfig {
  id: string;
  type: 'dashboard' | 'status_grid' | 'countdown' | 'action_tracker' | 'timeline' | 'table' | 'checklist' | 'alert' | 'markdown';
  title: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  visible?: string; // template condition: '{{condition}}'
  config: any; // type-specific config
}

export interface ArtifactRendererProps {
  artifact: ArtifactConfig;
  context?: Record<string, any>; // For template rendering
  onAction?: (actionId: string, data?: any) => void;
  onRefresh?: (artifactId: string) => Promise<void>;
}

// Template rendering utilities imported from @/utils/templateResolver

// =====================================================
// Status Grid Artifact
// =====================================================

interface StatusGridConfig {
  items: Array<{
    label: string;
    value: string;
    status: 'complete' | 'pending' | 'error' | 'warning';
    icon?: string;
    sublabel?: string;
  }>;
  columns?: 2 | 4;
}

const StatusGridArtifact: React.FC<{ config: StatusGridConfig; context?: Record<string, any> }> = ({
  config,
  context = {}
}) => {
  const columns = config.columns || 4;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-50 border-green-200';
      case 'pending': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`grid grid-cols-${columns} gap-3`}>
      {config.items.map((item, index) => {
        const label = resolveTemplate(item.label, context);
        const value = resolveTemplate(item.value, context);
        const sublabel = item.sublabel ? resolveTemplate(item.sublabel, context) : undefined;

        return (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusBg(item.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {label}
              </span>
              {getStatusIcon(item.status)}
            </div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
            {sublabel && (
              <div className="text-xs text-gray-600 mt-1">{sublabel}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// Countdown Artifact
// =====================================================

interface CountdownConfig {
  targetDate: string; // ISO date or template
  theme?: 'default' | 'emergency';
  thresholds?: Array<{ days: number; message: string }>;
  statusItems?: Array<{ label: string; status: string }>;
}

const CountdownArtifact: React.FC<{ config: CountdownConfig; context?: Record<string, any> }> = ({
  config,
  context = {}
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDateStr = resolveTemplate(config.targetDate, context);
      const target = new Date(targetDateStr);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [config.targetDate, context]);

  const isEmergency = config.theme === 'emergency';
  const bgColor = isEmergency ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300';
  const textColor = isEmergency ? 'text-red-900' : 'text-blue-900';

  return (
    <div className={`p-6 rounded-lg border-2 ${bgColor}`}>
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Timer className={`w-6 h-6 ${textColor}`} />
        <h3 className={`text-lg font-semibold ${textColor}`}>Time Remaining</h3>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds }
        ].map((item, index) => (
          <div key={index} className="text-center">
            <div className={`text-4xl font-bold ${textColor}`}>{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Threshold alerts */}
      {config.thresholds?.map((threshold, index) => {
        if (timeLeft.days <= threshold.days) {
          return (
            <div key={index} className="flex items-center space-x-2 bg-red-100 border border-red-300 rounded p-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {resolveTemplate(threshold.message, context)}
              </span>
            </div>
          );
        }
        return null;
      })}

      {/* Status grid */}
      {config.statusItems && config.statusItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {config.statusItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded">
              <span className="text-sm text-gray-700">{resolveTemplate(item.label, context)}</span>
              <span className="text-xs">{resolveTemplate(item.status, context)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// Action Tracker Artifact
// =====================================================

interface ActionTrackerConfig {
  actions: Array<{
    id: string;
    title: string;
    owner: string;
    deadline: string;
    status: 'complete' | 'pending' | 'overdue';
    checkable?: boolean;
  }>;
  showProgress?: boolean;
}

const ActionTrackerArtifact: React.FC<{
  config: ActionTrackerConfig;
  context?: Record<string, any>;
  onAction?: (actionId: string, data?: any) => void;
}> = ({ config, context = {}, onAction }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const completedCount = config.actions.filter(a => a.status === 'complete').length;
  const progress = (completedCount / config.actions.length) * 100;

  const handleCheck = (actionId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(actionId)) {
      newChecked.delete(actionId);
    } else {
      newChecked.add(actionId);
    }
    setCheckedItems(newChecked);
    onAction?.(`check_action_${actionId}`, { checked: !checkedItems.has(actionId) });
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {config.showProgress && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">Progress</span>
            <span className="text-gray-600">{completedCount}/{config.actions.length} completed</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action list */}
      <div className="space-y-2">
        {config.actions.map((action) => {
          const isOverdue = action.status === 'overdue';
          const isComplete = action.status === 'complete';
          const isChecked = checkedItems.has(action.id);

          return (
            <div
              key={action.id}
              className={`
                p-3 rounded-lg border
                ${isOverdue ? 'bg-red-50 border-red-200' :
                  isComplete ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="flex items-start space-x-3">
                {action.checkable && (
                  <button
                    onClick={() => handleCheck(action.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {isChecked || isComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-gray-900 ${isComplete ? 'line-through' : ''}`}>
                    {resolveTemplate(action.title, context)}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{resolveTemplate(action.owner, context)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{resolveTemplate(action.deadline, context)}</span>
                    </span>
                  </div>
                </div>

                {isOverdue && (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =====================================================
// Timeline Artifact
// =====================================================

interface TimelineConfig {
  events: Array<{
    date: string;
    title: string;
    description?: string;
    status?: 'complete' | 'pending' | 'current';
  }>;
}

const TimelineArtifact: React.FC<{ config: TimelineConfig; context?: Record<string, any> }> = ({
  config,
  context = {}
}) => {
  return (
    <div className="space-y-4">
      {config.events.map((event, index) => {
        const isLast = index === config.events.length - 1;
        const isCurrent = event.status === 'current';
        const isComplete = event.status === 'complete';

        return (
          <div key={index} className="flex space-x-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isCurrent ? 'bg-blue-500' : isComplete ? 'bg-green-500' : 'bg-gray-300'}
              `}>
                {isComplete && <Check className="w-5 h-5 text-white" />}
                {isCurrent && <ArrowRight className="w-5 h-5 text-white" />}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[40px] ${isComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-8">
              <div className="text-sm text-gray-500 mb-1">
                {resolveTemplate(event.date, context)}
              </div>
              <div className={`font-semibold text-gray-900 ${isCurrent ? 'text-blue-600' : ''}`}>
                {resolveTemplate(event.title, context)}
              </div>
              {event.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {resolveTemplate(event.description, context)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// Alert Artifact
// =====================================================

interface AlertConfig {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  dismissible?: boolean;
}

const AlertArtifact: React.FC<{ config: AlertConfig; context?: Record<string, any> }> = ({
  config,
  context = {}
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const styles = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: AlertCircle },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', icon: AlertTriangle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: XCircle },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: CheckCircle }
  }[config.type];

  const Icon = styles.icon;

  return (
    <div className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${styles.text} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${styles.text} mb-1`}>
            {resolveTemplate(config.title, context)}
          </h4>
          <p className={`text-sm ${styles.text}`}>
            {resolveTemplate(config.message, context)}
          </p>
        </div>
        {config.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={`${styles.text} hover:opacity-70`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Main Artifact Renderer
// =====================================================

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
  context = {},
  onAction,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check visibility condition
  const isVisible = artifact.visible
    ? evaluateCondition(artifact.visible, context)
    : true;

  // Auto-refresh logic (must be called before any conditional returns)
  useEffect(() => {
    if (!isVisible || !artifact.autoRefresh || !artifact.refreshInterval || !onRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        await onRefresh(artifact.id);
        setLastRefresh(new Date());
      } finally {
        setIsRefreshing(false);
      }
    }, artifact.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isVisible, artifact.autoRefresh, artifact.refreshInterval, artifact.id, onRefresh]);

  // Check visibility after all hooks
  if (!isVisible) return null;

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh(artifact.id);
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          {resolveTemplate(artifact.title, context)}
        </h3>

        <div className="flex items-center space-x-2">
          {artifact.autoRefresh && (
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}

          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {artifact.type === 'status_grid' && (
          <StatusGridArtifact config={artifact.config} context={context} />
        )}

        {artifact.type === 'countdown' && (
          <CountdownArtifact config={artifact.config} context={context} />
        )}

        {artifact.type === 'action_tracker' && (
          <ActionTrackerArtifact config={artifact.config} context={context} onAction={onAction} />
        )}

        {artifact.type === 'timeline' && (
          <TimelineArtifact config={artifact.config} context={context} />
        )}

        {artifact.type === 'alert' && (
          <AlertArtifact config={artifact.config} context={context} />
        )}

        {artifact.type === 'markdown' && (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resolveTemplate(artifact.config.content, context)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
