/**
 * Anthropic Retry Utility
 *
 * Provides exponential backoff retry logic for API calls.
 * Handles rate limits, timeouts, and transient errors.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 32000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor (0-1) to randomize delays (default: 0.1) */
  jitterFactor?: number;
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for logging retry attempts */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  isRetryable: defaultIsRetryable,
  onRetry: defaultOnRetry,
};

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Rate limit errors - always retry
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return true;
  }

  // Timeout errors - retry
  if (message.includes('timeout') || message.includes('timed out') || message.includes('econnreset')) {
    return true;
  }

  // Server errors (5xx) - retry
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }

  // Network errors - retry
  if (message.includes('network') || message.includes('fetch failed') || message.includes('enotfound')) {
    return true;
  }

  // Overloaded - retry
  if (message.includes('overloaded')) {
    return true;
  }

  // Authentication errors - don't retry
  if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
    return false;
  }

  // Validation errors - don't retry
  if (message.includes('invalid') || message.includes('400')) {
    return false;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Default retry callback (logging)
 */
function defaultOnRetry(attempt: number, error: unknown, delayMs: number): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn(`[anthropic-retry] Attempt ${attempt} failed: ${errorMessage}. Retrying in ${delayMs}ms...`);
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitterFactor: number
): number {
  // Exponential backoff
  const baseDelay = initialDelay * Math.pow(multiplier, attempt - 1);

  // Cap at max delay
  const cappedDelay = Math.min(baseDelay, maxDelay);

  // Add jitter (-jitterFactor to +jitterFactor)
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);

  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result with success status, data/error, and attempt count
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    attempts = attempt;

    try {
      const data = await fn();
      return { success: true, data, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt > opts.maxRetries || !opts.isRetryable(error)) {
        break;
      }

      // Calculate delay
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier,
        opts.jitterFactor
      );

      // Call retry callback
      opts.onRetry(attempt, error, delayMs);

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  const failResult: RetryResult<T> = { success: false, attempts };
  if (lastError) {
    failResult.error = lastError;
  }
  return failResult;
}

/**
 * Execute a function with retry logic, throwing on failure
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result data
 * @throws Error if all retries fail
 */
export async function withRetryOrThrow<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(fn, options);

  if (!result.success) {
    throw result.error || new Error('All retry attempts failed');
  }

  return result.data!;
}

// =============================================================================
// SPECIALIZED RETRY FUNCTIONS
// =============================================================================

/**
 * Retry options optimized for Anthropic API calls
 */
export const ANTHROPIC_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  onRetry: (attempt, error, delayMs) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[AnthropicService] Retry ${attempt}: ${msg}. Waiting ${delayMs}ms...`);
  },
};

/**
 * Retry options for rate-limited scenarios (more aggressive backoff)
 */
export const RATE_LIMIT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 120000,
  backoffMultiplier: 2.5,
  jitterFactor: 0.2,
};

/**
 * Retry options for quick operations (fewer retries, shorter delays)
 */
export const QUICK_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

// =============================================================================
// HELPER FOR STREAMING
// =============================================================================

/**
 * Create a retry wrapper for streaming operations
 * Since streams can't be retried mid-stream, this retries the entire operation
 */
export async function* withRetryStreaming<T, R>(
  createStream: () => AsyncGenerator<T, R, unknown>,
  options: RetryOptions = ANTHROPIC_RETRY_OPTIONS
): AsyncGenerator<T, R, unknown> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const stream = createStream();
      const result = yield* stream;
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt > opts.maxRetries || !opts.isRetryable(error)) {
        throw lastError;
      }

      const delayMs = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier,
        opts.jitterFactor
      );

      opts.onRetry(attempt, error, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Streaming retry failed');
}
