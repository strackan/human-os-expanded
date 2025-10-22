/**
 * Template Hydrator
 *
 * Replaces placeholder variables in workflow slides with actual customer data.
 *
 * Placeholders use double-brace syntax:
 * - {{customer.name}} → "Acme Corp"
 * - {{customer.current_arr}} → "$250,000"
 * - {{primary_contact.email}} → "john@acme.com"
 *
 * Key Features:
 * 1. Deep object path resolution (e.g., customer.primary_contact.email)
 * 2. Automatic formatting (currency, dates, etc.)
 * 3. Fallback values for missing data
 * 4. Type-safe data access
 */

import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import {
  formatCurrency,
  formatARR,
  getCurrentTimestamp,
  calculateRenewalUrgency,
} from './utils';

// Re-define types here to avoid importing from dataFetcher (which has server dependencies)
export interface ContactData {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  is_primary: boolean;
}

export interface WorkflowCustomerData {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  current_arr: number;
  health_score: number;
  churn_risk_score?: number;
  utilization_percent?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_term?: number;
  renewal_date?: string;
  auto_renewal?: boolean;
  contract_status?: string;
  usage_score?: number;
  nps_score?: number;
  adoption_rate?: number;
  license_count?: number;
  active_users?: number;
  relationship_strength?: 'strong' | 'medium' | 'weak';
  primary_contact?: ContactData;
  contacts?: ContactData[];
  days_until_renewal?: number;
  renewal_likelihood?: number;
}

export interface CSMData {
  id: string;
  name: string;
  email: string;
}

/**
 * Hydration context - all data available for placeholder replacement
 */
export interface HydrationContext {
  customer: WorkflowCustomerData;
  csm?: CSMData;
  departed_contact?: {
    name: string;
    title?: string;
    departure_date?: string;
  };
  replacement_contact?: {
    name?: string;
    title?: string;
    email?: string;
    linkedin?: string;
  };
  // Computed/helper fields
  current_timestamp?: string;
  days_until_renewal?: number;
  renewal_urgency?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Hydrate a workflow slide with customer data
 *
 * Replaces all {{placeholder}} variables with actual values.
 *
 * @param slide - Workflow slide with placeholders
 * @param context - Customer and related data
 * @returns Hydrated slide with actual values
 *
 * @example
 * const slide = { title: "Review {{customer.name}}", ... };
 * const hydrated = hydrateSlide(slide, { customer: { name: "Acme" } });
 * // hydrated.title === "Review Acme"
 */
export function hydrateSlide(
  slide: WorkflowSlide,
  context: HydrationContext
): WorkflowSlide {
  // Deep clone to avoid mutation
  const hydratedSlide = JSON.parse(JSON.stringify(slide));

  // Recursively replace placeholders in the slide
  return recursiveHydrate(hydratedSlide, context);
}

/**
 * Hydrate an array of slides
 *
 * @param slides - Array of workflow slides
 * @param context - Customer and related data
 * @returns Array of hydrated slides
 */
export function hydrateSlides(
  slides: WorkflowSlide[],
  context: HydrationContext
): WorkflowSlide[] {
  return slides.map((slide) => hydrateSlide(slide, context));
}

/**
 * Recursively traverse object and replace placeholders
 */
function recursiveHydrate(obj: any, context: HydrationContext): any {
  if (typeof obj === 'string') {
    return replacePlaceholders(obj, context);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => recursiveHydrate(item, context));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = recursiveHydrate(obj[key], context);
    }
    return result;
  }

  return obj;
}

/**
 * Replace placeholders in a string
 *
 * Supports:
 * - {{customer.name}} - Simple path
 * - {{customer.current_arr}} - Auto-formatted currency
 * - {{primary_contact.email}} - Shorthand for customer.primary_contact.email
 *
 * @param str - String with placeholders
 * @param context - Data context
 * @returns String with placeholders replaced
 */
function replacePlaceholders(str: string, context: HydrationContext): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    // Get value from context
    const value = resolvePath(trimmedPath, context);

    // Format based on field name
    return formatValue(trimmedPath, value);
  });
}

/**
 * Resolve a dot-notation path in the context
 *
 * Examples:
 * - "customer.name" → context.customer.name
 * - "primary_contact.email" → context.customer.primary_contact.email
 * - "csm.name" → context.csm.name
 *
 * @param path - Dot-notation path
 * @param context - Data context
 * @returns Resolved value or undefined
 */
