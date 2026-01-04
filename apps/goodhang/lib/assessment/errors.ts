/**
 * Custom error classes for the assessment system
 * Provides typed errors with error codes and contextual details
 */

/**
 * Base error class for all assessment-related errors
 */
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AssessmentError';
    Object.setPrototypeOf(this, AssessmentError.prototype);
  }
}

/**
 * Error thrown when AI scoring fails
 */
export class ScoringError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SCORING_ERROR', details);
    this.name = 'ScoringError';
    Object.setPrototypeOf(this, ScoringError.prototype);
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when session is not found or invalid
 */
export class SessionError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SESSION_ERROR', details);
    this.name = 'SessionError';
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when badge evaluation fails
 */
export class BadgeEvaluationError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BADGE_EVALUATION_ERROR', details);
    this.name = 'BadgeEvaluationError';
    Object.setPrototypeOf(this, BadgeEvaluationError.prototype);
  }
}

/**
 * Error thrown when Claude API calls fail
 */
export class ClaudeAPIError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CLAUDE_API_ERROR', details);
    this.name = 'ClaudeAPIError';
    Object.setPrototypeOf(this, ClaudeAPIError.prototype);
  }
}

/**
 * Error thrown when parsing Claude's response fails
 */
export class ResponseParsingError extends AssessmentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESPONSE_PARSING_ERROR', details);
    this.name = 'ResponseParsingError';
    Object.setPrototypeOf(this, ResponseParsingError.prototype);
  }
}
