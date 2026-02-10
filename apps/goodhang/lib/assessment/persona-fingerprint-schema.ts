/**
 * Zod validation schema for the Persona Fingerprint LLM output.
 *
 * Validates the JSON returned by Claude for scoring 8 personality
 * dimensions from a Sculptor session transcript.
 */

import { z } from 'zod';

const DimensionScore = z.number().min(0).max(10);
const DimensionReasoning = z.string().min(10);

const DIMENSIONS = [
  'self_deprecation',
  'directness',
  'warmth',
  'intellectual_signaling',
  'comfort_with_sincerity',
  'absurdism_tolerance',
  'format_awareness',
  'vulnerability_as_tool',
] as const;

const FingerprintSchema = z.object(
  Object.fromEntries(DIMENSIONS.map(d => [d, DimensionScore])) as Record<typeof DIMENSIONS[number], typeof DimensionScore>
);

const ReasoningSchema = z.object(
  Object.fromEntries(DIMENSIONS.map(d => [d, DimensionReasoning])) as Record<typeof DIMENSIONS[number], typeof DimensionReasoning>
);

export const PersonaFingerprintOutputSchema = z.object({
  fingerprint: FingerprintSchema,
  reasoning: ReasoningSchema,
});

export type ValidatedPersonaFingerprintOutput = z.infer<typeof PersonaFingerprintOutputSchema>;
