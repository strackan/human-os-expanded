/**
 * AssessmentError - Custom error class for assessment-related failures
 *
 * Provides structured error handling with error codes, additional context,
 * and type safety for assessment operations.
 *
 * @example
 * ```typescript
 * if (!session) {
 *   throw new AssessmentError(
 *     'Session not found',
 *     'SESSION_NOT_FOUND',
 *     { sessionId, userId }
 *   );
 * }
 * ```
 */

/**
 * Error codes for assessment operations
 */
export enum AssessmentErrorCode {
  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  SESSION_UPDATE_FAILED = 'SESSION_UPDATE_FAILED',

  // Question/Answer errors
  QUESTION_NOT_FOUND = 'QUESTION_NOT_FOUND',
  INVALID_ANSWER = 'INVALID_ANSWER',
  ANSWER_TOO_LONG = 'ANSWER_TOO_LONG',
  ANSWER_SUBMISSION_FAILED = 'ANSWER_SUBMISSION_FAILED',

  // Completion errors
  INCOMPLETE_ASSESSMENT = 'INCOMPLETE_ASSESSMENT',
  COMPLETION_FAILED = 'COMPLETION_FAILED',

  // Authorization errors
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SESSION_OWNERSHIP_MISMATCH = 'SESSION_OWNERSHIP_MISMATCH',

  // Configuration errors
  INVALID_ASSESSMENT_CONFIG = 'INVALID_ASSESSMENT_CONFIG',
  MISSING_REQUIRED_SECTION = 'MISSING_REQUIRED_SECTION',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * HTTP status codes mapped to error codes
 */
const ERROR_STATUS_MAP: Record<AssessmentErrorCode, number> = {
  [AssessmentErrorCode.SESSION_NOT_FOUND]: 404,
  [AssessmentErrorCode.SESSION_ALREADY_COMPLETED]: 400,
  [AssessmentErrorCode.SESSION_CREATION_FAILED]: 500,
  [AssessmentErrorCode.SESSION_UPDATE_FAILED]: 500,
  [AssessmentErrorCode.QUESTION_NOT_FOUND]: 404,
  [AssessmentErrorCode.INVALID_ANSWER]: 400,
  [AssessmentErrorCode.ANSWER_TOO_LONG]: 400,
  [AssessmentErrorCode.ANSWER_SUBMISSION_FAILED]: 500,
  [AssessmentErrorCode.INCOMPLETE_ASSESSMENT]: 400,
  [AssessmentErrorCode.COMPLETION_FAILED]: 500,
  [AssessmentErrorCode.UNAUTHORIZED_ACCESS]: 401,
  [AssessmentErrorCode.SESSION_OWNERSHIP_MISMATCH]: 403,
  [AssessmentErrorCode.INVALID_ASSESSMENT_CONFIG]: 500,
  [AssessmentErrorCode.MISSING_REQUIRED_SECTION]: 500,
  [AssessmentErrorCode.UNKNOWN_ERROR]: 500,
};

/**
 * Additional context for errors
 */
export interface AssessmentErrorContext {
  sessionId?: string;
  userId?: string;
  questionId?: string;
  sectionId?: string;
  attemptedAction?: string;
  [key: string]: unknown;
}

/**
 * Custom Error class for assessment operations
 */
export class AssessmentError extends Error {
  /**
   * Machine-readable error code
   */
  public readonly code: AssessmentErrorCode;

  /**
   * HTTP status code for API responses
   */
  public readonly statusCode: number;

  /**
   * Additional context about the error
   */
  public readonly context?: AssessmentErrorContext;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: string;

  /**
   * Original error that caused this error (if any)
   */
  public override readonly cause?: Error;

