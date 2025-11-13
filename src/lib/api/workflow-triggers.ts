/**
 * Workflow Triggers API Client
 *
 * Client-side helpers for interacting with workflow trigger APIs.
 * These functions call the API routes created by Agent 2.
 */

import type { WakeTrigger } from '@/types/wake-triggers';

// =====================================================
// Types
// =====================================================

export interface SnoozeWithTriggersRequest {
  workflowId: string;
  userId: string;
  triggers: WakeTrigger[];
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
  triggers: WakeTrigger[]
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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch snoozed workflows (${response.status})`);
    }

    return await response.json();
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
