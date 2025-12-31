/**
 * Shared types for service layer
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Context passed to all service methods
 */
export interface ServiceContext {
  supabase: SupabaseClient;
  userId: string;
  layer: string;
}

/**
 * Standard service result wrapper
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
