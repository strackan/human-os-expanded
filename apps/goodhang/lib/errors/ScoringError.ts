/**
 * ScoringError - Custom error class for scoring-related failures
 *
 * Handles errors during AI scoring, badge evaluation, and results generation.
 * Provides structured error information for debugging and monitoring.
 *
 * @example
 * ```typescript
 * if (!claudeResponse) {
 *   throw new ScoringError(
 *     'Claude API failed to return scoring data',
 *     'CLAUDE_API_FAILURE',
 *     { sessionId, attemptCount }
 *   );
 * }
 * ```
 */

/**
 * Error codes for scoring operations
 */
export enum ScoringErrorCode {
  // Claude API errors
  CLAUDE_API_FAILURE = 'CLAUDE_API_FAILURE',
  CLAUDE_TIMEOUT = 'CLAUDE_TIMEOUT',
  CLAUDE_RATE_LIMIT = 'CLAUDE_RATE_LIMIT',
  CLAUDE_INVALID_RESPONSE = 'CLAUDE_INVALID_RESPONSE',
  CLAUDE_PARSING_ERROR = 'CLAUDE_PARSING_ERROR',

  // Scoring validation errors
  INVALID_DIMENSION_SCORE = 'INVALID_DIMENSION_SCORE',
  MISSING_REQUIRED_DIMENSION = 'MISSING_REQUIRED_DIMENSION',
  INVALID_PERSONALITY_TYPE = 'INVALID_PERSONALITY_TYPE',
  INVALID_TIER_ASSIGNMENT = 'INVALID_TIER_ASSIGNMENT',

  // Badge evaluation errors
  BADGE_EVALUATION_FAILED = 'BADGE_EVALUATION_FAILED',
  BADGE_DEFINITION_NOT_FOUND = 'BADGE_DEFINITION_NOT_FOUND',
  INVALID_BADGE_CRITERIA = 'INVALID_BADGE_CRITERIA',

  // Category calculation errors
  CATEGORY_CALCULATION_FAILED = 'CATEGORY_CALCULATION_FAILED',
  MISSING_CATEGORY_DIMENSIONS = 'MISSING_CATEGORY_DIMENSIONS',

  // Results generation errors
  RESULTS_GENERATION_FAILED = 'RESULTS_GENERATION_FAILED',
  RESULTS_SAVE_FAILED = 'RESULTS_SAVE_FAILED',

  // Data integrity errors
  INSUFFICIENT_ANSWERS = 'INSUFFICIENT_ANSWERS',
  MISSING_CRITICAL_ANSWER = 'MISSING_CRITICAL_ANSWER',

  // Generic errors
  UNKNOWN_SCORING_ERROR = 'UNKNOWN_SCORING_ERROR',
}

/**
 * HTTP status codes mapped to error codes
 */
const ERROR_STATUS_MAP: Record<ScoringErrorCode, number> = {
  [ScoringErrorCode.CLAUDE_API_FAILURE]: 502,
  [ScoringErrorCode.CLAUDE_TIMEOUT]: 504,
  [ScoringErrorCode.CLAUDE_RATE_LIMIT]: 429,
  [ScoringErrorCode.CLAUDE_INVALID_RESPONSE]: 502,
  [ScoringErrorCode.CLAUDE_PARSING_ERROR]: 500,
  [ScoringErrorCode.INVALID_DIMENSION_SCORE]: 500,
  [ScoringErrorCode.MISSING_REQUIRED_DIMENSION]: 500,
  [ScoringErrorCode.INVALID_PERSONALITY_TYPE]: 500,
  [ScoringErrorCode.INVALID_TIER_ASSIGNMENT]: 500,
  [ScoringErrorCode.BADGE_EVALUATION_FAILED]: 500,
  [ScoringErrorCode.BADGE_DEFINITION_NOT_FOUND]: 500,
  [ScoringErrorCode.INVALID_BADGE_CRITERIA]: 500,
  [ScoringErrorCode.CATEGORY_CALCULATION_FAILED]: 500,
  [ScoringErrorCode.MISSING_CATEGORY_DIMENSIONS]: 500,
  [ScoringErrorCode.RESULTS_GENERATION_FAILED]: 500,
  [ScoringErrorCode.RESULTS_SAVE_FAILED]: 500,
  [ScoringErrorCode.INSUFFICIENT_ANSWERS]: 400,
  [ScoringErrorCode.MISSING_CRITICAL_ANSWER]: 400,
  [ScoringErrorCode.UNKNOWN_SCORING_ERROR]: 500,
};

