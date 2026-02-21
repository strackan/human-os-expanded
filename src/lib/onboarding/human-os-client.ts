/**
 * Human-OS Client
 *
 * Thin wrapper for calling identity profile handlers in human-os-expanded.
 * This is the single integration point — all Renubu features that need
 * user context go through this file.
 */

import { createClient } from '@supabase/supabase-js';
import {
  getIdentityProfile,
  updateIdentityProfile,
  type IdentityProfileUpdate,
} from '@human-os/services';

const LAYER = 'personal';

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
    // Cast to any at package boundary — Renubu and @human-os/services
    // may use different @supabase/supabase-js versions
    const supabase = getHumanOsClient() as unknown;
    const result = await getIdentityProfile({ supabase, userId, layer: LAYER });

    if (!result.success || !result.data) {
      return null;
    }

    const p = result.data;
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
    const supabase = getHumanOsClient() as unknown;
    const result = await updateIdentityProfile(
      { supabase, userId, layer: LAYER },
      profileUpdates
    );

    if (!result.success) {
      console.error('[human-os-client] saveUserContext error:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[human-os-client] saveUserContext error:', error);
    return false;
  }
}
