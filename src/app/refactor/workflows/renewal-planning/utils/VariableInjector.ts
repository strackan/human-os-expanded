/**
 * Variable Injection Utility
 *
 * Replaces template variables like {{customer.name}} with actual values
 * from the customer context data.
 *
 * Supports nested paths: {{data.financials.currentARR}}
 * Returns original template string if variable not found (safe fallback)
 *
 * Usage:
 * ```typescript
 * const text = "Hello {{customer.name}}!";
 * const variables = { customer: { name: "Acme Corp" } };
 * const result = injectVariables(text, variables);
 * // Result: "Hello Acme Corp!"
 * ```
 */

/**
 * Inject variables into a template string
 * @param template - String with {{variable.path}} placeholders
 * @param variables - Object containing variable values
 * @returns String with variables replaced
 */
export function injectVariables(template: string, variables: any): string {
  if (!template || typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(variables, path.trim());
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Get nested value from object using dot notation
 * @param obj - Source object
 * @param path - Dot-separated path (e.g., "customer.name")
 * @returns Value at path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Inject variables into an object (recursively handles nested objects/arrays)
 * @param obj - Object with potential {{variable}} values
 * @param variables - Variable context
 * @returns New object with variables injected
 */
export function injectVariablesIntoObject(obj: any, variables: any): any {
  if (typeof obj === 'string') {
    return injectVariables(obj, variables);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => injectVariablesIntoObject(item, variables));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = injectVariablesIntoObject(obj[key], variables);
    }
    return result;
  }

  return obj;
}
