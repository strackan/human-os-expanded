/**
 * Session Management Tools
 *
 * Tools for session initialization and mode loading.
 * These are called at the start of each session to load context.
 */

import { createClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { STORAGE_BUCKETS, buildFounderLayer } from '@human-os/core';
import { existsSync } from 'fs';
import { performBidirectionalSync, type SyncResult } from '../lib/context-sync.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const sessionTools: Tool[] = [
  {
    name: 'get_session_context',
    description: 'Load identity, current state, and available modes at session start. Optionally syncs local files with Supabase (bi-directional, newer wins). Call this at the beginning of every conversation.',
    inputSchema: {
      type: 'object',
      properties: {
        localPath: {
          type: 'string',
          description: 'Optional local directory path for bi-directional sync with Supabase. If provided, syncs files in both directions based on which is newer.',
        },
        slug: {
          type: 'string',
          description: 'Entity slug in Supabase (e.g., "justin"). Defaults to "justin" if not provided.',
        },
      },
      required: [],
    },
  },
  {
    name: 'load_mode',
    description: 'Load protocol files for a specific mode (crisis, voice, decision, conversation, identity)',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          description: 'Mode to load: crisis, voice, decision, conversation, identity',
          enum: ['crisis', 'voice', 'decision', 'conversation', 'identity'],
        },
      },
      required: ['mode'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle session tool calls
 * Returns result if handled, null if not a session tool
 */
export async function handleSessionTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_session_context': {
      const localPath = (args as { localPath?: string })?.localPath;
      const slug = (args as { slug?: string })?.slug || 'justin';
      return getSessionContext(ctx.supabaseUrl, ctx.supabaseKey, ctx.userId, localPath, slug);
    }

    case 'load_mode': {
      const mode = (args as { mode: string })?.mode;
      if (!mode) throw new Error('mode parameter is required');
      return loadMode(ctx.supabaseUrl, ctx.supabaseKey, ctx.userId, mode);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

// Re-export SyncResult for backward compatibility
export type { SyncResult } from '../lib/context-sync.js';

export interface SessionContext {
  identity: {
    name: string;
    northStar: string;
    adhd_pda: boolean;
    decisionThreshold: number;
    responseStyle: string;
  };
  currentState: {
    energy: string;
    mode: string;
    topPriority: string;
    avoid: string[];
  };
  availableModes: ModeDefinition[];
  startHereContent: string;
  glossary: {
    terms: {
      term: string;
      short_definition: string | null;
      term_type: string;
      usage_count: number;
    }[];
    hint: string;
  };
  syncResult?: SyncResult;
}

export interface ModeDefinition {
  mode: string;
  triggers: string[];
  description: string;
  files: string[];
}

export interface ModeContent {
  mode: string;
  files: LoadedFile[];
  totalContent: string;
}

export interface LoadedFile {
  path: string;
  content: string;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

const BUCKET_NAME = STORAGE_BUCKETS.CONTEXTS;

/**
 * Get session context - called at the start of every session
 * Optionally performs bi-directional sync with local files
 */
export async function getSessionContext(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  localPath?: string,
  slug: string = 'justin'
): Promise<SessionContext> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Perform bi-directional sync if localPath is provided
  let syncResult: SyncResult | undefined;
  if (localPath && existsSync(localPath)) {
    syncResult = await performBidirectionalSync(supabase, localPath, slug);
  }

  // Load START_HERE.md
  const startHerePath = `justin/START_HERE.md`;
  const { data: startHereData, error: startHereError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(startHerePath);

  if (startHereError) {
    throw new Error(`Failed to load START_HERE.md: ${startHereError.message}`);
  }

  const startHereContent = await startHereData.text();

  // Load current state
  const statePath = `justin/state/current.md`;
  const { data: stateData, error: stateError } = await supabase.storage
    .from(BUCKET_NAME)
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
  const availableModes: ModeDefinition[] = [
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
      triggers: ['*'], // Always available as default
      description: 'Conversation protocols',
      files: ['protocols/conversation.md'],
    },
  ];

  // Load frequently used glossary terms
  const layer = buildFounderLayer(userId);
  let glossaryResult: { terms: SessionContext['glossary']['terms'] } = { terms: [] };
  try {
    glossaryResult = await getFrequentTerms(supabaseUrl, supabaseKey, layer, 10);
  } catch {
    glossaryResult = { terms: [] };
  }

  const glossary = {
    terms: glossaryResult.terms,
    hint:
      glossaryResult.terms.length > 0
        ? `User has ${glossaryResult.terms.length} defined terms. Use lookup_term if you encounter unfamiliar shorthand.`
        : 'No glossary terms defined yet. Use define_term to capture shorthand meanings.',
  };

  return {
    identity,
    currentState,
    availableModes,
    startHereContent,
    glossary,
    ...(syncResult && { syncResult }),
  };
}

/**
 * Load mode - load specific protocol files based on mode
 */
export async function loadMode(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  mode: string
): Promise<ModeContent> {
  const supabase = createClient(supabaseUrl, supabaseKey);

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

  const filePaths = modeFilePaths[mode];
  if (!filePaths) {
    throw new Error(`Unknown mode: ${mode}. Available modes: ${Object.keys(modeFilePaths).join(', ')}`);
  }

  const loadedFiles: LoadedFile[] = [];
  const contentParts: string[] = [];

  for (const filePath of filePaths) {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

    if (error) {
      console.error(`Failed to load ${filePath}: ${error.message}`);
      continue;
    }

    const content = await data.text();
    loadedFiles.push({ path: filePath, content });
    contentParts.push(`\n\n--- ${filePath} ---\n\n${content}`);
  }

  return {
    mode,
    files: loadedFiles,
    totalContent: contentParts.join(''),
  };
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Parse identity from START_HERE content
 */
function parseIdentityFromStartHere(content: string): SessionContext['identity'] {
  const identity = {
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

/**
 * Parse current state from state file
 */
function parseCurrentState(content: string): SessionContext['currentState'] {
  const state = {
    energy: 'Unknown',
    mode: 'Unknown',
    topPriority: 'Unknown',
    avoid: [] as string[],
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

/**
 * Get frequent terms (internal helper for session context)
 */
async function getFrequentTerms(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  limit: number = 10
): Promise<{ terms: SessionContext['glossary']['terms'] }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('glossary')
    .select('term, short_definition, term_type, usage_count')
    .eq('layer', layer)
    .gt('usage_count', 0)
    .order('usage_count', { ascending: false })
    .order('last_used_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get frequent terms: ${error.message}`);
  }

  return {
    terms: data || [],
  };
}

