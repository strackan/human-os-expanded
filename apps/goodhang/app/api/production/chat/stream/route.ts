/**
 * API Route: Production Chat Stream
 *
 * SSE streaming endpoint for Founder OS production mode.
 * Every message passes through the do() gate (entity resolution + alias routing)
 * before Claude sees it. Claude only reasons over grounded context.
 */

import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AnthropicService,
  type ConversationMessage,
  type StreamingChunk,
  type StreamingConversationResult,
} from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import { getTemperature } from '@/lib/shared/llm-config';
import {
  createErrorResponse,
  getSSEHeaders,
} from '@/lib/api/streaming-response';
import {
  getProductionSystemPrompt,
  loadCommandments,
  type GroundedContext,
} from '@/lib/production/system-prompt';
import { type ProductionMode } from '@/lib/production/mode-prompts';
import {
  EntityResolver,
  buildInjectedContext,
} from '@human-os/entity-resolution';
import {
  AliasResolver,
  AliasExecutor,
  type ResolverConfig,
  type ExecutorConfig,
  type ExecutionContext,
} from '@human-os/aliases';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// =============================================================================
// TYPES
// =============================================================================

interface ProductionChatStreamRequest {
  message: string;
  conversation_history: ConversationMessage[];
  entity_slug: string;
  mode: ProductionMode;
  session_id: string;
}

interface DoGateResult {
  matched: boolean;
  aliasPattern: string | null;
  confidence: number;
  summary: string;
  resolvedEntities: string[];
  clarification: Array<{ label: string; entitySlug: string; entityType: string }> | null;
}

// =============================================================================
// NLP MODE DETECTION
// =============================================================================

