/**
 * Zod → Prompt Schema Helpers
 *
 * Converts Zod schemas into prompt-friendly JSON examples for LLM extraction.
 * Reusable across any tool that needs to describe its schema in a prompt.
 *
 * Example output for a task schema:
 *   "tasks": [
 *     {
 *       "title": "Task title",
 *       "priority": "critical|high|medium|low",
 *       "context_tags": ["example"]
 *     }
 *   ]
 */

import { z } from 'zod';

/**
 * Get the .describe() text from a Zod field, checking wrappers.
 * Handles both `.describe('x').optional()` and `.optional().describe('x')`.
 */
function getDescription(field: z.ZodType): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = field._def as any;
  if (def?.description) return def.description;
  if (def?.innerType?._def?.description) return def.innerType._def.description;
  return undefined;
}

/**
 * Unwrap Optional / Default / Nullable to get the core Zod type.
 */
function unwrap(field: z.ZodType): z.ZodType {
  if (
    field instanceof z.ZodOptional ||
    field instanceof z.ZodDefault ||
    field instanceof z.ZodNullable
  ) {
    return unwrap(field._def.innerType);
  }
  return field;
}

/**
 * Convert a single Zod field to a prompt-friendly example value.
 * Returns a JSON-embeddable string (quoted strings, arrays, etc.)
 */
function fieldToExample(field: z.ZodType, key: string): string {
  const desc = getDescription(field);
  const inner = unwrap(field);

  if (inner instanceof z.ZodEnum) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `"${((inner._def as any).values as string[]).join('|')}"`;
  }

  if (inner instanceof z.ZodArray) {
    const item = unwrap(inner._def.type);
    if (item instanceof z.ZodObject) return `[${objectToExample(item)}]`;
    if (item instanceof z.ZodString) return `["example"]`;
    return `[]`;
  }

  if (inner instanceof z.ZodObject) return objectToExample(inner);
  if (inner instanceof z.ZodString) return `"${desc || key.replace(/_/g, ' ')}"`;
  if (inner instanceof z.ZodNumber) return desc ? `"${desc}"` : '0';
  if (inner instanceof z.ZodBoolean) return 'true';
  if (inner instanceof z.ZodRecord) return '{}';

  return desc ? `"${desc}"` : '"string"';
}

/**
 * Convert a Zod object schema to a compact inline JSON example.
 * e.g. `{"title": "Task title", "priority": "high|medium|low"}`
 */
function objectToExample(schema: z.ZodObject<z.ZodRawShape>): string {
  const fields = Object.entries(schema.shape).map(
    ([key, field]) => `"${key}": ${fieldToExample(field as z.ZodType, key)}`
  );
  return `{${fields.join(', ')}}`;
}

/**
 * Convert a Zod object schema into a multi-line prompt schema block
 * wrapped in an array under the given category name.
 *
 * @example
 *   zodToPromptSchema('tasks', taskInputSchema)
 *   // → `"tasks": [\n    {\n      "title": "Task title", ...\n    }\n  ]`
 */
export function zodToPromptSchema(
  categoryName: string,
  schema: z.ZodType
): string {
  if (!(schema instanceof z.ZodObject)) {
    return `"${categoryName}": []`;
  }

  const lines = Object.entries(schema.shape).map(
    ([key, field]) =>
      `      ${JSON.stringify(key)}: ${fieldToExample(field as z.ZodType, key)}`
  );

  return `"${categoryName}": [\n    {\n${lines.join(',\n')}\n    }\n  ]`;
}
