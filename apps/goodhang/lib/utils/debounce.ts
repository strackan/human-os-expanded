/**
 * Debounce Utility
 *
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time it was invoked.
 */

export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Debounce with promise support
 * Returns a promise that resolves when the debounced function executes
 */
export function debouncePromise<T extends (...args: never[]) => Promise<unknown>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return function debounced(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result as ReturnType<T>);
            pendingPromise = null;
            timeoutId = null;
          } catch (error) {
            reject(error);
            pendingPromise = null;
            timeoutId = null;
          }
        }, wait);
      });
    }

    return pendingPromise;
  };
}
