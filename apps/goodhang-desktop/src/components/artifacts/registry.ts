/**
 * Artifact Registry
 *
 * Central registry for all artifact types. New artifact types should be
 * registered here to be available in the canvas.
 */

import type { ComponentType } from 'react';
import type { ArtifactDefinition, ArtifactProps } from './types';
import { PersonaCardArtifact } from './PersonaCardArtifact';

// =============================================================================
// REGISTRY
// =============================================================================

const registry = new Map<string, ArtifactDefinition>();

/**
 * Register an artifact type
 */
export function registerArtifact(definition: ArtifactDefinition): void {
  registry.set(definition.type, definition);
}

/**
 * Get an artifact definition by type
 */
export function getArtifactDefinition(type: string): ArtifactDefinition | undefined {
  return registry.get(type);
}

/**
 * Get all registered artifact types
 */
export function getAllArtifactTypes(): ArtifactDefinition[] {
  return Array.from(registry.values());
}

/**
 * Check if an artifact type is registered
 */
export function isArtifactRegistered(type: string): boolean {
  return registry.has(type);
}

// =============================================================================
// BUILT-IN ARTIFACT TYPES
// =============================================================================

// Register PersonaCard artifact
registerArtifact({
  type: 'persona',
  title: 'Persona Card',
  component: PersonaCardArtifact as unknown as ComponentType<ArtifactProps>,
  icon: 'users',
  editable: true,
  exportable: true,
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Person name' },
      title: { type: 'string', description: 'Job title or role' },
      personality: {
        type: 'object',
        description: '8-dimension personality matrix (0-10 each)',
        properties: {
          self_deprecation: { type: 'number', minimum: 0, maximum: 10 },
          directness: { type: 'number', minimum: 0, maximum: 10 },
          warmth: { type: 'number', minimum: 0, maximum: 10 },
          intellectual_signaling: { type: 'number', minimum: 0, maximum: 10 },
          comfort_with_sincerity: { type: 'number', minimum: 0, maximum: 10 },
          absurdism_tolerance: { type: 'number', minimum: 0, maximum: 10 },
          format_awareness: { type: 'number', minimum: 0, maximum: 10 },
          vulnerability_as_tool: { type: 'number', minimum: 0, maximum: 10 },
        },
      },
      dndClass: { type: 'string', description: 'D&D-style class' },
      dndAlignment: { type: 'string', description: 'D&D-style alignment' },
      traits: { type: 'array', items: { type: 'string' }, description: 'Key traits' },
      summary: { type: 'string', description: 'Brief personality summary' },
    },
    required: ['name', 'personality'],
  },
});

// Placeholder for Table artifact (to be implemented)
registerArtifact({
  type: 'table',
  title: 'Table',
  component: (() => null) as unknown as ComponentType<ArtifactProps>, // Placeholder
  icon: 'table',
  editable: true,
  exportable: true,
  schema: {
    type: 'object',
    properties: {
      columns: { type: 'array' },
      rows: { type: 'array' },
    },
  },
});

// Placeholder for Document artifact
registerArtifact({
  type: 'document',
  title: 'Document',
  component: (() => null) as unknown as ComponentType<ArtifactProps>,
  icon: 'file-text',
  editable: true,
  exportable: true,
  schema: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      format: { type: 'string', enum: ['markdown', 'plaintext'] },
    },
  },
});

// Placeholder for Relationship Map
registerArtifact({
  type: 'relationship-map',
  title: 'Relationship Map',
  component: (() => null) as unknown as ComponentType<ArtifactProps>,
  icon: 'network',
  editable: false,
  exportable: true,
  schema: {
    type: 'object',
    properties: {
      nodes: { type: 'array' },
      edges: { type: 'array' },
    },
  },
});

// =============================================================================
// RENDER HELPER
// =============================================================================

/**
 * Get the component for an artifact type
 */
export function getArtifactComponent(type: string): ComponentType<ArtifactProps> | null {
  const definition = registry.get(type);
  return definition?.component || null;
}
