/**
 * Founders API Client
 *
 * Unified fetch wrapper for the Founders web experience.
 * Uses relative URLs (same-origin) — no base URL needed.
 */

// =============================================================================
// REQUEST OPTIONS
// =============================================================================

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | undefined;
  body?: unknown;
  token?: string | null | undefined;
  headers?: Record<string, string> | undefined;
  timeout?: number | undefined;
}

// =============================================================================
// API CLIENT
// =============================================================================

export class ApiClientError extends Error {
  status?: number | undefined;
  code?: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    timeout = 30000,
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(endpoint, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      throw new ApiClientError(errorMessage, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError('Request timeout', 408);
      }
      throw new ApiClientError(error.message);
    }

    throw new ApiClientError('Unknown error occurred');
  }
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

export function get<T>(endpoint: string, token?: string | null): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', token });
}

export function post<T>(
  endpoint: string,
  body: unknown,
  token?: string | null,
  options?: { timeout?: number }
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body, token, ...options });
}

/**
 * Check if dev mode is enabled via query param
 */
export function isDevMode(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');
}
