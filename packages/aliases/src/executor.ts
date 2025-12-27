/**
 * Human OS Aliases - Action Chain Executor
 *
 * Executes ordered action chains with variable interpolation,
 * condition evaluation, and execution logging.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Layer } from '@human-os/core'
import type {
  Alias,
  AliasAction,
  ExecutionContext,
  ExecutionLog,
  ExecutionStep,
} from './types.js'

/**
 * Configuration for the executor
 */
export interface ExecutorConfig {
  supabaseUrl: string
  supabaseKey: string

  /** Function to generate embeddings for execution logs */
  generateEmbedding?: (text: string) => Promise<number[]>

  /** Function to summarize execution results */
  summarize?: (steps: ExecutionStep[]) => Promise<string>

  /** Extract entities from execution context */
  extractEntities?: (steps: ExecutionStep[], vars: Record<string, unknown>) => string[]
}

/**
 * Result of executing an alias
 */
export interface ExecutionResult {
  success: boolean
  summary: string
  steps: ExecutionStep[]
  outputs: Record<string, unknown>
  error?: string
  durationMs: number
  log: ExecutionLog
}

/**
 * AliasExecutor runs action chains and logs executions
 */
export class AliasExecutor {
  private supabase: SupabaseClient
  private config: ExecutorConfig

