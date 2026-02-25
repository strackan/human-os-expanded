/**
 * Do Tool - Natural Language Command Router
 *
 * The meta-tool that routes natural language requests to aliases.
 * This is the primary entry point for the "user vocabulary as API" pattern.
 *
 * Key benefits:
 * - Reduces tool schema bloat (only 1 tool instead of 50)
 * - Executes action chains in isolated context
 * - Returns only summaries, not raw data
 * - Logs full traces for RAG recall
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext, ToolHandler } from '../lib/context.js';
import {
  AliasResolver,
  AliasExecutor,
  type ExecutionContext,
  type ResolverConfig,
  type ExecutorConfig,
} from '@human-os/aliases';
import {
  EntityResolver,
  buildInjectedContext,
  substituteEntityReferences,
  createCachedOpenAIProvider,
  type ResolvedContext,
  type InjectedContext,
} from '@human-os/entity-resolution';
import {
  ToolDiscoveryService,
  type ToolMatch,
} from '../lib/tool-discovery.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const doTools: Tool[] = [
  {
    name: 'do',
    description: `PREFERRED: Route all user requests through do() first. This reduces context bloat by returning concise summaries instead of raw data.

Handles natural language commands like:
- "check my os" / "what's urgent" / "my tasks" / "my projects"
- "who is {person}" / "my relationships" / "overdue contacts"
- "add task {title}" / "create project {name}" / "journal {content}"
- "define {term}" / "search {query}" / "find {query}"
- "I talked to {name}" / "remember {name} is {relationship}"
- "check in" / "gratitude" / "reflect" / "daily review"
- "code {task}" / "code status" / "queue {item}"
- "my priorities" / "my journal" / "my pipeline" / "my identity"
- "start session" / "load {mode} mode" / "what's on my plate"
- "what do I think about {person}" / "my transcripts" / "my deals"

Only call individual tools directly when do() returns no match or when you need specific parameters not expressible in natural language.`,
    inputSchema: {
      type: 'object',
      properties: {
        request: {
          type: 'string',
          description: 'What you want to do, in natural language',
        },
        context: {
          type: 'object',
          description: 'Optional additional context (current mode, entities in focus)',
          properties: {
            modes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Current active modes (crisis, voice, etc.)',
            },
            focusEntity: {
              type: 'string',
              description: 'Entity slug currently in focus',
            },
          },
        },
      },
      required: ['request'],
    },
  },
  {
    name: 'list_aliases',
    description: 'List all available alias patterns for natural language commands',
    inputSchema: {
      type: 'object',
      properties: {
        includeDescriptions: {
          type: 'boolean',
          description: 'Include descriptions (default: true)',
          default: true,
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle do tool calls
 */
export const handleDoTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> => {
  switch (name) {
    case 'do': {
      const request = args.request as string;
      const context = args.context as { modes?: string[]; focusEntity?: string } | undefined;
      return executeDoRequest(request, context, ctx);
    }

    case 'list_aliases': {
      const includeDescriptions = (args.includeDescriptions as boolean) ?? true;
      return listAvailableAliases(includeDescriptions, ctx);
    }

    default:
      return null;
  }
};

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Execute a natural language request via the alias system
 */
