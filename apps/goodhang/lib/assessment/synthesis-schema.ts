/**
 * Zod validation schemas for the assessment synthesis LLM output.
 *
 * These schemas validate the JSON returned by Claude for the unified
 * synthesis call (executive report + character profile + commandments).
 */

import { z } from 'zod';

// --- Sub-schemas ---

const StrengthSchema = z.object({
  strength: z.string(),
  description: z.string(),
});

const ChallengeSchema = z.object({
  challenge: z.string(),
  description: z.string(),
  coping: z.string(),
});

const PersonalityTraitSchema = z.object({
  trait: z.string(),
  description: z.string(),
  insight: z.string(),
});

const WorkStyleSchema = z.object({
  approach: z.string(),
  optimalConditions: z.array(z.string()).optional(),
  strengths: z.array(z.string()).optional(),
});

const CommunicationStyleSchema = z.object({
  style: z.string(),
  preferences: z.array(z.string()),
});

const VoiceProfileSchema = z.object({
  tone: z.string(),
  style: z.string(),
  characteristics: z.array(z.string()),
  examples: z.array(z.string()).optional(),
});

// --- Executive Report ---

const ExecutiveReportSchema = z.object({
  name: z.string().optional(),
  tagline: z.string().optional(),
  summary: z.string(),
  strengths: z.array(StrengthSchema).optional(),
  challenges: z.array(ChallengeSchema).optional(),
  workStyle: WorkStyleSchema,
  communication: CommunicationStyleSchema,
  keyInsights: z.array(z.string()),
  personality: z.array(PersonalityTraitSchema).optional(),
  voice: VoiceProfileSchema.optional(),
});

// --- Character Profile ---

const AlignmentEnum = z.enum([
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]);

const RaceEnum = z.enum([
  'Elven', 'Half-Orc', 'Tiefling', 'Dwarven', 'Human', 'Halfling',
]);

const ClassEnum = z.enum([
  'Paladin', 'Wizard', 'Bard', 'Rogue', 'Ranger',
  'Sorcerer', 'Artificer', 'Barbarian', 'Cleric',
]);

const CharacterProfileSchema = z.object({
  tagline: z.string(),
  alignment: AlignmentEnum,
  race: RaceEnum,
  class: ClassEnum,
});

// --- Attributes ---

const AttributesSchema = z.object({
  INT: z.number().int().min(1).max(10),
  WIS: z.number().int().min(1).max(10),
  CHA: z.number().int().min(1).max(10),
  CON: z.number().int().min(1).max(10),
  STR: z.number().int().min(1).max(10),
  DEX: z.number().int().min(1).max(10),
});

// --- Signals ---

const SignalsSchema = z.object({
  enneagram_hint: z.string().optional(),
  interest_vectors: z.array(z.string()),
  social_energy: z.string(),
  relationship_style: z.string(),
});

// --- Matching ---

const MatchingSchema = z.object({
  ideal_group_size: z.string(),
  connection_style: z.string(),
  energy_pattern: z.string(),
  good_match_with: z.array(z.string()),
  avoid_match_with: z.array(z.string()),
});

// --- Founder OS Commandments ---

const FounderOsCommandmentsSchema = z.object({
  CURRENT_STATE: z.string().min(1),
  STRATEGIC_THOUGHT_PARTNER: z.string().min(1),
  DECISION_MAKING: z.string().min(1),
  ENERGY_PATTERNS: z.string().min(1),
  AVOIDANCE_PATTERNS: z.string().min(1),
  RECOVERY_PROTOCOLS: z.string().min(1),
  ACCOUNTABILITY_FRAMEWORK: z.string().min(1),
  EMOTIONAL_SUPPORT: z.string().min(1),
  WORK_STYLE: z.string().min(1),
  CONVERSATION_PROTOCOLS: z.string().min(1),
});

const FounderOsSummarySchema = z.object({
  core_identity: z.string().optional(),
  support_philosophy: z.string().optional(),
  key_insight: z.string().optional(),
  personality_type: z.string().optional(),
  key_patterns: z.array(z.string()).optional(),
  primary_challenges: z.array(z.string()).optional(),
  recommended_approach: z.string().optional(),
}).passthrough();

const FounderOsSchema = z.object({
  commandments: FounderOsCommandmentsSchema,
  summary: FounderOsSummarySchema,
});

// --- Voice OS Commandments ---

const VoiceOsCommandmentsSchema = z.object({
  WRITING_ENGINE: z.string().min(1),
  SIGNATURE_MOVES: z.string().min(1),
  OPENINGS: z.string().min(1),
  MIDDLES: z.string().min(1),
  ENDINGS: z.string().min(1),
  THEMES: z.string().min(1),
  GUARDRAILS: z.string().min(1),
  STORIES: z.string().min(1),
  ANECDOTES: z.string().min(1),
  BLEND_HYPOTHESES: z.string().min(1),
});

const VoiceOsSummarySchema = z.object({
  voice_essence: z.string().optional(),
  signature_moves: z.array(z.string()).optional(),
  generation_guidance: z.string().optional(),
}).passthrough();

const VoiceOsSchema = z.object({
  commandments: VoiceOsCommandmentsSchema,
  summary: VoiceOsSummarySchema,
});

// --- Full Synthesis Output ---

export const SynthesisOutputSchema = z.object({
  executive_report: ExecutiveReportSchema,
  character_profile: CharacterProfileSchema,
  attributes: AttributesSchema,
  signals: SignalsSchema.optional(),
  matching: MatchingSchema.optional(),
  founder_os: FounderOsSchema,
  voice_os: VoiceOsSchema,
  summary: z.string().optional(),
});

export type ValidatedSynthesisOutput = z.infer<typeof SynthesisOutputSchema>;

// --- Sub-call schemas for Phase 2C parallel synthesis ---

export const ExecutiveProfileOutputSchema = z.object({
  executive_report: ExecutiveReportSchema,
  character_profile: CharacterProfileSchema,
  attributes: AttributesSchema,
  signals: SignalsSchema.optional(),
  matching: MatchingSchema.optional(),
  summary: z.string().optional(),
});

export const FounderOsOutputSchema = FounderOsSchema;

export const VoiceOsOutputSchema = VoiceOsSchema;