/**
 * Additional context for scoring errors
 */
export interface ScoringErrorContext {
  sessionId?: string;
  userId?: string;
  dimensions?: Record<string, number>;
  badgeId?: string;
  categoryType?: string;
  attemptCount?: number;
  rawResponse?: string;
  [key: string]: unknown;
}

/**
 * Custom Error class for scoring operations
 */
export class ScoringError extends Error {
  /**
   * Machine-readable error code
   */
  public readonly code: ScoringErrorCode;

  /**
   * HTTP status code for API responses
   */
  public readonly statusCode: number;

  /**
   * Additional context about the error
   */
  public readonly context?: ScoringErrorContext;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: string;

  /**
   * Original error that caused this error (if any)
   */
  public override readonly cause?: Error;

  /**
   * Whether this error should trigger a retry
   */
  public readonly retryable: boolean;

  /**
   * Creates a new ScoringError
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param context - Additional error context
   * @param cause - Original error that caused this error
   * @param retryable - Whether operation should be retried
   */
  constructor(
    message: string,
    code: ScoringErrorCode = ScoringErrorCode.UNKNOWN_SCORING_ERROR,
    context?: ScoringErrorContext,
    cause?: Error,
    retryable: boolean = false
  ) {
    super(message);

    this.name = 'ScoringError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.timestamp = new Date().toISOString();
    this.retryable = retryable;
    if (context !== undefined) {
      this.context = context;
    }
    if (cause !== undefined) {
      this.cause = cause;
    }

    // Maintains proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScoringError);
    }
  }

  /**
   * Converts error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        cause: this.cause?.message,
      }),
    };
  }

  /**
   * Checks if error is of a specific code
   */
  isCode(code: ScoringErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Checks if error is related to Claude API
   */
  isClaudeError(): boolean {
    return (
      this.code === ScoringErrorCode.CLAUDE_API_FAILURE ||
      this.code === ScoringErrorCode.CLAUDE_TIMEOUT ||
      this.code === ScoringErrorCode.CLAUDE_RATE_LIMIT ||
      this.code === ScoringErrorCode.CLAUDE_INVALID_RESPONSE ||
      this.code === ScoringErrorCode.CLAUDE_PARSING_ERROR
    );
  }

  /**
   * Checks if error is a validation error
   */
  isValidationError(): boolean {
    return (
      this.code === ScoringErrorCode.INVALID_DIMENSION_SCORE ||
      this.code === ScoringErrorCode.MISSING_REQUIRED_DIMENSION ||
      this.code === ScoringErrorCode.INVALID_PERSONALITY_TYPE ||
      this.code === ScoringErrorCode.INVALID_TIER_ASSIGNMENT
    );
  }
}

/**
 * Factory functions for common scoring errors
 */
export class ScoringErrorFactory {
  static claudeAPIFailure(sessionId: string, cause?: Error): ScoringError {
    return new ScoringError(
      'Claude API request failed',
      ScoringErrorCode.CLAUDE_API_FAILURE,
      { sessionId },
      cause,
      true // retryable
    );
  }

  static claudeTimeout(sessionId: string, attemptCount: number): ScoringError {
    return new ScoringError(
      'Claude API request timed out',
      ScoringErrorCode.CLAUDE_TIMEOUT,
      { sessionId, attemptCount },
      undefined,
      true // retryable
    );
  }

  static claudeRateLimit(retryAfterSeconds?: number): ScoringError {
    return new ScoringError(
      'Claude API rate limit exceeded',
      ScoringErrorCode.CLAUDE_RATE_LIMIT,
      { retryAfterSeconds },
      undefined,
      true // retryable
    );
  }

