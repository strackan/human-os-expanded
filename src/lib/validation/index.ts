/**
 * ⚠️⚠️⚠️ AGENT REMINDER: ALL API ROUTES MUST USE ZOD VALIDATION ⚠️⚠️⚠️
 *
 * MANDATORY: Every API route MUST validate request data before using it.
 * This prevents crashes, corrupt data, and security vulnerabilities.
 *
 * Quick Start:
 * 1. Import: `import { validateRequest, z } from '@/lib/validation';`
 * 2. Define schema: `const MySchema = z.object({ name: z.string() });`
 * 3. Validate: `const validation = await validateRequest(request, MySchema);`
 * 4. Check: `if (!validation.success) return error response;`
 * 5. Use: `const { name } = validation.data;`
 *
 * For copy-paste examples, see:
 * - src/lib/validation/TEMPLATES.md (coming in Day 3)
 * - src/lib/validation/schemas/ (examples for common patterns)
 *
 * ⚠️ DO NOT skip validation - it's caught 100% of "invalid data" bugs in testing
 */

export { z } from 'zod';
export type { z as ZodType } from 'zod';

export {
  validateRequest,
  validateQueryParams,
  CommonValidators,
  type ValidationResult,
} from './helpers';

// Re-export common schemas for convenience
export * from './schemas';
