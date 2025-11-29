/**
 * useTaskSnooze Hook
 *
 * Manages task snooze functionality with:
 * - 7-day snooze limit enforcement
 * - Snooze eligibility checking
 * - API calls for snooze/skip/complete actions
 * - State management
 */

import { useState, useCallback } from 'react';
import type { WorkflowTask } from '../task-types-frontend';
import {
  calculateSnoozeEligibility,
  calculateSnoozeDeadline,
  calculateNextSnoozeDate,
  type SnoozeEligibility
} from '../task-types-frontend';

interface UseTaskSnoozeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseTaskSnoozeReturn {
  // State
  isLoading: boolean;
  error: Error | null;
  eligibility: SnoozeEligibility | null;

  // Actions
  snoozeTask: (taskId: string, task: WorkflowTask) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  skipTask: (taskId: string, reason?: string) => Promise<void>;
  dismissWithoutChoice: (taskId: string) => Promise<void>; // Auto-skip

  // Utilities
  checkEligibility: (task: WorkflowTask) => SnoozeEligibility;
  getDaysRemaining: (task: WorkflowTask) => number | undefined;
}

export function useTaskSnooze(
  options: UseTaskSnoozeOptions = {}
): UseTaskSnoozeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [eligibility, setEligibility] = useState<SnoozeEligibility | null>(null);

  const { onSuccess, onError } = options;

  /**
   * Check snooze eligibility for a task
   */
  const checkEligibility = useCallback((task: WorkflowTask): SnoozeEligibility => {
    const result = calculateSnoozeEligibility(task);
    setEligibility(result);
    return result;
  }, []);

  /**
   * Get days remaining until snooze deadline
   */
  const getDaysRemaining = useCallback((task: WorkflowTask): number | undefined => {
    const result = calculateSnoozeEligibility(task);
    return result.daysRemaining;
  }, []);

  /**
   * Snooze a task for 1 week
   */
  const snoozeTask = useCallback(async (taskId: string, task: WorkflowTask) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check eligibility first
      const eligibility = calculateSnoozeEligibility(task);
      if (!eligibility.canSnooze) {
        throw new Error(eligibility.reason || 'Cannot snooze this task');
      }

      // Calculate snooze dates
      const snoozedUntil = calculateNextSnoozeDate();
      const firstSnoozedAt = task.firstSnoozedAt || new Date();
      const snoozeDeadline = calculateSnoozeDeadline(firstSnoozedAt);

      // API call to update task
      const response = await fetch(`/api/workflows/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'snoozed',
          snoozedUntil: snoozedUntil.toISOString(),
          firstSnoozedAt: task.firstSnoozedAt
            ? task.firstSnoozedAt
            : firstSnoozedAt.toISOString(),
          snoozeDeadline: snoozeDeadline.toISOString(),
          snoozeCount: (task.snoozeCount || 0) + 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to snooze task');
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  /**
   * Complete a task
   */
  const completeTask = useCallback(async (taskId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete task');
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  /**
   * Skip a task
   */
  const skipTask = useCallback(async (taskId: string, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'skipped',
          metadata: {
            skipReason: reason || 'User skipped',
            skippedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to skip task');
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  /**
   * Dismiss without choice (auto-skip)
   * Triggered when user tries to close forced decision modal
   */
  const dismissWithoutChoice = useCallback(async (taskId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'skipped',
          metadata: {
            skipReason: 'auto_skipped_on_abandon',
            skippedAt: new Date().toISOString(),
            autoSkipped: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to auto-skip task');
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  return {
    // State
    isLoading,
    error,
    eligibility,

    // Actions
    snoozeTask,
    completeTask,
    skipTask,
    dismissWithoutChoice,

    // Utilities
    checkEligibility,
    getDaysRemaining
  };
}

export default useTaskSnooze;
