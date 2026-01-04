/**
 * API Route Constants
 *
 * Centralized API route definitions for the entire application.
 * All API routes are organized by domain for better maintainability.
 *
 * Usage:
 *   import { API_ROUTES } from '@/lib/constants/api-routes';
 *   fetch(API_ROUTES.CUSTOMERS.LIST)
 *   fetch(API_ROUTES.CUSTOMERS.BY_ID('customer-123'))
 */

// =====================================================
// Authentication Routes
// =====================================================

export const AUTH_ROUTES = {
  SIGNIN: '/api/auth/signin',
  SIGNOUT: '/api/auth/signout',
  STATUS: '/api/auth/status',
  REFRESH: '/api/auth/refresh',
  DEBUG: '/api/auth/debug',
  CREATE_USER: '/api/auth/create-user',
  CHECK_USER: '/api/auth/check-user',
  UPDATE_PASSWORD: '/api/auth/update-password',
} as const;

// =====================================================
// Customer Routes
// =====================================================

export const CUSTOMER_ROUTES = {
  LIST: '/api/customers',
  BY_ID: (id: string) => `/api/customers/${id}`,
  BY_KEY: (key: string) => `/api/customers/${key}`,
  TEST: '/api/customers/test',
  CONTACTS: (id: string) => `/api/customers/${id}/contacts`,
  PROPERTIES: (id: string) => `/api/customers/${id}/properties`,
  METRICS: (id: string) => `/api/customers/${id}/metrics`,
  ACCOUNT_PLAN: (id: string) => `/api/customers/${id}/account-plan`,
} as const;

// =====================================================
// Workflow Routes
// =====================================================

export const WORKFLOW_ROUTES = {
  // Executions
  EXECUTIONS: {
    LIST: '/api/workflows/executions',
    BY_ID: (id: string) => `/api/workflows/executions/${id}`,
    STEPS: (id: string) => `/api/workflows/executions/${id}/steps`,
    TASKS: (id: string) => `/api/workflows/executions/${id}/tasks`,
    METRICS: (id: string) => `/api/workflows/executions/${id}/metrics`,
    PROGRESS: (id: string) => `/api/workflows/executions/${id}/progress`,
    CONTEXT: (id: string) => `/api/workflows/executions/${id}/context`,
    STREAM: (executionId: string, stepId: string) =>
      `/api/workflows/executions/${executionId}/steps/${stepId}/stream`,
  },

  // Tasks
  TASKS: {
    LIST: '/api/workflows/tasks',
    BY_ID: (id: string) => `/api/workflows/tasks/${id}`,
    PENDING: '/api/workflows/tasks/pending',
    SNOOZE: (id: string) => `/api/workflows/tasks/${id}/snooze`,
    REASSIGN: (id: string) => `/api/workflows/tasks/${id}/reassign`,
    NEXT: '/api/tasks/next',
    COMPLETE: (id: string) => `/api/tasks/${id}/complete`,
  },

  // Chat & Branches
  CHAT: {
    THREADS: '/api/workflows/chat/threads',
    THREAD_BY_ID: (threadId: string) => `/api/workflows/chat/threads/${threadId}`,
    MESSAGES: (threadId: string) => `/api/workflows/chat/threads/${threadId}/messages`,
    COMPLETE: (threadId: string) => `/api/workflows/chat/threads/${threadId}/complete`,
  },

  // Context & Queue
  CONTEXT: '/api/workflows/context',
  CONTEXT_BY_CUSTOMER: (customerId: string) => `/api/workflows/context/${customerId}`,
  QUEUE: {
    ME: '/api/workflows/queue/me',
    BY_CSM: (csmId: string) => `/api/workflows/queue/${csmId}`,
  },

  // Artifacts & Actions
  ARTIFACTS: {
    LIST: '/api/workflows/artifacts',
    BY_ID: (id: string) => `/api/workflows/artifacts/${id}`,
  },
  ACTIONS: {
    EXECUTE: '/api/workflows/actions/execute',
  },

  // Workflow Definitions
  BY_ID: (workflowId: string) => `/api/workflows/${workflowId}`,
  BRANCHES: (workflowId: string, stepId?: string) =>
    stepId
      ? `/api/workflows/${workflowId}/branches?stepId=${stepId}`
      : `/api/workflows/${workflowId}/branches`,
} as const;

// =====================================================
// Renewal Routes
// =====================================================

export const RENEWAL_ROUTES = {
  LIST: '/api/renewals',
  TEST: '/api/renewals/test',
} as const;

// =====================================================
// Contract Routes
// =====================================================

export const CONTRACT_ROUTES = {
  LIST: '/api/contracts',
} as const;

// =====================================================
// Team Routes
// =====================================================

