/**
 * Human OS Skills Package - Type Definitions
 *
 * PowerPak skills engine: SKILL.md parsing, indexing, and search.
 * Implements the "expertise as a service" pattern.
 */

import { z } from 'zod'
import type { Layer } from '@human-os/core'

// =============================================================================
// SKILL.MD STRUCTURE
// =============================================================================

/**
 * SKILL.md frontmatter metadata
 */
export interface SkillFrontmatter {
  name: string                      // Display name of the skill
  slug: string                      // URL-friendly identifier
  version: string                   // Semantic version
  tier?: 'free' | 'pro' | 'enterprise'  // Access tier
  author?: string                   // Entity slug of the author
  tags?: string[]                   // Categorization tags
  description?: string              // Short description
  requires?: string[]               // Required tool/capability dependencies
}

export const SkillFrontmatterSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().default('1.0.0'),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  requires: z.array(z.string()).default([]),
})

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * JSON Schema for tool parameters
 */
export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  required?: boolean
  default?: unknown
  enum?: unknown[]
}

/**
 * A tool defined in a SKILL.md file
 */
export interface SkillTool {
  id?: string
  name: string
  description: string
  parameters: ToolParameter[]
  returns?: string
  examples?: string[]
}

export const SkillToolSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
    enum: z.array(z.unknown()).optional(),
  })),
  returns: z.string().optional(),
  examples: z.array(z.string()).optional(),
})

// =============================================================================
// PROGRAM DEFINITIONS
// =============================================================================

/**
 * A step in a program workflow
 */
export interface ProgramStep {
  name: string
  tool: string                      // Tool to invoke
  params?: Record<string, unknown>  // Parameters with variable interpolation
  output?: string                   // Variable name to store result
  condition?: string                // Optional guard condition
}

/**
 * A program (multi-step workflow) defined in a SKILL.md file
 */
export interface SkillProgram {
  id?: string
  name: string
  description: string
  steps: ProgramStep[]
  input?: ToolParameter[]           // Program input parameters
  output?: string                   // What the program produces
}

export const SkillProgramSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string(),
  steps: z.array(z.object({
    name: z.string(),
    tool: z.string(),
    params: z.record(z.unknown()).optional(),
    output: z.string().optional(),
    condition: z.string().optional(),
  })),
  input: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    required: z.boolean().optional(),
  })).optional(),
  output: z.string().optional(),
})

// =============================================================================
// SKILL FILE
// =============================================================================

/**
 * A parsed SKILL.md file
 */
export interface SkillFile {
  id: string
  frontmatter: SkillFrontmatter
  content: string                   // Full markdown content
  tools: SkillTool[]
  programs: SkillProgram[]
  layer: Layer
  entityId?: string                 // Associated entity (author/owner)
  createdAt: Date
  updatedAt: Date
}

export const SkillFileSchema = z.object({
  id: z.string().uuid(),
  frontmatter: SkillFrontmatterSchema,
  content: z.string(),
  tools: z.array(SkillToolSchema),
  programs: z.array(SkillProgramSchema),
  layer: z.string() as z.ZodType<Layer>,
  entityId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// =============================================================================
// SEARCH TYPES
// =============================================================================

/**
 * Search result for skill/tool queries
 */
export interface SkillSearchResult {
  skillFile: {
    id: string
    name: string
    slug: string
    tier: string
    author?: string
  }
  tool?: SkillTool
  program?: SkillProgram
  relevanceScore: number
}

/**
 * Search options
 */
export interface SkillSearchOptions {
  query: string
  layer?: Layer
  tier?: 'free' | 'pro' | 'enterprise'
  tags?: string[]
  limit?: number
  searchType?: 'all' | 'tools' | 'programs'
}

// =============================================================================
// CONFIG
// =============================================================================

export interface SkillsConfig {
  supabaseUrl: string
  supabaseKey: string
  defaultLayer: Layer
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateSkillFileInput {
  content: string                   // Full SKILL.md content with frontmatter
  layer?: Layer
  entityId?: string
}

export interface ParsedSkillFile {
  frontmatter: SkillFrontmatter
  content: string
  tools: SkillTool[]
  programs: SkillProgram[]
}
