/**
 * Supabase Admin Client for CLI operations
 *
 * Uses service role key for full database access.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. ' +
        'This CLI requires service role access.'
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

export function getEnvironmentInfo(): {
  isStaging: boolean;
  isProduction: boolean;
  supabaseUrl: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // Staging project ID
  const isStaging = supabaseUrl.includes('amugmkrihnjsxlpwdzcy');
  // Production project ID
  const isProduction = supabaseUrl.includes('uuvdjjclwwulvyeboavk');

  return { isStaging, isProduction, supabaseUrl };
}

export function requireNonProduction(): void {
  const { isProduction } = getEnvironmentInfo();

  if (isProduction) {
    throw new Error(
      'This operation cannot be performed on production. ' +
        'Switch to staging with: npm run env:staging'
    );
  }
}
