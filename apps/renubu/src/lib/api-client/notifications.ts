/**
 * Notifications API Client
 *
 * Operations for notification management.
 */

import { apiFetch } from './index';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { Notification, ApiResponse } from './types';

// =====================================================
// Response Types
// =====================================================

interface NotificationsListResponse {
  notifications: Notification[];
}

interface UnreadCountResponse {
  count: number;
}

// =====================================================
// Notifications API
// =====================================================

export const notificationsApi = {
  /**
   * List all notifications
   */
  async list(): Promise<ApiResponse<NotificationsListResponse>> {
    return apiFetch<NotificationsListResponse>(API_ROUTES.NOTIFICATIONS.LIST);
  },

  /**
   * Get unread notifications
   */
  async getUnread(): Promise<ApiResponse<NotificationsListResponse>> {
    return apiFetch<NotificationsListResponse>(API_ROUTES.NOTIFICATIONS.UNREAD);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return apiFetch<UnreadCountResponse>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.NOTIFICATIONS.MARK_READ(notificationId), {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.NOTIFICATIONS.LIST, {
      method: 'POST',
      body: { markAllRead: true },
    });
  },
};
