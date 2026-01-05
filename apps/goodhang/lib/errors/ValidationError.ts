/**
 * ValidationError - Custom error class for data validation failures
 *
 * Handles Zod validation errors and general data integrity issues.
 * Provides user-friendly error messages and detailed validation failures.
 *
 * @example
 * ```typescript
 * import { ValidationError } from '@/lib/errors/ValidationError';
 * import { AnswerSubmissionSchema } from '@/lib/assessment/validation';
 *
 * const result = AnswerSubmissionSchema.safeParse(data);
 * if (!result.success) {
 *   throw ValidationError.fromZodError(result.error, 'answer submission');
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Error codes for validation failures
 */
export enum ValidationErrorCode {
  // Schema validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  TYPE_MISMATCH = 'TYPE_MISMATCH',

  // Business logic validation errors
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Data integrity errors
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  INCONSISTENT_STATE = 'INCONSISTENT_STATE',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',

  // Generic validation error
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * Individual validation failure details
 */
export interface ValidationFailure {
  field: string;
  message: string;
  code?: string;
  expected?: unknown;
  received?: unknown;
}

/**
 * Additional context for validation errors
 */
export interface ValidationErrorContext {
  entity?: string;
  operation?: string;
  failures?: ValidationFailure[];
  [key: string]: unknown;
}

/**
 * Custom Error class for validation failures
 */
export class ValidationError extends Error {
  /**
   * Machine-readable error code
   */
  public readonly code: ValidationErrorCode;

  /**
   * HTTP status code (always 400 for validation errors)
   */
  public readonly statusCode: number = 400;

  /**
   * List of individual validation failures
   */
  public readonly failures: ValidationFailure[];

  /**
   * Additional context about the error
   */
  public readonly context?: ValidationErrorContext;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: string;

  /**
   * Original Zod error (if from Zod validation)
   */
  public readonly zodError?: z.ZodError;

  /**
   * Creates a new ValidationError
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param failures - List of validation failures
   * @param context - Additional error context
   * @param zodError - Original Zod error (if applicable)
   */
  constructor(
    message: string,
    code: ValidationErrorCode = ValidationErrorCode.VALIDATION_FAILED,
    failures: ValidationFailure[] = [],
    context?: ValidationErrorContext,
    zodError?: z.ZodError
  ) {
    super(message);

    this.name = 'ValidationError';
    this.code = code;
    this.failures = failures;
    this.timestamp = new Date().toISOString();
    if (context !== undefined) {
      this.context = context;
    }
    if (zodError !== undefined) {
      this.zodError = zodError;
    }

    // Maintains proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Creates ValidationError from Zod validation error
   *
   * @param zodError - Zod validation error
   * @param entity - Name of entity being validated (e.g., "answer submission")
   * @returns ValidationError with formatted failures
   */
  static fromZodError(zodError: z.ZodError, entity?: string): ValidationError {
    const failures: ValidationFailure[] = zodError.issues.map((err) => ({
      field: err.path.join('.') || 'root',
      message: err.message,
      code: err.code,
      expected: 'expected' in err ? err.expected : undefined,
      received: 'received' in err ? err.received : undefined,
    }));

    const message = entity
      ? `Validation failed for ${entity}: ${failures.map((f) => f.message).join('; ')}`
      : `Validation failed: ${failures.map((f) => f.message).join('; ')}`;

    return new ValidationError(
      message,
      ValidationErrorCode.INVALID_INPUT,
      failures,
      entity !== undefined ? { entity } : undefined,
      zodError
    );
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
      failures: this.failures,
      context: this.context,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        zodError: this.zodError?.issues,
      }),
    };
  }

  /**
   * Gets user-friendly error messages
   */
  getUserMessages(): string[] {
    return this.failures.map((f) => {
      if (f.field === 'root') {
        return f.message;
      }
      return `${f.field}: ${f.message}`;
    });
  }

  /**
   * Gets first error message (useful for simple displays)
   */
  getFirstMessage(): string {
    return this.failures[0]?.message || this.message;
  }

  /**
   * Checks if a specific field failed validation
   */
  hasFieldError(fieldName: string): boolean {
    return this.failures.some((f) => f.field === fieldName);
  }

  /**
   * Gets error message for a specific field
   */
  getFieldError(fieldName: string): string | undefined {
    return this.failures.find((f) => f.field === fieldName)?.message;
  }

  /**
   * Checks if error is of a specific code
   */
  isCode(code: ValidationErrorCode): boolean {
    return this.code === code;
  }
}

/**
 * Factory functions for common validation errors
 */
