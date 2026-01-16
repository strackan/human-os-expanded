/**
 * Artifact System Types
 *
 * Type definitions for the extensible artifact canvas system.
 */

import type { ComponentType } from 'react';

// =============================================================================
// ARTIFACT DEFINITION (for registry)
// =============================================================================

export interface ArtifactDefinition {
  /** Unique type identifier */
  type: string;
  /** Display name */
  title: string;
  /** React component to render this artifact */
  component: ComponentType<ArtifactProps>;
  /** JSON Schema for LLM to populate data */
  schema: Record<string, unknown>;
  /** Whether user can edit this artifact */
  editable?: boolean;
  /** Whether this artifact can be exported */
  exportable?: boolean;
  /** Icon name (lucide icon) */
  icon?: string;
}

// =============================================================================
// ARTIFACT INSTANCE (runtime data)
// =============================================================================

export interface ArtifactInstance {
  /** Unique instance ID */
  id: string;
  /** Type from registry */
  type: string;
  /** Display title for tabs */
  title: string;
  /** Artifact-specific data */
  data: Record<string, unknown>;
  /** Current status */
  status: 'draft' | 'confirmed' | 'saved';
  /** When this artifact was generated */
  generatedAt: string;
  /** How this artifact was created */
  source: 'awaken' | 'conversation' | 'manual';
  /** Associated checklist item ID */
  checklistItemId?: string;
}

// =============================================================================
// ARTIFACT PROPS (passed to components)
// =============================================================================

export interface ArtifactProps<T = Record<string, unknown>> {
  /** The artifact instance */
  artifact: ArtifactInstance;
  /** Typed data for this artifact */
  data: T;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Callback when data changes */
  onDataChange?: (data: T) => void;
  /** Callback to confirm/save */
  onConfirm?: () => void;
}

// =============================================================================
// SPECIFIC ARTIFACT DATA TYPES
// =============================================================================

export interface TableArtifactData {
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    options?: string[]; // For select type
    width?: number;
  }>;
  rows: Array<Record<string, unknown>>;
  sortable?: boolean;
  filterable?: boolean;
}

export interface DocumentArtifactData {
  content: string; // Markdown
  format: 'markdown' | 'plaintext';
  metadata?: {
    author?: string;
    createdAt?: string;
    version?: number;
  };
}

export interface PersonaCardArtifactData {
  name: string;
  title?: string;
  avatar?: string;
  personality: {
    self_deprecation: number;
    directness: number;
    warmth: number;
    intellectual_signaling: number;
    comfort_with_sincerity: number;
    absurdism_tolerance: number;
    format_awareness: number;
    vulnerability_as_tool: number;
  };
  dndClass?: string;
  dndAlignment?: string;
  traits?: string[];
  summary?: string;
}

export interface RelationshipMapArtifactData {
  nodes: Array<{
    id: string;
    name: string;
    type: 'person' | 'company' | 'project';
    role?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relationship: string;
    strength?: number;
  }>;
}

export interface TaskListArtifactData {
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
    context?: string;
  }>;
}

export interface CalendarArtifactData {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
    type?: 'meeting' | 'deadline' | 'reminder' | 'event';
    description?: string;
  }>;
  view?: 'month' | 'week' | 'day' | 'agenda';
}

export interface CodeOutputArtifactData {
  language: string;
  code: string;
  output?: string;
  error?: string;
  executedAt?: string;
}

// =============================================================================
// REGISTRY HELPERS
// =============================================================================

export type ArtifactDataMap = {
  table: TableArtifactData;
  document: DocumentArtifactData;
  persona: PersonaCardArtifactData;
  'relationship-map': RelationshipMapArtifactData;
  'task-list': TaskListArtifactData;
  calendar: CalendarArtifactData;
  code: CodeOutputArtifactData;
};

export type ArtifactType = keyof ArtifactDataMap;
