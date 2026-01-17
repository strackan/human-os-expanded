/**
 * API Client
 *
 * Unified fetch wrapper with error handling and authentication.
 * Eliminates repeated boilerplate across components.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_BASE_URL = 'https://goodhang.com';

/**
 * Get the API base URL from environment or default
 */
export function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
}

// =============================================================================
// REQUEST OPTIONS
// =============================================================================

export interface ApiRequestOptions {
  /** HTTP method (defaults to GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Auth token to include in Authorization header */
  token?: string | null;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Make an API request with standard error handling
 */
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

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors for error response
      }
      throw new ApiClientError(errorMessage, response.status);
    }

    // Handle empty responses
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

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Make a GET request
 */
export function get<T>(endpoint: string, token?: string | null): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', token });
}

/**
 * Make a POST request
 */
export function post<T>(
  endpoint: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body, token });
}

/**
 * Make a PUT request
 */
export function put<T>(
  endpoint: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'PUT', body, token });
}

/**
 * Make a DELETE request
 */
export function del<T>(endpoint: string, token?: string | null): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE', token });
}
