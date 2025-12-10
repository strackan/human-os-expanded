/**
 * Justin Strackany's Voice Pack
 *
 * Voice configuration and templates for Justin's writing style.
 */

import { VoiceEngine, type VoicePack } from '@human-os/voice-packs-base';
import { ContextEngine, createSupabaseClient, type Viewer } from '@human-os/core';

export const JUSTIN_VOICE_SLUG = 'justin';
export const JUSTIN_LAYER = 'founder:justin';

/**
 * Justin's voice pack metadata
 */
export const justinVoiceMetadata = {
  slug: JUSTIN_VOICE_SLUG,
  name: 'Justin Strackany',
  description: 'Founder, builder, truth-teller. Direct communication with strategic depth.',
  version: '1.0.0',
  author: 'Justin Strackany',
};

/**
 * Create a voice engine pre-configured for Justin's voice
 */
export async function createJustinVoiceEngine(): Promise<{
  engine: VoiceEngine;
  voicePack: VoicePack | null;
}> {
  const SUPABASE_URL = process.env['SUPABASE_URL'];
  const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const baseConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  };

  const viewer: Viewer = {
    userId: 'justin',
  };

  const contextEngine = new ContextEngine({ ...baseConfig, viewer });
  const engine = new VoiceEngine(contextEngine);
  const voicePack = await engine.loadVoicePack(JUSTIN_VOICE_SLUG);

  return { engine, voicePack };
}

/**
 * Justin's key templates (reference)
 */
export const justinTemplates = {
  LINKEDIN_POST: 'linkedin-post',
  TWITTER_THREAD: 'twitter-thread',
  EMAIL_OUTREACH: 'email-outreach',
  NEWSLETTER: 'newsletter',
  PITCH_DECK: 'pitch-deck',
  INVESTOR_UPDATE: 'investor-update',
} as const;

/**
 * Justin's key blends (reference)
 */
export const justinBlends = {
  FOUNDER_MODE: 'founder-mode',
  THOUGHT_LEADER: 'thought-leader',
  MENTOR: 'mentor',
  STORYTELLER: 'storyteller',
} as const;

export { VoiceEngine } from '@human-os/voice-packs-base';
