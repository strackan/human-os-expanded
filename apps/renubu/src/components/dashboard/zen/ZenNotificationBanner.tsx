'use client';

/**
 * ZenNotificationBanner Component
 *
 * Zen-styled wrapper around Phase 3F NotificationBanner
 * Applies zen aesthetic: transparent cards, purple accents, minimal design
 */

import React, { useEffect, useState } from 'react';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import { AlertCircle, Clock, Users, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ZenNotificationBannerProps {
  userId: string;
  className?: string;
  onWorkflowClick?: (executionId: string) => void;
}

interface Notification {
  id: string;
  type: 'snoozed_due' | 'escalated' | 'renewal_window';
  title: string;
  message: string;
  workflowId?: string;
  priority: 'high' | 'medium' | 'low';
  icon: typeof AlertCircle;
  color: string;
}

export default function ZenNotificationBanner({
  userId,
  className = '',
  onWorkflowClick
}: ZenNotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default for zen minimal aesthetic
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const queryService = new WorkflowQueryService();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    const newNotifications: Notification[] = [];

    try {
      // Check for snoozed workflows that are due
      const snoozedResult = await queryService.getSnoozedWorkflowsDue(userId);
      if (snoozedResult.success && snoozedResult.workflows) {
        snoozedResult.workflows.forEach((workflow) => {
          newNotifications.push({
            id: `snoozed-${workflow.id}`,
            type: 'snoozed_due',
            title: 'Workflow Ready to Resume',
            message: `"${workflow.workflow_name}" for ${workflow.customer_name} is ready to resume`,
            workflowId: workflow.id,
            priority: 'high',
            icon: Clock,
            color: 'orange'
          });
        });
      }

      // Check for workflows escalated to user
      const escalatedResult = await queryService.getEscalatedToMe(userId);
      if (escalatedResult.success && escalatedResult.workflows) {
        escalatedResult.workflows.forEach((workflow) => {
          newNotifications.push({
            id: `escalated-${workflow.id}`,
            type: 'escalated',
            title: 'Workflow Escalated to You',
            message: `"${workflow.workflow_name}" for ${workflow.customer_name} was escalated to you${
              workflow.escalated_from_name ? ` by ${workflow.escalated_from_name}` : ''
            }`,
            workflowId: workflow.id,
            priority: 'high',
            icon: Users,
            color: 'purple'
          });
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('[ZenNotificationBanner] Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (notificationId: string) => {
    setDismissed(prev => new Set(prev).add(notificationId));
  };

  const handleDismissAll = () => {
    setDismissed(new Set(notifications.map(n => n.id)));
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  // Don't render if no notifications
  if (loading || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`max-w-6xl mx-auto mb-6 ${className}`}>
      {/* Zen-styled notification card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                {visibleNotifications.length} Notification{visibleNotifications.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-gray-400">Updates that need your attention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {visibleNotifications.length > 1 && (
              <button
                onClick={handleDismissAll}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Dismiss All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Notification List */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {visibleNotifications.map((notification) => {
              const Icon = notification.icon;
              const colorClasses = {
                orange: 'bg-orange-50 border-orange-200 text-orange-600',
                purple: 'bg-purple-50 border-purple-200 text-purple-600',
                red: 'bg-red-50 border-red-200 text-red-600'
              }[notification.color] || 'bg-gray-50 border-gray-200 text-gray-600';

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${colorClasses} transition-all`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    {notification.workflowId && onWorkflowClick && (
                      <button
                        onClick={() => onWorkflowClick(notification.workflowId!)}
                        className="text-xs font-medium mt-2 text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        Open Workflow →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
