/**
 * Notification Service
 *
 * Handles in-product notifications with 90-day retention:
 * - Create notifications (task assigned, snoozed resurfaced, force action warnings, etc.)
 * - Get unread count (for red badge)
 * - Get unread notifications
 * - Mark as read (auto-delete from badge)
 * - Clean up old notifications (90-day retention)
 *
 * Phase 3.3: Task State Management
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types
// =====================================================

export type NotificationType =
  | 'task_assigned'
  | 'task_snoozed_resurfaced'
  | 'task_force_action_warning'
  | 'task_auto_skipped'
  | 'task_reassigned'
  | 'workflow_completed'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface InProductNotification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  link_url: string | null;
  link_text: string | null;
  task_id: string | null;
  workflow_execution_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string;
  metadata: Record<string, any>;
}

export interface CreateNotificationParams {
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  linkUrl?: string;
  linkText?: string;
  taskId?: string;
  workflowExecutionId?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// NotificationService
// =====================================================

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    params: CreateNotificationParams,
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const {
      userId,
      notificationType,
      title,
      message,
      priority = 'normal',
      linkUrl,
      linkText,
      taskId,
      workflowExecutionId,
      metadata = {}
    } = params;

    const { data, error } = await supabase
      .from('in_product_notifications')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        title,
        message,
        priority,
        link_url: linkUrl || null,
        link_text: linkText || null,
        task_id: taskId || null,
        workflow_execution_id: workflowExecutionId || null,
        metadata
        // is_read defaults to false
        // expires_at defaults to NOW() + 90 days
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(
    userId: string,
    supabase: SupabaseClient
  ): Promise<number> {
    const { count, error } = await supabase
      .from('in_product_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get all unread notifications for a user
   */
  static async getUnreadNotifications(
    userId: string,
    supabase: SupabaseClient,
    limit?: number
  ): Promise<InProductNotification[]> {
    let query = supabase
      .from('in_product_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get unread notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all notifications for a user (read and unread)
   */
  static async getAllNotifications(
    userId: string,
    supabase: SupabaseClient,
    limit?: number
  ): Promise<InProductNotification[]> {
    let query = supabase
      .from('in_product_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    notificationId: string,
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { data, error } = await supabase
      .from('in_product_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(
    userId: string,
    supabase: SupabaseClient
  ): Promise<number> {
    const { data, error } = await supabase
      .from('in_product_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    notificationId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase
      .from('in_product_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Clean up notifications older than 90 days
   * (Called by cron job)
   */
  static async cleanupOldNotifications(
    supabase: SupabaseClient
  ): Promise<number> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('in_product_notifications')
      .delete()
      .lt('expires_at', now)
      .select();

    if (error) {
      throw new Error(`Failed to clean up old notifications: ${error.message}`);
    }

    return data?.length || 0;
  }

  // =====================================================
  // Helper Methods for Common Notifications
  // =====================================================

  /**
   * Create task assigned notification
   */
  static async notifyTaskAssigned(
    params: {
      userId: string;
      taskId: string;
      taskAction: string;
      customerName: string;
      priority?: NotificationPriority;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, taskId, taskAction, customerName, priority = 'normal' } = params;

    return this.createNotification(
      {
        userId,
        notificationType: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have a new task: ${taskAction} for ${customerName}`,
        priority,
        linkUrl: `/tasks/${taskId}`,
        linkText: 'View Task',
        taskId
      },
      supabase
    );
  }

  /**
   * Create snoozed task resurfaced notification
   */
  static async notifySnoozedTaskResurfaced(
    params: {
      userId: string;
      taskId: string;
      taskAction: string;
      customerName: string;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, taskId, taskAction, customerName } = params;

    return this.createNotification(
      {
        userId,
        notificationType: 'task_snoozed_resurfaced',
        title: 'Snoozed Task Ready',
        message: `Your snoozed task is ready: ${taskAction} for ${customerName}`,
        priority: 'high',
        linkUrl: `/tasks/${taskId}`,
        linkText: 'View Task',
        taskId
      },
      supabase
    );
  }

  /**
   * Create force action warning notification (7-day deadline passed)
   */
  static async notifyForceActionWarning(
    params: {
      userId: string;
      taskId: string;
      taskAction: string;
      customerName: string;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, taskId, taskAction, customerName } = params;

    return this.createNotification(
      {
        userId,
        notificationType: 'task_force_action_warning',
        title: 'Urgent: Task Deadline Reached',
        message: `Task "${taskAction}" for ${customerName} has reached the 7-day deadline. You must complete or skip this task within 24 hours or it will be auto-skipped.`,
        priority: 'urgent',
        linkUrl: `/tasks/${taskId}`,
        linkText: 'Take Action Now',
        taskId
      },
      supabase
    );
  }

  /**
   * Create task auto-skipped notification
   */
  static async notifyTaskAutoSkipped(
    params: {
      userId: string;
      taskId: string;
      taskAction: string;
      customerName: string;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, taskId, taskAction, customerName } = params;

    return this.createNotification(
      {
        userId,
        notificationType: 'task_auto_skipped',
        title: 'Task Auto-Skipped',
        message: `Task "${taskAction}" for ${customerName} was automatically skipped after the 24-hour warning period.`,
        priority: 'high',
        linkUrl: `/tasks/${taskId}`,
        linkText: 'View Details',
        taskId
      },
      supabase
    );
  }

  /**
   * Create task reassigned notification
   */
  static async notifyTaskReassigned(
    params: {
      userId: string;
      taskId: string;
      taskAction: string;
      customerName: string;
      reassignedFrom: string;
      reason: string;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, taskId, taskAction, customerName, reassignedFrom, reason } = params;

    return this.createNotification(
      {
        userId,
        notificationType: 'task_reassigned',
        title: 'Task Reassigned to You',
        message: `Task "${taskAction}" for ${customerName} has been reassigned to you. Reason: ${reason}`,
        priority: 'high',
        linkUrl: `/tasks/${taskId}`,
        linkText: 'View Task',
        taskId,
        metadata: { reassignedFrom, reason }
      },
      supabase
    );
  }

  /**
   * Create workflow completed notification
   */
  static async notifyWorkflowCompleted(
    params: {
      userId: string;
      workflowExecutionId: string;
      workflowName: string;
      customerName: string;
      hasPendingTasks: boolean;
    },
    supabase: SupabaseClient
  ): Promise<InProductNotification> {
    const { userId, workflowExecutionId, workflowName, customerName, hasPendingTasks } = params;

    const message = hasPendingTasks
      ? `${workflowName} for ${customerName} is complete, but you have pending tasks to address.`
      : `${workflowName} for ${customerName} is complete!`;

    return this.createNotification(
      {
        userId,
        notificationType: 'workflow_completed',
        title: 'Workflow Completed',
        message,
        priority: hasPendingTasks ? 'high' : 'normal',
        linkUrl: `/workflows/executions/${workflowExecutionId}`,
        linkText: hasPendingTasks ? 'View Pending Tasks' : 'View Details',
        workflowExecutionId,
        metadata: { hasPendingTasks }
      },
      supabase
    );
  }
}
