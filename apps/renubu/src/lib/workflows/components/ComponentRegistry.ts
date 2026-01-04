/**
 * Component Registry - React component registration system
 *
 * Manages registration and resolution of React components for workflow artifacts.
 * Components are registered by type ID and can be resolved with props mapping.
 */

import { ComponentType } from 'react';

/**
 * Component registration entry
 */
interface ComponentRegistration {
  componentType: ComponentType<any>;
  displayName: string;
  description?: string;
}

// Component storage
const components = new Map<string, ComponentRegistration>();

/**
 * Register a React component
 */
export function registerComponent(
  id: string,
  componentType: ComponentType<any>,
  displayName: string,
  description?: string
): void {
  components.set(id, {
    componentType,
    displayName,
    description,
  });
}

/**
 * Get a registered component
 */
export function getComponent(id: string): ComponentType<any> | undefined {
  return components.get(id)?.componentType;
}

/**
 * Check if a component exists
 */
export function hasComponent(id: string): boolean {
  return components.has(id);
}

/**
 * Get component metadata
 */
export function getComponentMetadata(id: string): Omit<ComponentRegistration, 'componentType'> | undefined {
  const registration = components.get(id);
  if (!registration) return undefined;

  return {
    displayName: registration.displayName,
    description: registration.description,
  };
}

/**
 * List all registered components
 */
export function listComponents(): Array<{ id: string; displayName: string; description?: string }> {
  return Array.from(components.entries()).map(([id, registration]) => ({
    id,
    displayName: registration.displayName,
    description: registration.description,
  }));
}

/**
 * Bulk register components
 */
export function registerComponents(
  componentMap: Record<string, { component: ComponentType<any>; displayName: string; description?: string }>
): void {
  Object.entries(componentMap).forEach(([id, { component, displayName, description }]) => {
    registerComponent(id, component, displayName, description);
  });
}

/**
 * Clear all components (for testing)
 */
export function clearComponents(): void {
  components.clear();
}