  static claudeInvalidResponse(
    sessionId: string,
    rawResponse?: string
  ): ScoringError {
    return new ScoringError(
      'Claude API returned invalid response format',
      ScoringErrorCode.CLAUDE_INVALID_RESPONSE,
      {
        sessionId,
        ...(rawResponse && { rawResponse: rawResponse.substring(0, 500) }) // Truncate for logging
      }
    );
  }

  static claudeParsingError(
    sessionId: string,
    rawResponse: string,
    cause?: Error
  ): ScoringError {
    return new ScoringError(
      'Failed to parse Claude response JSON',
      ScoringErrorCode.CLAUDE_PARSING_ERROR,
      { sessionId, rawResponse: rawResponse.substring(0, 500) },
      cause
    );
  }

  static invalidDimensionScore(
    dimension: string,
    score: number
  ): ScoringError {
    return new ScoringError(
      `Invalid score for dimension "${dimension}": ${score} (must be 0-100)`,
      ScoringErrorCode.INVALID_DIMENSION_SCORE,
      { dimension, score }
    );
  }

  static missingRequiredDimension(dimension: string): ScoringError {
    return new ScoringError(
      `Missing required dimension: ${dimension}`,
      ScoringErrorCode.MISSING_REQUIRED_DIMENSION,
      { dimension }
    );
  }

  static invalidPersonalityType(
    personalityType: string,
    validTypes: string[]
  ): ScoringError {
    return new ScoringError(
      `Invalid personality type: ${personalityType}`,
      ScoringErrorCode.INVALID_PERSONALITY_TYPE,
      { personalityType, validTypes }
    );
  }

  static badgeEvaluationFailed(
    badgeId: string,
    cause?: Error
  ): ScoringError {
    return new ScoringError(
      `Failed to evaluate badge: ${badgeId}`,
      ScoringErrorCode.BADGE_EVALUATION_FAILED,
      { badgeId },
      cause
    );
  }

  static badgeDefinitionNotFound(badgeId: string): ScoringError {
    return new ScoringError(
      `Badge definition not found: ${badgeId}`,
      ScoringErrorCode.BADGE_DEFINITION_NOT_FOUND,
      { badgeId }
    );
  }

  static categoryCalculationFailed(
    categoryType: string,
    cause?: Error
  ): ScoringError {
    return new ScoringError(
      `Failed to calculate ${categoryType} category score`,
      ScoringErrorCode.CATEGORY_CALCULATION_FAILED,
      { categoryType },
      cause
    );
  }

  static missingCategoryDimensions(
    categoryType: string,
    missingDimensions: string[]
  ): ScoringError {
    return new ScoringError(
      `Missing dimensions for ${categoryType} category`,
      ScoringErrorCode.MISSING_CATEGORY_DIMENSIONS,
      { categoryType, missingDimensions }
    );
  }

  static resultsGenerationFailed(
    sessionId: string,
    cause?: Error
  ): ScoringError {
    return new ScoringError(
      'Failed to generate assessment results',
      ScoringErrorCode.RESULTS_GENERATION_FAILED,
      { sessionId },
      cause
    );
  }

  static resultsSaveFailed(
    sessionId: string,
    cause?: Error
  ): ScoringError {
    return new ScoringError(
      'Failed to save assessment results to database',
      ScoringErrorCode.RESULTS_SAVE_FAILED,
      { sessionId },
      cause
    );
  }

  static insufficientAnswers(
    sessionId: string,
    answeredCount: number,
    requiredCount: number
  ): ScoringError {
    return new ScoringError(
      `Insufficient answers to score assessment (${answeredCount}/${requiredCount})`,
      ScoringErrorCode.INSUFFICIENT_ANSWERS,
      { sessionId, answeredCount, requiredCount }
    );
  }

  static missingCriticalAnswer(
    sessionId: string,
    questionId: string
  ): ScoringError {
    return new ScoringError(
      `Missing critical answer required for scoring: ${questionId}`,
      ScoringErrorCode.MISSING_CRITICAL_ANSWER,
      { sessionId, questionId }
    );
  }
}

/**
 * Type guard to check if error is a ScoringError
 */
export function isScoringError(error: unknown): error is ScoringError {
  return error instanceof ScoringError;
}
