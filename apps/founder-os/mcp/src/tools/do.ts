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
    description: `Execute any Human-OS action using natural language. This is the preferred way to interact with the system.

Examples:
- "check my os" - Load session context and urgent tasks
- "what's urgent" - Show urgent tasks
- "who is Grace" - Get full context on a person
- "what do I think about John" - Retrieve opinions and notes
- "tie a string to Sarah after Q1" - Set contextual reminder
- "what would Scott say about this pricing" - Get expert perspective
- "add refactor auth to my queue" - Queue item for later

The system will:
1. Match your request to a known alias pattern
2. Extract variables (person names, timing, topics)
3. Execute the appropriate tools
4. Return a concise summary

If no alias matches, will search available tools and suggest creating one.`,
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

    // Get all available tools for semantic search
    const allTools = await getAllAvailableTools();
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

  return {
    success: result.success,
    summary: result.summary,
    matchedAlias: match.alias.pattern,
    matchType: match.matchType,
    confidence: match.confidence,
    error: result.error,
    resolvedEntities: Object.keys(injectedContext.entityMap),
    canTraverseNetwork: injectedContext.canTraverseNetwork,
  };
}

/**
 * Invoke an internal tool by name
 * This is used by the executor to call tools during action chain execution
 */
async function invokeToolInternal(
  toolName: string,
  params: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  // Import handlers dynamically to avoid circular dependencies
  const { handleSessionTools } = await import('./session.js');
  const { handleQueueTools } = await import('./queue.js');
  const { handleTaskTools } = await import('./tasks.js');
  const { handleGlossaryTools } = await import('./glossary.js');
  const { handleSearchTools } = await import('./search.js');
  const { handleTranscriptTools } = await import('./transcripts.js');
  const { handleCommunityIntelTools } = await import('./community-intel.js');
  const { handleProjectTools } = await import('./projects/index.js');
  const { handleJournalTools } = await import('./journal.js');
  const { handleEmotionTools } = await import('./emotions.js');

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
 * Get all available tools from the MCP server
 * Used for semantic tool discovery when alias matching fails
 */
async function getAllAvailableTools(): Promise<Tool[]> {
  // Dynamically import all tool modules to get their definitions
  const [
    { taskTools },
    { queueTools },
    { glossaryTools },
    { searchTools },
    { sessionTools },
    { gftTools },
    { transcriptTools },
    { communityIntelTools },
    { projectTools },
    { journalTools },
    { emotionTools },
    { voiceTools },
    { skillsTools },
    { contextTools },
    { identityTools },
    { priorityTools },
    { emailTools },
    { moodTools },
    { relationshipTools },
    { conductorTools },
  ] = await Promise.all([
    import('./tasks.js'),
    import('./queue.js'),
    import('./glossary.js'),
    import('./search.js'),
    import('./session.js'),
    import('./gft-ingestion.js'),
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
  ]);

  // Combine all tools (excluding do/recall/learn_alias to avoid recursion)
  return [
    ...taskTools,
    ...queueTools,
    ...glossaryTools,
    ...searchTools,
    ...sessionTools,
    ...gftTools,
    ...transcriptTools,
    ...communityIntelTools,
    ...projectTools,
    ...journalTools,
    ...emotionTools,
    ...voiceTools,
    ...skillsTools,
    ...contextTools,
    ...identityTools,
    ...priorityTools,
    ...emailTools,
    ...moodTools,
    ...relationshipTools,
    ...conductorTools,
  ];
}
