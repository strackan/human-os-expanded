/**
 * Shared utility for extracting and validating JSON from LLM output.
 *
 * Replaces the scattered regex-based extraction patterns with a single
 * pipeline: strip code fences → JSON.parse → Zod safeParse.
 */

import { type ZodType, type ZodError } from 'zod';

export interface LLMJsonResult<T> {
  success: true;
  data: T;
}

export interface LLMJsonError {
  success: false;
  error: string;
  raw: string;
  zodError?: ZodError;
}

/**
 * Extract JSON from LLM output, parse it, and validate against a Zod schema.
 *
 * Handles common LLM quirks:
 * - ```json ... ``` code fences
 * - ``` ... ``` code fences without language tag
 * - Trailing commas before ] or }
 * - Bare JSON objects/arrays
 */
export function extractAndValidate<T>(
  raw: string,
  schema: ZodType<T>,
): LLMJsonResult<T> | LLMJsonError {
  // Step 1: Strip code fences
  const stripped = stripCodeFences(raw);

  // Step 2: Extract JSON substring
  const jsonStr = extractJsonSubstring(stripped);
  if (!jsonStr) {
    return { success: false, error: 'No JSON found in LLM output', raw };
  }

  // Step 3: Parse JSON (with repair attempt on failure)
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Try repairing common issues
    const repaired = repairJson(jsonStr);
    try {
      parsed = JSON.parse(repaired);
    } catch (e) {
      return {
        success: false,
        error: `JSON parse error: ${(e as Error).message}`,
        raw: jsonStr.slice(0, 500),
      };
    }
  }

  // Step 4: Validate against schema
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: `Zod validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      raw: jsonStr.slice(0, 500),
      zodError: result.error,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Strip markdown code fences from LLM output.
 */
function stripCodeFences(text: string): string {
  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1];
  }
  return text;
}

/**
 * Extract the first JSON object or array from a string.
 */
function extractJsonSubstring(text: string): string | null {
  // Try object first
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];

  // Try array
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0];

  return null;
}

/**
 * Repair common JSON issues from LLM output.
 */
function repairJson(jsonStr: string): string {
  let repaired = jsonStr;

  // Remove trailing commas before ] or }
  repaired = repaired.replace(/,(\s*[\]\}])/g, '$1');

  // Convert literal \n and \t outside of strings to actual whitespace
  repaired = convertEscapesOutsideStrings(repaired);

  return repaired;
}

function convertEscapesOutsideStrings(jsonStr: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < jsonStr.length) {
    const char = jsonStr[i]!;

    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      inString = !inString;
      result.push(char);
      i++;
    } else if (!inString && char === '\\' && i + 1 < jsonStr.length) {
      const nextChar = jsonStr[i + 1]!;
      if (nextChar === 'n') {
        result.push('\n');
        i += 2;
      } else if (nextChar === 't') {
        result.push('\t');
        i += 2;
      } else {
        result.push(char);
        i++;
      }
    } else {
      result.push(char);
      i++;
    }
  }

  return result.join('');
}
