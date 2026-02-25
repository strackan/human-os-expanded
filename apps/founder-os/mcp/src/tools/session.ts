/**
 * Session Management Tools
 *
 * Tools for session initialization and mode loading.
 * These are called at the start of each session to load context.
 *
 * Storage path pattern: contexts/{entity_slug}/
 * - START_HERE.md - Entry point with identity and quick reference
 * - founder-os/ - Founder OS commandments (10 files)
 * - voice/ - Voice OS commandments and content files
 * - state/ - Current state files
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
    description: `Load identity, current state, and available modes at session start.
Loads from contexts/{slug}/ in storage. Optionally syncs local files with Supabase.
Call this at the beginning of every conversation.`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Entity slug (e.g., "scott", "justin"). Defaults to current user if omitted.',
        },
        localPath: {
          type: 'string',
          description: 'Optional local directory path for bi-directional sync with Supabase.',
        },
      },
      required: [],
    },
  },
  {
    name: 'load_commandments',
    description: `Load the Ten Commandments for Founder OS and/or Voice OS.
These are the core instructions that define how the AI should support this person.

Founder OS Commandments (10):
- CURRENT_STATE, STRATEGIC_THOUGHT_PARTNER, DECISION_MAKING
- ENERGY_PATTERNS, AVOIDANCE_PATTERNS, RECOVERY_PROTOCOLS
- ACCOUNTABILITY_FRAMEWORK, EMOTIONAL_SUPPORT, WORK_STYLE, CONVERSATION_PROTOCOLS

Voice OS Commandments (10):
- VOICE, THEMES, GUARDRAILS, AUDIENCE, AUTHORITY
- HUMOR, CONTROVERSY, PERSONAL, FORMAT, QUALITY_CONTROL`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Entity slug (e.g., "scott", "justin"). Defaults to current user if omitted.',
        },
        type: {
          type: 'string',
          enum: ['founder_os', 'voice_os', 'both'],
          description: 'Which commandments to load. Default: both',
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
        slug: {
          type: 'string',
          description: 'Entity slug (e.g., "scott", "justin"). Defaults to current user if omitted.',
        },
        mode: {
          type: 'string',
          description: 'Mode to load: crisis, voice, decision, conversation, identity, founder_os',
          enum: ['crisis', 'voice', 'decision', 'conversation', 'identity', 'founder_os'],
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
      const slug = (args as { slug?: string }).slug || ctx.userId;
      const localPath = (args as { localPath?: string })?.localPath;
      return getSessionContext(ctx.supabaseUrl, ctx.supabaseKey, ctx.userId, slug, localPath);
    }

    case 'load_commandments': {
      const slug = (args as { slug?: string }).slug || ctx.userId;
      const type = (args as { type?: string })?.type || 'both';
      return loadCommandments(ctx.supabaseUrl, ctx.supabaseKey, slug, type);
    }

    case 'load_mode': {
      const slug = (args as { slug?: string }).slug || ctx.userId;
      const mode = (args as { mode: string })?.mode;
      if (!mode) throw new Error('mode parameter is required');
      return loadMode(ctx.supabaseUrl, ctx.supabaseKey, ctx.userId, slug, mode);
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
  slug: string;
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
  availableCommandments: {
    founder_os: string[];
    voice_os: string[];
  };
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

export interface CommandmentsResult {
  slug: string;
  founder_os?: Record<string, string>;
  voice_os?: Record<string, string>;
  loaded_count: number;
  total_content_length: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BUCKET_NAME = STORAGE_BUCKETS.CONTEXTS;

const FOUNDER_OS_COMMANDMENTS = [
  'CURRENT_STATE',
  'STRATEGIC_THOUGHT_PARTNER',
  'DECISION_MAKING',
  'ENERGY_PATTERNS',
  'AVOIDANCE_PATTERNS',
  'RECOVERY_PROTOCOLS',
  'ACCOUNTABILITY_FRAMEWORK',
  'EMOTIONAL_SUPPORT',
  'WORK_STYLE',
  'CONVERSATION_PROTOCOLS',
];

const VOICE_OS_COMMANDMENTS = [
  'VOICE',
  'THEMES',
  'GUARDRAILS',
  'AUDIENCE',
  'AUTHORITY',
  'HUMOR',
  'CONTROVERSY',
  'PERSONAL',
  'FORMAT',
  'QUALITY_CONTROL',
];

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Get session context - called at the start of every session
 * Loads from contexts/{slug}/ path pattern
 */
