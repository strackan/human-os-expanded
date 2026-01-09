/**
 * Client for the main Human OS database
 * Used for cross-product features like activation keys and user status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy client creation to avoid build-time errors
let _humanOsClient: SupabaseClient | null = null;

export function getHumanOsClient(): SupabaseClient {
  if (!_humanOsClient) {
    const url = process.env.HUMAN_OS_SUPABASE_URL;
    const key = process.env.HUMAN_OS_SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Human OS Supabase credentials not configured. Set HUMAN_OS_SUPABASE_URL and HUMAN_OS_SUPABASE_SERVICE_KEY.');
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
 * Check if Human OS database is configured
 */
export function isHumanOsConfigured(): boolean {
  return !!(process.env.HUMAN_OS_SUPABASE_URL && process.env.HUMAN_OS_SUPABASE_SERVICE_KEY);
}
