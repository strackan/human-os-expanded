/**
 * User-Friendly Error Messages Utility
 *
 * Converts technical errors into helpful, actionable messages for users
 */

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ClaudeAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeAPIError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Convert any error into a user-friendly message
 */
export function getUserFriendlyError(error: Error | unknown): string {
  // Handle known error types
  if (error instanceof NetworkError) {
    return "We're having trouble connecting. Please check your internet and try again.";
  }

  if (error instanceof AuthenticationError) {
    return "Your session has expired. Please log in again to continue.";
  }

  if (error instanceof ValidationError) {
    return error.message; // Validation errors are already user-friendly
  }

  if (error instanceof ClaudeAPIError) {
    return "Our AI system is temporarily unavailable. We've been notified and are working on it. Please try again in a few minutes.";
  }

  if (error instanceof DatabaseError) {
    return "We couldn't save your information right now. Your data is safe - please try again in a moment.";
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('fetch') || message.includes('network') || message.includes('offline')) {
      return "Connection lost. Check your internet and try again.";
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return "This is taking longer than expected. Please try again.";
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return "You're doing that too quickly. Please wait a moment and try again.";
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return "You don't have permission to do that. Please contact support if you think this is a mistake.";
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return "We couldn't find what you're looking for. It may have been moved or deleted.";
    }

    // Server errors
    if (message.includes('500') || message.includes('server error') || message.includes('internal')) {
      return "Something went wrong on our end. We've been notified and are looking into it.";
    }

    // Return the original message if it's already user-friendly (short and clear)
    if (error.message.length < 100 && !message.includes('error:') && !message.includes('exception')) {
      return error.message;
    }
  }

  // Generic fallback
  return "Something unexpected happened. Please try again or contact support if the problem continues.";
}

/**
 * Get a user-friendly error with suggested actions
 */
export function getErrorWithActions(error: Error | unknown): {
  message: string;
  actions: string[];
} {
  const message = getUserFriendlyError(error);
  const actions: string[] = [];

  if (error instanceof NetworkError) {
    actions.push('Check your internet connection');
    actions.push('Refresh the page');
    actions.push('Try again in a moment');
  } else if (error instanceof AuthenticationError) {
    actions.push('Log in again');
    actions.push('Clear your browser cache');
  } else if (error instanceof ClaudeAPIError) {
    actions.push('Wait a few minutes');
    actions.push('Try refreshing the page');
    actions.push('Contact support if this persists');
  } else {
    actions.push('Try again');
    actions.push('Refresh the page');
    actions.push('Contact support if the problem continues');
  }

  return { message, actions };
}

/**
 * Format error for logging (includes technical details)
 */
export function formatErrorForLogging(error: Error | unknown): {
  message: string;
  name: string;
  stack?: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      ...(error.stack && { stack: error.stack }),
      timestamp,
    };
  }

  return {
    message: String(error),
    name: 'UnknownError',
    timestamp,
  };
}
