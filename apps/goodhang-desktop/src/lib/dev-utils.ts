/**
 * Development utilities for testing onboarding flows
 *
 * Usage: Import and call from browser console or add to a dev menu
 */

import { getAllCompletionKeys } from './tutorial/steps';
import { clearDeviceRegistration } from './tauri';
import type {
  FounderOsExtractionResult,
  VoiceOsExtractionResult,
  ExecutiveReport,
  CharacterProfile,
  FounderOsCommandments,
  VoiceOsCommandments,
} from './types';

/**
 * Reset all local onboarding progress for Founder OS
 * Clears localStorage items that track tutorial/onboarding state
 */
export function resetOnboarding() {
  // Get completion keys from config + other progress keys
  const itemsToRemove = [
    ...getAllCompletionKeys(),
    'founder-os-tutorial-progress',
    'founder-os-tutorial-completed',
    'founder-os-tutorial-tutorial',
    'founder-os-work-style-progress',
    'question-e-answers',
    'founder-os-welcome-seen',
    'goodhang-dnd-assessment-progress',
    'fos-consolidated-interview-progress',
  ];

  itemsToRemove.forEach(key => {
    const had = localStorage.getItem(key);
    localStorage.removeItem(key);
    if (had) {
      console.log(`[reset] Cleared: ${key}`);
    }
  });

  console.log('[reset] Onboarding state cleared. Refresh to restart flow.');
  return 'Onboarding reset complete. Refresh the app.';
}

/**
 * Show current onboarding state (for debugging)
 */
export function showOnboardingState() {
  const items = [
    ...getAllCompletionKeys(),
    'founder-os-tutorial-progress',
    'founder-os-tutorial-completed',
    'founder-os-tutorial-tutorial',
    'founder-os-work-style-progress',
    'question-e-answers',
    'founder-os-welcome-seen',
    'goodhang-dnd-assessment-progress',
    'fos-consolidated-interview-progress',
  ];

  console.log('=== Onboarding State ===');
  items.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      } catch {
        console.log(`${key}:`, value);
      }
    } else {
      console.log(`${key}: (not set)`);
    }
  });
}

/**
 * Reset activation/auth state (clears device registration)
 * After calling this, refresh and you'll see the activation page
 */
export async function resetActivation() {
  try {
    await clearDeviceRegistration();
    console.log('[reset] Device registration cleared. Refresh to see activation page.');
    return 'Activation reset complete. Refresh the app.';
  } catch (err) {
    console.error('[reset] Failed to clear device registration:', err);
    return 'Failed to reset activation: ' + err;
  }
}

/**
 * Reset Scott's activation key in the database (clears redeemed_at)
 * This allows the key to be re-used
 */
export async function resetScottKey() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const code = 'B744-DD4D-6D47';

  try {
    const response = await fetch(`${API_URL}/api/activation/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`[reset] Scott's key ${code} has been reset in database`);
      return `Key ${code} reset successfully. You can re-enter it now.`;
    } else {
      console.error('[reset] Failed to reset key:', data.error);
      return `Failed to reset key: ${data.error}`;
    }
  } catch (err) {
    console.error('[reset] Error calling reset API:', err);
    return `Error: ${err}`;
  }
}

/**
 * Full reset - clears both onboarding progress AND activation (local + database)
 */
export async function fullReset() {
  resetOnboarding();
  await resetActivation();
  await resetScottKey();
  console.log('[reset] Full reset complete. Refresh to restart from activation.');
  return 'Full reset complete. Refresh the app.';
}

/**
 * Skip to tool testing step by loading Scott's data from storage
 * Sets all prerequisite localStorage keys and returns synthesis result
 */
