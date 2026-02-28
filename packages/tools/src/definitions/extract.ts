/**
 * Extract Tool
 *
 * Claude-powered structured extraction from free-text input.
 * Turns brain dumps, transcripts, voice memos, and notes into
 * structured entities that map to the tool registry.
 *
 * Categories come from two sources, merged at runtime:
 *   1. Static — people, projects, goals, parking_lot (custom schemas)
 *   2. Dynamic — tools annotated with `extractable: true` (schema from Zod)
 *
 * Adding `extractable: true` to a new tool makes extract() discover it
 * automatically — no changes to this file needed.
 */

import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { defineTool, getRegistry } from '../registry.js';
import { zodToPromptSchema } from '../zod-prompt.js';
import { DB_SCHEMAS } from '@human-os/core';
import type { ToolContext } from '../types.js';

// =============================================================================
// UNIFIED CATEGORY TYPE
// =============================================================================

interface ExtractionCategory {
  name: string;
  schema: string;
  guideline: string;
  /** Tool name for auto-populate, or null if custom/unsupported */
  toolName: string | null;
  /** Custom populate fn (overrides toolName-based invoke). Return null to skip. */
  populate: PopulateFn | null;
}

type PopulateFn = (
  ctx: ToolContext,
  entities: Array<Record<string, unknown>>
) => Promise<PopulateResult>;

interface PopulateResult {
  created: number;
  errors: string[];
}

// =============================================================================
// POPULATE HANDLERS — named functions, not inline lambdas
// =============================================================================