const MODE_PATTERNS: Array<{ mode: ProductionMode; patterns: RegExp[] }> = [
  {
    mode: 'journal',
    patterns: [
      /\b(journal|reflect|reflecting|gratitude|diary)\b/i,
      /\bjournal mode\b/i,
      /\blet me (think|reflect|write)\b/i,
    ],
  },
  {
    mode: 'brainstorm',
    patterns: [
      /\b(brainstorm|ideate|brainstorming|spitball)\b/i,
      /\bbrainstorm mode\b/i,
      /\blet me brainstorm\b/i,
      /\bwhat if\b.*\bwhat if\b/i, // repeated "what if"
    ],
  },
  {
    mode: 'checkin',
    patterns: [
      /\b(check.?in|checkin)\b/i,
      /\bhow am i\b/i,
      /\bstart my day\b/i,
      /\bmorning routine\b/i,
    ],
  },
  {
    mode: 'crisis',
    patterns: [
      /\b(overwhelmed|drowning|can't cope|freaking out|panicking|crisis)\b/i,
      /\btoo much\b/i,
      /\bi('m| am) (stressed|losing it|falling apart)\b/i,
    ],
  },
  {
    mode: 'post',
    patterns: [
      /\b(linkedin|tweet|social media|draft a post|write a post)\b/i,
      /\bpost mode\b/i,
    ],
  },
  {
    mode: 'search',
    patterns: [
      /\bwho (knows|can|do i know)\b/i,
      /\b(search|find|look up) (people|contacts|connections)\b/i,
      /\bsearch mode\b/i,
      /\bnetwork search\b/i,
    ],
  },
];

function detectModeSwitch(message: string, currentMode: ProductionMode): ProductionMode | null {
  // Check for explicit exit
  if (/\b(exit|leave|back to (normal|default)|default mode)\b/i.test(message)) {
    return currentMode !== 'default' ? 'default' : null;
  }

  // Check for explicit mode requests
  const explicitMatch = message.match(/\b(journal|brainstorm|checkin|check.?in|crisis|post|search) mode\b/i);
  if (explicitMatch) {
    const modeStr = explicitMatch[1]!.toLowerCase().replace(/[- ]/, '');
    const modeMap: Record<string, ProductionMode> = {
      journal: 'journal',
      brainstorm: 'brainstorm',
      checkin: 'checkin',
      crisis: 'crisis',
      post: 'post',
      search: 'search',
    };
    const detected = modeMap[modeStr];
    if (detected && detected !== currentMode) return detected;
  }

  // Check NLP patterns (only switch if not already in a mode, or for crisis)
  for (const { mode, patterns } of MODE_PATTERNS) {
    if (mode === currentMode) continue;
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        // Crisis always overrides; others only from default
        if (mode === 'crisis' || currentMode === 'default') {
          return mode;
        }
      }
    }
  }

  return null;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function OPTIONS() {
  return new Response(null, { headers: getSSEHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body: ProductionChatStreamRequest = await request.json();
    const {
      message,
      conversation_history = [],
      entity_slug,
      mode: currentMode = 'default',
      session_id,
    } = body;

    if (!message) {
      return createErrorResponse('message is required', 'MISSING_MESSAGE', 400);
    }

    if (!entity_slug) {
      return createErrorResponse('entity_slug is required', 'MISSING_ENTITY_SLUG', 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine the layer from entity_slug
    const layer: `founder:${string}` = `founder:${entity_slug.split('-')[0] || entity_slug}`;

    // ==========================================================================
    // STEP 0: Mode detection
    // ==========================================================================
    const detectedMode = detectModeSwitch(message, currentMode);
    const activeMode: ProductionMode = detectedMode || currentMode;

    // ==========================================================================
    // STEP 1: Check for __init__ (startup greeting)
    // ==========================================================================
    const isInit = message === '__init__';

    if (isInit) {
      return handleStartupGreeting(supabase, entity_slug, layer, activeMode, session_id);
    }

    // ==========================================================================
    // STEP 2: Entity Resolution (the do() gate)
    // ==========================================================================
    const entityResolver = new EntityResolver({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
      layer,
    });

    const resolvedContext = await entityResolver.resolve(message);
    const injectedContext = buildInjectedContext(resolvedContext);

    // Build do() gate result for metadata
    const doGateResult: DoGateResult = {
      matched: false,
      aliasPattern: null,
      confidence: 0,
      summary: '',
      resolvedEntities: Object.keys(injectedContext.entityMap),
      clarification: null,
    };

    // Handle ambiguous entities
    if (injectedContext.clarificationNeeded && injectedContext.clarificationPrompt) {
      doGateResult.clarification = Object.entries(injectedContext.entityMap).map(
        ([_mention, entity]) => ({
          label: `${entity.name}${entity.type ? ` (${entity.type})` : ''}`,
          entitySlug: entity.slug,
          entityType: entity.type || 'unknown',
        })
      );
    }

    // ==========================================================================
    // STEP 3: Alias Resolution + Execution
    // ==========================================================================
    const resolverConfig: ResolverConfig = {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
      defaultLayer: layer,
      enableSemanticFallback: false,
      semanticThreshold: 0.7,
    };

    const aliasResolver = new AliasResolver(resolverConfig);
    const aliasMatch = await aliasResolver.resolve(message, layer);

    let aliasResult: { matched: boolean; pattern?: string; summary?: string } = {
      matched: false,
    };

    if (aliasMatch) {
      const executorConfig: ExecutorConfig = {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
      };

      const executor = new AliasExecutor(executorConfig);

      const execCtx: ExecutionContext = {
        layer,
        userId: entity_slug,
        vars: {},
        outputs: {},
        resolvedEntities: {
          entities: injectedContext.entityMap,
          systemContext: injectedContext.systemContext,
          canTraverseNetwork: injectedContext.canTraverseNetwork,
        },
        invokeTool: async (toolName: string, params: Record<string, unknown>) => {
          // In production mode, tools are executed via the API routes
          // For now, return a placeholder — MCP tools are server-side only
          console.log(`[production/chat] Tool invocation: ${toolName}`, params);
          return { success: true, message: `Executed ${toolName}` };
        },
        log: (msg, data) => {
          console.log(`[production/chat/do] ${msg}`, data ? JSON.stringify(data) : '');
        },
      };

      const executionResult = await executor.execute(
        aliasMatch.alias,
        aliasMatch.extractedVars,
        message,
        execCtx
      );

      aliasResult = {
        matched: true,
        pattern: aliasMatch.alias.pattern,
        summary: executionResult.summary,
      };

      doGateResult.matched = true;
      doGateResult.aliasPattern = aliasMatch.alias.pattern;
      doGateResult.confidence = aliasMatch.confidence;
      doGateResult.summary = executionResult.summary;
    }

    // ==========================================================================
    // STEP 4: Build system prompt + stream response
    // ==========================================================================
    const groundedContext: GroundedContext = {
      entities: injectedContext.entityMap as Record<
        string,
        { id: string; slug: string; name: string; type?: string }
      >,
      systemContext: injectedContext.systemContext,
      aliasResult,
      canTraverseNetwork: injectedContext.canTraverseNetwork,
    };

    // Load commandments (cached)
    const commandments = await loadCommandments(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      entity_slug
    );

    // Get founder first name
    const firstName = entity_slug.split('-')[0] || undefined;

    const systemPrompt = getProductionSystemPrompt(
      activeMode,
      groundedContext,
      commandments,
      firstName
    );

    // Build messages array
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /production/chat/stream] Generating streaming response:', {
      mode: activeMode,
      modeSwitch: detectedMode ? `${currentMode} → ${activeMode}` : 'none',
      entityCount: doGateResult.resolvedEntities.length,
      aliasMatched: doGateResult.matched,
      messageCount: messages.length,
    });

    // Create streaming generator
    const streamGenerator = AnthropicService.generateStreamingConversation({
      messages,
      systemPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 2000,
      temperature: getTemperature('conversational'),
    });

    // Metadata for the complete event
    const metadata: Record<string, unknown> = {
      doGateResult,
      mode: activeMode,
      entities: doGateResult.resolvedEntities,
    };

    if (detectedMode) {
      metadata.modeSwitch = {
        from: currentMode,
        to: activeMode,
        reason: 'nlp_detection',
      };
    }

    // Update session if we have one
    if (session_id) {
      supabase
        .from('production_sessions')
        .update({
          mode: activeMode,
          message_count: conversation_history.length + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id)
        .then(({ error }) => {
          if (error) console.warn('[production/chat] Session update failed:', error.message);
        });
    }

    // Wrap the stream to include metadata
    return createStreamingResponseWithMetadata(streamGenerator, metadata);
  } catch (error) {
    console.error('[API /production/chat/stream] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// =============================================================================
// STARTUP GREETING
// =============================================================================

async function handleStartupGreeting(
  supabase: SupabaseClient,
  entitySlug: string,
  layer: string,
  mode: ProductionMode,
  sessionId: string
): Promise<Response> {
  const firstName = entitySlug.split('-')[0] || 'there';
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Try to load context for greeting
  let greeting = `Hey ${capitalizedName}. What's on your mind?`;

  try {
    // Check for urgent tasks
    const { data: urgentTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('layer', layer)
      .eq('status', 'active')
      .lte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(5);

    if (urgentTasks && urgentTasks.length > 0) {
      greeting = `Morning ${capitalizedName}. You've got ${urgentTasks.length} task${urgentTasks.length > 1 ? 's' : ''} due. Starting there or something else?`;
    }
  } catch {
    // Fallback greeting is fine
  }

  // Create or update session
  if (sessionId) {
    await supabase
      .from('production_sessions')
      .upsert({
        id: sessionId,
        user_id: entitySlug,
        entity_slug: entitySlug,
        mode,
        message_count: 0,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();
  }

  // Return as SSE stream (single token + complete)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'token', text: greeting })}\n\n`
        )
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'complete',
            content: greeting,
            tokensUsed: { input: 0, output: 0, total: 0 },
            model: 'system',
            stopReason: 'end_turn',
            metadata: { mode, doGateResult: null, entities: [] },
          })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new Response(stream, { headers: getSSEHeaders() });
}

// =============================================================================
// STREAMING RESPONSE WITH METADATA
// =============================================================================

function createStreamingResponseWithMetadata(
  generator: AsyncGenerator<StreamingChunk, StreamingConversationResult, unknown>,
  metadata: Record<string, unknown>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let finalResult: StreamingConversationResult | undefined;

        while (true) {
          const { value, done } = await generator.next();

          if (done) {
            finalResult = value;
            break;
          }

          if (value.type === 'text' && value.text) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'token', text: value.text })}\n\n`
              )
            );
          }
        }

        if (finalResult) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                content: finalResult.content,
                tokensUsed: finalResult.tokensUsed,
                model: finalResult.model,
                stopReason: finalResult.stopReason,
                metadata,
              })}\n\n`
            )
          );
        }

        controller.close();
      } catch (error) {
        console.error('[production/chat/stream] Error in stream:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: getSSEHeaders() });
}
