/**
 * Workflow Triggers API Client
 *
 * Client-side helpers for interacting with workflow trigger APIs.
 * These functions call the API routes created by Agent 2.
 */

import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { SkipTrigger } from '@/types/skip-triggers';
import type { ReviewTrigger } from '@/types/review-triggers';
// Backward compatibility
import type { EscalateTrigger } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface SnoozeWithTriggersRequest {
  workflowId: string;
  userId: string;
  triggers: WakeTrigger[];
  logic?: TriggerLogic;
}

export interface SnoozeWithTriggersResponse {
  success: boolean;
  actionId?: string;
  error?: string;
}

export interface SnoozedWorkflowsResponse {
  workflows: Array<{
    id: string;
    workflowName: string;
    workflowType: string;
    customerName: string;
    customerId: string;
    snoozedAt: string;
    snoozedBy: string;
    snoozedByName?: string;
    status: string;
    priorityScore?: number;
    wake_triggers?: WakeTrigger[];
    trigger_fired_at?: string;
    fired_trigger_type?: string;
    last_evaluated_at?: string;
    metadata?: Record<string, any>;
  }>;
  count: number;
}

export interface WakeNowRequest {
  workflowId: string;
  userId: string;
  reason?: string;
}

export interface WakeNowResponse {
  success: boolean;
  error?: string;
}

// =====================================================
// API Client Functions
// =====================================================

/**
 * Snooze a workflow with wake triggers
 * Calls: POST /api/workflows/snooze-with-triggers
 */
export async function snoozeWithTriggers(
  workflowId: string,
  userId: string,
  triggers: WakeTrigger[],
  logic?: TriggerLogic
): Promise<SnoozeWithTriggersResponse> {
  try {
    const response = await fetch('/api/workflows/snooze-with-triggers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        userId,
        triggers,
        logic: logic || 'OR', // Default to OR for backward compatibility
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to snooze workflow (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Snooze with triggers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to snooze workflow',
    };
  }
}

/**
 * Get snoozed workflows for a user
 * Calls: GET /api/workflows/snoozed?userId=<userId>
 */
export async function getSnoozedWorkflows(
  userId?: string
): Promise<SnoozedWorkflowsResponse> {
  try {
    const url = userId
      ? `/api/workflows/snoozed?userId=${userId}`
      : '/api/workflows/snoozed';

    console.log('[API] getSnoozedWorkflows - Fetching from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] getSnoozedWorkflows - Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] getSnoozedWorkflows - Error response:', errorData);
      throw new Error(errorData.error || `Failed to fetch snoozed workflows (${response.status})`);
    }

    const data = await response.json();
    console.log('[API] getSnoozedWorkflows - Response data:', data);
    console.log('[API] getSnoozedWorkflows - Has workflows array?', !!data.workflows, 'Count:', data.count);

    return data;
  } catch (error) {
    console.error('[API] Get snoozed workflows error:', error);
    throw error;
  }
}

/**
 * Wake a workflow immediately (bypass snooze)
 * Calls: POST /api/workflows/wake-now
 */
