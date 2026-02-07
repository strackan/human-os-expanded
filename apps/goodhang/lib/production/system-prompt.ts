/**
 * Production System Prompt Composition
 *
 * Builds the layered system prompt for production mode:
 * 1. Base prompt (production.md)
 * 2. Mode overlay
 * 3. Grounded context (resolved entities, alias results)
 * 4. Commandments snapshot
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { type ProductionMode, getModePrompt } from './mode-prompts';

// =============================================================================
// TYPES
// =============================================================================

export interface GroundedContext {
  /** Resolved entities from the do() gate */
  entities: Record<string, { id: string; slug: string; name: string; type?: string }>;
  /** System context from entity resolution */
  systemContext: string;
  /** Alias execution result, if any */
  aliasResult?: {
    matched: boolean;
    pattern?: string;
    summary?: string;
  };
  /** Whether the query can fall through to general knowledge */
  canTraverseNetwork: boolean;
}

export interface CommandmentsSnapshot {
  commandments: string[];
  updatedAt: string;
}

// =============================================================================
// BASE PROMPT
// =============================================================================

let cachedBasePrompt: string | null = null;

function getBasePrompt(): string {
  if (cachedBasePrompt) return cachedBasePrompt;

  try {
    cachedBasePrompt = readFileSync(
      join(process.cwd(), 'lib', 'production', 'production.md'),
      'utf-8'
    );
  } catch {
    // Fallback if file read fails (e.g., in edge runtime)
    cachedBasePrompt = `You are an executive AI operating system for a founder. You are the reasoning layer on top of grounded data — never the source of truth. Be direct, concise, and action-oriented. Only reference what the do() gate provided. Never invent entities or fabricate history.`;
  }

  return cachedBasePrompt;
}

// =============================================================================
// COMMANDMENTS CACHE
// =============================================================================

let commandmentsCache: { data: CommandmentsSnapshot | null; fetchedAt: number } = {
  data: null,
  fetchedAt: 0,
};

const COMMANDMENTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function loadCommandments(
  supabaseUrl: string,
  supabaseKey: string,
  entitySlug: string
): Promise<CommandmentsSnapshot | null> {
  const now = Date.now();

  if (commandmentsCache.data && now - commandmentsCache.fetchedAt < COMMANDMENTS_CACHE_TTL) {
    return commandmentsCache.data;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to load from storage bucket
    const { data, error } = await supabase.storage
      .from('commandments')
      .download(`${entitySlug}/voice-commandments.json`);

    if (error || !data) {
      return null;
    }

    const text = await data.text();
    const parsed = JSON.parse(text);
    const snapshot: CommandmentsSnapshot = {
      commandments: parsed.commandments || [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };

    commandmentsCache = { data: snapshot, fetchedAt: now };
    return snapshot;
  } catch {
    return null;
  }
}

// =============================================================================
// PROMPT COMPOSITION
// =============================================================================

export function getProductionSystemPrompt(
  mode: ProductionMode,
  groundedContext: GroundedContext,
  commandments: CommandmentsSnapshot | null,
  firstName?: string
): string {
  const parts: string[] = [];

  // 1. Base prompt
  parts.push(getBasePrompt());

  // 2. Mode overlay
  const modePrompt = getModePrompt(mode);
  if (modePrompt) {
    parts.push(modePrompt);
  }

  // 3. Grounded context block
  parts.push(buildGroundedContextBlock(groundedContext, firstName));

  // 4. Commandments
  if (commandments?.commandments.length) {
    parts.push(buildCommandmentsBlock(commandments));
  }

  return parts.join('\n\n---\n\n');
}

function buildGroundedContextBlock(context: GroundedContext, firstName?: string): string {
  const lines: string[] = ['## Grounded Context'];

  if (firstName) {
    lines.push(`The founder's first name is ${firstName}.`);
  }

  // Entity map
  const entityEntries = Object.entries(context.entities);
  if (entityEntries.length > 0) {
    lines.push('\n### Resolved Entities');
    for (const [mention, entity] of entityEntries) {
      lines.push(`- "${mention}" → **${entity.name}** (${entity.slug}${entity.type ? `, ${entity.type}` : ''})`);
    }
  }

  // System context from entity resolution
  if (context.systemContext) {
    lines.push(`\n### Entity Context\n${context.systemContext}`);
  }

  // Alias result
  if (context.aliasResult?.matched) {
    lines.push(`\n### Action Executed\nMatched alias: "${context.aliasResult.pattern}"\nResult: ${context.aliasResult.summary}`);
  }

  // Network traversal flag
  if (context.canTraverseNetwork) {
    lines.push('\n*No specific entities matched. You may answer from general knowledge.*');
  } else if (entityEntries.length === 0) {
    lines.push('\n*No entities resolved from this message. Only reference data you have been given.*');
  }

  return lines.join('\n');
}

function buildCommandmentsBlock(commandments: CommandmentsSnapshot): string {
  const lines = ['## Voice Commandments', "These are the founder's voice rules. Use them to match tone:"];

  for (const cmd of commandments.commandments) {
    lines.push(`- ${cmd}`);
  }

  return lines.join('\n');
}
