/**
 * useNotifications Hook
 *
 * Manages in-product notifications with:
 * - Auto-polling every 60 seconds
 * - Unread count tracking
 * - Mark as read functionality
 * - Priority-based grouping
 * - Real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationType =
  | 'task_deadline_approaching'
  | 'task_requires_decision'
  | 'workflow_started'
  | 'recommendation_available';

export interface Notification {
  id: string;
  userId: string;
  taskId?: string;
  workflowExecutionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationGroup {
  type: NotificationType;
  label: string;
  icon: string;
  notifications: Notification[];
  unreadCount: number;
}

interface UseNotificationsOptions {
  pollInterval?: number; // milliseconds, default 60000 (1 minute)
  enablePolling?: boolean; // default true
  onNewNotification?: (notification: Notification) => void;
  onError?: (error: Error) => void;
}

interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  groups: NotificationGroup[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: Date | null;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;

  // Utilities
  getUnreadByType: (type: NotificationType) => number;
  hasUnreadUrgent: () => boolean;
}

// Notification type configurations
const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; icon: string }> = {
  'task_requires_decision': { label: 'Action Required', icon: '🚨' },
  'task_deadline_approaching': { label: 'Deadline Approaching', icon: '⏰' },
  'workflow_started': { label: 'Workflow Updates', icon: '🔄' },
  'recommendation_available': { label: 'New Recommendations', icon: '💡' }
};

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    pollInterval = 60000, // 1 minute
    enablePolling = true,
    onNewNotification,
    onError
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch notifications');
      }

      const data = await response.json();
      const fetchedNotifications: Notification[] = data.notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));

      // Detect new notifications
      if (onNewNotification && previousNotificationIdsRef.current.size > 0) {
        const newNotifications = fetchedNotifications.filter(
          n => !previousNotificationIdsRef.current.has(n.id)
        );
        newNotifications.forEach(n => onNewNotification(n));
      }

      // Update refs
      previousNotificationIdsRef.current = new Set(fetchedNotifications.map(n => n.id));

      // Update state
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
      setLastFetched(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onNewNotification, onError]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark notification as read');
      }

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  /**
   * Mark all notifications as read
   */
  const markAllRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark all as read');
      }

      // Optimistically update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notification');
      }

      // Optimistically update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        if (wasUnread) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  /**
   * Group notifications by type
   */
  const groups: NotificationGroup[] = Object.entries(NOTIFICATION_TYPE_CONFIG).map(
    ([type, config]) => {
      const typeNotifications = notifications.filter(n => n.type === type);
      return {
        type: type as NotificationType,
        label: config.label,
        icon: config.icon,
        notifications: typeNotifications,
        unreadCount: typeNotifications.filter(n => !n.read).length
      };
    }
  ).filter(g => g.notifications.length > 0); // Only show groups with notifications

  /**
   * Get unread count by type
   */
  const getUnreadByType = useCallback((type: NotificationType): number => {
    return notifications.filter(n => n.type === type && !n.read).length;
  }, [notifications]);

  /**
   * Check if there are any unread urgent notifications (priority 1-2)
   */
  const hasUnreadUrgent = useCallback((): boolean => {
    return notifications.some(n => !n.read && (n.priority === 1 || n.priority === 2));
  }, [notifications]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Polling
   */
  useEffect(() => {
    if (!enablePolling) return;

    pollTimerRef.current = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [enablePolling, pollInterval, fetchNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    groups,
    isLoading,
    error,
    lastFetched,

    // Actions
    markAsRead,
    markAllRead,
    deleteNotification,
    refresh: fetchNotifications,

    // Utilities
    getUnreadByType,
    hasUnreadUrgent
  };
}

export default useNotifications;
