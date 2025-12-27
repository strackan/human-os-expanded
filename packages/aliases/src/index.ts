/**
 * @human-os/aliases
 *
 * Natural language command routing for Human OS.
 * "User vocabulary as the API"
 *
 * @example
 * ```typescript
 * import { AliasResolver, AliasExecutor } from '@human-os/aliases'
 *
 * const resolver = new AliasResolver({
 *   supabaseUrl: process.env.SUPABASE_URL!,
 *   supabaseKey: process.env.SUPABASE_KEY!,
 *   defaultLayer: 'founder:justin',
 *   enableSemanticFallback: true,
 *   semanticThreshold: 0.7,
 * })
 *
 * const match = await resolver.resolve('tie a string to Grace after Q1')
 * if (match) {
 *   const executor = new AliasExecutor({ ... })
 *   const result = await executor.execute(match.alias, match.extractedVars, ...)
 *   console.log(result.summary)
 * }
 * ```
 */

// Types
export type {
  ExecutionMode,
  AliasAction,
  Alias,
  AliasMatchResult,
  ExecutionStep,
  ExecutionLog,
  ExecutionContext,
  ResolverConfig,
  CreateAliasInput,
} from './types.js'

// Schemas (for validation)
export {
  AliasActionSchema,
  AliasSchema,
  ExecutionLogSchema,
} from './types.js'

// Resolver
export {
  AliasResolver,
  parsePattern,
  patternToRegex,
} from './resolver.js'

// Executor
export {
  AliasExecutor,
  ExecutionRecaller,
  type ExecutorConfig,
  type ExecutionResult,
} from './executor.js'
