/**
 * Voice Triggers + Transcription Metrics
 *
 * MCP tools for managing spoken-phrase triggers that kick off workflows,
 * and comparing transcription provider quality.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext, ToolHandler } from '../lib/context.js'

const SCHEMA = 'human_os'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const voiceTriggerTools: Tool[] = [
  {
    name: 'list_voice_triggers',
    description: `List all active voice triggers. Optionally filter by entity_slug.

Example: "Show me all voice triggers" or "List triggers for scott-leese"`,
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'Filter triggers for a specific entity (optional)',
        },
      },
    },
  },
  {
    name: 'create_voice_trigger',
    description: `Create a new voice trigger — a spoken phrase that fires a workflow action.

Match types:
- exact: case-insensitive exact match
- fuzzy: Levenshtein similarity (default threshold 0.8)
- regex: regular expression test

Action types:
- do: natural language instruction routed through the do tool
- mcp_tool: call a specific MCP tool with args
- webhook: POST to a URL

Example: create_voice_trigger({ trigger_phrase: "Start daily standup", action_type: "do", action_payload: { instruction: "Create today's standup notes" } })`,
    inputSchema: {
      type: 'object',
      properties: {
        trigger_phrase: {
          type: 'string',
          description: 'The spoken phrase to match (e.g., "Initiate New Return")',
        },
        match_type: {
          type: 'string',
          enum: ['exact', 'fuzzy', 'regex'],
          description: 'How to match the phrase (default: fuzzy)',
        },
        fuzzy_threshold: {
          type: 'number',
          description: 'Similarity threshold for fuzzy matching, 0-1 (default: 0.8)',
        },
        action_type: {
          type: 'string',
          enum: ['do', 'mcp_tool', 'webhook'],
          description: 'What kind of action to fire (default: do)',
        },
        action_payload: {
          type: 'object',
          description: 'Action config — { instruction } for do, { tool, args } for mcp_tool, { url, body } for webhook',
        },
        entity_slug: {
          type: 'string',
          description: 'Scope trigger to a specific entity/project (optional)',
        },
        description: {
          type: 'string',
          description: 'Human-readable description of what this trigger does',
        },
      },
      required: ['trigger_phrase', 'action_payload'],
    },
  },
  {
    name: 'update_voice_trigger',
    description: 'Update an existing voice trigger by ID. Any field can be changed.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger UUID' },
        trigger_phrase: { type: 'string' },
        match_type: { type: 'string', enum: ['exact', 'fuzzy', 'regex'] },
        fuzzy_threshold: { type: 'number' },
        action_type: { type: 'string', enum: ['do', 'mcp_tool', 'webhook'] },
        action_payload: { type: 'object' },
        entity_slug: { type: 'string' },
        description: { type: 'string' },
        is_active: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_voice_trigger',
    description: 'Soft-delete a voice trigger (sets is_active = false).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger UUID to deactivate' },
      },
      required: ['id'],
    },
  },
  {
    name: 'process_voice_input',
    description: `Core tool: takes transcribed text and checks against all active voice triggers.

On match: returns { matched: true, trigger, action } — the calling agent then executes the action.
On no match: returns { matched: false, text } — available for normal processing.

Supports exact, fuzzy (Levenshtein), and regex matching.`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Transcribed text to check against triggers',
        },
        entity_slug: {
          type: 'string',
          description: 'Only check triggers scoped to this entity (optional)',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'compare_transcription_providers',
    description: `Query transcription_metrics to compare Wispr vs Whisper vs Web Speech.

Returns per-provider: avg latency, avg edit distance, total cost, usage count, and a recommendation.`,
    inputSchema: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          description: 'ISO date string — only include metrics after this date (optional)',
        },
        until: {
          type: 'string',
          description: 'ISO date string — only include metrics before this date (optional)',
        },
      },
    },
  },
]

// =============================================================================
// HANDLER
// =============================================================================

export const handleVoiceTriggerTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => {
  switch (name) {
    case 'list_voice_triggers':
      return listVoiceTriggers(ctx, args)
    case 'create_voice_trigger':
      return createVoiceTrigger(ctx, args)
    case 'update_voice_trigger':
      return updateVoiceTrigger(ctx, args)
    case 'delete_voice_trigger':
      return deleteVoiceTrigger(ctx, args)
    case 'process_voice_input':
      return processVoiceInput(ctx, args)
    case 'compare_transcription_providers':
      return compareProviders(ctx, args)
    default:
      return null
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function listVoiceTriggers(ctx: ToolContext, args: Record<string, unknown>) {
  const entitySlug = args.entity_slug as string | undefined
  const supabase = ctx.getClient().schema(SCHEMA)

  let query = supabase
    .from('voice_triggers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (entitySlug) {
    query = query.or(`entity_slug.eq.${entitySlug},entity_slug.is.null`)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, triggers: data, count: data?.length ?? 0 }
}

async function createVoiceTrigger(ctx: ToolContext, args: Record<string, unknown>) {
  const supabase = ctx.getClient().schema(SCHEMA)

  const { data, error } = await supabase
    .from('voice_triggers')
    .insert({
      trigger_phrase: args.trigger_phrase,
      match_type: args.match_type || 'fuzzy',
      fuzzy_threshold: args.fuzzy_threshold ?? 0.8,
      action_type: args.action_type || 'do',
      action_payload: args.action_payload,
      entity_slug: args.entity_slug || null,
      description: args.description || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, trigger: data }
}

async function updateVoiceTrigger(ctx: ToolContext, args: Record<string, unknown>) {
  const id = args.id as string
  const supabase = ctx.getClient().schema(SCHEMA)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['trigger_phrase', 'match_type', 'fuzzy_threshold', 'action_type', 'action_payload', 'entity_slug', 'description', 'is_active']) {
    if (args[key] !== undefined) {
      updates[key] = args[key]
    }
  }

  const { data, error } = await supabase
    .from('voice_triggers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, trigger: data }
}

async function deleteVoiceTrigger(ctx: ToolContext, args: Record<string, unknown>) {
  const id = args.id as string
  const supabase = ctx.getClient().schema(SCHEMA)

  const { error } = await supabase
    .from('voice_triggers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id, deactivated: true }
}

async function processVoiceInput(ctx: ToolContext, args: Record<string, unknown>) {
  const text = (args.text as string).trim()
  const entitySlug = args.entity_slug as string | undefined
  const supabase = ctx.getClient().schema(SCHEMA)

  let query = supabase
    .from('voice_triggers')
    .select('*')
    .eq('is_active', true)

  if (entitySlug) {
    query = query.or(`entity_slug.eq.${entitySlug},entity_slug.is.null`)
  }

  const { data: triggers, error } = await query

  if (error) {
    return { matched: false, text, error: error.message }
  }

  if (!triggers || triggers.length === 0) {
    return { matched: false, text, reason: 'no_triggers_configured' }
  }

  const inputLower = text.toLowerCase()

  for (const trigger of triggers) {
    const phrase = (trigger.trigger_phrase as string).toLowerCase()
    let isMatch = false

    switch (trigger.match_type) {
      case 'exact':
        isMatch = inputLower === phrase
        break

      case 'fuzzy': {
        const threshold = Number(trigger.fuzzy_threshold) || 0.8
        // Check sliding windows of the input against the trigger phrase
        const words = inputLower.split(/\s+/)
        const phraseWords = phrase.split(/\s+/)
        const windowSize = phraseWords.length

        for (let i = 0; i <= words.length - windowSize; i++) {
          const window = words.slice(i, i + windowSize).join(' ')
          const similarity = levenshteinSimilarity(window, phrase)
          if (similarity >= threshold) {
            isMatch = true
            break
          }
        }

        // Also check the full input against the phrase
        if (!isMatch) {
          const fullSim = levenshteinSimilarity(inputLower, phrase)
          if (fullSim >= threshold) {
            isMatch = true
          }
        }
        break
      }

      case 'regex': {
        try {
          const re = new RegExp(trigger.trigger_phrase, 'i')
          isMatch = re.test(text)
        } catch {
          // Invalid regex — skip
        }
        break
      }
    }

    if (isMatch) {
      return {
        matched: true,
        trigger: {
          id: trigger.id,
          trigger_phrase: trigger.trigger_phrase,
          match_type: trigger.match_type,
          description: trigger.description,
        },
        action: {
          type: trigger.action_type,
          payload: trigger.action_payload,
        },
        original_text: text,
      }
    }
  }

  return { matched: false, text }
}

async function compareProviders(ctx: ToolContext, args: Record<string, unknown>) {
  const since = args.since as string | undefined
  const until = args.until as string | undefined
  const supabase = ctx.getClient().schema(SCHEMA)

  let query = supabase
    .from('transcription_metrics')
    .select('*')

  if (since) query = query.gte('created_at', since)
  if (until) query = query.lte('created_at', until)

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    return { success: true, message: 'No transcription metrics found', providers: {} }
  }

  // Group by provider
  const grouped: Record<string, typeof data> = {}
  for (const row of data) {
    const p = row.provider as string
    if (!grouped[p]) grouped[p] = []
    grouped[p].push(row)
  }

  const providers: Record<string, unknown> = {}
  for (const [provider, rows] of Object.entries(grouped)) {
    const latencies = rows
      .map(r => r.transcription_latency_ms as number)
      .filter(v => v != null)
    const editDistances = rows
      .map(r => r.edit_distance as number)
      .filter(v => v != null)
    const costs = rows
      .map(r => Number(r.estimated_cost_usd))
      .filter(v => !isNaN(v))

    providers[provider] = {
      usage_count: rows.length,
      avg_latency_ms: latencies.length ? Math.round(avg(latencies)) : null,
      avg_edit_distance: editDistances.length ? Math.round(avg(editDistances) * 10) / 10 : null,
      total_cost_usd: costs.length ? Math.round(sum(costs) * 1000000) / 1000000 : 0,
    }
  }

  // Simple recommendation
  const providerNames = Object.keys(providers)
  let recommendation = 'Not enough data to recommend.'
  if (providerNames.length >= 2) {
    const scored = providerNames.map(p => {
      const stats = providers[p] as { avg_latency_ms: number | null; avg_edit_distance: number | null; usage_count: number }
      // Lower latency + lower edit distance = better
      const latencyScore = stats.avg_latency_ms != null ? stats.avg_latency_ms : 5000
      const editScore = stats.avg_edit_distance != null ? stats.avg_edit_distance * 100 : 500
      return { provider: p, score: latencyScore + editScore }
    })
    scored.sort((a, b) => a.score - b.score)
    recommendation = `${scored[0].provider} has the best combined latency + accuracy.`
  }

  return { success: true, providers, recommendation, total_records: data.length }
}

// =============================================================================
// HELPERS
// =============================================================================

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}
