import { User } from '@supabase/supabase-js';

export interface VariableContext {
  user?: User | null;
  customer?: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Processes variable substitution in text strings
 * Supports variables like {{user.first}}, {{customer.name}}, etc.
 */
export function substituteVariables(text: string, context: VariableContext): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Regular expression to match {{variable.path}} patterns
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  return text.replace(variableRegex, (match, variablePath) => {
    const trimmedPath = variablePath.trim();
    const value = getNestedValue(context, trimmedPath);
    
    // If value is not found, return the original match (keep the variable as-is)
    if (value === undefined || value === null) {
      console.warn(`Variable substitution: No value found for {{${trimmedPath}}}`);
      return match;
    }
    
    return String(value);
  });
}

/**
 * Gets a nested value from an object using dot notation
 * e.g., "user.first" -> context.user.first
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle special user properties
    if (key === 'first' && current.user_metadata) {
      const metadata = current.user_metadata;
      const name = metadata.given_name || 
                  metadata.name?.split(' ')[0] || 
                  metadata.full_name?.split(' ')[0];
      
      if (name) {
        return name;
      }
      
      // Fallback to email username if no name found
      if (current.email) {
        const emailPrefix = current.email.split('@')[0];
        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
      
      return 'User';
    }
    
    if (key === 'last' && current.user_metadata) {
      const metadata = current.user_metadata;
      const fullName = metadata.name || metadata.full_name;
      
      if (fullName) {
        const names = fullName.split(' ');
        return names.length > 1 ? names[names.length - 1] : '';
      }
      
      return '';
    }
    
    if (key === 'email' && current.email) {
      return current.email;
    }
    
    if (key === 'full_name' && current.user_metadata) {
      return current.user_metadata.name || current.user_metadata.full_name || '';
    }
    
    // Handle regular property access
    current = current[key];
  }

  return current;
}

/**
 * Predefined variable mappings for common use cases
 */
export const VARIABLE_MAPPINGS = {
  // User variables
  'user.first': 'user.first',
  'user.last': 'user.last', 
  'user.email': 'user.email',
  'user.full_name': 'user.full_name',
  
  // Customer variables
  'customer.name': 'customer.name',
  'customer.contact': 'customer.primaryContact?.value',
  'customer.arr': 'customer.customerOverview?.metrics?.arr?.value',
  'customer.renewal_date': 'customer.customerOverview?.metrics?.renewalDate?.value',
  
  // Common shortcuts
  'name': 'user.first', // Shortcut for user.first
  'customer': 'customer.name', // Shortcut for customer.name
} as const;

/**
 * Enhanced substitution that also handles predefined mappings
 */
export function substituteVariablesWithMappings(text: string, context: VariableContext): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // First, expand any shortcut variables
  let expandedText = text;
  Object.entries(VARIABLE_MAPPINGS).forEach(([shortcut, fullPath]) => {
    const regex = new RegExp(`\\{\\{${shortcut}\\}\\}`, 'g');
    expandedText = expandedText.replace(regex, `{{${fullPath}}}`);
  });

  // Then perform normal substitution
  return substituteVariables(expandedText, context);
}

/**
 * Validates that all variables in a text string can be resolved
 */
export function validateVariables(text: string, context: VariableContext): {
  isValid: boolean;
  unresolvedVariables: string[];
} {
  if (!text || typeof text !== 'string') {
    return { isValid: true, unresolvedVariables: [] };
  }

  const variableRegex = /\{\{([^}]+)\}\}/g;
  const unresolvedVariables: string[] = [];
  let match;

  while ((match = variableRegex.exec(text)) !== null) {
    const variablePath = match[1].trim();
    const value = getNestedValue(context, variablePath);
    
    if (value === undefined || value === null) {
      unresolvedVariables.push(variablePath);
    }
  }

  return {
    isValid: unresolvedVariables.length === 0,
    unresolvedVariables
  };
}
