'use client';

/**
 * NotificationBanner Component
 *
 * Displays important notifications for the user:
 * - Snoozed workflows that are now due
 * - Workflows escalated to the user
 * - Workflows approaching renewal window
 */

import React, { useEffect, useState } from 'react';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import { AlertCircle, Clock, Users, X, ChevronDown, ChevronUp } from 'lucide-react';

interface NotificationBannerProps {
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

export default function NotificationBanner({ userId, className = '', onWorkflowClick }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const queryService = new WorkflowQueryService();

  useEffect(() => {
    loadNotifications();

    // Refresh every 5 minutes
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

      // TODO: Add renewal window notifications once contract integration is complete
      // This would query contracts approaching renewal window

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(new Set([...dismissed, id]));
  };

  const handleDismissAll = () => {
    setDismissed(new Set(notifications.map(n => n.id)));
  };

  const handleClickNotification = (notification: Notification) => {
    if (notification.workflowId && onWorkflowClick) {
      onWorkflowClick(notification.workflowId);
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (loading || visibleNotifications.length === 0) {
    return null;
  }

  const highPriorityCount = visibleNotifications.filter(n => n.priority === 'high').length;

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
          !isExpanded ? 'border-b border-gray-100' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${
            highPriorityCount > 0 ? 'text-red-500' : 'text-orange-500'
          }`} />
          <div>
            <h3 className="font-semibold text-gray-900">
              {visibleNotifications.length} Notification{visibleNotifications.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-500">
              {highPriorityCount > 0 && `${highPriorityCount} requiring immediate attention`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && visibleNotifications.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismissAll();
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
            >
              Dismiss All
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {visibleNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => handleClickNotification(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.color === 'orange' ? 'bg-orange-100' :
                    notification.color === 'purple' ? 'bg-purple-100' :
                    notification.color === 'red' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      notification.color === 'orange' ? 'text-orange-600' :
                      notification.color === 'purple' ? 'text-purple-600' :
                      notification.color === 'red' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>

                      {/* Dismiss Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Priority Badge */}
                    {notification.priority === 'high' && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                        Requires Attention
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