async function executeDoRequest(
  request: string,
  context: { modes?: string[]; focusEntity?: string } | undefined,
  ctx: ToolContext
): Promise<{
  success: boolean;
  summary: string;
  data?: unknown;
  matchedAlias?: string;
  matchType?: string;
  confidence?: number;
  error?: string;
  suggestions?: string[];
  suggestedTools?: ToolMatch[];
  resolvedEntities?: string[];
  clarificationNeeded?: boolean;
  clarificationPrompt?: string;
  canTraverseNetwork?: boolean;
}> {
  // ==========================================================================
  // STEP 1: Entity Resolution (pre-process before alias matching)
  // ==========================================================================

  // Create embedding provider (Tier 4) if OpenAI key available
  const openaiKey = process.env['OPENAI_API_KEY'];
  const embeddingProvider = openaiKey ? createCachedOpenAIProvider(openaiKey) : undefined;

  // Create entity resolver
  const entityResolver = new EntityResolver({
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    layer: ctx.layer,
    generateEmbedding: embeddingProvider
      ? (text) => embeddingProvider.generate(text)
      : undefined,
  });

  // Resolve entities in the request (tiered: glossary → exact → fuzzy → semantic)
  const resolvedContext = await entityResolver.resolve(request);
  const injectedContext = buildInjectedContext(resolvedContext);

  // Handle ambiguous entities - return clarification request
  if (injectedContext.clarificationNeeded && injectedContext.clarificationPrompt) {
    return {
      success: false,
      summary: injectedContext.clarificationPrompt,
      clarificationNeeded: true,
      clarificationPrompt: injectedContext.clarificationPrompt,
      canTraverseNetwork: injectedContext.canTraverseNetwork,
    };
  }

  // ==========================================================================
  // STEP 2: Alias Resolution
  // ==========================================================================

  // Initialize alias resolver
  const resolverConfig: ResolverConfig = {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    defaultLayer: ctx.layer,
    enableSemanticFallback: true,
    semanticThreshold: 0.7,
    generateEmbedding: embeddingProvider
      ? (text) => embeddingProvider.generate(text)
      : undefined,
  };

  const resolver = new AliasResolver(resolverConfig);

  // Try to match the request to an alias
  const match = await resolver.resolve(request, ctx.layer, context?.modes);

  if (!match) {
    // No match found
    // If network traversal is allowed (general knowledge query), indicate that
    if (injectedContext.canTraverseNetwork) {
      return {
        success: false,
        summary: `No matching alias found. This appears to be a general knowledge question that can be answered directly.`,
        canTraverseNetwork: true,
        resolvedEntities: Object.keys(injectedContext.entityMap),
      };
    }

    // ==========================================================================
    // STEP 2b: Semantic Tool Discovery (Tier 4 fallback)
    // ==========================================================================

    // Get all available tools for semantic search (bundle-aware)
    const allTools = getAllAvailableTools(ctx);
    const toolDiscovery = new ToolDiscoveryService(allTools, {
      generateEmbedding: embeddingProvider
        ? (text) => embeddingProvider.generate(text)
        : undefined,
    });

    // Search for relevant tools by intent
    const discoveryResult = await toolDiscovery.search(request, 5);

    if (discoveryResult.matches.length > 0) {
      // Found relevant tools - suggest them
      const topMatch = discoveryResult.matches[0]!;
      return {
        success: false,
        summary: `No alias found, but found ${discoveryResult.matches.length} relevant tool(s). ` +
          `Top match: "${topMatch.name}" (${(topMatch.confidence * 100).toFixed(0)}% confidence). ` +
          `${topMatch.reason}`,
        suggestedTools: discoveryResult.matches,
        error: 'No matching alias. Consider using one of the suggested tools directly, or use learn_alias to create an alias for this pattern.',
        resolvedEntities: Object.keys(injectedContext.entityMap),
        canTraverseNetwork: false,
      };
    }

    // No tools matched either - fall back to alias suggestions
    const aliases = await resolver.listAliases(ctx.layer, false);
    return {
      success: false,
      summary: `No matching alias or tool found for: "${request}"`,
      suggestions: aliases.slice(0, 5).map(a => a.pattern),
      error: 'No matching alias or tool. Try one of the suggested patterns or use learn_alias to create a new one.',
      resolvedEntities: Object.keys(injectedContext.entityMap),
      canTraverseNetwork: false,
    };
  }

  // ==========================================================================
  // STEP 3: Execute Alias with Resolved Entities
  // ==========================================================================

  // Initialize executor
  const executorConfig: ExecutorConfig = {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    generateEmbedding: embeddingProvider
      ? (text) => embeddingProvider.generate(text)
      : undefined,
    summarize: async (steps) => summarizeSteps(steps),
  };

  const executor = new AliasExecutor(executorConfig);

  // Build execution context with resolved entities
  const execCtx: ExecutionContext = {
    layer: ctx.layer,
    userId: ctx.userId,
    modeContext: context?.modes,
    vars: {},
    outputs: {},
    // Store resolved entities for reference in tool handlers
    resolvedEntities: {
      entities: injectedContext.entityMap,
      systemContext: injectedContext.systemContext,
      canTraverseNetwork: injectedContext.canTraverseNetwork,
    },
    invokeTool: async (toolName: string, params: Record<string, unknown>) => {
      // Substitute entity references in params with resolved IDs/slugs
      const enhancedParams = substituteEntityReferences(params, injectedContext.entityMap);
      // Route to existing tool handlers
      return invokeToolInternal(toolName, enhancedParams, ctx);
    },
    log: (message, data) => {
      console.error(`[do] ${message}`, data ? JSON.stringify(data) : '');
    },
  };

  // Execute the alias
  const result = await executor.execute(match.alias, match.extractedVars, request, execCtx);

  // Extract the actual data from the last completed step
  const completedSteps = result.steps.filter(s => !s.skipped && !s.error);
  const lastResult = completedSteps.length > 0
    ? completedSteps[completedSteps.length - 1]!.result
    : undefined;

  return {
    success: result.success,
    summary: result.summary,
    data: lastResult,
    matchedAlias: match.alias.pattern,
    matchType: match.matchType,
    confidence: match.confidence,
    error: result.error,
    resolvedEntities: Object.keys(injectedContext.entityMap),
    canTraverseNetwork: injectedContext.canTraverseNetwork,
  };
}

