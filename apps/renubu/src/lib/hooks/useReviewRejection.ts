/**
 * useReviewRejection Hook
 *
 * React hooks for review rejection API integration (Release 1.4)
 * Provides hooks for rejecting workflows/steps, resubmitting, and fetching rejection history
 */

import { useState, useCallback } from 'react';
import type { ReviewRejectionHistory } from '@/types/review-triggers';

// =====================================================
// Types
// =====================================================

export interface RejectWorkflowRequest {
  workflowId: string;
  reason?: string;
  comments: string;
}

export interface RejectStepRequest {
  executionId: string;
  stepId: string;
  stepIndex: number;
  reason?: string;
  comments: string;
}

export interface ResubmitRequest {
  workflowId: string;
  notes?: string;
}

export interface RejectionHistoryResponse {
  success: boolean;
  history: ReviewRejectionHistory;
  currentIteration: number;
  error?: string;
}

// =====================================================
// Workflow-Level Rejection Hooks
// =====================================================

/**
 * Hook for rejecting a workflow review
 */
export function useRejectWorkflow() {
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectWorkflow = useCallback(async (request: RejectWorkflowRequest) => {
    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${request.workflowId}/review/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: request.reason,
          comments: request.comments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to reject workflow (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reject workflow';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsRejecting(false);
    }
  }, []);

  return { rejectWorkflow, isRejecting, error };
}

/**
 * Hook for resubmitting a rejected workflow
 */
export function useResubmitWorkflow() {
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resubmitWorkflow = useCallback(async (request: ResubmitRequest) => {
    setIsResubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${request.workflowId}/review/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: request.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to resubmit workflow (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resubmit workflow';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsResubmitting(false);
    }
  }, []);

  return { resubmitWorkflow, isResubmitting, error };
}

/**
 * Hook for fetching workflow rejection history
 */
export function useRejectionHistory(workflowId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ReviewRejectionHistory>([]);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!workflowId) return;

    setIsLoading(true);
    setError(null);

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

      const data: RejectionHistoryResponse = await response.json();
      setHistory(data.history || []);
      setCurrentIteration(data.currentIteration || 1);
      return { success: true, history: data.history, currentIteration: data.currentIteration };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch rejection history';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  return { fetchHistory, history, currentIteration, isLoading, error };
}

// =====================================================
// Step-Level Rejection Hooks
// =====================================================

/**
 * Hook for rejecting a step review
 */
export function useRejectStep() {
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectStep = useCallback(async (request: RejectStepRequest) => {
    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workflows/executions/${request.executionId}/steps/${request.stepId}/review/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stepIndex: request.stepIndex,
            reason: request.reason,
            comments: request.comments,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to reject step (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reject step';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsRejecting(false);
    }
  }, []);

  return { rejectStep, isRejecting, error };
}

/**
 * Hook for resubmitting a rejected step
 */
export function useResubmitStep() {
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resubmitStep = useCallback(
    async (executionId: string, stepId: string, stepIndex: number, notes?: string) => {
      setIsResubmitting(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/workflows/executions/${executionId}/steps/${stepId}/review/resubmit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stepIndex,
              notes,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to resubmit step (${response.status})`);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to resubmit step';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsResubmitting(false);
      }
    },
    []
  );

  return { resubmitStep, isResubmitting, error };
}
