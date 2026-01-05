/**
 * Zod validation schemas for runtime type checking
 * Provides defense-in-depth validation at API boundaries, service layers, and database operations
 */

import { z } from 'zod';

// =====================================================
// CORE DIMENSION SCHEMAS
// =====================================================

/**
 * Schema for individual dimension scores (0-100)
 */
export const DimensionScoreSchema = z.number().min(0).max(100);

/**
 * Schema for all 14 assessment dimensions
 */
export const AssessmentDimensionsSchema = z.object({
  iq: DimensionScoreSchema,
  eq: DimensionScoreSchema,
  empathy: DimensionScoreSchema,
  self_awareness: DimensionScoreSchema,
  technical: DimensionScoreSchema,
  ai_readiness: DimensionScoreSchema,
  gtm: DimensionScoreSchema,
  personality: DimensionScoreSchema,
  motivation: DimensionScoreSchema,
  work_history: DimensionScoreSchema,
  passions: DimensionScoreSchema,
  culture_fit: DimensionScoreSchema,
  organization: DimensionScoreSchema,
  executive_leadership: DimensionScoreSchema,
});

// =====================================================
// PERSONALITY & AI ORCHESTRATION SCHEMAS
// =====================================================

/**
 * Schema for MBTI personality type (e.g., "INTJ", "ENFP")
 */
export const MBTISchema = z.string().regex(/^[EI][NS][TF][JP]$/);

/**
 * Schema for Enneagram type (e.g., "Type 1", "Type 5")
 */
export const EnneagramSchema = z.string().regex(/^Type [1-9]$/);

/**
 * Schema for personality traits array
 */
export const PersonalityTraitsSchema = z.array(z.string()).min(3).max(5);

/**
 * Schema for personality profile
 */
export const PersonalityProfileSchema = z.object({
  mbti: MBTISchema,
  enneagram: EnneagramSchema,
  traits: PersonalityTraitsSchema,
});

/**
 * Schema for AI orchestration sub-scores
 */
export const AIOrchestrationScoresSchema = z.object({
  technical_foundation: DimensionScoreSchema,
  practical_use: DimensionScoreSchema,
  conceptual_understanding: DimensionScoreSchema,
  systems_thinking: DimensionScoreSchema,
  judgment: DimensionScoreSchema,
});

// =====================================================
// CATEGORY SCORES SCHEMA
// =====================================================

/**
 * Schema for category scores with subscores
 */
export const CategoryScoresSchema = z.object({
  technical: z.object({
    overall: DimensionScoreSchema,
    subscores: z.object({
      technical: DimensionScoreSchema,
      ai_readiness: DimensionScoreSchema,
      organization: DimensionScoreSchema,
      iq: DimensionScoreSchema,
    }),
  }),
  emotional: z.object({
    overall: DimensionScoreSchema,
    subscores: z.object({
      eq: DimensionScoreSchema,
      empathy: DimensionScoreSchema,
      self_awareness: DimensionScoreSchema,
      executive_leadership: DimensionScoreSchema,
      gtm: DimensionScoreSchema,
    }),
  }),
  creative: z.object({
    overall: DimensionScoreSchema,
    subscores: z.object({
      passions: DimensionScoreSchema,
      culture_fit: DimensionScoreSchema,
      personality: DimensionScoreSchema,
      motivation: DimensionScoreSchema,
    }),
  }),
});

// =====================================================
// ASSESSMENT FLAGS & TIER SCHEMAS
// =====================================================

/**
 * Schema for assessment flags (red and green)
 */
export const AssessmentFlagsSchema = z.object({
  red_flags: z.array(z.string()),
  green_flags: z.array(z.string()),
});

/**
 * Schema for assessment tier
 */
export const AssessmentTierSchema = z.enum(['top_1', 'benched', 'passed']);

/**
 * Schema for archetype confidence
 */
export const ArchetypeConfidenceSchema = z.enum(['high', 'medium', 'low']);

// =====================================================
// BADGE SCHEMAS
// =====================================================

/**
 * Schema for a single badge
 */
export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  earned_at: z.string().datetime(),
});

// =====================================================
// ASSESSMENT RESULTS SCHEMA
// =====================================================

/**
 * Complete schema for assessment results
 */
export const AssessmentResultsSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  archetype: z.string().min(3).max(50),
  archetype_confidence: ArchetypeConfidenceSchema,
  overall_score: DimensionScoreSchema,
  dimensions: AssessmentDimensionsSchema,
  tier: AssessmentTierSchema,
  flags: AssessmentFlagsSchema,
  recommendation: z.string().min(10).max(500),
  best_fit_roles: z.array(z.string()).min(3).max(5),
  analyzed_at: z.string().datetime(),
  personality_profile: PersonalityProfileSchema.optional(),
  ai_orchestration_scores: AIOrchestrationScoresSchema.optional(),
  category_scores: CategoryScoresSchema.optional(),
  badges: z.array(BadgeSchema).optional(),
  public_summary: z.string().min(50).max(1000).optional(),
  detailed_summary: z.string().min(100).max(5000).optional(),
  is_published: z.boolean().optional(),
});

