/**
 * Retry Logic Utility
 *
 * Implements exponential backoff for API calls and network requests
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const jitter = exponentialDelay * 0.1 * Math.random(); // Add 0-10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = opts.shouldRetry(lastError, attempt);
      const isLastAttempt = attempt === opts.maxRetries;

      if (!shouldRetry || isLastAttempt) {
        throw lastError;
      }

      // Calculate delay and notify
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      opts.onRetry(lastError, attempt);

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError!;
}

/**
 * Retry specifically for fetch requests
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const shouldRetry = (error: Error, _attempt: number): boolean => {
    // Don't retry client errors (4xx), except for specific cases
    if (error.message.includes('4') && !error.message.includes('429')) {
      return false;
    }

    // Always retry network errors
    if (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('offline')
    ) {
      return true;
    }

    // Retry server errors (5xx) and timeouts
    return true;
  };

  return withRetry(
    async () => {
      const response = await fetch(input, init);

      // Consider 5xx and 429 as retryable errors
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    },
    { ...options, shouldRetry: options.shouldRetry || shouldRetry }
  );
}

/**
 * Retry for assessment answer submission
 */
export async function saveAnswerWithRetry(
  sessionId: string,
  questionId: string,
  questionText: string,
  answer: string,
  sectionIndex: number,
  questionIndex: number
): Promise<Response> {
  return fetchWithRetry(
    `/api/assessment/${sessionId}/answer`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        question_text: questionText,
        answer,
        section_index: sectionIndex,
        question_index: questionIndex,
      }),
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        console.log(`Retrying answer submission (attempt ${attempt}):`, error.message);
      },
    }
  );
}

/**
 * Queue for offline operations
 */
export class OfflineQueue {
  private queue: Array<{
    id: string;
    operation: () => Promise<unknown>;
    retries: number;
  }> = [];
  private isProcessing = false;
  private readonly STORAGE_KEY = 'offline_queue';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.setupOnlineListener();
    }
  }

  /**
   * Add operation to queue
   */
  add(id: string, operation: () => Promise<unknown>): void {
    this.queue.push({ id, operation, retries: 0 });
    this.saveToStorage();
  }

  /**
   * Process queue when online
   */
  async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      if (!item) break;

      try {
        await item.operation();
        // Success - remove from queue
        this.queue.shift();
        this.saveToStorage();
      } catch (_error) {
        item.retries++;
        if (item.retries >= 3) {
          // Failed too many times - remove
          console.error(`Offline operation ${item.id} failed after 3 retries`);
          this.queue.shift();
          this.saveToStorage();
        } else {
          // Will retry later
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        // Note: Can't restore functions, only data
        // In a real implementation, you'd store operation metadata
        // and reconstruct the operations
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      // In a real implementation, you'd serialize operation metadata
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.queue.map((item) => ({ id: item.id, retries: item.retries })))
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Setup listener for online event
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Back online - processing queued operations');
      this.process();
    });
  }

  /**
   * Get queue status
   */
  getStatus(): { pending: number; isProcessing: boolean } {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Export singleton instance
export const offlineQueue = typeof window !== 'undefined' ? new OfflineQueue() : null;
