/**
 * Voice Profile Tools
 *
 * MCP tools for VoiceOS - voice profile management and content generation.
 * Based on the "10 Commandments" architecture from Voice-OS.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext, ToolHandler } from '../lib/context.js'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const voiceTools: Tool[] = [
  {
    name: 'list_voice_profiles',
    description: 'List available voice profiles for content generation. Returns profiles with their completeness status.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer filter (optional)',
        },
      },
    },
  },
  {
    name: 'get_voice_profile',
    description: 'Get a complete voice profile with all its commandments. Use entity_slug like "scott-leese" or "justin".',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'Entity slug identifier (e.g., "scott-leese", "justin")',
        },
      },
      required: ['entity_slug'],
    },
  },
  {
    name: 'get_voice_commandment',
    description: 'Get a specific commandment from a voice profile. Commandment types: THEMES, VOICE, GUARDRAILS, STORIES, ANECDOTES, OPENINGS, MIDDLES, ENDINGS, BLENDS, EXAMPLES.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'Entity slug identifier',
        },
        commandment_type: {
          type: 'string',
          enum: ['THEMES', 'VOICE', 'GUARDRAILS', 'STORIES', 'ANECDOTES', 'OPENINGS', 'MIDDLES', 'ENDINGS', 'BLENDS', 'EXAMPLES'],
          description: 'Type of commandment to retrieve',
        },
      },
      required: ['entity_slug', 'commandment_type'],
    },
  },
  {
    name: 'create_voice_profile',
    description: 'Create a new voice profile for an entity.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'URL-friendly identifier (e.g., "john-doe")',
        },
        display_name: {
          type: 'string',
          description: 'Human-readable name (e.g., "John Doe")',
        },
        description: {
          type: 'string',
          description: 'Brief bio or context about this voice',
        },
        layer: {
          type: 'string',
          description: 'Privacy layer (default: founder layer)',
        },
      },
      required: ['entity_slug', 'display_name'],
    },
  },
  {
    name: 'upsert_voice_commandment',
    description: 'Create or update a commandment for a voice profile. Content should be markdown with YAML frontmatter.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: {
          type: 'string',
          description: 'Entity slug identifier',
        },
        commandment_type: {
          type: 'string',
          enum: ['THEMES', 'VOICE', 'GUARDRAILS', 'STORIES', 'ANECDOTES', 'OPENINGS', 'MIDDLES', 'ENDINGS', 'BLENDS', 'EXAMPLES'],
          description: 'Type of commandment',
        },
        content: {
          type: 'string',
          description: 'Full commandment content with YAML frontmatter',
        },
      },
      required: ['entity_slug', 'commandment_type', 'content'],
    },
  },
  {
    name: 'search_voice_profiles',
    description: 'Search voice profiles by name or description.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
]

// =============================================================================
// HANDLER
// =============================================================================

export const handleVoiceTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => {
  const supabase = ctx.getClient()
  const { layer } = ctx

  switch (name) {
    case 'list_voice_profiles': {
      const filterLayer = (args.layer as string) || layer

      const { data, error } = await supabase.rpc('list_voice_profiles', {
        p_layer: filterLayer,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        profiles: data || [],
        total: data?.length || 0,
      }
    }

    case 'get_voice_profile': {
      const entitySlug = args.entity_slug as string

      const { data, error } = await supabase.rpc('get_voice_profile_full', {
        p_entity_slug: entitySlug,
        p_layer: layer,
      })

      if (error) {
        return { error: error.message }
      }

      if (!data || data.length === 0) {
        return { error: `Voice profile not found: ${entitySlug}` }
      }

      const profile = data[0]
      return {
        profile: {
          id: profile.profile_id,
          entitySlug: profile.entity_slug,
          displayName: profile.display_name,
          description: profile.description,
          layer: profile.layer,
          completeness: profile.completeness,
        },
        commandments: profile.commandments,
        commandmentCount: Object.keys(profile.commandments || {}).length,
      }
    }

    case 'get_voice_commandment': {
      const entitySlug = args.entity_slug as string
      const commandmentType = args.commandment_type as string

      // First get the profile
      const { data: profiles, error: profileError } = await supabase
        .from('voice_profiles')
        .select('id')
        .eq('entity_slug', entitySlug)
        .or(`layer.eq.public,layer.eq.${layer}`)
        .limit(1)

      const profile = profiles?.[0]
      if (profileError || !profile) {
        return { error: `Voice profile not found: ${entitySlug}` }
      }

      // Then get the commandment
      const { data: commandment, error } = await supabase
        .from('voice_commandments')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('commandment_type', commandmentType)
        .maybeSingle()

      if (error) {
        return { error: error.message }
      }

      if (!commandment) {
        return { error: `Commandment ${commandmentType} not found for ${entitySlug}` }
      }

      return {
        commandment: {
          id: commandment.id,
          type: commandment.commandment_type,
          version: commandment.version,
          frontmatter: commandment.frontmatter,
          content: commandment.content,
          updatedAt: commandment.updated_at,
        },
      }
    }

    case 'create_voice_profile': {
      const entitySlug = args.entity_slug as string
      const displayName = args.display_name as string
      const description = args.description as string | undefined
      const profileLayer = (args.layer as string) || layer

      const { data, error } = await supabase
        .from('voice_profiles')
        .insert({
          entity_slug: entitySlug,
          display_name: displayName,
          description,
          layer: profileLayer,
          completeness: 0,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      return {
        created: true,
        profile: {
          id: data.id,
          entitySlug: data.entity_slug,
          displayName: data.display_name,
          description: data.description,
          layer: data.layer,
          completeness: 0,
        },
      }
    }

    case 'upsert_voice_commandment': {
      const entitySlug = args.entity_slug as string
      const commandmentType = args.commandment_type as string
      const content = args.content as string

      // Get the profile
      const { data: profiles, error: profileError } = await supabase
        .from('voice_profiles')
        .select('id')
        .eq('entity_slug', entitySlug)
        .or(`layer.eq.public,layer.eq.${layer}`)
        .limit(1)

      const foundProfile = profiles?.[0]
      if (profileError || !foundProfile) {
        return { error: `Voice profile not found: ${entitySlug}` }
      }

      const profileId = foundProfile.id

      // Parse frontmatter from content
      let frontmatter: Record<string, unknown> = {}
      let body = content

      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
      if (frontmatterMatch) {
        const yamlContent = frontmatterMatch[1] || ''
        body = (frontmatterMatch[2] || '').trim()

        // Simple YAML parsing
        const lines = yamlContent.split('\n')
        for (const line of lines) {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim()
            let value = line.slice(colonIndex + 1).trim()
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1)
            }
            frontmatter[key] = value
          }
        }
      }

      // Upsert the commandment
      const { data, error } = await supabase
        .from('voice_commandments')
        .upsert(
          {
            profile_id: profileId,
            commandment_type: commandmentType,
            frontmatter,
            content: body,
            version: (frontmatter.version as string) || '1.0',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'profile_id,commandment_type',
          }
        )
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      // Update profile completeness
      const { count } = await supabase
        .from('voice_commandments')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)

      const completeness = Math.min(100, Math.round(((count || 0) / 10) * 100))

      await supabase
        .from('voice_profiles')
        .update({ completeness, updated_at: new Date().toISOString() })
        .eq('id', profileId)

      return {
        upserted: true,
        commandment: {
          id: data.id,
          type: data.commandment_type,
          version: data.version,
        },
        profileCompleteness: completeness,
      }
    }

    case 'search_voice_profiles': {
      const query = args.query as string
      const limit = (args.limit as number) || 10

      const { data, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .or(`layer.eq.public,layer.eq.${layer}`)
        .or(`display_name.ilike.%${query}%,description.ilike.%${query}%,entity_slug.ilike.%${query}%`)
        .limit(limit)

      if (error) {
        return { error: error.message }
      }

      return {
        results: (data || []).map((p: Record<string, unknown>) => ({
          id: p.id,
          entitySlug: p.entity_slug,
          displayName: p.display_name,
          description: p.description,
          completeness: p.completeness,
        })),
        total: data?.length || 0,
      }
    }

    default:
      return null
  }
}
