/**
 * Human OS Aliases - Type Definitions
 *
 * Natural language command routing system.
 * "User vocabulary as the API"
 */

import { z } from 'zod'
import type { Layer } from '@human-os/core'

// =============================================================================
// EXECUTION MODE
// =============================================================================

/**
 * Execution modes for alias actions
 * - tactical: Deterministic, button-style interactions
 * - strategic: Exploratory, multi-turn conversations
 */
export type ExecutionMode = 'tactical' | 'strategic'

// =============================================================================
// ALIAS ACTION
// =============================================================================

/**
 * A single action in an alias action chain
 */
export interface AliasAction {
  /** Tool identifier to invoke */
  tool: string

  /** Parameters with {variable} interpolation support */
  params: Record<string, string | number | boolean>

  /** Variable name to store output for chaining */
  output?: string

  /** Optional condition for execution (JS expression) */
  condition?: string
}

export const AliasActionSchema = z.object({
  tool: z.string(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])),
  output: z.string().optional(),
  condition: z.string().optional(),
})

// =============================================================================
// ALIAS
// =============================================================================

/**
 * An alias maps natural language patterns to tool chains
 */
export interface Alias {
  id: string

  /** Pattern with {variable} placeholders, e.g., "tie a string to {person} {timing}" */
  pattern: string

  /** Human-readable description */
  description: string

  /** Privacy layer scope */
  layer: Layer

  /** Contextual availability (modes, states) */
  context: string[]

  /** Preferred execution mode */
  mode?: ExecutionMode

  /** Tools needed for lazy-loading */
  toolsRequired: string[]

  /** Ordered list of actions to execute */
  actions: AliasAction[]

  /** Lower = higher priority for pattern conflicts */
  priority: number

  /** Whether this alias is active */
  enabled: boolean

  /** Usage statistics */
  usageCount: number
  lastUsedAt?: Date

  /** Embedding for semantic fallback */
  patternEmbedding?: number[]

  createdAt: Date
  updatedAt: Date
}

export const AliasSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string().min(1),
  description: z.string(),
  layer: z.string() as z.ZodType<Layer>,
  context: z.array(z.string()).default([]),
  mode: z.enum(['tactical', 'strategic']).optional(),
  toolsRequired: z.array(z.string()).default([]),
  actions: z.array(AliasActionSchema),
  priority: z.number().int().default(100),
  enabled: z.boolean().default(true),
  usageCount: z.number().int().default(0),
  lastUsedAt: z.date().optional(),
  patternEmbedding: z.array(z.number()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// =============================================================================
// ALIAS MATCH RESULT
// =============================================================================

/**
 * Result of matching a request to an alias
 */
export interface AliasMatchResult {
  alias: Alias
  matchType: 'exact' | 'fuzzy' | 'semantic'
  extractedVars: Record<string, string>
  confidence: number
}

// =============================================================================
// EXECUTION STEP
// =============================================================================

/**
 * A single step in an execution trace
 */
export interface ExecutionStep {
  index: number
  tool: string
  params: Record<string, unknown>
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  result?: unknown
  error?: string
  skipped?: boolean
  skipReason?: string
}

// =============================================================================
// EXECUTION LOG
// =============================================================================

/**
 * Full execution trace stored for RAG recall
 */
export interface ExecutionLog {
  id: string

  /** Reference to the alias used */
  aliasId?: string
  aliasPattern: string

  /** Original user input */
  inputRequest: string

  /** Variables extracted from pattern */
  extractedVars: Record<string, string>

  /** Full step-by-step trace */
  steps: ExecutionStep[]

  /** Compressed result returned to main agent */
  resultSummary: string

  /** Success indicator */
  success: boolean
  errorMessage?: string

  /** Entity slugs for relationship queries */
  entities: string[]

  /** Embedding for semantic search */
  embedding?: number[]

  /** Privacy scope */
  layer: Layer
  userId?: string

  /** Performance metrics */
  durationMs?: number
  tokensUsed?: number

  createdAt: Date
}

export const ExecutionLogSchema = z.object({
  id: z.string().uuid(),
  aliasId: z.string().uuid().optional(),
  aliasPattern: z.string(),
  inputRequest: z.string(),
  extractedVars: z.record(z.string()),
  steps: z.array(z.object({
    index: z.number(),
    tool: z.string(),
    params: z.record(z.unknown()),
    startedAt: z.date(),
    completedAt: z.date().optional(),
    durationMs: z.number().optional(),
    result: z.unknown().optional(),
    error: z.string().optional(),
    skipped: z.boolean().optional(),
    skipReason: z.string().optional(),
  })),
  resultSummary: z.string(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  entities: z.array(z.string()),
  embedding: z.array(z.number()).optional(),
  layer: z.string() as z.ZodType<Layer>,
  userId: z.string().optional(),
  durationMs: z.number().optional(),
  tokensUsed: z.number().optional(),
  createdAt: z.date(),
})

// =============================================================================
// EXECUTION CONTEXT
// =============================================================================

/**
 * Resolved entity from semantic entity resolution
 */
export interface ResolvedEntityInfo {
  id: string
  slug: string
  name: string
  type: string
}

/**
 * Context passed to the executor
 */
export interface ExecutionContext {
  /** Layer for privacy scoping */
  layer: Layer

  /** User ID */
  userId?: string

  /** Current execution mode context */
  modeContext?: string[]

  /** Variables from pattern extraction */
  vars: Record<string, unknown>

  /** Accumulated outputs from previous steps */
  outputs: Record<string, unknown>

  /**
   * Resolved entities from semantic entity resolution (pre-processing)
   * Maps mention text (lowercase) to resolved entity info
   */
  resolvedEntities?: {
    /** Entity lookup map: mention -> entity info */
    entities: Record<string, ResolvedEntityInfo>
    /** Formatted context string for system prompt injection */
    systemContext: string
    /** Whether the query can traverse outside HumanOS network */
    canTraverseNetwork: boolean
  }

  /** Tool invoker function */
  invokeTool: (name: string, params: Record<string, unknown>) => Promise<unknown>

  /** Optional logger */
  log?: (message: string, data?: unknown) => void
}

// =============================================================================
// RESOLVER CONFIG
// =============================================================================

/**
 * Configuration for the alias resolver
 */
export interface ResolverConfig {
  /** Supabase client for database queries */
  supabaseUrl: string
  supabaseKey: string

  /** Default layer for queries */
  defaultLayer: Layer

  /** Whether to use semantic fallback */
  enableSemanticFallback: boolean

  /** Threshold for semantic matching (0-1) */
  semanticThreshold: number

  /** Function to generate embeddings */
  generateEmbedding?: (text: string) => Promise<number[]>
}

// =============================================================================
// CREATE ALIAS INPUT
// =============================================================================

/**
 * Input for creating a new alias
 */
export interface CreateAliasInput {
  pattern: string
  description: string
  layer?: Layer
  context?: string[]
  mode?: ExecutionMode
  toolsRequired: string[]
  actions: AliasAction[]
  priority?: number
}
