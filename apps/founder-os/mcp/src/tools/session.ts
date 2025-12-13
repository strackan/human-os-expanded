/**
 * Session Management Tools
 *
 * Tools for session initialization and mode loading.
 * These are called at the start of each session to load context.
 */

import { createClient } from '@supabase/supabase-js';
import { getFrequentTerms } from './glossary.js';

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

const BUCKET_NAME = 'contexts';

/**
 * Get session context - called at the start of every session
 *
 * Returns identity, current state, and available modes
 */
export async function getSessionContext(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<SessionContext> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load START_HERE.md
  const startHerePath = `justin/START_HERE.md`;
  const { data: startHereData, error: startHereError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .download(startHerePath);

  if (startHereError) {
    throw new Error(`Failed to load START_HERE.md: ${startHereError.message}`);
  }

  const startHereContent = await startHereData.text();

  // Load current state
  const statePath = `justin/state/current.md`;
  const { data: stateData, error: stateError } = await supabase
    .storage
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
      triggers: ['*'],  // Always available as default
      description: 'Conversation protocols',
      files: ['protocols/conversation.md'],
    },
  ];

  // Load frequently used glossary terms
  const layer = `founder:${userId}`;
  let glossaryResult;
  try {
    glossaryResult = await getFrequentTerms(supabaseUrl, supabaseKey, layer, 10);
  } catch {
    glossaryResult = { terms: [] };
  }

  const glossary = {
    terms: glossaryResult.terms,
    hint: glossaryResult.terms.length > 0
      ? `User has ${glossaryResult.terms.length} defined terms. Use lookup_term if you encounter unfamiliar shorthand.`
      : 'No glossary terms defined yet. Use define_term to capture shorthand meanings.',
  };

  return {
    identity,
    currentState,
    availableModes,
    startHereContent,
    glossary,
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

  // Map mode to file paths
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
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
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
    mode,
    files: loadedFiles,
    totalContent: contentParts.join(''),
  };
}

/**
 * Parse identity from START_HERE content
 */
function parseIdentityFromStartHere(content: string): SessionContext['identity'] {
  // Default values
  const identity = {
    name: 'Justin Strackany',
    northStar: 'Make Work Joyful',
    adhd_pda: true,
    decisionThreshold: 70,
    responseStyle: 'Direct, no fluff, authentic',
  };

  // Try to extract values from content
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
  // Default values
  const state = {
    energy: 'Unknown',
    mode: 'Unknown',
    topPriority: 'Unknown',
    avoid: [] as string[],
  };

  if (!content) return state;

  // Try to extract values from content
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

  // Extract avoid items
  const avoidSection = content.match(/## WHAT'S DRAINING RIGHT NOW[\s\S]*?(?=##|$)/i);
  if (avoidSection) {
    const avoidMatches = avoidSection[0].match(/⚠️\s*([^\n(]+)/g);
    if (avoidMatches) {
      state.avoid = avoidMatches.map(m => m.replace(/⚠️\s*/, '').trim());
    }
  }

  return state;
}
