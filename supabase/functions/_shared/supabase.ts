/**
 * Shared Supabase client for edge functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Create Supabase client with service role key
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Get user ID from request (API key or JWT)
 * For now, uses a default - extend with proper auth later
 */
export function getUserId(_req: Request): string {
  // TODO: Extract from API key or JWT
  // For now, default to justin
  return Deno.env.get('HUMAN_OS_USER_ID') || 'justin';
}

/**
 * Get layer from user ID
 */
export function getLayer(userId: string): string {
  return `founder:${userId}`;
}
