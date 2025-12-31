/**
 * Human OS Aliases - Pattern Resolver
 *
 * Matches natural language requests to alias patterns,
 * extracting variables and ranking matches.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Layer } from '@human-os/core'
import type {
  Alias,
  AliasMatchResult,
  ResolverConfig,
  CreateAliasInput,
} from './types.js'

/** Schema where aliases tables and functions live */
const ALIASES_SCHEMA = 'human_os'

/**
 * AliasResolver handles pattern matching for natural language commands
 */
export class AliasResolver {
  private supabase: SupabaseClient
  private config: ResolverConfig

  constructor(config: ResolverConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  /**
   * Get schema-specific query builder
   */
  private schema() {
    return this.supabase.schema(ALIASES_SCHEMA)
  }

  /**
   * Find the best matching alias for a natural language request
   */
  async resolve(
    request: string,
    layer?: Layer,
    context?: string[]
  ): Promise<AliasMatchResult | null> {
    const effectiveLayer = layer ?? this.config.defaultLayer

    // 1. Try exact pattern match first
    const exactMatch = await this.findExactMatch(request, effectiveLayer, context)
    if (exactMatch) {
      return exactMatch
    }

    // 2. Try fuzzy text search
    const fuzzyMatch = await this.findFuzzyMatch(request, effectiveLayer, context)
    if (fuzzyMatch) {
      return fuzzyMatch
    }

    // 3. Try semantic search if enabled
    if (this.config.enableSemanticFallback && this.config.generateEmbedding) {
      const semanticMatch = await this.findSemanticMatch(request, effectiveLayer)
      if (semanticMatch) {
        return semanticMatch
      }
    }

    return null
  }

  /**
   * Extract variables from a request given a pattern
   */
  extractVariables(request: string, pattern: string): Record<string, string> | null {
    const vars: Record<string, string> = {}

    // Build regex from pattern: {varName} -> named capture group
    const varNames: string[] = []
    const regexStr = pattern.replace(/\{(\w+)\}/g, (_, varName) => {
      varNames.push(varName)
      // Match non-greedy to handle multiple variables
      return '(.+?)'
    })

    // Make it match the full string
    const regex = new RegExp(`^${regexStr}$`, 'i')
    const match = request.match(regex)

    if (!match) {
      return null
    }

    // Extract captured groups
    for (let i = 0; i < varNames.length; i++) {
      const varName = varNames[i]
      const value = match[i + 1]
      if (varName && value) {
        vars[varName] = value.trim()
      }
    }

    return vars
  }

  /**
   * List all available aliases for a layer
   */
  async listAliases(
    layer?: Layer,
    includeDescriptions = true
  ): Promise<Array<{ pattern: string; description?: string; mode?: string; usageCount: number }>> {
    const effectiveLayer = layer ?? this.config.defaultLayer

    const { data, error } = await this.schema().rpc('list_aliases', {
      p_layer: effectiveLayer,
      p_include_descriptions: includeDescriptions,
    })

    if (error) {
      throw new Error(`Failed to list aliases: ${error.message}`)
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      pattern: row.pattern as string,
      description: row.description as string | undefined,
      mode: row.mode as string | undefined,
      usageCount: row.usage_count as number,
    }))
  }

  /**
   * Create a new alias
   */
  async createAlias(input: CreateAliasInput): Promise<Alias> {
    const embedding = this.config.generateEmbedding
      ? await this.config.generateEmbedding(input.pattern)
      : null

    const { data, error } = await this.schema()
      .from('aliases')
      .insert({
        pattern: input.pattern,
        description: input.description,
        layer: input.layer ?? this.config.defaultLayer,
        context: input.context ?? [],
        mode: input.mode,
        tools_required: input.toolsRequired,
        actions: input.actions,
        priority: input.priority ?? 100,
        pattern_embedding: embedding,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create alias: ${error.message}`)
    }

    return this.mapDbRowToAlias(data)
  }

  /**
   * Get an alias by ID
   */
  async getAlias(id: string): Promise<Alias | null> {
    const { data, error } = await this.schema()
      .from('aliases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get alias: ${error.message}`)
    }

    return this.mapDbRowToAlias(data)
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async findExactMatch(
    request: string,
    layer: Layer,
    context?: string[]
  ): Promise<AliasMatchResult | null> {
    const { data, error } = await this.schema().rpc('find_alias', {
      p_request: request,
      p_layer: layer,
      p_context: context ?? [],
    })

    if (error) {
      throw new Error(`Failed to find alias: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0] as Record<string, unknown>
    if (row.match_type !== 'exact') {
      return null
    }

    const alias = this.mapRpcRowToAlias(row)
    const extractedVars = this.extractVariables(request, alias.pattern) ?? {}

    return {
      alias,
      matchType: 'exact',
      extractedVars,
      confidence: 1.0,
    }
  }

  private async findFuzzyMatch(
    request: string,
    layer: Layer,
    context?: string[]
  ): Promise<AliasMatchResult | null> {
    const { data, error } = await this.schema().rpc('find_alias', {
      p_request: request,
      p_layer: layer,
      p_context: context ?? [],
    })

    if (error) {
      throw new Error(`Failed to find alias: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0] as Record<string, unknown>
    if (row.match_type !== 'fuzzy') {
      return null
    }

    const alias = this.mapRpcRowToAlias(row)
    const extractedVars = this.extractVariables(request, alias.pattern) ?? {}

    return {
      alias,
      matchType: 'fuzzy',
      extractedVars,
      confidence: 0.8, // Fuzzy matches have lower confidence
    }
  }

  private async findSemanticMatch(
    request: string,
    layer: Layer
  ): Promise<AliasMatchResult | null> {
    if (!this.config.generateEmbedding) {
      return null
    }

    const embedding = await this.config.generateEmbedding(request)

    const { data, error } = await this.schema().rpc('find_alias_semantic', {
      p_embedding: embedding,
      p_layer: layer,
      p_threshold: this.config.semanticThreshold,
      p_limit: 1,
    })

    if (error) {
      throw new Error(`Failed to find semantic match: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0] as Record<string, unknown>
    const alias = this.mapRpcRowToAlias(row)
    const extractedVars = this.extractVariables(request, alias.pattern) ?? {}

    return {
      alias,
      matchType: 'semantic',
      extractedVars,
      confidence: row.similarity as number,
    }
  }

  private mapDbRowToAlias(row: Record<string, unknown>): Alias {
    return {
      id: row.id as string,
      pattern: row.pattern as string,
      description: row.description as string,
      layer: row.layer as Layer,
      context: (row.context as string[]) ?? [],
      mode: row.mode as 'tactical' | 'strategic' | undefined,
      toolsRequired: (row.tools_required as string[]) ?? [],
      actions: row.actions as Alias['actions'],
      priority: row.priority as number,
      enabled: row.enabled as boolean,
      usageCount: row.usage_count as number,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : undefined,
      patternEmbedding: row.pattern_embedding as number[] | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }

  private mapRpcRowToAlias(row: Record<string, unknown>): Alias {
    return {
      id: row.id as string,
      pattern: row.pattern as string,
      description: row.description as string,
      layer: 'public' as Layer, // RPC doesn't return layer
      context: [],
      mode: row.mode as 'tactical' | 'strategic' | undefined,
      toolsRequired: (row.tools_required as string[]) ?? [],
      actions: row.actions as Alias['actions'],
      priority: 100,
      enabled: true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

/**
 * Parse a pattern into its components
 */
export function parsePattern(pattern: string): {
  staticParts: string[]
  variables: string[]
} {
  const staticParts: string[] = []
  const variables: string[] = []

  let lastIndex = 0
  const regex = /\{(\w+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(pattern)) !== null) {
    // Add static part before this variable
    if (match.index > lastIndex) {
      staticParts.push(pattern.slice(lastIndex, match.index))
    }

    // Add variable name
    variables.push(match[1]!)
    lastIndex = match.index + match[0].length
  }

  // Add remaining static part
  if (lastIndex < pattern.length) {
    staticParts.push(pattern.slice(lastIndex))
  }

  return { staticParts, variables }
}

/**
 * Build a regex from a pattern for matching
 */
export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const withCaptures = escaped.replace(/\\\{(\w+)\\\}/g, '(.+?)')
  return new RegExp(`^${withCaptures}$`, 'i')
}
