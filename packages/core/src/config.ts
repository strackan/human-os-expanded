/**
 * Centralized Configuration Constants
 *
 * All magic strings, schema names, and configuration values
 * should be defined here to avoid duplication and ensure consistency.
 */

import type { Layer } from './types.js';

// =============================================================================
// DATABASE SCHEMAS
// =============================================================================

export const DB_SCHEMAS = {
  /** Founder OS personal data (tasks, goals, check-ins) */
  FOUNDER_OS: 'founder_os',
  /** GFT CRM data (contacts, companies, posts) */
  GFT: 'gft',
  /** PowerPak expert configurations */
  POWERPAK: 'powerpak',
  /** Public schema (default) */
  PUBLIC: 'public',
} as const;

// =============================================================================
// STORAGE BUCKETS
// =============================================================================

export const STORAGE_BUCKETS = {
  /** Context files storage bucket */
  CONTEXTS: 'contexts',
} as const;

// =============================================================================
// LAYER PREFIXES
// =============================================================================

export const LAYER_PREFIXES = {
  /** Personal founder layer prefix */
  FOUNDER: 'founder:',
  /** Renubu tenant layer prefix */
  RENUBU_TENANT: 'renubu:tenant-',
  /** Public layer */
  PUBLIC: 'public',
  /** PowerPak published layer */
  POWERPAK_PUBLISHED: 'powerpak-published',
} as const;

// =============================================================================
// PATH PREFIXES (Storage paths)
// =============================================================================

export const PATH_PREFIXES = {
  /** Public content path */
  PUBLIC: 'public/',
  /** PowerPak published content path */
  POWERPAK_PUBLISHED: 'powerpak-published/',
  /** Renubu tenant content path (followed by tenant-{id}/) */
  RENUBU: 'renubu/',
  /** Founder OS personal content path (followed by {userId}/) */
  FOUNDER_OS: 'founder-os/',
  /** Voice OS personal content path (followed by {userId}/) */
  VOICE_OS: 'voice-os/',
} as const;

// =============================================================================
// PATH PATTERNS (Regex patterns for parsing)
// =============================================================================

export const PATH_PATTERNS = {
  /** Matches renubu/tenant-{id}/ and captures tenant ID */
  RENUBU_TENANT: /^renubu\/tenant-([^/]+)\//,
  /** Matches founder-os/{userId}/ and captures user ID */
  FOUNDER_OS: /^founder-os\/([^/]+)\//,
  /** Matches voice-os/{userId}/ and captures user ID */
  VOICE_OS: /^voice-os\/([^/]+)\//,
} as const;

// =============================================================================
// TASK STATUS VALUES
// =============================================================================

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  DONE: 'done',
  ARCHIVED: 'archived',
} as const;

export const TASK_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// =============================================================================
// OPINION TYPES (Relationship context)
// =============================================================================

export const OPINION_TYPES = [
  'general',
  'work_style',
  'communication',
  'trust',
  'negotiation',
  'decision_making',
  'responsiveness',
  'relationship_history',
] as const;

export type OpinionType = (typeof OPINION_TYPES)[number];

// =============================================================================
// SENTIMENT VALUES (for relationship opinions)
// =============================================================================

export const OPINION_SENTIMENTS = ['positive', 'neutral', 'negative', 'mixed'] as const;
export type OpinionSentiment = (typeof OPINION_SENTIMENTS)[number];

// =============================================================================
// CONFIDENCE LEVELS
// =============================================================================

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULTS = {
  /** Default owner ID when none is provided (placeholder UUID) */
  OWNER_ID: '00000000-0000-0000-0000-000000000000',
  /** Default task priority */
  TASK_PRIORITY: 'medium' as const,
  /** Default confidence level */
  CONFIDENCE: 'medium' as const,
  /** Default pagination limit */
  PAGE_LIMIT: 50,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build a founder layer string from user ID
 */
export function buildFounderLayer(userId: string): Layer {
  return `founder:${userId}` as Layer;
}

/**
 * Build a renubu tenant layer string from tenant ID
 */
export function buildRenubuTenantLayer(tenantId: string): Layer {
  return `renubu:tenant-${tenantId}` as Layer;
}

/**
 * Extract user ID from a founder layer string
 */
export function extractUserIdFromLayer(layer: string): string | null {
  if (layer.startsWith(LAYER_PREFIXES.FOUNDER)) {
    return layer.slice(LAYER_PREFIXES.FOUNDER.length);
  }
  return null;
}

/**
 * Extract tenant ID from a renubu layer string
 */
export function extractTenantIdFromLayer(layer: string): string | null {
  if (layer.startsWith(LAYER_PREFIXES.RENUBU_TENANT)) {
    return layer.slice(LAYER_PREFIXES.RENUBU_TENANT.length);
  }
  return null;
}