function resolvePath(path: string, context: HydrationContext): any {
  const parts = path.split('.');

  // Handle shorthand paths
  // "primary_contact.email" → "customer.primary_contact.email"
  if (parts[0] === 'primary_contact' && context.customer.primary_contact) {
    return resolvePathFromObject(parts.slice(1), context.customer.primary_contact);
  }

  // "departed_contact.name" → "departed_contact.name"
  if (parts[0] === 'departed_contact' && context.departed_contact) {
    return resolvePathFromObject(parts.slice(1), context.departed_contact);
  }

  // "replacement_contact.name" → "replacement_contact.name"
  if (parts[0] === 'replacement_contact' && context.replacement_contact) {
    return resolvePathFromObject(parts.slice(1), context.replacement_contact);
  }

  // Standard path resolution
  return resolvePathFromObject(parts, context);
}

/**
 * Resolve path from a specific object
 */
function resolvePathFromObject(parts: string[], obj: any): any {
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Format a value based on its field name
 *
 * Automatic formatting for common field types:
 * - *_arr, current_arr → Currency with K/M suffix
 * - *_date → Date formatting
 * - health_score, *_score → Number
 * - *_percent → Percentage
 *
 * @param path - Field path (used to determine format)
 * @param value - Value to format
 * @returns Formatted string
 */
function formatValue(path: string, value: any): string {
  if (value === undefined || value === null) {
    return '';
  }

  const lowerPath = path.toLowerCase();

  // Currency fields
  if (lowerPath.includes('_arr') || lowerPath.includes('current_arr')) {
    return formatARR(value);
  }

  // Other currency fields
  if (
    lowerPath.includes('revenue') ||
    lowerPath.includes('price') ||
    lowerPath.includes('amount')
  ) {
    return formatCurrency(value);
  }

  // Date fields
  if (lowerPath.includes('_date')) {
    return formatDate(value);
  }

  // Percentage fields
  if (lowerPath.includes('_percent')) {
    return `${value}%`;
  }

  // Score fields (already numbers)
  if (lowerPath.includes('_score')) {
    return String(value);
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Default: convert to string
  return String(value);
}

/**
 * Format a date for display
 *
 * @param dateValue - Date string or object
 * @returns Formatted date string
 */
function formatDate(dateValue: any): string {
  if (!dateValue) return '';

  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(dateValue);
  }
}

/**
 * Build a complete hydration context from customer data
 *
 * Adds computed fields and helper values.
 *
 * @param customerData - Customer data from database
 * @param additionalContext - Additional context (CSM, departed contact, etc.)
 * @returns Complete hydration context
 */
export function buildHydrationContext(
  customerData: WorkflowCustomerData,
  additionalContext?: {
    csm?: CSMData;
    departed_contact?: any;
    replacement_contact?: any;
  }
): HydrationContext {
  const timestamp = getCurrentTimestamp();

  return {
    customer: customerData,
    csm: additionalContext?.csm,
    departed_contact: additionalContext?.departed_contact,
    replacement_contact: additionalContext?.replacement_contact,

    // Computed fields
    current_timestamp: timestamp.readable,
    days_until_renewal: customerData.days_until_renewal,
    renewal_urgency: calculateRenewalUrgency(customerData.days_until_renewal),
  };
}

/**
 * Preview placeholder replacement (for debugging)
 *
 * Shows what placeholders would be replaced with.
 *
 * @param text - Text with placeholders
 * @param context - Hydration context
 * @returns Array of placeholder → value mappings
 *
 * @example
 * const preview = previewPlaceholders(
 *   "Hello {{customer.name}}, your ARR is {{customer.current_arr}}",
 *   context
 * );
 * // [
 * //   { placeholder: "{{customer.name}}", value: "Acme Corp" },
 * //   { placeholder: "{{customer.current_arr}}", value: "$250K" }
 * // ]
 */
export function previewPlaceholders(
  text: string,
  context: HydrationContext
): Array<{ placeholder: string; value: string; path: string }> {
  const placeholders: Array<{ placeholder: string; value: string; path: string }> = [];

  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const placeholder = match[0];
    const path = match[1].trim();
    const value = resolvePath(path, context);
    const formattedValue = formatValue(path, value);

    placeholders.push({
      placeholder,
      path,
      value: formattedValue,
    });
  }

  return placeholders;
}

/**
 * Validate that all required placeholders can be resolved
 *
 * @param text - Text with placeholders
 * @param context - Hydration context
 * @returns Validation result with missing placeholders
 */
export function validatePlaceholders(
  text: string,
  context: HydrationContext
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const path = match[1].trim();
    const value = resolvePath(path, context);

    if (value === undefined || value === null) {
      missing.push(path);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
