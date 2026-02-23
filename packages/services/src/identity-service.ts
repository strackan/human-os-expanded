/**
 * Identity Service
 *
 * Shared service for managing Identity Pack profiles.
 * Used by MCP tools (founder-os) and REST consumers (Renubu onboarding).
 *
 * The identity profile is the foundational layer from The Sculptor conversation.
 * Portable across all Human OS products.
 */

import type { ServiceContext, ServiceResult } from './types.js';

const IDENTITY_SCHEMA = 'human_os';

// =============================================================================
// TYPES
// =============================================================================

export interface IdentityProfile {
  user_id: string;
  core_values: string[] | null;
  energy_patterns: string | null;
  communication_style: string | null;
  interest_vectors: string[] | null;
  relationship_orientation: string | null;
  work_style: string | null;
  cognitive_profile: string | null;
  sculptor_completed_at: string | null;
  annual_theme: string | null;
  annual_theme_year: number | null;
  annual_theme_context: string | null;
  theme_history: ThemeEntry[] | null;
}

export interface ThemeEntry {
  year: number;
  theme: string;
  context?: string;
}

export interface IdentityProfileUpdate {
  core_values?: string[];
  energy_patterns?: string;
  communication_style?: string;
  interest_vectors?: string[];
  relationship_orientation?: string;
  work_style?: string;
  cognitive_profile?: string;
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get a user's identity profile from human_os.identity_profiles.
 */
export async function getIdentityProfile(
  ctx: ServiceContext
): Promise<ServiceResult<IdentityProfile | null>> {
  try {
    const schema = ctx.supabase.schema(IDENTITY_SCHEMA);

    const { data, error } = await schema
      .from('identity_profiles')
      .select('*')
      .eq('user_id', ctx.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: `Failed to get identity profile: ${error.message}` };
    }

    return { success: true, data: data as IdentityProfile | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Upsert a user's identity profile.
 * Merges provided fields with existing data.
 */
export async function updateIdentityProfile(
  ctx: ServiceContext,
  updates: IdentityProfileUpdate
): Promise<ServiceResult<IdentityProfile>> {
  try {
    const schema = ctx.supabase.schema(IDENTITY_SCHEMA);

    const row: Record<string, unknown> = {
      user_id: ctx.userId,
      layer: ctx.layer,
    };

    if (updates.core_values) row.core_values = updates.core_values;
    if (updates.energy_patterns) row.energy_patterns = updates.energy_patterns;
    if (updates.communication_style) row.communication_style = updates.communication_style;
    if (updates.interest_vectors) row.interest_vectors = updates.interest_vectors;
    if (updates.relationship_orientation) row.relationship_orientation = updates.relationship_orientation;
    if (updates.work_style) row.work_style = updates.work_style;
    if (updates.cognitive_profile) row.cognitive_profile = updates.cognitive_profile;
    row.sculptor_completed_at = new Date().toISOString();

    const { data, error } = await schema
      .from('identity_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: `Failed to update identity profile: ${error.message}` };
    }

    return { success: true, data: data as IdentityProfile };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
