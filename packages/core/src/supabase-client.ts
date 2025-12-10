/**
 * Supabase Client Factory
 *
 * Creates configured Supabase clients for Human OS operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { HumanOSConfig } from './types.js';

let clientInstance: SupabaseClient | null = null;

/**
 * Create or get a Supabase client instance
 */
export function getSupabaseClient(config: HumanOSConfig): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return clientInstance;
}

/**
 * Create a new Supabase client (non-singleton)
 */
export function createSupabaseClient(config: HumanOSConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Reset the singleton client (useful for testing)
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
}

/**
 * Default storage bucket name
 */
export const DEFAULT_STORAGE_BUCKET = 'contexts';

/**
 * Database table names
 */
export const TABLES = {
  ENTITIES: 'entities',
  CONTEXT_FILES: 'context_files',
  ENTITY_LINKS: 'entity_links',
  INTERACTIONS: 'interactions',
  API_KEYS: 'api_keys',
} as const;

/**
 * Type helpers for database operations
 */
export interface DatabaseEntity {
  id: string;
  slug: string | null;
  entity_type: string;
  name: string;
  email: string | null;
  metadata: Record<string, unknown>;
  owner_id: string | null;
  tenant_id: string | null;
  privacy_scope: string;
  source_system: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseContextFile {
  id: string;
  entity_id: string | null;
  layer: string;
  file_path: string;
  storage_bucket: string;
  content_hash: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface DatabaseEntityLink {
  id: string;
  layer: string;
  source_slug: string;
  target_slug: string;
  link_type: string;
  link_text: string | null;
  context_snippet: string | null;
  strength: number;
  created_at: string;
}

export interface DatabaseInteraction {
  id: string;
  entity_id: string | null;
  layer: string;
  interaction_type: string;
  title: string | null;
  content: string | null;
  sentiment: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  duration_minutes: number | null;
  owner_id: string | null;
  source_system: string | null;
  source_id: string | null;
  created_at: string;
}

export interface DatabaseApiKey {
  id: string;
  owner_id: string | null;
  name: string;
  scopes: string[];
  rate_limit_per_minute: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
}
