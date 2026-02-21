/**
 * Human-OS Client
 *
 * Thin wrapper for reading/writing identity profiles in human-os-expanded's
 * Supabase (human_os.identity_profiles). This is the single integration point —
 * all Renubu features that need user context go through this file.
 *
 * The query logic mirrors @human-os/services identity-service.ts.
 * When that package is publishable to a registry, this can be replaced
 * with a direct import.
 */

import { createClient } from '@supabase/supabase-js';

const IDENTITY_SCHEMA = 'human_os';
const LAYER = 'personal';

export interface IdentityProfileUpdate {
  core_values?: string[];
  energy_patterns?: string;
  communication_style?: string;
  interest_vectors?: string[];
  relationship_orientation?: string;
  work_style?: string;
  cognitive_profile?: string;
}

interface IdentityProfile {
  core_values: string[] | null;
  energy_patterns: string | null;
  communication_style: string | null;
  interest_vectors: string[] | null;
  relationship_orientation: string | null;
  work_style: string | null;
  cognitive_profile: string | null;
}

function getHumanOsClient() {
  const url = process.env.HUMAN_OS_SUPABASE_URL;
  const key = process.env.HUMAN_OS_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing HUMAN_OS_SUPABASE_URL or HUMAN_OS_SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Load user context from human-os identity profile.
 * Returns a markdown-formatted string suitable for injection into AI system prompts.
 * Returns null if no profile exists.
 */
export async function loadUserContext(userId: string): Promise<string | null> {
  try {
    const supabase = getHumanOsClient();
    const schema = supabase.schema(IDENTITY_SCHEMA);

    const { data, error } = await schema
      .from('identity_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[human-os-client] loadUserContext query error:', error.message);
      return null;
    }

    if (!data) return null;

    const p = data as IdentityProfile;
    const sections: string[] = ['## User Context (from onboarding)'];

    if (p.core_values?.length) {
      sections.push(`**Core Values**: ${p.core_values.join(', ')}`);
    }
    if (p.communication_style) {
      sections.push(`**Communication Style**: ${p.communication_style}`);
    }
    if (p.work_style) {
      sections.push(`**Work Style**: ${p.work_style}`);
    }
    if (p.energy_patterns) {
      sections.push(`**Energy Patterns**: ${p.energy_patterns}`);
    }
    if (p.interest_vectors?.length) {
      sections.push(`**Interests**: ${p.interest_vectors.join(', ')}`);
    }
    if (p.relationship_orientation) {
      sections.push(`**Relationship Orientation**: ${p.relationship_orientation}`);
    }
    if (p.cognitive_profile) {
      sections.push(`**Cognitive Profile**: ${p.cognitive_profile}`);
    }

    return sections.length > 1 ? sections.join('\n') : null;
  } catch (error) {
    console.error('[human-os-client] loadUserContext error:', error);
    return null;
  }
}

/**
 * Save synthesized user context to human-os identity profile.
 */
export async function saveUserContext(
  userId: string,
  profileUpdates: IdentityProfileUpdate
): Promise<boolean> {
  try {
    const supabase = getHumanOsClient();
    const schema = supabase.schema(IDENTITY_SCHEMA);

    const row: Record<string, unknown> = {
      user_id: userId,
      layer: LAYER,
      sculptor_completed_at: new Date().toISOString(),
    };

    if (profileUpdates.core_values) row.core_values = profileUpdates.core_values;
    if (profileUpdates.energy_patterns) row.energy_patterns = profileUpdates.energy_patterns;
    if (profileUpdates.communication_style) row.communication_style = profileUpdates.communication_style;
    if (profileUpdates.interest_vectors) row.interest_vectors = profileUpdates.interest_vectors;
    if (profileUpdates.relationship_orientation) row.relationship_orientation = profileUpdates.relationship_orientation;
    if (profileUpdates.work_style) row.work_style = profileUpdates.work_style;
    if (profileUpdates.cognitive_profile) row.cognitive_profile = profileUpdates.cognitive_profile;

    const { error } = await schema
      .from('identity_profiles')
      .upsert(row, { onConflict: 'user_id' });

    if (error) {
      console.error('[human-os-client] saveUserContext upsert error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[human-os-client] saveUserContext error:', error);
    return false;
  }
}
