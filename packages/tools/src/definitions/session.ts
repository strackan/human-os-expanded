/**
 * Session Tools
 *
 * Unified definitions for session initialization and mode loading.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';
import { STORAGE_BUCKETS, DB_SCHEMAS, buildFounderLayer } from '@human-os/core';

// =============================================================================
// GET SESSION CONTEXT
// =============================================================================

export const getSessionContext = defineTool({
  name: 'get_session_context',
  description: 'Load identity, current state, and available modes at session start. Call this at the beginning of every conversation.',
  platform: 'founder',
  category: 'session',

  input: z.object({
    slug: z.string().optional().default('justin').describe('Entity slug in Supabase (e.g., "justin")'),
  }),

  handler: async (ctx, input) => {
    const slug = input.slug || 'justin';

    // Load START_HERE.md
    const startHerePath = `${slug}/START_HERE.md`;
    const { data: startHereData, error: startHereError } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.CONTEXTS)
      .download(startHerePath);

    if (startHereError) {
      throw new Error(`Failed to load START_HERE.md: ${startHereError.message}`);
    }

    const startHereContent = await startHereData.text();

    // Load current state
    const statePath = `${slug}/state/current.md`;
    const { data: stateData, error: stateError } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.CONTEXTS)
      .download(statePath);

    let currentStateContent = '';
    if (!stateError && stateData) {
      currentStateContent = await stateData.text();
    }

    // Parse identity from START_HERE
    const identity = parseIdentityFromStartHere(startHereContent);

    // Parse current state
    const currentState = parseCurrentState(currentStateContent);

    // Define available modes with their triggers
    const availableModes = [
      {
        mode: 'crisis',
        triggers: ['overwhelmed', 'stuck', 'too much', 'drowning', 'cant think'],
        description: 'Crisis support protocols',
        files: ['protocols/crisis.md'],
      },
      {
        mode: 'voice',
        triggers: ['write', 'draft', 'post', 'linkedin', 'compose', 'edit'],
        description: 'Writing engine and voice system',
        files: ['voice/01_WRITING_ENGINE.md', 'voice/02_TEMPLATE_COMPONENTS.md', 'voice/04_BLEND_RECIPES.md'],
      },
      {
        mode: 'decision',
        triggers: ['should I', 'decide', 'what do you think', 'choice', 'options'],
        description: 'Strategic decision framework',
        files: ['protocols/decision.md'],
      },
      {
        mode: 'conversation',
        triggers: ['*'],
        description: 'Conversation protocols',
        files: ['protocols/conversation.md'],
      },
    ];

    // Load frequently used glossary terms
    const layer = buildFounderLayer(ctx.userId);
    let glossaryTerms: Array<{ term: string; short_definition: string | null; term_type: string; usage_count: number }> = [];

    try {
      const { data } = await ctx.supabase
        .from('glossary')
        .select('term, short_definition, term_type, usage_count')
        .eq('layer', layer)
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(10);
      glossaryTerms = data || [];
    } catch {
      // Ignore glossary errors
    }

    const glossary = {
      terms: glossaryTerms,
      hint: glossaryTerms.length > 0
        ? `User has ${glossaryTerms.length} defined terms. Use lookup_term if you encounter unfamiliar shorthand.`
        : 'No glossary terms defined yet. Use define_term to capture shorthand meanings.',
    };

    // Check inbox for pending messages (read-only — does NOT mark as delivered)
    let inbox: {
      pendingCount: number;
      messages: Array<{ from: string; subject: string | null; received: string }>;
      hint: string;
    } = { pendingCount: 0, messages: [], hint: 'No pending messages.' };

    try {
      const { data: pendingMessages } = await ctx.supabase
        .schema(DB_SCHEMAS.FOUNDER_OS)
        .from('messages')
        .select('id, from_name, subject, created_at')
        .eq('to_forest', layer)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingMessages && pendingMessages.length > 0) {
        inbox = {
          pendingCount: pendingMessages.length,
          messages: pendingMessages.map((m: { from_name: string; subject: string | null; created_at: string }) => ({
            from: m.from_name,
            subject: m.subject ?? null,
            received: m.created_at,
          })),
          hint: `You have ${pendingMessages.length} message${pendingMessages.length > 1 ? 's' : ''} waiting. Use grab_messages to read them.`,
        };
      }
    } catch {
      // Graceful fallback — table may not exist yet
    }

    return {
      identity,
      currentState,
      availableModes,
      startHereContent,
      glossary,
      inbox,
    };
  },

  rest: { method: 'GET', path: '/session/context' },

  alias: {
    pattern: 'start session',
    priority: 10,
  },
});

// =============================================================================
// LOAD MODE
// =============================================================================

export const loadMode = defineTool({
  name: 'load_mode',
  description: 'Load protocol files for a specific mode (crisis, voice, decision, conversation, identity)',
  platform: 'founder',
  category: 'session',

  input: z.object({
    mode: z.enum(['crisis', 'voice', 'decision', 'conversation', 'identity']).describe('Mode to load'),
  }),

  handler: async (ctx, input) => {
    const modeFilePaths: Record<string, string[]> = {
      crisis: ['justin/protocols/crisis.md'],
      voice: [
        'justin/voice/01_WRITING_ENGINE.md',
        'justin/voice/02_TEMPLATE_COMPONENTS.md',
        'justin/voice/04_BLEND_RECIPES.md',
      ],
      decision: ['justin/protocols/decision.md'],
      conversation: ['justin/protocols/conversation.md'],
      identity: [
        'justin/identity/core.md',
        'justin/identity/adhd-patterns.md',
        'justin/identity/communication.md',
      ],
    };

    const filePaths = modeFilePaths[input.mode];
    if (!filePaths) {
      throw new Error(`Unknown mode: ${input.mode}. Available modes: ${Object.keys(modeFilePaths).join(', ')}`);
    }

    const loadedFiles: Array<{ path: string; content: string }> = [];
    const contentParts: string[] = [];

    for (const filePath of filePaths) {
      const { data, error } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.CONTEXTS)
        .download(filePath);

      if (error) {
        console.error(`Failed to load ${filePath}: ${error.message}`);
        continue;
      }

      const content = await data.text();
      loadedFiles.push({ path: filePath, content });
      contentParts.push(`\n\n--- ${filePath} ---\n\n${content}`);
    }

    return {
      mode: input.mode,
      files: loadedFiles,
      totalContent: contentParts.join(''),
    };
  },

  rest: { method: 'GET', path: '/session/mode/:mode' },

  alias: {
    pattern: 'load {mode} mode',
    priority: 30,
  },
});

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

interface Identity {
  name: string;
  northStar: string;
  adhd_pda: boolean;
  decisionThreshold: number;
  responseStyle: string;
}

interface CurrentState {
  energy: string;
  mode: string;
  topPriority: string;
  avoid: string[];
}

function parseIdentityFromStartHere(content: string): Identity {
  const identity: Identity = {
    name: 'Justin Strackany',
    northStar: 'Make Work Joyful',
    adhd_pda: true,
    decisionThreshold: 70,
    responseStyle: 'Direct, no fluff, authentic',
  };

  const northStarMatch = content.match(/North Star:\*?\*?\s*["']?([^"\n]+)["']?/i);
  if (northStarMatch?.[1]) {
    identity.northStar = northStarMatch[1].trim().replace(/["'*]/g, '');
  }

  const thresholdMatch = content.match(/Decision threshold:\s*(\d+)%/i);
  if (thresholdMatch?.[1]) {
    identity.decisionThreshold = parseInt(thresholdMatch[1], 10);
  }

  const styleMatch = content.match(/Response style:\s*([^\n]+)/i);
  if (styleMatch?.[1]) {
    identity.responseStyle = styleMatch[1].trim();
  }

  return identity;
}

function parseCurrentState(content: string): CurrentState {
  const state: CurrentState = {
    energy: 'Unknown',
    mode: 'Unknown',
    topPriority: 'Unknown',
    avoid: [],
  };

  if (!content) return state;

  const energyMatch = content.match(/\*\*Energy:\*\*\s*([^\n]+)/i);
  if (energyMatch?.[1]) {
    state.energy = energyMatch[1].trim();
  }

  const modeMatch = content.match(/\*\*Primary Work:\*\*\s*([^\n]+)/i);
  if (modeMatch?.[1]) {
    state.mode = modeMatch[1].trim();
  }

  const priorityMatch = content.match(/\*\*1\.\s*([^\*]+)\*\*/);
  if (priorityMatch?.[1]) {
    state.topPriority = priorityMatch[1].trim();
  }

  const avoidSection = content.match(/## WHAT'S DRAINING RIGHT NOW[\s\S]*?(?=##|$)/i);
  if (avoidSection) {
    const avoidMatches = avoidSection[0].match(/[^\n(]+/g);
    if (avoidMatches) {
      state.avoid = avoidMatches.map(m => m.replace(/\s*/, '').trim());
    }
  }

  return state;
}
