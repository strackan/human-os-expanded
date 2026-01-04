/**
 * Template Hydrator
 *
 * Replaces placeholders in workflow text with actual customer/user data.
 *
 * Supports:
 * - Mustache syntax: {{customer.name}}, {{customer.arr}}
 * - User variables: <User.First>, <User.Last>
 * - Nested objects: {{contact.name}}, {{primary_contact.title}}
 * - Formatting: {{customer.arr|currency}}, {{renewal_date|date}}
 *
 * Example:
 * Input:  "Renewal for {{customer.name}} ({{customer.arr|currency}})"
 * Output: "Renewal for Obsidian Black ($185,000)"
 */

export interface HydrationContext {
  // Customer data
  customer?: {
    id?: string;
    name?: string;
    domain?: string;
    industry?: string;
    current_arr?: number;
    health_score?: number;
    renewal_date?: string;
    days_until_renewal?: number;
    [key: string]: any;
  };

  // User data (who is running the workflow)
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    [key: string]: any;
  };

  // Additional context
  [key: string]: any;
}

/**
 * Format a value based on format specifier
 */
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (!format) {
    return String(value);
  }

  switch (format.toLowerCase()) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'percent':
    case 'percentage':
      return formatPercentage(value);
    case 'date':
      return formatDate(value);
    default:
      return String(value);
  }
}

/**
 * Format as currency
 */
function formatCurrency(value: number): string {
  if (typeof value !== 'number') {
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    value = num;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format as number with commas
 */
function formatNumber(value: number): string {
  if (typeof value !== 'number') {
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    value = num;
  }

  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format as percentage
 */
function formatPercentage(value: number): string {
  if (typeof value !== 'number') {
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    value = num;
  }

  // If value is < 1, treat as decimal (e.g., 0.85 = 85%)
  // If value is >= 1, treat as percentage (e.g., 85 = 85%)
  const percentage = value < 1 ? value * 100 : value;

  return `${percentage.toFixed(0)}%`;
}

/**
 * Format as date
 */
function formatDate(value: string | Date): string {
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(value);
  }
}

/**
 * Get nested value from object using dot notation
 * Example: getValue(context, 'customer.primary_contact.name')
 */
function getValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Hydrate a single template string
 */
export function hydrateTemplate(template: string, context: HydrationContext): string {
  if (!template || typeof template !== 'string') {
    return template;
  }

  let result = template;

  // 1. Replace mustache-style placeholders: {{customer.name}}, {{customer.arr|currency}}
  result = result.replace(/\{\{([^}|]+)(\|([^}]+))?\}\}/g, (match, path, _, format) => {
    const value = getValue(context, path.trim());
    return formatValue(value, format?.trim());
  });

  // 2. Replace user variables: <User.First>, <User.Last>
  result = result.replace(/<User\.([^>]+)>/g, (match, prop) => {
    const propLower = prop.toLowerCase();
    if (propLower === 'first' && context.user?.first_name) {
      return context.user.first_name;
    }
    if (propLower === 'last' && context.user?.last_name) {
      return context.user.last_name;
    }
    if (context.user?.[propLower]) {
      return String(context.user[propLower]);
    }
    return match; // Keep original if not found
  });

  return result;
}

/**
 * Recursively hydrate all string values in an object
 */
export function hydrateObject(obj: any, context: HydrationContext): any {
  if (!obj) return obj;

  // Handle strings
  if (typeof obj === 'string') {
    return hydrateTemplate(obj, context);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => hydrateObject(item, context));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = hydrateObject(obj[key], context);
      }
    }
    return result;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Create hydration context from customer data
 */
export function createHydrationContext(customerData?: any, userData?: any): HydrationContext {
  return {
    customer: customerData || {},
    user: userData || {
      first_name: 'Justin', // TODO: Get from auth
      last_name: 'User',
    },
    ...customerData, // Allow direct access like {{name}} instead of {{customer.name}}
  };
}

/**
 * Hydrate workflow config
 *
 * Recursively hydrates all text in a workflow config object
 */
export function hydrateWorkflowConfig(config: any, context: HydrationContext): any {
  return hydrateObject(config, context);
}