/**
 * Summarize execution steps into a human-readable string.
 * Rule-based: inspects result shape and extracts counts, messages, key fields.
 */
function summarizeSteps(steps: { tool: string; result?: unknown; error?: string; skipped?: boolean }[]): string {
  const completed = steps.filter(s => !s.skipped && !s.error);
  if (completed.length === 0) {
    const failed = steps.find(s => s.error);
    return failed ? `Failed: ${failed.error}` : 'No actions executed';
  }

  const parts: string[] = [];

  for (const step of completed) {
    const r = step.result;
    if (r == null) {
      parts.push(`${step.tool}: done`);
      continue;
    }

    if (typeof r === 'string') {
      parts.push(r);
      continue;
    }

    if (typeof r !== 'object') {
      parts.push(`${step.tool}: ${String(r)}`);
      continue;
    }

    const obj = r as Record<string, unknown>;

    // If result has a message field, use it
    if (typeof obj['message'] === 'string') {
      parts.push(obj['message']);
      continue;
    }

    // Look for common list patterns: { items: [...], count: N } or { data: [...] }
    const listKey = ['items', 'data', 'results', 'tasks', 'relationships', 'overdue',
      'entries', 'transcripts', 'messages', 'meetings', 'priorities', 'goals',
      'aliases', 'contexts', 'shares', 'categories', 'deals', 'campaigns',
      'voices', 'profiles', 'interviews', 'skills'].find(
      k => Array.isArray(obj[k])
    );

    if (listKey) {
      const arr = obj[listKey] as unknown[];
      const count = typeof obj['count'] === 'number' ? obj['count'] : arr.length;
      const label = listKey.replace(/_/g, ' ');
      if (count === 0) {
        parts.push(`No ${label} found`);
      } else {
        // Show first few item names/titles if available
        const previews = arr.slice(0, 3).map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const o = item as Record<string, unknown>;
            return o['name'] || o['title'] || o['pattern'] || o['term'] || o['subject'] || o['label'] || null;
          }
          return null;
        }).filter(Boolean);

        const previewStr = previews.length > 0 ? `: ${previews.join(', ')}` : '';
        const moreStr = count > 3 ? ` (+${count - 3} more)` : '';
        parts.push(`${count} ${label}${previewStr}${moreStr}`);
      }
      continue;
    }

    // Object with success field
    if (typeof obj['success'] === 'boolean') {
      const detail = obj['id'] || obj['name'] || obj['slug'] || '';
      parts.push(`${step.tool}: ${obj['success'] ? 'success' : 'failed'}${detail ? ` — ${detail}` : ''}`);
      continue;
    }

    // Object with count
    if (typeof obj['count'] === 'number') {
      parts.push(`${step.tool}: ${obj['count']} result(s)`);
      continue;
    }

    // Fallback: tool name + compact key summary
    const keys = Object.keys(obj).filter(k => obj[k] != null).slice(0, 4);
    parts.push(`${step.tool}: returned ${keys.join(', ')}`);
  }

  return parts.join(' → ');
}

/**
 * Invoke an internal tool by name
 * This is used by the executor to call tools during action chain execution.
 *
 * Uses dynamic imports to avoid circular dependencies with do.ts.
 * All non-infrastructure modules are included so alias chains can
 * call any tool in the registry.
 */