export async function wakeWorkflowNow(
  workflowId: string,
  userId: string,
  reason?: string
): Promise<WakeNowResponse> {
  try {
    const response = await fetch('/api/workflows/wake-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        userId,
        reason: reason || 'Manual wake by user',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to wake workflow (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Wake workflow now error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to wake workflow',
    };
  }
}

/**
 * Evaluate triggers for a snoozed workflow
 * Calls: POST /api/workflows/evaluate-triggers
 * (Used by background workers - not typically called from UI)
 */
export async function evaluateTriggers(
  workflowId: string
): Promise<{ triggered: boolean; triggerId?: string; error?: string }> {
  try {
    const response = await fetch('/api/workflows/evaluate-triggers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workflowId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to evaluate triggers (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Evaluate triggers error:', error);
    return {
      triggered: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate triggers',
    };
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Format trigger for display
 */
export function formatTriggerSummary(triggers: WakeTrigger[]): string {
  if (triggers.length === 0) return 'No triggers';
  if (triggers.length === 1) {
    const trigger = triggers[0];
    if (trigger.type === 'date') {
      return `Wake on ${new Date((trigger.config as any).date).toLocaleDateString()}`;
    } else {
      return `Wake on ${(trigger.config as any).eventType.replace(/_/g, ' ')}`;
    }
  }
  return `${triggers.length} triggers configured`;
}

/**
 * Check if any trigger has fired
 */
export function hasTriggerFired(
  triggers: WakeTrigger[],
  firedTriggerType?: string
): boolean {
  return !!firedTriggerType;
}

/**
 * Get the next trigger that will fire (for date triggers)
 */
export function getNextTrigger(triggers: WakeTrigger[]): WakeTrigger | null {
  const dateTriggers = triggers.filter((t) => t.type === 'date');
  if (dateTriggers.length === 0) return null;

  return dateTriggers.reduce((earliest, current) => {
    const currentDate = new Date((current.config as any).date);
    const earliestDate = new Date((earliest.config as any).date);
    return currentDate < earliestDate ? current : earliest;
  });
}

// =====================================================
// Skip API Functions (Phase 1.1)
// =====================================================

/**
 * Skip a workflow with reactivation triggers
 * Calls: POST /api/workflows/skip-with-triggers
 */
export async function skipWithTriggers(
  workflowId: string,
  triggers: SkipTrigger[],
  reason?: string,
  logic?: TriggerLogic
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/workflows/skip-with-triggers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        triggers,
        reason,
        logic: logic || 'OR',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to skip workflow (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Skip with triggers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip workflow',
    };
  }
}

/**
 * Get skipped workflows for a user
 * Calls: GET /api/workflows/skipped?userId=<userId>
 */
export async function getSkippedWorkflows(
  userId?: string
): Promise<{ workflows: any[]; count: number }> {
  try {
    const url = userId
      ? `/api/workflows/skipped?userId=${userId}`
      : '/api/workflows/skipped';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch skipped workflows (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Get skipped workflows error:', error);
    throw error;
  }
}

/**
 * Reactivate a skipped workflow immediately
 * Calls: POST /api/workflows/reactivate-now
 */
export async function reactivateWorkflowNow(
  workflowId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/workflows/reactivate-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        reason: reason || 'Manual reactivation by user',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to reactivate workflow (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Reactivate workflow now error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate workflow',
    };
  }
}

// =====================================================
// Review API Functions (Phase 1.2B)
// =====================================================

/**
 * Request review for a workflow with notification triggers
 * Calls: POST /api/workflows/request-review
 *
 * Review-only mode: Original user keeps ownership but is blocked until reviewer approves.
 * Triggers determine when the reviewer is notified.
 */
export async function requestReviewWithTriggers(
  workflowId: string,
  reviewerId: string,
  triggers: ReviewTrigger[],
  reason?: string,
  logic?: TriggerLogic
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/workflows/request-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        reviewerId,
        triggers,
        reason,
        logic: logic || 'OR',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to request review (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Request review with triggers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request review',
    };
  }
}

/**
 * @deprecated Use requestReviewWithTriggers instead
 * Backward compatibility wrapper for escalate → review transition
 */
export async function escalateWithTriggers(
  workflowId: string,
  escalateToUserId: string,
  triggers: EscalateTrigger[],
  reason?: string,
  logic?: TriggerLogic
): Promise<{ success: boolean; error?: string }> {
  return requestReviewWithTriggers(workflowId, escalateToUserId, triggers, reason, logic);
}

/**
 * Get workflows pending review for a user
 * Calls: GET /api/workflows/pending-review?userId=<userId>
 */
export async function getPendingReviewWorkflows(
  userId?: string
): Promise<{ workflows: any[]; count: number }> {
  try {
    const url = userId
      ? `/api/workflows/pending-review?userId=${userId}`
      : '/api/workflows/pending-review';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch pending review workflows (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Get pending review workflows error:', error);
    throw error;
  }
}

/**
 * @deprecated Use getPendingReviewWorkflows instead
 * Backward compatibility wrapper for escalate → review transition
 */
export async function getEscalatedWorkflows(
  userId?: string
): Promise<{ workflows: any[]; count: number }> {
  return getPendingReviewWorkflows(userId);
}

/**
 * Approve a workflow review
 * Calls: POST /api/workflows/approve-review
 */
export async function approveWorkflowReview(
  workflowId: string,
  comments?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/workflows/approve-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        comments,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to approve review (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Approve review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve review',
    };
  }
}

/**
 * Request changes for a workflow review
 * Calls: POST /api/workflows/request-changes
 */
export async function requestWorkflowChanges(
  workflowId: string,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/workflows/request-changes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        comments,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to request changes (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Request changes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request changes',
    };
  }
}

/**
 * @deprecated Use approveWorkflowReview instead
 * Backward compatibility wrapper for escalate → review transition
 */
export async function resolveWorkflowNow(
  workflowId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return approveWorkflowReview(workflowId, reason);
}

// =====================================================
// Review Rejection API Functions (Phase 1.4)
// =====================================================

/**
 * Reject a workflow review
 * Calls: POST /api/workflows/[workflowId]/review/reject
 */
export async function rejectWorkflowReview(
  workflowId: string,
  reason: string | undefined,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/workflows/${workflowId}/review/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
        comments,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to reject review (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Reject review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject review',
    };
  }
}

/**
 * Resubmit a rejected workflow for review
 * Calls: POST /api/workflows/[workflowId]/review/resubmit
 */
export async function resubmitWorkflowForReview(
  workflowId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/workflows/${workflowId}/review/resubmit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to resubmit workflow (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Resubmit workflow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resubmit workflow',
    };
  }
}

/**
 * Get rejection history for a workflow
 * Calls: GET /api/workflows/[workflowId]/review/history
 */
export async function getWorkflowRejectionHistory(
  workflowId: string
): Promise<{ success: boolean; history?: any[]; currentIteration?: number; error?: string }> {
  try {
    const response = await fetch(`/api/workflows/${workflowId}/review/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch rejection history (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Get rejection history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rejection history',
    };
  }
}