export const TEAM_ROUTES = {
  MEMBERS: '/api/team/members',
  INVITE: '/api/team/invite',
  PROMOTE: (userId: string) => `/api/team/${userId}/promote`,
  DISABLE: (userId: string) => `/api/team/${userId}/disable`,
} as const;

// =====================================================
// User Routes
// =====================================================

export const USER_ROUTES = {
  PROFILE: '/api/user/profile',
  PREFERENCES: '/api/user/preferences',
  UPDATE_PROFILE_NAME: '/api/update-profile-name',
} as const;

// =====================================================
// Notification Routes
// =====================================================

export const NOTIFICATION_ROUTES = {
  LIST: '/api/notifications',
  UNREAD: '/api/notifications/unread',
  UNREAD_COUNT: '/api/notifications/unread/count',
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
} as const;

// =====================================================
// Orchestrator Routes
// =====================================================

export const ORCHESTRATOR_ROUTES = {
  QUEUE: '/api/orchestrator/queue',
  EXECUTIONS: {
    SNOOZE: (id: string) => `/api/orchestrator/executions/${id}/snooze`,
    STATUS: (id: string) => `/api/orchestrator/executions/${id}/status`,
    ESCALATE: (id: string) => `/api/orchestrator/executions/${id}/escalate`,
    SKIP: (id: string) => `/api/orchestrator/executions/${id}/skip`,
  },
  DEMO: {
    INITIALIZE: '/api/orchestrator/demo/initialize',
    STATUS: '/api/orchestrator/demo/status',
  },
} as const;

// =====================================================
// Demo & Test Routes
// =====================================================

export const DEMO_ROUTES = {
  SUPPORT_TICKETS: '/api/demo/support-tickets',
  OPERATIONS: '/api/demo/operations',
} as const;

export const TEST_ROUTES = {
  CALENDAR: '/api/test/calendar',
} as const;

// =====================================================
// Automation Routes
// =====================================================

export const AUTOMATION_ROUTES = {
  TRIGGER_WEBHOOK: (customerId: string) => `/api/automations/trigger-webhook/${customerId}`,
} as const;

// =====================================================
// Dashboard Routes
// =====================================================

export const DASHBOARD_ROUTES = {
  TODAY_WORKFLOWS: '/api/dashboard/today-workflows',
} as const;

// =====================================================
// Event Routes
// =====================================================

export const EVENT_ROUTES = {
  LIST: '/api/events',
} as const;

// =====================================================
// Alert Routes
// =====================================================

export const ALERT_ROUTES = {
  LIST: '/api/alerts',
} as const;

// =====================================================
// Admin Routes
// =====================================================

export const ADMIN_ROUTES = {
  SEED: '/api/admin/seed',
} as const;

// =====================================================
// Cron Routes
// =====================================================

export const CRON_ROUTES = {
  EVALUATE_TASKS: '/api/cron/evaluate-tasks',
} as const;

// =====================================================
// Misc Routes
// =====================================================

export const MISC_ROUTES = {
  CHECK_CONFIG: '/api/check-config',
  COMPONENT_SOURCE: '/api/component-source',
  QUICK_ACTIONS: {
    SEND_EMAIL: '/api/quick-actions/send-email',
    SCHEDULE_MEETING: '/api/quick-actions/schedule-meeting',
    CREATE_TASK: '/api/quick-actions/create-task',
    UPDATE_FIELD: '/api/quick-actions/update-field',
    REMIND_LATER: '/api/quick-actions/remind-later',
  },
} as const;

// =====================================================
// Consolidated API Routes Object
// =====================================================

export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  CUSTOMERS: CUSTOMER_ROUTES,
  WORKFLOWS: WORKFLOW_ROUTES,
  RENEWALS: RENEWAL_ROUTES,
  CONTRACTS: CONTRACT_ROUTES,
  TEAM: TEAM_ROUTES,
  USER: USER_ROUTES,
  NOTIFICATIONS: NOTIFICATION_ROUTES,
  ORCHESTRATOR: ORCHESTRATOR_ROUTES,
  DEMO: DEMO_ROUTES,
  TEST: TEST_ROUTES,
  AUTOMATIONS: AUTOMATION_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  EVENTS: EVENT_ROUTES,
  ALERTS: ALERT_ROUTES,
  ADMIN: ADMIN_ROUTES,
  CRON: CRON_ROUTES,
  MISC: MISC_ROUTES,
} as const;

// =====================================================
// Helper Functions
// =====================================================

/**
 * Build a URL with query parameters
 */
export function buildApiUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return baseUrl;

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Type-safe API route builder
 */
export type ApiRoute = string | ((...args: any[]) => string);

/**
 * Default export for convenience
 */
export default API_ROUTES;