async function invokeToolInternal(
  toolName: string,
  params: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  // Handle list_aliases directly (avoid importing handleDoTools which would be recursive)
  if (toolName === 'list_aliases') {
    const { listAvailableAliases: listAliasesFn } = await import('./do-list-aliases.js');
    return listAliasesFn(params, ctx);
  }

  // Import handlers dynamically to avoid circular dependencies
  const [
    { handleSessionTools },
    { handleQueueTools },
    { handleTaskTools },
    { handleGlossaryTools },
    { handleSearchTools },
    { handleTranscriptTools },
    { handleCommunityIntelTools },
    { handleProjectTools },
    { handleJournalTools },
    { handleEmotionTools },
    { handleVoiceTools },
    { handleSkillsTools },
    { handleContextTools },
    { handleIdentityTools },
    { handlePriorityTools },
    { handleEmailTools },
    { handleMoodTools },
    { handleRelationshipTools },
    { handleConductorTools },
    { handleCodeTools },
    { handleCrmTools },
    { handleOKRGoalTools },
    { handleOutreachTools },
    { handleDocumentTools },
    { handleDemoTools },
    { handleGFTTools },
    { handleSharingTools },
    { handleNominationTools },
  ] = await Promise.all([
    import('./session.js'),
    import('./queue.js'),
    import('./tasks.js'),
    import('./glossary.js'),
    import('./search.js'),
    import('./transcripts.js'),
    import('./community-intel.js'),
    import('./projects/index.js'),
    import('./journal.js'),
    import('./emotions.js'),
    import('./voice.js'),
    import('./skills.js'),
    import('./context.js'),
    import('./identity.js'),
    import('./priorities.js'),
    import('./email.js'),
    import('./moods.js'),
    import('./relationships.js'),
    import('./conductor.js'),
    import('./code.js'),
    import('./crm/index.js'),
    import('./okr-goals.js'),
    import('./outreach.js'),
    import('./documents.js'),
    import('./demo.js'),
    import('./gft-ingestion.js'),
    import('./sharing.js'),
    import('./nominations.js'),
  ]);

  const handlers = [
    handleSessionTools,
    handleQueueTools,
    handleTaskTools,
    handleGlossaryTools,
    handleSearchTools,
    handleTranscriptTools,
    handleCommunityIntelTools,
    handleProjectTools,
    handleJournalTools,
    handleEmotionTools,
    handleVoiceTools,
    handleSkillsTools,
    handleContextTools,
    handleIdentityTools,
    handlePriorityTools,
    handleEmailTools,
    handleMoodTools,
    handleRelationshipTools,
    handleConductorTools,
    handleCodeTools,
    handleCrmTools,
    handleOKRGoalTools,
    handleOutreachTools,
    handleDocumentTools,
    handleDemoTools,
    handleGFTTools,
    handleSharingTools,
    handleNominationTools,
  ];

  for (const handler of handlers) {
    const result = await handler(toolName, params, ctx);
    if (result !== null) {
      return result;
    }
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * List available aliases
 */
async function listAvailableAliases(
  includeDescriptions: boolean,
  ctx: ToolContext
): Promise<{
  aliases: Array<{
    pattern: string;
    description?: string;
    mode?: string;
    usageCount: number;
  }>;
  hint: string;
}> {
  const resolverConfig: ResolverConfig = {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    defaultLayer: ctx.layer,
    enableSemanticFallback: false,
    semanticThreshold: 0.7,
  };

  const resolver = new AliasResolver(resolverConfig);
  const aliases = await resolver.listAliases(ctx.layer, includeDescriptions);

  return {
    aliases,
    hint: 'Use the do() tool with any of these patterns. Variables in {braces} will be extracted from your request.',
  };
}

/**
 * Get all available tools from the active bundle.
 * Used for semantic tool discovery when alias matching fails.
 *
 * Reads ctx.activeTools (populated at startup from the bundle filter)
 * and excludes do/recall/learn_alias to avoid recursion.
 */
function getAllAvailableTools(ctx: ToolContext): Tool[] {
  const EXCLUDED = new Set(['do', 'list_aliases', 'recall', 'learn_alias']);

  if (ctx.activeTools) {
    return ctx.activeTools.filter(t => !EXCLUDED.has(t.name));
  }

  // Fallback: should not happen in normal operation, but return empty
  // rather than crash if activeTools wasn't populated
  console.error('[do] Warning: ctx.activeTools not populated, tool discovery will be empty');
  return [];
}
