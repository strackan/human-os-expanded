/**
 * SWR Configuration
 *
 * Optimized caching strategy for assessment API calls:
 * - Stale-while-revalidate for better UX
 * - Automatic retry with exponential backoff
 * - Deduplication of concurrent requests
 * - Focus revalidation for real-time updates
 */

import type { SWRConfiguration } from 'swr';

/**
 * Default SWR configuration for the application
 */
export const swrConfig: SWRConfiguration = {
  // Revalidation settings
  revalidateOnFocus: true, // Refresh data when tab regains focus
  revalidateOnReconnect: true, // Refresh data when connection restored
  revalidateIfStale: true, // Always revalidate stale data
  dedupingInterval: 2000, // Dedupe requests within 2 seconds

  // Cache settings
  focusThrottleInterval: 5000, // Throttle focus revalidation to 5s
  loadingTimeout: 3000, // Show error if loading takes > 3s

  // Error retry settings
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5s between retries

  // Keep data fresh
  refreshInterval: 0, // Don't auto-refresh (set per-hook if needed)

  // Optimistic UI support
  revalidateOnMount: true,
};

/**
 * Assessment-specific SWR configuration
 * More aggressive caching for assessment data
 */
export const assessmentSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false, // Don't revalidate on focus for assessments
  dedupingInterval: 5000, // Longer dedup for assessment calls
  errorRetryCount: 5, // More retries for critical assessment calls
};

/**
 * Results-specific SWR configuration
 * Cache results more aggressively (they don't change often)
 */
export const resultsSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateIfStale: false,
  dedupingInterval: 60000, // 1 minute dedup
  errorRetryCount: 2, // Fewer retries for results
};

/**
 * Custom fetcher with better error handling
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred while fetching data',
    }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetcher with authentication
 */
export async function authenticatedFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for auth
  });

  if (response.status === 401) {
    // Redirect to login if unauthorized
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred while fetching data',
    }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  assessmentStatus: () => '/api/assessment/status',
  assessmentSession: (sessionId: string) => `/api/assessment/${sessionId}`,
  assessmentResults: (sessionId: string) => `/api/assessment/${sessionId}/results`,
  memberProfile: (userId: string) => `/api/members/${userId}`,
  invites: () => '/api/invites',
};

/**
 * Mutate helpers for optimistic updates
 */
export function optimisticUpdate<T>(
  _key: string,
  _updateFn: (data: T) => T
): Promise<T | undefined> {
  // This would use SWR's mutate function
  // Import from 'swr' when using: import { mutate } from 'swr'
  // return mutate<T>(key, updateFn, { revalidate: false });
  return Promise.resolve(undefined);
}
