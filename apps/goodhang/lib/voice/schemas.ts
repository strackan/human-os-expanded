/**
 * Zod validation schemas for voice pipeline LLM outputs.
 *
 * Covers finalize RC, generate samples, and refine commandments.
 */

import { z } from 'zod';

// --- Voice Finalize RC ---

export const VoiceFinalizeRCSchema = z.object({
  themes: z.string().min(1),
  guardrails: z.string().min(1),
  stories: z.string().min(1),
  anecdotes: z.string().min(1),
});

export type ValidatedVoiceFinalizeRC = z.infer<typeof VoiceFinalizeRCSchema>;

// --- Voice Generate Samples ---

const SampleSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  description: z.string(),
  content: z.string(),
  topic: z.string().optional(),
});

export const VoiceGenerateSamplesSchema = z.object({
  samples: z.array(SampleSchema).min(1),
});

export type ValidatedVoiceGenerateSamples = z.infer<typeof VoiceGenerateSamplesSchema>;

// --- Voice Refine Commandments ---

export const VoiceRefineCommandmentsSchema = z.object({
  refined_voice_os: z.object({
    commandments: z.record(z.string(), z.string()),
    summary: z.object({
      voice_essence: z.string().optional(),
      signature_moves: z.array(z.string()).optional(),
      generation_guidance: z.string().optional(),
    }).passthrough(),
  }),
  adjustments_made: z.array(z.string()),
});

export type ValidatedVoiceRefineCommandments = z.infer<typeof VoiceRefineCommandmentsSchema>;
