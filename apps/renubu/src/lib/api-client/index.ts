/**
 * API Client
 *
 * Transport-agnostic API client for Renubu.
 * Can be used in browser, Node.js, or external integrations.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client';
 *   const profile = await apiClient.user.getProfile();
 *   const customers = await apiClient.customers.list({ search: 'acme' });
 */

import { buildApiUrl } from '@/lib/constants/api-routes';
import type { ApiResponse } from './types';

// =====================================================
// Configuration
// =====================================================

export interface ApiClientConfig {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

let globalConfig: ApiClientConfig = {
  baseUrl: '',
  getAuthToken: async () => null,
  onUnauthorized: () => {},
};

/**
 * Configure the API client globally
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

// =====================================================
// Base Fetch Wrapper
// =====================================================

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

/**
 * Type-safe fetch wrapper with error handling
 */
export async function apiFetch<T>(
  route: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, headers = {} } = options;

  try {
    // Build URL with query params
    const url = buildApiUrl(`${globalConfig.baseUrl}${route}`, params);

    // Get auth token if configured
    const token = globalConfig.getAuthToken
      ? await globalConfig.getAuthToken()
      : null;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies for session auth
    });

    // Handle unauthorized
    if (response.status === 401) {
      globalConfig.onUnauthorized?.();
      return {
        data: null,
        error: { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: {
          error: data.error || 'Request failed',
          details: data.details,
          code: String(response.status),
        },
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('API fetch error:', error);
    return {
      data: null,
      error: {
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

// Re-export types
export * from './types';