export async function getSessionContext(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  slug: string,
  localPath?: string
): Promise<SessionContext> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const basePath = `contexts/${slug}`;

  // Perform bi-directional sync if localPath is provided
  let syncResult: SyncResult | undefined;
  if (localPath && existsSync(localPath)) {
    syncResult = await performBidirectionalSync(supabase, localPath, slug);
  }

  // Load START_HERE.md (required)
  const startHerePath = `${basePath}/START_HERE.md`;
  const { data: startHereData, error: startHereError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(startHerePath);

  let startHereContent = '';
  if (startHereError) {
    console.warn(`No START_HERE.md found for ${slug}: ${startHereError.message}`);
    startHereContent = `# ${slug}\n\nNo START_HERE.md found. Use load_commandments to access the Ten Commandments.`;
  } else {
    startHereContent = await startHereData.text();
  }

  // Load current state (optional)
  const statePath = `${basePath}/state/current.md`;
  const { data: stateData, error: stateError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(statePath);

  let currentStateContent = '';
  if (!stateError && stateData) {
    currentStateContent = await stateData.text();
  }

  // Check which commandments are available
  const availableCommandments = await checkAvailableCommandments(supabase, basePath);

  // Parse identity from START_HERE
  const identity = parseIdentityFromStartHere(startHereContent, slug);

  // Parse current state
  const currentState = parseCurrentState(currentStateContent);

  // Define available modes with their triggers (using entity-specific paths)
  const availableModes: ModeDefinition[] = [
    {
      mode: 'founder_os',
      triggers: ['support', 'help', 'stuck', 'decision', 'energy', 'accountability'],
      description: 'Load Founder OS commandments for personalized AI support',
      files: FOUNDER_OS_COMMANDMENTS.map(c => `founder-os/${c}.md`),
    },
    {
      mode: 'voice',
      triggers: ['write', 'draft', 'post', 'linkedin', 'compose', 'edit', 'content'],
      description: 'Load Voice OS for content generation in your voice',
      files: VOICE_OS_COMMANDMENTS.map(c => `voice/${c}.md`),
    },
    {
      mode: 'crisis',
      triggers: ['overwhelmed', 'stuck', 'too much', 'drowning', 'cant think'],
      description: 'Crisis support - loads RECOVERY_PROTOCOLS and EMOTIONAL_SUPPORT',
      files: ['founder-os/RECOVERY_PROTOCOLS.md', 'founder-os/EMOTIONAL_SUPPORT.md'],
    },
    {
      mode: 'decision',
      triggers: ['should I', 'decide', 'what do you think', 'choice', 'options'],
      description: 'Decision support - loads DECISION_MAKING and STRATEGIC_THOUGHT_PARTNER',
      files: ['founder-os/DECISION_MAKING.md', 'founder-os/STRATEGIC_THOUGHT_PARTNER.md'],
    },
    {
      mode: 'conversation',
      triggers: ['*'],
      description: 'Default conversation mode - loads CONVERSATION_PROTOCOLS',
      files: ['founder-os/CONVERSATION_PROTOCOLS.md'],
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
    slug,
    identity,
    currentState,
    availableModes,
    availableCommandments,
    startHereContent,
    glossary,
    ...(syncResult && { syncResult }),
  };
}

/**
 * Load the Ten Commandments - the core instructions for AI support
 */
export async function loadCommandments(
  supabaseUrl: string,
  supabaseKey: string,
  slug: string,
  type: string = 'both'
): Promise<CommandmentsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const basePath = `contexts/${slug}`;

  const result: CommandmentsResult = {
    slug,
    loaded_count: 0,
    total_content_length: 0,
  };

  // Load Founder OS commandments
  if (type === 'founder_os' || type === 'both') {
    result.founder_os = {};
    for (const commandment of FOUNDER_OS_COMMANDMENTS) {
      const filePath = `${basePath}/founder-os/${commandment}.md`;
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

      if (!error && data) {
        const content = await data.text();
        // Extract content after YAML frontmatter if present
        const match = content.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
        result.founder_os[commandment] = match?.[1]?.trim() ?? content.trim();
        result.loaded_count++;
        result.total_content_length += result.founder_os[commandment].length;
      }
    }
  }

  // Load Voice OS commandments
  if (type === 'voice_os' || type === 'both') {
    result.voice_os = {};
    for (const commandment of VOICE_OS_COMMANDMENTS) {
      // Voice files might be in different naming conventions
      const possiblePaths = [
        `${basePath}/voice/${commandment}.md`,
        `${basePath}/voice/${commandment}_SUMMARY.md`,
      ];

      for (const filePath of possiblePaths) {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

        if (!error && data) {
          const content = await data.text();
          const match = content.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
          result.voice_os[commandment] = match?.[1]?.trim() ?? content.trim();
          result.loaded_count++;
          result.total_content_length += result.voice_os[commandment].length;
          break; // Found the file, no need to check other paths
        }
      }
    }
  }

  return result;
}

/**
 * Load mode - load specific protocol files based on mode
 */
export async function loadMode(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  slug: string,
  mode: string
): Promise<ModeContent> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const basePath = `contexts/${slug}`;

  // Define mode file mappings
  const modeFilePaths: Record<string, string[]> = {
    founder_os: FOUNDER_OS_COMMANDMENTS.map(c => `${basePath}/founder-os/${c}.md`),
    voice: VOICE_OS_COMMANDMENTS.map(c => `${basePath}/voice/${c}.md`),
    crisis: [
      `${basePath}/founder-os/RECOVERY_PROTOCOLS.md`,
      `${basePath}/founder-os/EMOTIONAL_SUPPORT.md`,
      `${basePath}/founder-os/AVOIDANCE_PATTERNS.md`,
    ],
    decision: [
      `${basePath}/founder-os/DECISION_MAKING.md`,
      `${basePath}/founder-os/STRATEGIC_THOUGHT_PARTNER.md`,
    ],
    conversation: [
      `${basePath}/founder-os/CONVERSATION_PROTOCOLS.md`,
      `${basePath}/founder-os/WORK_STYLE.md`,
    ],
    identity: [
      `${basePath}/founder-os/CURRENT_STATE.md`,
      `${basePath}/founder-os/ENERGY_PATTERNS.md`,
      `${basePath}/founder-os/AVOIDANCE_PATTERNS.md`,
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
      console.warn(`Failed to load ${filePath}: ${error.message}`);
      continue;
    }

    const content = await data.text();
    loadedFiles.push({ path: filePath, content });

    // Extract filename for header
    const filename = filePath.split('/').pop() || filePath;
    contentParts.push(`\n\n--- ${filename} ---\n\n${content}`);
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
 * Check which commandments are available in storage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAvailableCommandments(
  supabase: ReturnType<typeof createClient<any>>,
  basePath: string
): Promise<{ founder_os: string[]; voice_os: string[] }> {
  const result = {
    founder_os: [] as string[],
    voice_os: [] as string[],
  };

  // Check founder-os folder
  const { data: founderFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${basePath}/founder-os`);

  if (founderFiles) {
    for (const file of founderFiles) {
      const name = file.name.replace('.md', '');
      if (FOUNDER_OS_COMMANDMENTS.includes(name)) {
        result.founder_os.push(name);
      }
    }
  }

  // Check voice folder
  const { data: voiceFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${basePath}/voice`);

  if (voiceFiles) {
    for (const file of voiceFiles) {
      const name = file.name.replace('.md', '').replace('_SUMMARY', '');
      if (VOICE_OS_COMMANDMENTS.includes(name) && !result.voice_os.includes(name)) {
        result.voice_os.push(name);
      }
    }
  }

  return result;
}

/**
 * Parse identity from START_HERE content
 */
function parseIdentityFromStartHere(content: string, slug: string): SessionContext['identity'] {
  // Default identity based on slug
  const identity = {
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    northStar: 'Not specified',
    adhd_pda: false,
    decisionThreshold: 70,
    responseStyle: 'Direct, authentic',
  };

  // Try to parse from content
  const nameMatch = content.match(/name:\s*["']?([^"'\n]+)["']?/i);
  if (nameMatch?.[1]) {
    identity.name = nameMatch[1].trim();
  }

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

  const adhdMatch = content.match(/adhd|pda/i);
  if (adhdMatch) {
    identity.adhd_pda = true;
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
