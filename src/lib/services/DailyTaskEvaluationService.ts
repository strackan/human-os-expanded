/**
 * Daily Task Evaluation Service
 *
 * Runs daily (6am via cron) to manage task lifecycle:
 * - Resurface snoozed tasks that are ready
 * - Set force_action flag on tasks past 7-day deadline (from first snooze)
 * - Send urgent notifications for force-action tasks
 * - Auto-skip tasks that have passed configurable grace period (24-48 hours)
 * - Escalate tasks requiring manual intervention
 * - Clean up old notifications (90-day retention)
 *
 * Phase 3.3: Task State Management (HYBRID APPROACH)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { WorkflowTaskService } from './WorkflowTaskService';
import { NotificationService } from './NotificationService';

// =====================================================
// Types
// =====================================================

export interface DailyEvaluationResult {
  resurfacedTasks: number;
  forceActionTasks: number;
  autoSkippedTasks: number;
  notificationsSent: number;
  notificationsDeleted: number;
  errors: string[];
}

// =====================================================
// DailyTaskEvaluationService
// =====================================================

export class DailyTaskEvaluationService {
  /**
   * Main orchestrator - runs all daily task evaluations
   */
  static async runDailyEvaluation(
    supabase: SupabaseClient
  ): Promise<DailyEvaluationResult> {
    console.log('[DailyTaskEvaluation] Starting daily task evaluation...');

    const result: DailyEvaluationResult = {
      resurfacedTasks: 0,
      forceActionTasks: 0,
      autoSkippedTasks: 0,
      notificationsSent: 0,
      notificationsDeleted: 0,
      errors: []
    };

    try {
      // Step 1: Resurface snoozed tasks
      const resurfaced = await this.resurfaceSnoozedTasks(supabase);
      result.resurfacedTasks = resurfaced.count;
      result.notificationsSent += resurfaced.notificationsSent;
      result.errors.push(...resurfaced.errors);

      console.log(`[DailyTaskEvaluation] Resurfaced ${resurfaced.count} snoozed tasks`);

      // Step 2: Set force_action flag on tasks past 7-day deadline
      const forceAction = await this.setForceActionFlags(supabase);
      result.forceActionTasks = forceAction.count;
      result.notificationsSent += forceAction.notificationsSent;
      result.errors.push(...forceAction.errors);

      console.log(`[DailyTaskEvaluation] Set force_action on ${forceAction.count} tasks`);

      // Step 3: Auto-skip abandoned tasks
      const autoSkipped = await this.autoSkipAbandonedTasks(supabase);
      result.autoSkippedTasks = autoSkipped.count;
      result.notificationsSent += autoSkipped.notificationsSent;
      result.errors.push(...autoSkipped.errors);

      console.log(`[DailyTaskEvaluation] Auto-skipped ${autoSkipped.count} tasks`);

      // Step 4: Clean up old notifications
      const cleaned = await this.cleanupOldNotifications(supabase);
      result.notificationsDeleted = cleaned;

      console.log(`[DailyTaskEvaluation] Deleted ${cleaned} old notifications`);

      console.log('[DailyTaskEvaluation] Daily evaluation complete:', result);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DailyTaskEvaluation] Error during daily evaluation:', errorMessage);
      result.errors.push(`Daily evaluation error: ${errorMessage}`);
      return result;
    }
  }

  /**
   * Step 1: Resurface snoozed tasks that are ready
   */
  static async resurfaceSnoozedTasks(
    supabase: SupabaseClient
  ): Promise<{ count: number; notificationsSent: number; errors: string[] }> {
    const errors: string[] = [];
    let notificationsSent = 0;

    try {
      // Get all snoozed tasks ready to resurface
      const tasks = await WorkflowTaskService.getSnoozedTasksToResurface(supabase);

      console.log(`[ResurfaceTasks] Found ${tasks.length} snoozed tasks to resurface`);

      // Resurface each task
      for (const task of tasks) {
        try {
          // Resurface the task
          await WorkflowTaskService.resurfaceTask(task.id, supabase);

          // Get customer name for notification
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', task.customer_id)
            .single();

          const customerName = customer?.name || 'Unknown Customer';

          // Send notification
          await NotificationService.notifySnoozedTaskResurfaced(
            {
              userId: task.assigned_to,
              taskId: task.id,
              taskAction: task.action,
              customerName
            },
            supabase
          );

          notificationsSent++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to resurface task ${task.id}: ${errorMessage}`);
          console.error(`[ResurfaceTasks] Error resurfacing task ${task.id}:`, errorMessage);
        }
      }

      return {
        count: tasks.length,
        notificationsSent,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to fetch snoozed tasks: ${errorMessage}`);
      return { count: 0, notificationsSent, errors };
    }
  }

  /**
   * Step 2: Set force_action flag on tasks past 7-day deadline (from first snooze)
   * HYBRID APPROACH: Configurable grace periods and manual escalation support
   */
  static async setForceActionFlags(
    supabase: SupabaseClient
  ): Promise<{ count: number; notificationsSent: number; errors: string[] }> {
    const errors: string[] = [];
    let notificationsSent = 0;

    try {
      // Get tasks requiring force action
      const tasks = await WorkflowTaskService.getTasksRequiringForceAction(supabase);

      console.log(`[ForceAction] Found ${tasks.length} tasks requiring force action`);

      // Set force_action flag on each task
      for (const task of tasks) {
        try {
          // Get task type configuration
          const { data: config } = await supabase
            .from('task_type_config')
            .select('auto_skip_enabled, auto_skip_grace_hours, requires_manual_escalation')
            .eq('task_type', task.task_type)
            .single();

          const graceHours = config?.auto_skip_grace_hours || 24;
          const requiresEscalation = config?.requires_manual_escalation || false;

          // Set force_action flag (with configurable grace period)
          await WorkflowTaskService.setForceAction(task.id, supabase);

          // Get customer name for notification
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', task.customer_id)
            .single();

          const customerName = customer?.name || 'Unknown Customer';

          // Send urgent notification with grace period info
          await NotificationService.notifyForceActionWarning(
            {
              userId: task.assigned_to,
              taskId: task.id,
              taskAction: task.action,
              customerName
            },
            supabase
          );

          notificationsSent++;

          // If requires manual escalation, escalate to manager
          if (requiresEscalation) {
            await this.escalateToManager(task, customerName, supabase);
            console.log(`[ForceAction] Escalated task ${task.id} to manager`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to set force action for task ${task.id}: ${errorMessage}`);
          console.error(`[ForceAction] Error setting force action for task ${task.id}:`, errorMessage);
        }
      }

      return {
        count: tasks.length,
        notificationsSent,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to fetch tasks requiring force action: ${errorMessage}`);
      return { count: 0, notificationsSent, errors };
    }
  }

  /**
   * Step 3: Auto-skip tasks that have passed the 24-hour warning period
   */
  static async autoSkipAbandonedTasks(
    supabase: SupabaseClient
  ): Promise<{ count: number; notificationsSent: number; errors: string[] }> {
    const errors: string[] = [];
    let notificationsSent = 0;

    try {
      // Get tasks ready for auto-skip
      const tasks = await WorkflowTaskService.getTasksForAutoSkip(supabase);

      console.log(`[AutoSkip] Found ${tasks.length} tasks to auto-skip`);

      // Auto-skip each task
      for (const task of tasks) {
        try {
          // Auto-skip the task
          await WorkflowTaskService.autoSkipTask(task.id, supabase);

          // Get customer name for notification
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', task.customer_id)
            .single();

          const customerName = customer?.name || 'Unknown Customer';

          // Send notification
          await NotificationService.notifyTaskAutoSkipped(
            {
              userId: task.assigned_to,
              taskId: task.id,
              taskAction: task.action,
              customerName
            },
            supabase
          );

          notificationsSent++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to auto-skip task ${task.id}: ${errorMessage}`);
          console.error(`[AutoSkip] Error auto-skipping task ${task.id}:`, errorMessage);
        }
      }

      return {
        count: tasks.length,
        notificationsSent,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to fetch tasks for auto-skip: ${errorMessage}`);
      return { count: 0, notificationsSent, errors };
    }
  }

  /**
   * Step 4: Clean up notifications older than 90 days
   */
  static async cleanupOldNotifications(
    supabase: SupabaseClient
  ): Promise<number> {
    try {
      const count = await NotificationService.cleanupOldNotifications(supabase);
      console.log(`[CleanupNotifications] Deleted ${count} old notifications`);
      return count;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CleanupNotifications] Error cleaning up notifications:', errorMessage);
      return 0;
    }
  }

  /**
   * Escalate task to manager when manual intervention required
   * HYBRID APPROACH: For task types with requires_manual_escalation = true
   */
  static async escalateToManager(
    task: any,
    customerName: string,
    supabase: SupabaseClient
  ): Promise<void> {
    try {
      // Get CSM's manager from profiles table
      // Assuming profiles table has a manager_id field
      const { data: profile } = await supabase
        .from('profiles')
        .select('manager_id, full_name')
        .eq('id', task.assigned_to)
        .single();

      if (!profile?.manager_id) {
        console.warn(`[Escalate] No manager found for user ${task.assigned_to}, cannot escalate task ${task.id}`);
        return;
      }

      // Create notification for manager
      await NotificationService.createNotification(
        {
          userId: profile.manager_id,
          notificationType: 'task_reassigned',
          title: 'Task Requires Manager Intervention',
          message: `Task "${task.action}" for ${customerName} requires immediate attention. Assigned CSM: ${profile.full_name}. This task type requires manual escalation and cannot be auto-skipped.`,
          priority: 'urgent',
          linkUrl: `/tasks/${task.id}`,
          linkText: 'Review Task',
          taskId: task.id,
          metadata: {
            escalated_from: task.assigned_to,
            task_type: task.task_type,
            reason: 'Task type requires manual escalation'
          }
        },
        supabase
      );

      console.log(`[Escalate] Escalated task ${task.id} to manager ${profile.manager_id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Escalate] Error escalating task ${task.id}:`, errorMessage);
    }
  }

  /**
   * Helper: Get daily evaluation summary for logging/monitoring
   */
  static formatEvaluationSummary(result: DailyEvaluationResult): string {
    const summary = [
      '=== Daily Task Evaluation Summary ===',
      `Resurfaced Tasks: ${result.resurfacedTasks}`,
      `Force Action Tasks: ${result.forceActionTasks}`,
      `Auto-Skipped Tasks: ${result.autoSkippedTasks}`,
      `Notifications Sent: ${result.notificationsSent}`,
      `Notifications Deleted: ${result.notificationsDeleted}`,
      `Errors: ${result.errors.length}`,
      ''
    ];

    if (result.errors.length > 0) {
      summary.push('Errors:');
      result.errors.forEach((error, index) => {
        summary.push(`  ${index + 1}. ${error}`);
      });
    }

    summary.push('=====================================');

    return summary.join('\n');
  }
}
