/**
 * API Client Entry Point
 *
 * Unified API client with all resources.
 * Import this file for the complete client.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client/client';
 *   const profile = await apiClient.user.getProfile();
 */

import { userApi } from './user';
import { customersApi } from './customers';
import { workflowsApi } from './workflows';
import { notificationsApi } from './notifications';
import { teamApi } from './team';

/**
 * Unified API client with all resources
 */
export const apiClient = {
  user: userApi,
  customers: customersApi,
  workflows: workflowsApi,
  notifications: notificationsApi,
  team: teamApi,
};

// Re-export individual APIs
export { userApi, customersApi, workflowsApi, notificationsApi, teamApi };

// Re-export configuration
export { configureApiClient, apiFetch } from './index';
export type { ApiClientConfig, FetchOptions } from './index';

// Re-export types
export * from './types';

export default apiClient;
