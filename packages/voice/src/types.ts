/**
 * Human OS VoiceOS - Type Definitions
 *
 * Voice profile synthesis system based on the "10 Commandments" architecture.
 * Enables AI content generation that authentically captures a person's voice.
 */

import { z } from 'zod'
import type { Layer } from '@human-os/core'

// =============================================================================
// COMMANDMENT TYPES
// =============================================================================

/**
 * The 10 Commandment types that define a complete voice profile.
 * Each commandment serves a specific purpose in voice synthesis.
 */
export const CommandmentTypes = {
  THEMES: 'THEMES',           // Core topics and beliefs
  VOICE: 'VOICE',             // Speech patterns, sentence structure, vocabulary
  GUARDRAILS: 'GUARDRAILS',   // Hard limits, never-say rules
  STORIES: 'STORIES',         // Extended narratives and case studies
  ANECDOTES: 'ANECDOTES',     // Short memorable examples
  OPENINGS: 'OPENINGS',       // How to start content
  MIDDLES: 'MIDDLES',         // How to structure arguments
  ENDINGS: 'ENDINGS',         // How to close and CTA patterns
  BLENDS: 'BLENDS',           // Content archetypes and templates
  EXAMPLES: 'EXAMPLES',       // Reference outputs for calibration
} as const

export type CommandmentType = typeof CommandmentTypes[keyof typeof CommandmentTypes]

export const CommandmentTypeSchema = z.enum([
  'THEMES',
  'VOICE',
  'GUARDRAILS',
  'STORIES',
  'ANECDOTES',
  'OPENINGS',
  'MIDDLES',
  'ENDINGS',
  'BLENDS',
  'EXAMPLES',
])

// =============================================================================
// COMMANDMENT FILE STRUCTURE
// =============================================================================

/**
 * Frontmatter metadata for commandment files
 */
export interface CommandmentFrontmatter {
  title: string
  entity: string           // Entity slug (e.g., "scott-leese", "justin")
  version: string          // e.g., "1.0", "1.1"
  created: string          // ISO date
  revised?: string         // ISO date, added on revision
}

export const CommandmentFrontmatterSchema = z.object({
  title: z.string(),
  entity: z.string(),
  version: z.string().default('1.0'),
  created: z.string(),
  revised: z.string().optional(),
})

/**
 * A single commandment file with parsed content
 */
export interface Commandment {
  id: string
  profileId: string
  type: CommandmentType
  frontmatter: CommandmentFrontmatter
  content: string          // Full markdown content (excluding frontmatter)
  version: string
  createdAt: Date
  updatedAt: Date
}

export const CommandmentSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  type: CommandmentTypeSchema,
  frontmatter: CommandmentFrontmatterSchema,
  content: z.string(),
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// =============================================================================
// VOICE PROFILE
// =============================================================================

/**
 * A complete voice profile containing all 10 commandments
 */
export interface VoiceProfile {
  id: string
  entitySlug: string       // e.g., "scott-leese", "justin"
  displayName: string      // e.g., "Scott Leese"
  layer: Layer             // Privacy scope
  description?: string     // Brief bio or context

  /** Source hierarchy weights for synthesis */
  sourceHierarchy?: {
    primary: string[]      // e.g., ["2024-2025"]
    secondary: string[]    // e.g., ["2021-2023"]
    historical: string[]   // e.g., ["2019-2020"]
  }

  /** Synthesis status */
  completeness: number     // 0-100, percentage of commandments present

  createdAt: Date
  updatedAt: Date
}

export const VoiceProfileSchema = z.object({
  id: z.string().uuid(),
  entitySlug: z.string().min(1),
  displayName: z.string().min(1),
  layer: z.string() as z.ZodType<Layer>,
  description: z.string().optional(),
  sourceHierarchy: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
    historical: z.array(z.string()),
  }).optional(),
  completeness: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// =============================================================================
// VOICE PATTERNS (from VOICE.md)
// =============================================================================

/**
 * Voice patterns extracted from VOICE.md
 * These define the mechanics of how someone speaks/writes
 */
export interface VoicePattern {
  name: string
  description: string
  examples: string[]
  frequency: string        // e.g., "10+ examples per post"
}

export interface VoiceAntiPattern {
  name: string
  description: string
  wrongExample?: string
  rightExample?: string
}

export interface SignaturePhrase {
  phrase: string
  frequency?: string
  context: string
}

export interface VoicePatterns {
  always: VoicePattern[]
  never: VoiceAntiPattern[]
  signaturePhrases: {
    timeless: SignaturePhrase[]
    currentEra: SignaturePhrase[]
    emphaticDismissals: SignaturePhrase[]
  }
  vocabularyFingerprint: {
    industryJargon: string[]
    registerShifts: {
      high: string[]
      low: string[]
      pattern: string
    }
    overusedWords: string[]
    structuralPatterns: string[]
    popCultureRefs: string[]
  }
  rhythm: {
    sentenceLengthPattern: string
    paragraphStructure: Record<string, string>
    buildToMicDrop: string
    alternatingModes: string[]
  }
  punctuation: Record<string, {
    description: string
    frequency: string
    examples: string[]
  }>
  tensions: Array<{
    name: string
    description: string
    rule: string
  }>
}

// =============================================================================
// GENERATION CONTEXT
// =============================================================================

/**
 * Context passed to content generation
 */
export interface GenerationContext {
  /** Voice profile to use */
  profileId: string

  /** Content type being generated */
  contentType: 'linkedin_post' | 'newsletter' | 'email' | 'connection_message' | 'generic'

  /** Target length */
  length?: 'short' | 'medium' | 'long'

  /** Topic or subject */
  topic?: string

  /** Any specific themes to emphasize */
  themes?: string[]

  /** Audience context */
  audience?: string

  /** Previous content for context */
  previousContent?: string[]
}

// =============================================================================
// GENERATION RESULT
// =============================================================================

/**
 * Result of content generation
 */
export interface GenerationResult {
  content: string
  voiceProfileUsed: string
  commandmentsUsed: CommandmentType[]
  confidenceScore: number   // 0-100, how well it matches voice
  suggestions?: string[]    // Ways to improve authenticity
}

// =============================================================================
// PROFILE CONFIG
// =============================================================================

/**
 * Configuration for voice profile operations
 */
export interface VoiceConfig {
  supabaseUrl: string
  supabaseKey: string
  defaultLayer: Layer
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input for creating a voice profile
 */
export interface CreateVoiceProfileInput {
  entitySlug: string
  displayName: string
  layer?: Layer
  description?: string
}

/**
 * Input for creating/updating a commandment
 */
export interface UpsertCommandmentInput {
  profileId: string
  type: CommandmentType
  content: string
  version?: string
}

/**
 * Parsed commandment file input
 */
export interface ParsedCommandmentFile {
  frontmatter: CommandmentFrontmatter
  content: string
}
