/**
 * Module Registry
 *
 * Defines product modules and their category taxonomies.
 * Each module represents an independent feature domain.
 */

export interface Module {
  id: string;
  name: string;
  description: string;
  categories: readonly string[];
  icon?: string;
  color?: string;
  enabled: boolean;
}

/**
 * Module 1: Customer Success
 * B2B customer lifecycle management for CS teams
 */
export const CUSTOMER_SUCCESS_MODULE: Module = {
  id: 'customer-success',
  name: 'Customer Success',
  description: 'B2B customer lifecycle management',
  categories: ['renewal', 'opportunity', 'risk', 'strategic', 'action', 'common'] as const,
  color: 'blue',
  enabled: true,
};

/**
 * Module 2: Productivity
 * Personal productivity and work management
 */
export const PRODUCTIVITY_MODULE: Module = {
  id: 'productivity',
  name: 'Productivity',
  description: 'Personal productivity and work management',
  categories: ['planner', 'gtd', 'capture', 'review'] as const,
  color: 'purple',
  enabled: true,
};

/**
 * All registered modules
 */
export const MODULES: Record<string, Module> = {
  [CUSTOMER_SUCCESS_MODULE.id]: CUSTOMER_SUCCESS_MODULE,
  [PRODUCTIVITY_MODULE.id]: PRODUCTIVITY_MODULE,
};

/**
 * Module-specific category types
 */
export type CustomerSuccessCategory = 'renewal' | 'opportunity' | 'risk' | 'strategic' | 'action' | 'common';
export type ProductivityCategory = 'planner' | 'gtd' | 'capture' | 'review';

/**
 * Union of all module categories
 */
export type WorkflowCategory = CustomerSuccessCategory | ProductivityCategory;

/**
 * Get module by ID
 */
export function getModule(moduleId: string): Module | undefined {
  return MODULES[moduleId];
}

/**
 * Get all enabled modules
 */
export function getEnabledModules(): Module[] {
  return Object.values(MODULES).filter((m) => m.enabled);
}

/**
 * Validate category belongs to module
 */
export function isValidCategoryForModule(moduleId: string, category: string): boolean {
  const module = getModule(moduleId);
  if (!module) return false;
  return module.categories.includes(category);
}
