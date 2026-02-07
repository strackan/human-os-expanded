/**
 * Outreach Tools
 *
 * MCP tools for generating personalized LinkedIn outreach in a founder's voice.
 * Multi-tenant: any founder with a voice profile can use it.
 * Designed for the GFT LinkedIn plugin but usable by any MCP client.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext, ToolHandler } from '../lib/context.js'

const VOICE_SCHEMA = 'human_os'
const CRM_SCHEMA = 'crm'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const outreachTools: Tool[] = [
  {
    name: 'draft_connection_request',
    description: `Generate a personalized LinkedIn connection request in a founder's voice.

Uses Voice OS commandments (VOICE, GUARDRAILS, OPENINGS) to ghostwrite as any founder with a voice profile.
Optionally logs the outreach to a CRM campaign.

Example: "Draft a connection request as Scott Leese to Jane Smith, VP Sales at Acme"`,
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'Whose voice to use (e.g., "justin", "scott-leese")',
        },
        target: {
          type: 'object',
          description: 'Target person info for personalization',
          properties: {
            name: { type: 'string', description: "Target person's name" },
            headline: { type: 'string', description: 'LinkedIn headline' },
            company: { type: 'string', description: 'Current company' },
            recent_activity: {
              type: 'string',
              description: 'Recent post or activity for personalization hook',
            },
            mutual_connections: {
              type: 'number',
              description: 'Count of shared connections',
            },
            reason_for_connecting: {
              type: 'string',
              description: 'Campaign context or shared interest',
            },
          },
          required: ['name'],
        },
        campaign_id: {
          type: 'string',
          description: 'Auto-log outreach to this CRM campaign',
        },
        member_id: {
          type: 'string',
          description: 'Campaign member to update (required if campaign_id set)',
        },
        tone_override: {
          type: 'string',
          enum: ['warm', 'professional', 'casual', 'direct'],
          description: 'Override the default voice tone',
        },
        max_length: {
          type: 'number',
          description: 'Max character count (default 300, LinkedIn limit)',
        },
      },
      required: ['entity_slug', 'target'],
    },
  },
]

// =============================================================================
// TYPES
// =============================================================================

interface TargetInfo {
  name: string
  headline?: string
  company?: string
  recent_activity?: string
  mutual_connections?: number
  reason_for_connecting?: string
}

interface VoiceCommandment {
  commandment_type: string
  content: string
  frontmatter?: Record<string, unknown>
}

interface VoiceProfile {
  id: string
  display_name: string
  description?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export const handleOutreachTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => {
  if (name !== 'draft_connection_request') {
    return null
  }

  return draftConnectionRequest(ctx, args)
}

// =============================================================================
// IMPLEMENTATION
// =============================================================================

async function draftConnectionRequest(
  ctx: ToolContext,
  args: Record<string, unknown>
) {
  const entitySlug = args.entity_slug as string
  const target = args.target as TargetInfo
  const campaignId = args.campaign_id as string | undefined
  const memberId = args.member_id as string | undefined
  const toneOverride = args.tone_override as string | undefined
  const maxLength = (args.max_length as number) || 300

  // Step 1: Validate inputs
  if (!entitySlug) {
    return { success: false, error: 'entity_slug is required' }
  }
  if (!target?.name) {
    return { success: false, error: 'target.name is required' }
  }
  if (campaignId && !memberId) {
    return {
      success: false,
      error: 'member_id is required when campaign_id is provided',
    }
  }

  const supabase = ctx.getClient()
  const schema = supabase.schema(VOICE_SCHEMA)

  // Step 2: Fetch voice profile
  const { data: profiles, error: profileError } = await schema
    .from('voice_profiles')
    .select('id, display_name, description')
    .eq('entity_slug', entitySlug)
    .or(`layer.eq.public,layer.eq.${ctx.layer}`)
    .limit(1)

  const profile = profiles?.[0] as VoiceProfile | undefined
  if (profileError || !profile) {
    return {
      success: false,
      error: `Voice profile not found: ${entitySlug}`,
    }
  }

  // Fetch only the 3 commandments needed for connection requests
  const { data: commandments, error: cmdError } = await schema
    .from('voice_commandments')
    .select('commandment_type, content, frontmatter')
    .eq('profile_id', profile.id)
    .in('commandment_type', ['VOICE', 'GUARDRAILS', 'OPENINGS'])

  if (cmdError) {
    return { success: false, error: `Failed to fetch commandments: ${cmdError.message}` }
  }

  const cmdMap = new Map<string, VoiceCommandment>()
  for (const cmd of (commandments || []) as VoiceCommandment[]) {
    cmdMap.set(cmd.commandment_type, cmd)
  }

  const commandmentsUsed = Array.from(cmdMap.keys())

  // Step 3: Build system prompt
  const systemPrompt = buildSystemPrompt(
    profile,
    cmdMap,
    toneOverride,
    maxLength
  )

  // Step 4: Build user prompt
  const userPrompt = buildUserPrompt(target)

  // Step 5: Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    }
  }

  const anthropic = new Anthropic({ apiKey })

  let draft: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250501',
      max_tokens: 256,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const firstBlock = response.content[0]
    draft =
      firstBlock && firstBlock.type === 'text' ? firstBlock.text.trim() : ''

    if (!draft) {
      return { success: false, error: 'LLM returned empty response' }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown LLM error'
    return { success: false, error: `LLM call failed: ${message}` }
  }

  // Step 6: Truncate at sentence boundary if over limit
  if (draft.length > maxLength) {
    draft = truncateAtSentence(draft, maxLength)
  }

  // Step 7: Optionally log to CRM campaign
  let campaignLogged: {
    activityId: string
    memberStatusUpdated: boolean
  } | null = null

  if (campaignId && memberId) {
    campaignLogged = await logToCampaign(ctx, campaignId, memberId, draft)
  }

  // Step 8: Return structured response
  return {
    success: true,
    draft,
    character_count: draft.length,
    voice_profile: profile.display_name,
    target_name: target.name,
    commandments_used: commandmentsUsed,
    campaign_logged: campaignLogged,
  }
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

function buildSystemPrompt(
  profile: VoiceProfile,
  cmdMap: Map<string, VoiceCommandment>,
  toneOverride: string | undefined,
  maxLength: number
): string {
  const sections: string[] = []

  // 1. Identity
  sections.push(
    `You are ghostwriting a LinkedIn connection request as ${profile.display_name}.` +
      (profile.description ? ` Context: ${profile.description}` : '')
  )

  // 2. VOICE commandment
  const voice = cmdMap.get('VOICE')
  if (voice) {
    sections.push(`## VOICE\n${voice.content}`)
  }

  // 3. GUARDRAILS commandment
  const guardrails = cmdMap.get('GUARDRAILS')
  if (guardrails) {
    sections.push(`## GUARDRAILS\n${guardrails.content}`)
  }

  // 4. OPENINGS commandment
  const openings = cmdMap.get('OPENINGS')
  if (openings) {
    sections.push(`## OPENINGS\n${openings.content}`)
  }

  // 5. Tone override
  if (toneOverride) {
    sections.push(`## TONE OVERRIDE\nAdjust the voice to be more: ${toneOverride}`)
  }

  // 6. Generation rules
  sections.push(`## GENERATION RULES
- Maximum ${maxLength} characters
- 2-3 sentences max
- Return ONLY the message text, nothing else
- No "I'd love to connect" or similar generic phrases
- No exclamation marks unless the voice profile explicitly uses them
- No hashtags
- No emojis unless the voice profile explicitly uses them
- Lead with something specific to the target, not about yourself
- Sound like a real human, not a template`)

  return sections.join('\n\n')
}

function buildUserPrompt(target: TargetInfo): string {
  const parts: string[] = [`Write a connection request to ${target.name}.`]

  if (target.headline) {
    parts.push(`Their headline: ${target.headline}`)
  }
  if (target.company) {
    parts.push(`Company: ${target.company}`)
  }
  if (target.recent_activity) {
    parts.push(`Recent activity: ${target.recent_activity}`)
  }
  if (target.mutual_connections) {
    parts.push(`Mutual connections: ${target.mutual_connections}`)
  }
  if (target.reason_for_connecting) {
    parts.push(`Reason for connecting: ${target.reason_for_connecting}`)
  }

  parts.push('\nReturn ONLY the message text.')

  return parts.join('\n')
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Truncate text at the last sentence boundary within the character limit.
 */
function truncateAtSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  // Find the last sentence-ending punctuation
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastEnd = Math.max(lastPeriod, lastQuestion)

  if (lastEnd > 0) {
    return truncated.slice(0, lastEnd + 1)
  }

  // Fallback: truncate at last space
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated
}

/**
 * Log the connection request draft to a CRM campaign.
 */
async function logToCampaign(
  ctx: ToolContext,
  campaignId: string,
  memberId: string,
  messageContent: string
): Promise<{ activityId: string; memberStatusUpdated: boolean }> {
  const crmSchema = ctx.getClient().schema(CRM_SCHEMA)

  // Insert activity
  const { data: activity, error: activityError } = await crmSchema
    .from('campaign_activities')
    .insert({
      campaign_id: campaignId,
      member_id: memberId,
      activity_type: 'linkedin_connect',
      message_content: messageContent,
      outcome: 'sent',
      performed_by: ctx.userUUID,
    })
    .select('id')
    .single()

  if (activityError) {
    console.error('[outreach] Failed to log activity:', activityError.message)
    return { activityId: '', memberStatusUpdated: false }
  }

  // Update member status from pending → contacted
  const { error: memberError } = await crmSchema
    .from('campaign_members')
    .update({
      status: 'contacted',
      last_contacted_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('status', 'pending')

  return {
    activityId: activity.id,
    memberStatusUpdated: !memberError,
  }
}
