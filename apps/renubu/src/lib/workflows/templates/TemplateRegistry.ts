/**
 * Template Registry - Handlebars-based template system
 *
 * Manages registration, compilation, and rendering of Handlebars templates
 * for textual workflow artifacts (chat messages, email bodies, etc.)
 */

import Handlebars from 'handlebars';

// Template storage
const templates = new Map<string, HandlebarsTemplateDelegate>();
const rawTemplates = new Map<string, string>();

/**
 * Register Handlebars helpers
 */
function registerHelpers() {
  // Currency formatting
  Handlebars.registerHelper('currency', function(value: number) {
    if (typeof value !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  });

  // Percentage formatting
  Handlebars.registerHelper('percent', function(value: number) {
    if (typeof value !== 'number') return '0%';
    return `${value}%`;
  });

  // Date formatting
  Handlebars.registerHelper('date', function(value: Date | string, format?: string) {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!date || isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = format === 'short'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' };

    return date.toLocaleDateString('en-US', options);
  });

  // Number formatting
  Handlebars.registerHelper('number', function(value: number) {
    if (typeof value !== 'number') return '0';
    return new Intl.NumberFormat('en-US').format(value);
  });

  // Conditional helpers
  Handlebars.registerHelper('eq', function(a: any, b: any) {
    return a === b;
  });

  Handlebars.registerHelper('gt', function(a: number, b: number) {
    return a > b;
  });

  Handlebars.registerHelper('lt', function(a: number, b: number) {
    return a < b;
  });

  // Capitalize first letter
  Handlebars.registerHelper('capitalize', function(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Default value
  Handlebars.registerHelper('default', function(value: any, defaultValue: any) {
    return value || defaultValue;
  });
}

// Register helpers on module load
registerHelpers();

/**
 * Register a template
 */
export function registerTemplate(id: string, template: string): void {
  rawTemplates.set(id, template);
  try {
    const compiled = Handlebars.compile(template);
    templates.set(id, compiled);
  } catch (error) {
    console.error(`[TemplateRegistry] Failed to compile template "${id}":`, error);
    throw error;
  }
}

/**
 * Render a template with context
 */
export function renderTemplate(id: string, context: Record<string, any>): string {
  const template = templates.get(id);
  if (!template) {
    console.error(`[TemplateRegistry] Template "${id}" not found`);
    return `[Template ${id} not found]`;
  }

  try {
    return template(context);
  } catch (error) {
    console.error(`[TemplateRegistry] Failed to render template "${id}":`, error);
    return `[Error rendering template ${id}]`;
  }
}

/**
 * Check if a template exists
 */
export function hasTemplate(id: string): boolean {
  return templates.has(id);
}

/**
 * Get raw template string (for debugging)
 */
export function getRawTemplate(id: string): string | undefined {
  return rawTemplates.get(id);
}

/**
 * List all registered templates
 */
export function listTemplates(): string[] {
  return Array.from(templates.keys());
}

/**
 * Bulk register templates
 */
export function registerTemplates(templateMap: Record<string, string>): void {
  Object.entries(templateMap).forEach(([id, template]) => {
    registerTemplate(id, template);
  });
}

/**
 * Clear all templates (for testing)
 */
export function clearTemplates(): void {
  templates.clear();
  rawTemplates.clear();
}
