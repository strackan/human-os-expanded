/**
 * Template Resolver Utility
 *
 * Handlebars-based template resolution for workflow definitions.
 * Matches backend implementation in automation/workflow-engine/notificationProcessor.js
 *
 * Usage:
 *   const context = { customer: { name: 'Acme Corp' }, workflow: { daysOverdue: 15 } };
 *   const result = resolveTemplate('{{customer.name}} is {{workflow.daysOverdue}} days overdue', context);
 *   // Result: "Acme Corp is 15 days overdue"
 */

import Handlebars from 'handlebars';

// =====================================================
// Register Handlebars Helpers (matches backend)
// =====================================================

// Equality check
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Greater than or equal
Handlebars.registerHelper('gte', function(a, b) {
  return a >= b;
});

// Less than or equal
Handlebars.registerHelper('lte', function(a, b) {
  return a <= b;
});

// Greater than
Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

// Less than
Handlebars.registerHelper('lt', function(a, b) {
  return a < b;
});

// Logical AND
Handlebars.registerHelper('and', function(...args) {
  // Last argument is Handlebars options object, remove it
  const values = args.slice(0, -1);
  return values.every(Boolean);
});

// Logical OR
Handlebars.registerHelper('or', function(...args) {
  // Last argument is Handlebars options object, remove it
  const values = args.slice(0, -1);
  return values.some(Boolean);
});

// Logical NOT
Handlebars.registerHelper('not', function(value) {
  return !value;
});

// Absolute value
Handlebars.registerHelper('abs', function(value) {
  return Math.abs(value);
});

// Format currency
Handlebars.registerHelper('formatCurrency', function(value) {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
});

// Format date
Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
});

// =====================================================
// Template Resolution Functions
// =====================================================

/**
 * Resolve a Handlebars template with the given context
 *
 * @param template - Template string with {{variables}} and {{#helpers}}
 * @param context - Context object with data
 * @returns Resolved string
 */
export function resolveTemplate(template: string, context: any): string {
  if (!template) return '';
  if (typeof template !== 'string') return String(template);

  try {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context);
  } catch (error) {
    console.error('[templateResolver] Error resolving template:', template, error);
    return template; // Return original template on error
  }
}

/**
 * Evaluate a condition template and return boolean result
 *
 * Useful for conditional visibility: visible: '{{eq workflow.daysOverdue 15}}'
 *
 * @param condition - Condition template (e.g., '{{eq a b}}')
 * @param context - Context object
 * @returns Boolean result
 */
export function evaluateCondition(condition: string, context: any): boolean {
  if (!condition) return true; // No condition = always visible

  try {
    const result = resolveTemplate(condition, context);

    // Convert result to boolean
    // Handlebars returns 'true' or 'false' as strings from helpers
    if (result === 'true') return true;
    if (result === 'false') return false;

    // Handle other truthy/falsy values
    return Boolean(result && result !== '' && result !== '0');
  } catch (error) {
    console.error('[templateResolver] Error evaluating condition:', condition, error);
    return false; // Hide on error
  }
}

/**
 * Resolve an array of templates
 *
 * Useful for recipient lists: ['{{csm.email}}', '{{csm.manager}}']
 *
 * @param templates - Array of template strings
 * @param context - Context object
 * @returns Array of resolved strings
 */
export function resolveTemplateArray(templates: string[], context: any): string[] {
  if (!Array.isArray(templates)) return [];

  return templates.map(template => resolveTemplate(template, context));
}

/**
 * Resolve all templates in an object recursively
 *
 * Useful for resolving entire workflow step configs
 *
 * @param obj - Object with template strings
 * @param context - Context object
 * @returns Object with resolved strings
 */
export function resolveObjectTemplates(obj: any, context: any): any {
  if (obj === null || obj === undefined) return obj;

  // Handle strings (template resolution)
  if (typeof obj === 'string') {
    return resolveTemplate(obj, context);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => resolveObjectTemplates(item, context));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const resolved: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        resolved[key] = resolveObjectTemplates(obj[key], context);
      }
    }
    return resolved;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Create a safe context object with Math utilities
 *
 * Matches backend context builder
 *
 * @param baseContext - Base context object
 * @returns Context with Math utilities added
 */
export function createContext(baseContext: any): any {
  return {
    ...baseContext,
    Math: Math // Allow Math operations in templates
  };
}
