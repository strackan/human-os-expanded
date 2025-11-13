/**
 * Validation Helpers
 *
 * Runtime validation utilities using Zod for API routes.
 * Prevents invalid data from entering the system.
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors: z.ZodError };

/**
 * Validate request body against a Zod schema
 *
 * Usage:
 * ```ts
 * const MySchema = z.object({ name: z.string(), age: z.number() });
 *
 * export async function POST(request: NextRequest) {
 *   const validation = await validateRequest(request, MySchema);
 *   if (!validation.success) {
 *     return NextResponse.json({ error: validation.error }, { status: 400 });
 *   }
 *
 *   const { name, age } = validation.data;
 *   // ... use validated data
 * }
 * ```
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      return {
        success: false,
        error: `Validation failed: ${errorMessages}`,
        errors: result.error,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
      errors: new z.ZodError([]),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 *
 * Usage:
 * ```ts
 * const QuerySchema = z.object({ page: z.string().regex(/^\d+$/) });
 *
 * export async function GET(request: NextRequest) {
 *   const validation = validateQueryParams(request, QuerySchema);
 *   if (!validation.success) {
 *     return NextResponse.json({ error: validation.error }, { status: 400 });
 *   }
 *
 *   const { page } = validation.data;
 *   // ... use validated query params
 * }
 * ```
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams);

  const result = schema.safeParse(params);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: any) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');

    return {
      success: false,
      error: `Query validation failed: ${errorMessages}`,
      errors: result.error,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Common field validators
 *
 * Use these as building blocks for your schemas:
 * ```ts
 * const MySchema = z.object({
 *   userId: CommonValidators.uuid(),
 *   email: CommonValidators.email(),
 *   workflowId: CommonValidators.uuid(),
 * });
 * ```
 */
export const CommonValidators = {
  /** UUID v4 validator */
  uuid: () =>
    z.string().uuid({ message: 'Must be a valid UUID' }),

  /** Email validator */
  email: () =>
    z.string().email({ message: 'Must be a valid email address' }),

  /** Non-empty string */
  nonEmptyString: () =>
    z.string().min(1, { message: 'Cannot be empty' }),

  /** Positive integer */
  positiveInt: () =>
    z.number().int().positive({ message: 'Must be a positive integer' }),

  /** ISO date string */
  isoDate: () =>
    z.string().datetime({ message: 'Must be a valid ISO 8601 date' }),

  /** URL validator */
  url: () =>
    z.string().url({ message: 'Must be a valid URL' }),

  /** Pagination page number (starts at 1) */
  pageNumber: () =>
    z.number().int().min(1, { message: 'Page must be >= 1' }),

  /** Pagination page size (10-100) */
  pageSize: () =>
    z.number().int().min(10).max(100, { message: 'Page size must be 10-100' }),
};