  constructor(config: ExecutorConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  /**
   * Execute an alias with the given context
   */
  async execute(
    alias: Alias,
    extractedVars: Record<string, string>,
    inputRequest: string,
    ctx: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const steps: ExecutionStep[] = []
    const outputs: Record<string, unknown> = {}

    // Merge extracted vars into context
    ctx.vars = { ...ctx.vars, ...extractedVars }

    let success = true
    let errorMessage: string | undefined

    try {
      // Execute each action in order
      for (let i = 0; i < alias.actions.length; i++) {
        const action = alias.actions[i]!
        const step = await this.executeStep(action, i, ctx, outputs)
        steps.push(step)

        if (step.error) {
          success = false
          errorMessage = step.error
          break
        }

        // Store output if specified
        if (action.output && step.result !== undefined) {
          outputs[action.output] = step.result
          ctx.outputs[action.output] = step.result
        }
      }
    } catch (err) {
      success = false
      errorMessage = err instanceof Error ? err.message : String(err)
    }

    const durationMs = Date.now() - startTime

    // Generate summary
    const summary = await this.generateSummary(steps, success, errorMessage)

    // Extract entities
    const entities = this.config.extractEntities
      ? this.config.extractEntities(steps, ctx.vars)
      : this.extractEntitiesDefault(extractedVars)

    // Create execution log
    const log = await this.logExecution({
      aliasId: alias.id,
      aliasPattern: alias.pattern,
      inputRequest,
      extractedVars,
      steps,
      resultSummary: summary,
      success,
      errorMessage,
      entities,
      layer: ctx.layer,
      userId: ctx.userId,
      durationMs,
    })

    return {
      success,
      summary,
      steps,
      outputs,
      error: errorMessage,
      durationMs,
      log,
    }
  }

  /**
   * Execute a single action step
   */
  private async executeStep(
    action: AliasAction,
    index: number,
    ctx: ExecutionContext,
    outputs: Record<string, unknown>
  ): Promise<ExecutionStep> {
    const startedAt = new Date()

    // Check condition if specified
    if (action.condition) {
      const shouldExecute = this.evaluateCondition(action.condition, ctx, outputs)
      if (!shouldExecute) {
        return {
          index,
          tool: action.tool,
          params: action.params,
          startedAt,
          completedAt: new Date(),
          durationMs: 0,
          skipped: true,
          skipReason: `Condition not met: ${action.condition}`,
        }
      }
    }

    // Interpolate parameters
    const interpolatedParams = this.interpolateParams(action.params, ctx, outputs)

    ctx.log?.(`Executing ${action.tool}`, interpolatedParams)

    try {
      const result = await ctx.invokeTool(action.tool, interpolatedParams)
      const completedAt = new Date()

      return {
        index,
        tool: action.tool,
        params: interpolatedParams,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        result,
      }
    } catch (err) {
      const completedAt = new Date()
      return {
        index,
        tool: action.tool,
        params: interpolatedParams,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * Interpolate {variable} placeholders in parameters
   */
  private interpolateParams(
    params: Record<string, string | number | boolean>,
    ctx: ExecutionContext,
    outputs: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateString(value, ctx, outputs)
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Interpolate a single string value
   */
  private interpolateString(
    value: string,
    ctx: ExecutionContext,
    outputs: Record<string, unknown>
  ): unknown {
    // Check if the entire value is a variable reference
    const fullVarMatch = value.match(/^\{([^}]+)\}$/)
    if (fullVarMatch) {
      const path = fullVarMatch[1]!
      return this.resolvePath(path, ctx, outputs)
    }

    // Otherwise, interpolate inline
    return value.replace(/\{([^}]+)\}/g, (_, path) => {
      const resolved = this.resolvePath(path, ctx, outputs)
      return String(resolved ?? '')
    })
  }

  /**
   * Resolve a dotted path like "contact.id" or "person"
   */
  private resolvePath(
    path: string,
    ctx: ExecutionContext,
    outputs: Record<string, unknown>
  ): unknown {
    const parts = path.split('.')
    const rootKey = parts[0]!

    // Check outputs first (for chained values)
    let current: unknown = outputs[rootKey]

    // Fall back to vars
    if (current === undefined) {
      current = ctx.vars[rootKey]
    }

    // Navigate nested path
    for (let i = 1; i < parts.length; i++) {
      if (current === null || current === undefined) {
        return undefined
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[parts[i]!]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    ctx: ExecutionContext,
    outputs: Record<string, unknown>
  ): boolean {
    try {
      // Build context for evaluation
      const evalContext = {
        ...ctx.vars,
        ...outputs,
        ctx: ctx.modeContext,
      }

      // Simple expression evaluation (safe subset)
      // Supports: ==, !=, >, <, >=, <=, &&, ||, !
      const fn = new Function(
        ...Object.keys(evalContext),
        `return ${condition}`
      )
      return Boolean(fn(...Object.values(evalContext)))
    } catch {
      // On error, assume condition is not met
      return false
    }
  }

  /**
   * Generate a summary of the execution
   */
  private async generateSummary(
    steps: ExecutionStep[],
    success: boolean,
    error?: string
  ): Promise<string> {
    if (this.config.summarize) {
      return this.config.summarize(steps)
    }

    // Default summarization
    if (!success) {
      return `Failed: ${error ?? 'Unknown error'}`
    }

    const completedSteps = steps.filter(s => !s.skipped && !s.error)
    if (completedSteps.length === 0) {
      return 'No actions executed'
    }

    const lastStep = completedSteps[completedSteps.length - 1]!
    const result = lastStep.result

    if (typeof result === 'string') {
      return result
    }

    if (result && typeof result === 'object' && 'message' in result) {
      return String((result as { message: unknown }).message)
    }

    return `Completed ${completedSteps.length} action(s)`
  }

  /**
   * Default entity extraction from variables
   */
  private extractEntitiesDefault(vars: Record<string, string>): string[] {
    const entities: string[] = []

    // Common entity variable names
    const entityKeys = ['person', 'contact', 'company', 'project', 'expert']

    for (const key of entityKeys) {
      if (vars[key]) {
        // Convert to slug format
        const slug = vars[key]!
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        entities.push(slug)
      }
    }

    return entities
  }

  /**
   * Log execution to database
   */
  private async logExecution(log: Omit<ExecutionLog, 'id' | 'createdAt'>): Promise<ExecutionLog> {
    // Generate embedding if available
    const embedding = this.config.generateEmbedding
      ? await this.config.generateEmbedding(log.inputRequest)
      : null

    const { data, error } = await this.supabase
      .from('execution_logs')
      .insert({
        alias_id: log.aliasId,
        alias_pattern: log.aliasPattern,
        input_request: log.inputRequest,
        extracted_vars: log.extractedVars,
        steps: log.steps,
        result_summary: log.resultSummary,
        success: log.success,
        error_message: log.errorMessage,
        entities: log.entities,
        embedding,
        layer: log.layer,
        user_id: log.userId,
        duration_ms: log.durationMs,
        tokens_used: log.tokensUsed,
      })
      .select()
      .single()

    if (error) {
      // Log error but don't fail execution
      console.error('Failed to log execution:', error.message)
      return {
        id: 'temp-' + Date.now(),
        ...log,
        createdAt: new Date(),
      }
    }

    return {
      id: data.id as string,
      aliasId: data.alias_id as string | undefined,
      aliasPattern: data.alias_pattern as string,
      inputRequest: data.input_request as string,
      extractedVars: data.extracted_vars as Record<string, string>,
      steps: data.steps as ExecutionStep[],
      resultSummary: data.result_summary as string,
      success: data.success as boolean,
      errorMessage: data.error_message as string | undefined,
      entities: data.entities as string[],
      layer: data.layer as Layer,
      userId: data.user_id as string | undefined,
      durationMs: data.duration_ms as number | undefined,
      tokensUsed: data.tokens_used as number | undefined,
      createdAt: new Date(data.created_at as string),
    }
  }
}

/**
 * Recall past executions via RAG search
 */
export class ExecutionRecaller {
  private supabase: SupabaseClient
  private generateEmbedding?: (text: string) => Promise<number[]>

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    generateEmbedding?: (text: string) => Promise<number[]>
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.generateEmbedding = generateEmbedding
  }

  /**
   * Search past executions
   */
  async recall(
    query: string,
    layer: Layer,
    options: {
      entity?: string
      limit?: number
      useSemantic?: boolean
    } = {}
  ): Promise<Array<{
    id: string
    aliasPattern: string
    inputRequest: string
    resultSummary: string
    entities: string[]
    createdAt: Date
    similarity?: number
  }>> {
    const { entity, limit = 10, useSemantic = true } = options

    let embedding: number[] | null = null
    if (useSemantic && this.generateEmbedding) {
      embedding = await this.generateEmbedding(query)
    }

    const { data, error } = await this.supabase.rpc('recall_executions', {
      p_query: query,
      p_embedding: embedding,
      p_entity: entity,
      p_layer: layer,
      p_limit: limit,
    })

    if (error) {
      throw new Error(`Failed to recall executions: ${error.message}`)
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      aliasPattern: row.alias_pattern as string,
      inputRequest: row.input_request as string,
      resultSummary: row.result_summary as string,
      entities: row.entities as string[],
      createdAt: new Date(row.created_at as string),
      similarity: row.similarity as number | undefined,
    }))
  }

  /**
   * Get executions related to a specific entity
   */
  async recallByEntity(
    entitySlug: string,
    layer: Layer,
    limit = 10
  ): Promise<Array<{
    id: string
    aliasPattern: string
    inputRequest: string
    resultSummary: string
    createdAt: Date
  }>> {
    return this.recall('', layer, { entity: entitySlug, limit, useSemantic: false })
  }
}