export async function loadScottDataForToolTesting(): Promise<{
  founder_os: FounderOsExtractionResult;
  voice_os: VoiceOsExtractionResult;
  executive_report: ExecutiveReport;
  character_profile: CharacterProfile;
}> {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const entitySlug = 'scott';

  console.log('[dev] Loading Scott data for skip-to-tooling...');

  // Mark all prerequisite steps as complete
  const now = new Date().toISOString();
  localStorage.setItem('founder-os-interview-completed', now);
  localStorage.setItem('founder-os-voice-test-completed', now);
  localStorage.setItem('founder-os-question-e-completed', now);
  localStorage.setItem('founder-os-assessment-review-completed', now);

  // Load commandments from storage
  const founderOsKeys = [
    'CURRENT_STATE',
    'STRATEGIC_THOUGHT_PARTNER',
    'DECISION_MAKING',
    'ENERGY_PATTERNS',
    'AVOIDANCE_PATTERNS',
    'RECOVERY_PROTOCOLS',
    'ACCOUNTABILITY_FRAMEWORK',
    'EMOTIONAL_SUPPORT',
    'WORK_STYLE',
    'CONVERSATION_PROTOCOLS',
  ];

  const voiceOsKeys = [
    'WRITING_ENGINE',
    'SIGNATURE_MOVES',
    'OPENINGS',
    'MIDDLES',
    'ENDINGS',
    'THEMES',
    'GUARDRAILS',
    'STORIES',
    'ANECDOTES',
    'BLEND_HYPOTHESES',
  ];

  const founderOsCommandments: Record<string, string> = {};
  const voiceOsCommandments: Record<string, string> = {};

  // Fetch Founder OS commandments
  for (const key of founderOsKeys) {
    try {
      const response = await fetch(
        `${API_URL}/api/storage/read?path=contexts/${entitySlug}/founder-os/${key}.md`
      );
      if (response.ok) {
        const data = await response.json();
        // Extract content after YAML frontmatter
        const content = data.content || '';
        const match = content.match(/---[\s\S]*?---\s*([\s\S]*)/);
        founderOsCommandments[key] = match ? match[1].trim() : content.trim();
      }
    } catch (err) {
      console.warn(`[dev] Failed to load ${key}:`, err);
    }
  }

  // Fetch Voice OS commandments (use summary files which are more concise)
  for (const key of voiceOsKeys) {
    try {
      // Use summary files which are more concise
      const summaryPath = `contexts/${entitySlug}/voice/${key}_SUMMARY.md`;
      const response = await fetch(`${API_URL}/api/storage/read?path=${summaryPath}`);
      if (response.ok) {
        const data = await response.json();
        voiceOsCommandments[key] = data.content?.trim() || `[${key} - loaded from storage]`;
      } else {
        // Default placeholder if file doesn't exist
        voiceOsCommandments[key] = `[${key} commandment - see voice folder for details]`;
      }
    } catch (err) {
      voiceOsCommandments[key] = `[${key} - loading failed]`;
    }
  }

  console.log('[dev] Loaded commandments:', {
    founderOs: Object.keys(founderOsCommandments).length,
    voiceOs: Object.keys(voiceOsCommandments).length,
  });

  return {
    founder_os: {
      commandments: founderOsCommandments as unknown as FounderOsCommandments,
      summary: {
        personality_type: 'Direct, Bold, Authentic',
        key_patterns: ['High energy starter', 'Sprint-based work', 'Direct communication'],
        primary_challenges: ['Chronic pain management', 'Saying no'],
        recommended_approach: 'Direct, no-bullshit support with accountability',
      },
    },
    voice_os: {
      commandments: voiceOsCommandments as unknown as VoiceOsCommandments,
      summary: {
        voice_essence: 'Bold, direct, authentic -- no-BS storyteller who turns pain into fuel',
        signature_moves: ['Vulnerability as hook', 'Direct challenge', 'Harsh truth + warmth'],
        generation_guidance: 'Lead with directness, use specific stories from his journey, never hedge or sanitize',
      },
    },
    executive_report: {
      summary: 'Scott Leese is a sales leader who built himself from rock bottom. Direct, bold, and authentic communicator.',
      workStyle: {
        approach: 'Sprint-based intensity with recovery periods',
        optimalConditions: ['Morning focus blocks', 'Clear deadlines', 'Autonomy'],
      },
      communication: {
        style: 'Direct and no-bullshit',
        preferences: ['Get to the point', 'Harsh truths welcomed', 'Action-oriented'],
      },
      keyInsights: [
        'Prefers direct communication without sugarcoating',
        'Sprint-based work style with defined rest periods',
        'Values accountability but needs permission to vent sometimes',
      ],
    },
    character_profile: {
      tagline: 'Sales Leader from Rock Bottom',
      alignment: 'Chaotic Good',
      race: 'Human',
      class: 'Ranger',
    },
  };
}

// Expose to window for easy console access in dev
if (typeof window !== 'undefined') {
  (window as any).devUtils = {
    resetOnboarding,
    resetActivation,
    resetScottKey,
    fullReset,
    showOnboardingState,
    loadScottDataForToolTesting,
  };
}