async function populatePeople(
  ctx: ToolContext,
  entities: Array<Record<string, unknown>>
): Promise<PopulateResult> {
  const r: PopulateResult = { created: 0, errors: [] };
  const validTypes: Record<string, string> = {
    colleague: 'colleague', friend: 'friend', family: 'family',
    mentor: 'mentor', client: 'client', partner: 'partner',
    report: 'report', vendor: 'vendor', other: 'other',
  };

  for (const person of entities) {
    try {
      const { data: existing } = await ctx.supabase
        .schema(DB_SCHEMAS.FOUNDER_OS)
        .from('relationships')
        .select('id')
        .eq('user_id', ctx.userId)
        .ilike('name', String(person.name))
        .maybeSingle();

      if (existing) continue;

      const { error } = await ctx.supabase
        .schema(DB_SCHEMAS.FOUNDER_OS)
        .from('relationships')
        .insert({
          user_id: ctx.userId,
          name: person.name,
          relationship: validTypes[String(person.relationship_type || 'other')] || 'other',
          notes: person.context || null,
          sentiment:
            typeof person.confidence === 'number' && person.confidence >= 0.8
              ? 'positive'
              : 'neutral',
        });

      if (error) throw new Error(error.message);
      r.created++;
    } catch (err) {
      r.errors.push(`Person "${person.name}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return r;
}

async function populateGoals(
  ctx: ToolContext,
  entities: Array<Record<string, unknown>>
): Promise<PopulateResult> {
  const registry = getRegistry();
  const r: PopulateResult = { created: 0, errors: [] };

  for (const goal of entities) {
    const tags = ['goal'];
    if (typeof goal.timeframe === 'string') tags.push(goal.timeframe);
    try {
      await registry.invoke('add_task', {
        title: goal.title,
        description: goal.timeframe ? `Timeframe: ${goal.timeframe}` : undefined,
        priority: 'medium',
        context_tags: tags,
      }, ctx);
      r.created++;
    } catch (err) {
      r.errors.push(`Goal "${goal.title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return r;
}

async function populateParkingLot(
  ctx: ToolContext,
  entities: Array<Record<string, unknown>>
): Promise<PopulateResult> {
  const registry = getRegistry();
  const r: PopulateResult = { created: 0, errors: [] };

  for (const item of entities) {
    const tags = ['parking_lot'];
    if (typeof item.capture_mode === 'string') tags.push(item.capture_mode);
    try {
      await registry.invoke('add_task', {
        title: String(item.cleaned_text || item.raw_input).substring(0, 200),
        description:
          item.raw_input !== item.cleaned_text ? `Original: ${item.raw_input}` : undefined,
        priority: 'low',
        context_tags: tags,
      }, ctx);
      r.created++;
    } catch (err) {
      r.errors.push(`Parking lot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return r;
}

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

/** Static categories — custom schemas that don't map to a single tool input */
const STATIC_CATEGORIES: ExtractionCategory[] = [
  {
    name: 'people',
    schema: `"people": [
    {
      "name": "Person's Name",
      "relationship_type": "colleague|friend|family|mentor|client|partner|report|vendor|other",
      "context": "Brief description of how they were mentioned",
      "confidence": 0.0-1.0
    }
  ]`,
    guideline:
      '- **People**: Named individuals. Infer relationship type from context ("my boss Sarah" = colleague). Score confidence by how clearly they were referenced.',
    toolName: null,
    populate: populatePeople,
  },
  {
    name: 'projects',
    schema: `"projects": [
    {
      "name": "Project name",
      "description": "What the project is about",
      "status": "active|planning|on_hold|completed"
    }
  ]`,
    guideline:
      '- **Projects**: Ongoing initiatives, products, or work streams. Not one-off tasks.',
    toolName: null,
    populate: null,
  },
  {
    name: 'goals',
    schema: `"goals": [
    {
      "title": "Goal statement",
      "timeframe": "this_week|this_month|this_quarter|this_year|someday|null"
    }
  ]`,
    guideline:
      '- **Goals**: Objectives, targets, aspirations. Outcomes, not actions. Different from tasks.',
    toolName: 'add_task',
    populate: populateGoals,
  },
  {
    name: 'parking_lot',
    schema: `"parking_lot": [
    {
      "raw_input": "Original text snippet",
      "cleaned_text": "Cleaned/normalized version",
      "capture_mode": "project|brainstorm|expand|passive"
    }
  ]`,
    guideline:
      '- **Parking Lot**: Ideas, thoughts, topics to revisit later. capture_mode: "project" for potential projects, "brainstorm" for ideas, "expand" for topics to explore, "passive" for observations.',
    toolName: 'add_task',
    populate: populateParkingLot,
  },
];

/** Build dynamic categories from tools with `extractable: true` */
function dynamicCategoriesFromRegistry(): ExtractionCategory[] {
  return getRegistry()
    .getAll()
    .filter((t) => t.extractable && t.extractHint)
    .map((t) => {
      const name = t.extractCategory || t.name;
      const label = name.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
      return {
        name,
        schema: zodToPromptSchema(name, t.input),
        guideline: `- **${label}**: ${t.extractHint}`,
        toolName: t.name,
        populate: null, // uses generic tool invoke
      };
    });
}

/**
 * Merge static + dynamic into one list. Dynamic categories with the same
 * name as a static one replace the schema/guideline but keep the static
 * populate handler (static handlers have custom routing logic).
 */
function getAllCategories(): ExtractionCategory[] {
  const staticByName = new Map(STATIC_CATEGORIES.map((c) => [c.name, c]));
  const dynamic = dynamicCategoriesFromRegistry();
  const merged: ExtractionCategory[] = [];
  const seen = new Set<string>();

  // Static first — use dynamic schema if available, keep static populate
  for (const cat of STATIC_CATEGORIES) {
    const dyn = dynamic.find((d) => d.name === cat.name);
    merged.push(dyn ? { ...dyn, populate: cat.populate } : cat);
    seen.add(cat.name);
  }

  // Dynamic-only (not in static)
  for (const cat of dynamic) {
    if (!seen.has(cat.name)) merged.push(cat);
  }

  return merged;
}

// =============================================================================
// AUTO-POPULATE
// =============================================================================

async function autoPopulate(
  category: ExtractionCategory,
  entities: Array<Record<string, unknown>>,
  ctx: ToolContext
): Promise<PopulateResult> {
  if (!entities.length) return { created: 0, errors: [] };

  // Custom handler takes priority
  if (category.populate) return category.populate(ctx, entities);

  // Generic: invoke the tool directly — Zod validates and strips extra fields
  if (category.toolName) {
    const registry = getRegistry();
    const r: PopulateResult = { created: 0, errors: [] };
    for (const entity of entities) {
      try {
        await registry.invoke(category.toolName, entity, ctx);
        r.created++;
      } catch (err) {
        const label = (entity.title ?? entity.term ?? entity.name ?? 'item') as string;
        r.errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return r;
  }

  return { created: 0, errors: [] };
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

function buildSystemPrompt(categories: ExtractionCategory[]): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  return `You are an entity extraction system for a personal productivity platform. Your job is to analyze free-text input and extract structured entities.

Today is ${dateStr} (${dayName}). Convert relative dates ("tomorrow", "next Friday") to absolute YYYY-MM-DD dates.

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  ${categories.map((c) => c.schema).join(',\n  ')},
  "summary": "One sentence summary of what was captured"
}

Guidelines:
${categories.map((c) => c.guideline).join('\n')}

General rules:
- Be generous with extraction — better to capture something uncertain than miss it.
- Use confidence scores (for people) to indicate certainty.
- An item can only belong to ONE category. Pick the best fit.
- Empty arrays are fine — only extract what's actually present.`;
}

// =============================================================================
// EXTRACT TOOL
// =============================================================================

/**
 * Max input length (chars). ~20k chars ≈ ~5k tokens, enough for a long
 * brain dump or meeting transcript without blowing up cost.
 */
const MAX_INPUT_LENGTH = 20_000;

export const extract = defineTool({
  name: 'extract',
  description:
    'Extract structured entities from free-text input (brain dumps, transcripts, voice memos, notes). Discovers extraction categories dynamically from the tool registry. Use compact mode to get counts only (avoids context bloat), then request full entities per-category as needed.',
  platform: 'core',
  category: 'extraction',

  input: z.object({
    text: z
      .string()
      .min(10)
      .max(MAX_INPUT_LENGTH)
      .describe('Free-text to extract from (max 20k chars)'),
    source: z
      .enum(['brain_dump', 'transcript', 'voice_memo', 'email', 'note', 'conversation'])
      .optional()
      .describe('Source type — helps tune extraction heuristics'),
    categories: z
      .array(z.string())
      .optional()
      .describe('Limit extraction to specific categories. Default: all available.'),
    compact: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'If true (default), return counts + summary only — no entity arrays. Set false to get full extracted entities. Use compact for initial extraction, then re-extract with specific categories + compact:false for details.'
      ),
    auto_populate: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'If true, create entities via downstream tools. Requires compact:false. Best used after reviewing extracted entities in a separate step.'
      ),
    context: z
      .record(z.string())
      .optional()
      .describe('Additional context (e.g., work_style, current_project)'),
  }),

  handler: async (ctx, input) => {
    // Resolve categories once
    const all = getAllCategories();
    const active = input.categories?.length
      ? all.filter((c) => input.categories!.includes(c.name))
      : all;

    if (!active.length) {
      return { error: `No valid categories. Available: ${all.map((c) => c.name).join(', ')}` };
    }

    // auto_populate requires full entities
    if (input.auto_populate && input.compact) {
      return { error: 'auto_populate requires compact:false so entities can be reviewed.' };
    }

    // Build user message
    const contextBlock = input.context
      ? `\n\nAdditional context about this user:\n${Object.entries(input.context).map(([k, v]) => `${k}: ${v}`).join('\n')}`
      : '';

    // Call Claude
    const response = await new Anthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: buildSystemPrompt(active),
      messages: [
        {
          role: 'user',
          content: `${contextBlock}\n\n${input.source || 'text'} to analyze:\n---\n${input.text}\n---\n\nExtract all entities and return JSON:`,
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') {
      return { error: 'No response from extraction model' };
    }

    // Parse
    let parsed: Record<string, unknown>;
    try {
      const match = block.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found');
      parsed = JSON.parse(match[0]);
    } catch {
      return { error: 'Failed to parse extraction response' };
    }

    // Normalize into arrays and count
    const entities: Record<string, Array<Record<string, unknown>>> = {};
    const counts: Record<string, number> = {};

    for (const cat of active) {
      const raw = parsed[cat.name];
      const arr = Array.isArray(raw) ? raw : [];
      entities[cat.name] = arr;
      counts[cat.name] = arr.length;
    }

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    // Build result — compact mode omits entity arrays
    const result: Record<string, unknown> = {
      summary: parsed.summary || 'Entities extracted.',
      source: input.source || 'unknown',
      extracted_at: new Date().toISOString(),
      category_count: counts,
      total_count: totalCount,
    };

    if (!input.compact) {
      // Full mode — include all entity arrays
      for (const [name, arr] of Object.entries(entities)) {
        result[name] = arr;
      }
    }

    // Auto-populate (only in full mode)
    if (input.auto_populate) {
      const populateResults: Record<string, PopulateResult> = {};
      for (const cat of active) {
        if (entities[cat.name]?.length) {
          populateResults[cat.name] = await autoPopulate(cat, entities[cat.name], ctx);
        }
      }
      result.populate_results = populateResults;
    }

    return result;
  },

  rest: { method: 'POST', path: '/extract' },

  // No alias — extract is a deliberate operation invoked via MCP/REST,
  // not a casual natural language phrase. Prevents accidental Sonnet calls.
});

// =============================================================================
// LIST EXTRACTION CATEGORIES
// =============================================================================

export const listExtractionCategories = defineTool({
  name: 'list_extraction_categories',
  description:
    'List available extraction categories and their downstream tool mappings.',
  platform: 'core',
  category: 'extraction',

  input: z.object({}),

  handler: async () => ({
    categories: getAllCategories().map((c) => ({
      name: c.name,
      tool: c.toolName,
      guideline: c.guideline.replace(/^- \*\*[^*]+\*\*:\s*/, ''),
      auto_populate: c.populate !== null || c.toolName !== null,
    })),
  }),

  rest: { method: 'GET', path: '/extract/categories' },
});
