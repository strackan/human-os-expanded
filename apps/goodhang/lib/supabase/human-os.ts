/**
 * Client for the main Human OS database
 * Used for cross-product features like activation keys and user status
 *
 * Note: In goodhang-staging, the main Supabase URL IS the human-os database,
 * so these clients use the standard env vars.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy client creation to avoid build-time errors
let _humanOsClient: SupabaseClient | null = null;
let _humanOsPublicClient: SupabaseClient | null = null;
let _humanOsAdminClient: SupabaseClient | null = null;

export function getHumanOsClient(): SupabaseClient {
  if (!_humanOsClient) {
    const url = process.env.HUMAN_OS_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.HUMAN_OS_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Human OS Supabase credentials not configured.');
    }

    _humanOsClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _humanOsClient;
}

/**
 * Get Human-OS client for public operations
 * Uses anon key, respects RLS policies
 */
export function getHumanOSPublicClient(): SupabaseClient {
  if (!_humanOsPublicClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured.');
    }

    _humanOsPublicClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _humanOsPublicClient;
}

/**
 * Get Human-OS client for server-side operations
 * Uses service role key for full access to tables
 */
export function getHumanOSAdminClient(): SupabaseClient {
  if (!_humanOsAdminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase service role credentials not configured.');
    }

    _humanOsAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _humanOsAdminClient;
}

/**
 * Check if Human OS database is configured
 */
export function isHumanOsConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
