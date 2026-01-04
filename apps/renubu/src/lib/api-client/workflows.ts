/**
 * Workflows API Client
 *
 * Operations for workflow execution and management.
 */

import { apiFetch } from './index';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { WorkflowExecution, WorkflowStepExecution, ApiResponse } from './types';

// =====================================================
// Response Types
// =====================================================

interface ExecutionListResponse {
  executions: WorkflowExecution[];
  page: number;
  pageSize: number;
  count: number;
}

interface ExecutionDetailResponse {
  execution: WorkflowExecution;
}

interface StepExecutionsResponse {
  stepExecutions: WorkflowStepExecution[];
}

// =====================================================
// Workflows API
// =====================================================

export const workflowsApi = {
  // -------------------------------------------------
  // Executions
  // -------------------------------------------------

  /**
   * List workflow executions
   */
  async listExecutions(params?: {
    customerId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<ExecutionListResponse>> {
    return apiFetch<ExecutionListResponse>(API_ROUTES.WORKFLOWS.EXECUTIONS.LIST, {
      params,
    });
  },

  /**
   * Get execution by ID
   */
  async getExecution(id: string): Promise<ApiResponse<ExecutionDetailResponse>> {
    return apiFetch<ExecutionDetailResponse>(API_ROUTES.WORKFLOWS.EXECUTIONS.BY_ID(id));
  },

  /**
   * Get step executions for a workflow execution
   */
  async getStepExecutions(executionId: string): Promise<ApiResponse<StepExecutionsResponse>> {
    return apiFetch<StepExecutionsResponse>(API_ROUTES.WORKFLOWS.EXECUTIONS.STEPS(executionId));
  },

  /**
   * Get execution context
   */
  async getExecutionContext(executionId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.WORKFLOWS.EXECUTIONS.CONTEXT(executionId));
  },

  /**
   * Get execution progress
   */
  async getExecutionProgress(executionId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.WORKFLOWS.EXECUTIONS.PROGRESS(executionId));
  },

  // -------------------------------------------------
  // Tasks
  // -------------------------------------------------

  /**
   * List workflow tasks
   */
  async listTasks(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.TASKS.LIST, { params });
  },

  /**
   * Get pending tasks
   */
  async getPendingTasks(): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.TASKS.PENDING);
  },

  /**
   * Snooze a task
   */
  async snoozeTask(taskId: string, until: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.TASKS.SNOOZE(taskId), {
      method: 'POST',
      body: { until },
    });
  },

  /**
   * Reassign a task
   */
  async reassignTask(taskId: string, userId: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.TASKS.REASSIGN(taskId), {
      method: 'POST',
      body: { userId },
    });
  },

  // -------------------------------------------------
  // Actions (Orchestrator)
  // -------------------------------------------------

  /**
   * Snooze workflow execution
   */
  async snoozeExecution(
    executionId: string,
    data: { until?: string; triggers?: unknown[] }
  ): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.ORCHESTRATOR.EXECUTIONS.SNOOZE(executionId), {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Skip workflow execution
   */
  async skipExecution(executionId: string, reason: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.ORCHESTRATOR.EXECUTIONS.SKIP(executionId), {
      method: 'POST',
      body: { reason },
    });
  },

  /**
   * Escalate workflow execution
   */
  async escalateExecution(
    executionId: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.ORCHESTRATOR.EXECUTIONS.ESCALATE(executionId), {
      method: 'POST',
      body: { userId, reason },
    });
  },

  /**
   * Get workflow queue for current user
   */
  async getMyQueue(): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.QUEUE.ME);
  },

  // -------------------------------------------------
  // Chat
  // -------------------------------------------------

  /**
   * Get chat threads
   */
  async getChatThreads(): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.CHAT.THREADS);
  },

  /**
   * Get chat messages for a thread
   */
  async getChatMessages(threadId: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(API_ROUTES.WORKFLOWS.CHAT.MESSAGES(threadId));
  },
};