export class ValidationErrorFactory {
  static missingRequiredField(fieldName: string, entity?: string): ValidationError {
    return new ValidationError(
      `Missing required field: ${fieldName}`,
      ValidationErrorCode.MISSING_REQUIRED_FIELD,
      [
        {
          field: fieldName,
          message: `${fieldName} is required`,
        },
      ],
      {
        field: fieldName,
        ...(entity !== undefined && { entity })
      }
    );
  }

  static invalidFormat(
    fieldName: string,
    expected: string,
    received: unknown
  ): ValidationError {
    return new ValidationError(
      `Invalid format for ${fieldName}`,
      ValidationErrorCode.INVALID_FORMAT,
      [
        {
          field: fieldName,
          message: `Expected ${expected}`,
          expected,
          received,
        },
      ]
    );
  }

  static outOfRange(
    fieldName: string,
    min: number | undefined,
    max: number | undefined,
    value: number
  ): ValidationError {
    const rangeMsg = min !== undefined && max !== undefined
      ? `between ${min} and ${max}`
      : min !== undefined
      ? `at least ${min}`
      : `at most ${max}`;

    return new ValidationError(
      `${fieldName} must be ${rangeMsg}`,
      ValidationErrorCode.OUT_OF_RANGE,
      [
        {
          field: fieldName,
          message: `Must be ${rangeMsg}`,
          expected: { min, max },
          received: value,
        },
      ]
    );
  }

  static typeMismatch(
    fieldName: string,
    expectedType: string,
    receivedType: string
  ): ValidationError {
    return new ValidationError(
      `Type mismatch for ${fieldName}`,
      ValidationErrorCode.TYPE_MISMATCH,
      [
        {
          field: fieldName,
          message: `Expected ${expectedType}, received ${receivedType}`,
          expected: expectedType,
          received: receivedType,
        },
      ]
    );
  }

  static invalidStateTransition(
    from: string,
    to: string,
    entity?: string
  ): ValidationError {
    return new ValidationError(
      `Invalid state transition from "${from}" to "${to}"`,
      ValidationErrorCode.INVALID_STATE_TRANSITION,
      [
        {
          field: 'status',
          message: `Cannot transition from "${from}" to "${to}"`,
        },
      ],
      {
        from,
        to,
        ...(entity !== undefined && { entity })
      }
    );
  }

  static businessRuleViolation(
    rule: string,
    details?: string
  ): ValidationError {
    return new ValidationError(
      `Business rule violation: ${rule}`,
      ValidationErrorCode.BUSINESS_RULE_VIOLATION,
      [
        {
          field: 'root',
          message: details || rule,
        },
      ],
      {
        rule,
        ...(details !== undefined && { details })
      }
    );
  }

  static duplicateEntry(
    fieldName: string,
    value: unknown,
    entity?: string
  ): ValidationError {
    return new ValidationError(
      `Duplicate entry for ${fieldName}`,
      ValidationErrorCode.DUPLICATE_ENTRY,
      [
        {
          field: fieldName,
          message: `${fieldName} already exists`,
          received: value,
        },
      ],
      {
        field: fieldName,
        ...(entity !== undefined && { entity })
      }
    );
  }

  static constraintViolation(
    constraint: string,
    details?: string
  ): ValidationError {
    return new ValidationError(
      `Constraint violation: ${constraint}`,
      ValidationErrorCode.CONSTRAINT_VIOLATION,
      [
        {
          field: 'root',
          message: details || constraint,
        },
      ],
      {
        constraint,
        ...(details !== undefined && { details })
      }
    );
  }

  static corruptedData(entity: string, reason?: string): ValidationError {
    return new ValidationError(
      `Corrupted data detected in ${entity}`,
      ValidationErrorCode.CORRUPTED_DATA,
      [
        {
          field: 'root',
          message: reason || 'Data integrity check failed',
        },
      ],
      {
        entity,
        ...(reason !== undefined && { reason })
      }
    );
  }

  static inconsistentState(entity: string, details: string): ValidationError {
    return new ValidationError(
      `Inconsistent state in ${entity}`,
      ValidationErrorCode.INCONSISTENT_STATE,
      [
        {
          field: 'root',
          message: details,
        },
      ],
      { entity, details }
    );
  }

  static missingDependency(
    entity: string,
    dependency: string
  ): ValidationError {
    return new ValidationError(
      `Missing required dependency: ${dependency}`,
      ValidationErrorCode.MISSING_DEPENDENCY,
      [
        {
          field: dependency,
          message: `${dependency} is required for ${entity}`,
        },
      ],
      { entity, dependency }
    );
  }
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Helper to safely validate with Zod and throw ValidationError on failure
 *
 * @example
 * ```typescript
 * const data = validateOrThrow(AnswerSubmissionSchema, requestBody, 'answer submission');
 * // data is now type-safe and validated
 * ```
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  entity?: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error, entity);
  }
  return result.data;
}
