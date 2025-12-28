/**
 * Skills Search Tools
 *
 * MCP tools for PowerPak skills search and management.
 * Enables searching SKILL.md files and their tools/programs.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext, ToolHandler } from '../lib/context.js'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const skillsTools: Tool[] = [
  {
    name: 'search_skills',
    description: 'Search for skills by name, description, or tool. Returns matching SKILL.md files with their tools and programs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches name, description, tool names)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        tier: {
          type: 'string',
          enum: ['free', 'pro', 'enterprise'],
          description: 'Filter by tier',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_skills_files',
    description: 'List all available SKILL.md files. Use to discover what skills are available.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          description: 'Privacy layer filter',
        },
        source_system: {
          type: 'string',
          description: 'Source system filter (e.g., "powerpak")',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_skill_file',
    description: 'Get a complete SKILL.md file with all its tools and programs.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'UUID of the skills file',
        },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'search_tools',
    description: 'Search for specific tools across all SKILL.md files by tool name.',
    inputSchema: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Tool name to search for (partial match)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 20)',
        },
      },
      required: ['tool_name'],
    },
  },
  {
    name: 'get_entity_skills',
    description: 'Get all SKILL.md files associated with an entity (person/expert).',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: {
          type: 'string',
          description: 'UUID of the entity',
        },
      },
      required: ['entity_id'],
    },
  },
]

// =============================================================================
// HANDLER
// =============================================================================

export const handleSkillsTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => {
  const supabase = ctx.getClient()
  const { layer } = ctx

  switch (name) {
    case 'search_skills': {
      const query = args.query as string
      const tags = args.tags as string[] | undefined
      const tier = args.tier as string | undefined
      const limit = (args.limit as number) || 20

      // Build the search query
      let dbQuery = supabase
        .from('context_files')
        .select(`
          id,
          layer,
          file_path,
          frontmatter,
          tools_count,
          programs_count,
          source_system,
          updated_at
        `)
        .eq('file_type', 'skills')
        .or(`layer.eq.public,layer.eq.${layer}`)
        .limit(limit)

      // Add text search on frontmatter
      // Note: This is a simplified search. Production would use full-text search
      dbQuery = dbQuery.or(
        `frontmatter->>name.ilike.%${query}%,` +
        `frontmatter->>description.ilike.%${query}%,` +
        `frontmatter->>slug.ilike.%${query}%`
      )

      if (tier) {
        dbQuery = dbQuery.eq('frontmatter->>tier', tier)
      }

      const { data: files, error } = await dbQuery

      if (error) {
        return { error: error.message }
      }

      // Filter by tags if provided
      let results: Record<string, unknown>[] = (files || []) as Record<string, unknown>[]
      if (tags && tags.length > 0) {
        results = results.filter((f: Record<string, unknown>) => {
          const fileTags = (f.frontmatter as Record<string, unknown>)?.tags as string[] || []
          return tags.some(t => fileTags.includes(t))
        })
      }

      // Also search in skills_tools table
      const { data: toolMatches, error: toolError } = await supabase.rpc(
        'search_skills_by_tool',
        { p_tool_name: query, p_layer: layer, p_limit: limit }
      )

      if (!toolError && toolMatches) {
        // Add unique file IDs from tool matches
        const existingIds = new Set(results.map((r) => r.id))
        for (const match of toolMatches) {
          if (!existingIds.has(match.file_id)) {
            results.push({
              id: match.file_id,
              file_path: match.file_path,
              layer: match.layer,
              matched_tool: match.tool_name,
            })
          }
        }
      }

      return {
        results: results.map((f: Record<string, unknown>) => ({
          id: f.id,
          name: (f.frontmatter as Record<string, unknown>)?.name,
          slug: (f.frontmatter as Record<string, unknown>)?.slug,
          description: (f.frontmatter as Record<string, unknown>)?.description,
          tier: (f.frontmatter as Record<string, unknown>)?.tier || 'free',
          tags: (f.frontmatter as Record<string, unknown>)?.tags || [],
          toolsCount: f.tools_count,
          programsCount: f.programs_count,
          matchedTool: f.matched_tool,
        })),
        total: results.length,
      }
    }

    case 'list_skills_files': {
      const filterLayer = (args.layer as string) || layer
      const sourceSystem = args.source_system as string | undefined
      const limit = (args.limit as number) || 50

      const { data, error } = await supabase.rpc('get_skills_files', {
        p_layer: filterLayer,
        p_source_system: sourceSystem,
        p_limit: limit,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        files: (data || []).map((f: Record<string, unknown>) => ({
          id: f.id,
          name: (f.frontmatter as Record<string, unknown>)?.name,
          slug: (f.frontmatter as Record<string, unknown>)?.slug,
          tier: (f.frontmatter as Record<string, unknown>)?.tier || 'free',
          toolsCount: f.tools_count,
          programsCount: f.programs_count,
          sourceSystem: f.source_system,
          updatedAt: f.updated_at,
        })),
        total: data?.length || 0,
      }
    }

    case 'get_skill_file': {
      const fileId = args.file_id as string

      const { data, error } = await supabase.rpc('get_skills_file_detail', {
        p_file_id: fileId,
      })

      if (error) {
        return { error: error.message }
      }

      if (!data || data.length === 0) {
        return { error: `Skills file not found: ${fileId}` }
      }

      const file = data[0]
      return {
        file: {
          id: file.id,
          filePath: file.file_path,
          layer: file.layer,
          frontmatter: file.frontmatter,
          tools: file.tools,
          programs: file.programs,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        },
      }
    }

    case 'search_tools': {
      const toolName = args.tool_name as string
      const limit = (args.limit as number) || 20

      const { data, error } = await supabase.rpc('search_skills_by_tool', {
        p_tool_name: toolName,
        p_layer: layer,
        p_limit: limit,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        tools: (data || []).map((t: Record<string, unknown>) => ({
          fileId: t.file_id,
          filePath: t.file_path,
          layer: t.layer,
          toolId: t.tool_id,
          toolName: t.tool_name,
          toolDescription: t.tool_description,
        })),
        total: data?.length || 0,
      }
    }

    case 'get_entity_skills': {
      const entityId = args.entity_id as string

      const { data, error } = await supabase.rpc('get_entity_skills', {
        p_entity_id: entityId,
      })

      if (error) {
        return { error: error.message }
      }

      return {
        files: (data || []).map((f: Record<string, unknown>) => ({
          id: f.id,
          name: (f.frontmatter as Record<string, unknown>)?.name,
          slug: (f.frontmatter as Record<string, unknown>)?.slug,
          toolsCount: f.tools_count,
          programsCount: f.programs_count,
        })),
        total: data?.length || 0,
      }
    }

    default:
      return null
  }
}