// =====================================================
// ANSWER SCHEMAS
// =====================================================

/**
 * Schema for a single answer
 */
export const AssessmentAnswerSchema = z.object({
  question_id: z.string(),
  answer: z.string().min(1).max(10000),
  answered_at: z.string().datetime(),
});

/**
 * Schema for answer record (key-value map)
 */
export const AnswersRecordSchema = z.record(z.string(), AssessmentAnswerSchema);

// =====================================================
// SESSION SCHEMAS
// =====================================================

/**
 * Schema for assessment session status
 */
export const SessionStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

/**
 * Schema for assessment session
 */
export const AssessmentSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: SessionStatusSchema,
  current_section: z.string().optional(),
  current_question: z.number().int().min(0).optional(),
  answers: AnswersRecordSchema,
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  analyzed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Scoring results (optional until completed)
  dimensions: AssessmentDimensionsSchema.optional(),
  overall_score: DimensionScoreSchema.optional(),
  personality_type: MBTISchema.optional(),
  personality_profile: PersonalityProfileSchema.optional(),
  category_scores: CategoryScoresSchema.optional(),
  ai_orchestration_scores: AIOrchestrationScoresSchema.optional(),
  archetype: z.string().optional(),
  archetype_confidence: ArchetypeConfidenceSchema.optional(),
  tier: AssessmentTierSchema.optional(),
  flags: AssessmentFlagsSchema.optional(),
  recommendation: z.string().optional(),
  best_fit_roles: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  public_summary: z.string().optional(),
  detailed_summary: z.string().optional(),
  is_published: z.boolean().optional(),
});

// =====================================================
// API REQUEST/RESPONSE SCHEMAS
// =====================================================

/**
 * Schema for answer submission request
 */
export const SubmitAnswerRequestSchema = z.object({
  question_id: z.string(),
  answer: z.string().min(1).max(10000),
  question_text: z.string().optional(),
  current_section: z.string().optional(),
  section_index: z.number().int().min(0).optional(),
  current_question: z.number().int().min(0).optional(),
  question_index: z.number().int().min(0).optional(),
});

/**
 * Schema for start assessment response
 */
export const StartAssessmentResponseSchema = z.object({
  session_id: z.string().uuid(),
  status: SessionStatusSchema,
  resume: z.boolean().optional(),
  current_section_index: z.number().int().min(0).optional(),
  current_question_index: z.number().int().min(0).optional(),
  assessment: z.any(), // Assessment config is complex, validate separately if needed
});

/**
 * Schema for complete assessment response
 */
export const CompleteAssessmentResponseSchema = z.object({
  session_id: z.string().uuid(),
  status: z.literal('completed'),
  redirect_url: z.string().url(),
});

// =====================================================
// SCORING INPUT SCHEMA
// =====================================================

/**
 * Schema for scoring service input
 */
export const ScoringInputSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  answers: AnswersRecordSchema,
});

// =====================================================
// CLAUDE RESPONSE SCHEMA
// =====================================================

/**
 * Schema for Claude's scoring response
 */
export const ClaudeScoringResponseSchema = z.object({
  dimensions: AssessmentDimensionsSchema,
  personality_profile: PersonalityProfileSchema,
  ai_orchestration_scores: AIOrchestrationScoresSchema,
  archetype: z.string().min(3).max(50),
  archetype_confidence: ArchetypeConfidenceSchema,
  tier: AssessmentTierSchema,
  flags: AssessmentFlagsSchema,
  recommendation: z.string().min(10).max(500),
  best_fit_roles: z.array(z.string()).min(3).max(5),
  public_summary: z.string().min(50).max(1000),
  detailed_summary: z.string().min(100).max(5000),
});

// =====================================================
// TYPE EXPORTS (INFERRED FROM SCHEMAS)
// =====================================================

export type AssessmentDimensions = z.infer<typeof AssessmentDimensionsSchema>;
export type PersonalityProfile = z.infer<typeof PersonalityProfileSchema>;
export type AIOrchestrationScores = z.infer<typeof AIOrchestrationScoresSchema>;
export type CategoryScores = z.infer<typeof CategoryScoresSchema>;
export type AssessmentFlags = z.infer<typeof AssessmentFlagsSchema>;
export type AssessmentTier = z.infer<typeof AssessmentTierSchema>;
export type ArchetypeConfidence = z.infer<typeof ArchetypeConfidenceSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type AssessmentResults = z.infer<typeof AssessmentResultsSchema>;
export type AssessmentAnswer = z.infer<typeof AssessmentAnswerSchema>;
export type AnswersRecord = z.infer<typeof AnswersRecordSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type AssessmentSession = z.infer<typeof AssessmentSessionSchema>;
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>;
export type StartAssessmentResponse = z.infer<typeof StartAssessmentResponseSchema>;
export type CompleteAssessmentResponse = z.infer<typeof CompleteAssessmentResponseSchema>;
export type ScoringInput = z.infer<typeof ScoringInputSchema>;
export type ClaudeScoringResponse = z.infer<typeof ClaudeScoringResponseSchema>;
