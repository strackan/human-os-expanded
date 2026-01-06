/**
 * Human-OS Supabase Client
 *
 * Separate client for accessing human-os database tables.
 * Used for sculptor, conductor, and other cross-platform features.
 *
 * Environment variables:
 * - HUMAN_OS_SUPABASE_URL
 * - HUMAN_OS_SUPABASE_ANON_KEY
 * - HUMAN_OS_SUPABASE_SERVICE_ROLE_KEY (optional, for admin operations)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createHumanOSClient(useServiceRole = false) {
  // Fall back to main Supabase if Human-OS vars not set
  const supabaseUrl = process.env.HUMAN_OS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.HUMAN_OS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.HUMAN_OS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const keyToUse = useServiceRole && supabaseServiceKey
    ? supabaseServiceKey
    : supabaseAnonKey;

  return createSupabaseClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Human-OS client for server-side operations
 * Uses service role key for full access to tables
 */
export function getHumanOSAdminClient() {
  return createHumanOSClient(true);
}

/**
 * Get Human-OS client for public operations
 * Uses anon key, respects RLS policies
 */
export function getHumanOSPublicClient() {
  return createHumanOSClient(false);
}