  /**
   * Creates a new AssessmentError
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param context - Additional error context
   * @param cause - Original error that caused this error
   */
  constructor(
    message: string,
    code: AssessmentErrorCode = AssessmentErrorCode.UNKNOWN_ERROR,
    context?: AssessmentErrorContext,
    cause?: Error
  ) {
    super(message);

    this.name = 'AssessmentError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.timestamp = new Date().toISOString();
    if (context !== undefined) {
      this.context = context;
    }
    if (cause !== undefined) {
      this.cause = cause;
    }

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssessmentError);
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
  isCode(code: AssessmentErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Checks if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Checks if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Factory functions for common assessment errors
 */
export class AssessmentErrorFactory {
  static sessionNotFound(sessionId: string, userId?: string): AssessmentError {
    return new AssessmentError(
      `Assessment session not found`,
      AssessmentErrorCode.SESSION_NOT_FOUND,
      {
        sessionId,
        ...(userId !== undefined && { userId })
      }
    );
  }

  static sessionAlreadyCompleted(sessionId: string): AssessmentError {
    return new AssessmentError(
      `Assessment session is already completed and cannot be modified`,
      AssessmentErrorCode.SESSION_ALREADY_COMPLETED,
      { sessionId }
    );
  }

  static sessionCreationFailed(userId: string, cause?: Error): AssessmentError {
    return new AssessmentError(
      `Failed to create assessment session`,
      AssessmentErrorCode.SESSION_CREATION_FAILED,
      { userId },
      cause
    );
  }

  static sessionUpdateFailed(sessionId: string, cause?: Error): AssessmentError {
    return new AssessmentError(
      `Failed to update assessment session`,
      AssessmentErrorCode.SESSION_UPDATE_FAILED,
      { sessionId },
      cause
    );
  }

  static questionNotFound(questionId: string): AssessmentError {
    return new AssessmentError(
      `Question not found in assessment configuration`,
      AssessmentErrorCode.QUESTION_NOT_FOUND,
      { questionId }
    );
  }

  static invalidAnswer(questionId: string, reason: string): AssessmentError {
    return new AssessmentError(
      `Invalid answer: ${reason}`,
      AssessmentErrorCode.INVALID_ANSWER,
      { questionId, reason }
    );
  }

  static answerTooLong(questionId: string, maxLength: number): AssessmentError {
    return new AssessmentError(
      `Answer exceeds maximum length of ${maxLength} characters`,
      AssessmentErrorCode.ANSWER_TOO_LONG,
      { questionId, maxLength }
    );
  }

  static answerSubmissionFailed(
    questionId: string,
    sessionId: string,
    cause?: Error
  ): AssessmentError {
    return new AssessmentError(
      `Failed to save answer`,
      AssessmentErrorCode.ANSWER_SUBMISSION_FAILED,
      { questionId, sessionId },
      cause
    );
  }

  static incompleteAssessment(
    sessionId: string,
    answeredCount: number,
    totalCount: number
  ): AssessmentError {
    return new AssessmentError(
      `Assessment is incomplete (${answeredCount}/${totalCount} questions answered)`,
      AssessmentErrorCode.INCOMPLETE_ASSESSMENT,
      { sessionId, answeredCount, totalCount }
    );
  }

  static completionFailed(sessionId: string, cause?: Error): AssessmentError {
    return new AssessmentError(
      `Failed to complete assessment`,
      AssessmentErrorCode.COMPLETION_FAILED,
      { sessionId },
      cause
    );
  }

  static unauthorizedAccess(attemptedAction: string): AssessmentError {
    return new AssessmentError(
      `Unauthorized: User must be authenticated to ${attemptedAction}`,
      AssessmentErrorCode.UNAUTHORIZED_ACCESS,
      { attemptedAction }
    );
  }

  static sessionOwnershipMismatch(
    sessionId: string,
    userId: string
  ): AssessmentError {
    return new AssessmentError(
      `Access denied: User does not own this assessment session`,
      AssessmentErrorCode.SESSION_OWNERSHIP_MISMATCH,
      { sessionId, userId }
    );
  }
}

/**
 * Type guard to check if error is an AssessmentError
 */
export function isAssessmentError(error: unknown): error is AssessmentError {
  return error instanceof AssessmentError;
}
