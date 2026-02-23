/**
 * Identity Profile Tools
 *
 * MCP tools for managing the Identity Pack - the foundational identity layer
 * from The Sculptor conversation. Portable across all Human OS products.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';
import { getIdentityProfile, updateIdentityProfile } from '@human-os/services';

/** Schema where identity_profiles lives */
const IDENTITY_SCHEMA = 'human_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const identityTools: Tool[] = [
  {
    name: 'get_identity_profile',
    description: `Get the user's identity profile (Identity Pack). Contains core values, energy patterns,
communication style, and annual theme. This is the foundational layer for all goal-setting.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_identity_profile',
    description: `Update the user's identity profile. Use this after The Sculptor conversation
or when the user wants to update their core identity attributes.`,
    inputSchema: {
      type: 'object',
      properties: {
        core_values: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 core values (e.g., ["autonomy", "authenticity", "joy"])',
        },
        energy_patterns: {
          type: 'string',
          description: 'When/how energy flows (e.g., "night owl, burst worker, needs variety")',
        },
        communication_style: {
          type: 'string',
          description: 'How they communicate (e.g., "direct, warm, uses humor to disarm")',
        },
        interest_vectors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Interest areas (e.g., ["tech", "performing arts", "systems thinking"])',
        },
        relationship_orientation: {
          type: 'string',
          description: 'How they relate to others (e.g., "deep over wide, allergic to small talk")',
        },
        work_style: {
          type: 'string',
          description: 'How they work best (e.g., "sprinter not marathoner, needs deadlines")',
        },
        cognitive_profile: {
          type: 'string',
          description: 'Neurodivergent patterns if applicable (e.g., "ADHD+PDA, high novelty-seeking")',
        },
      },
    },
  },
  {
    name: 'set_annual_theme',
    description: `Set or update the annual theme. The theme answers "Who am I becoming this year?"
and should be grounded in the identity profile.`,
    inputSchema: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          description: 'The annual theme (e.g., "Sustainable founder", "Authentic connections")',
        },
        year: {
          type: 'number',
          description: 'The year (defaults to current year)',
        },
        context: {
          type: 'string',
          description: 'Why this theme - how it connects to identity and growth edge',
        },
      },
      required: ['theme'],
    },
  },
  {
    name: 'get_theme_history',
    description: 'Get past annual themes for reflection and pattern recognition.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateProfileSchema = z.object({
  core_values: z.array(z.string()).optional(),
  energy_patterns: z.string().optional(),
  communication_style: z.string().optional(),
  interest_vectors: z.array(z.string()).optional(),
  relationship_orientation: z.string().optional(),
  work_style: z.string().optional(),
  cognitive_profile: z.string().optional(),
});

const SetThemeSchema = z.object({
  theme: z.string(),
  year: z.number().optional(),
  context: z.string().optional(),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function handleIdentityTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(IDENTITY_SCHEMA);

  switch (name) {
    case 'get_identity_profile': {
      const serviceCtx = { supabase, userId: ctx.userUUID, layer: ctx.layer };
      const result = await getIdentityProfile(serviceCtx);

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        return {
          exists: false,
          message: 'No identity profile found. Use update_identity_profile to create one, ideally after The Sculptor conversation.',
        };
      }

      const data = result.data;
      return {
        exists: true,
        profile: {
          coreValues: data.core_values,
          energyPatterns: data.energy_patterns,
          communicationStyle: data.communication_style,
          interestVectors: data.interest_vectors,
          relationshipOrientation: data.relationship_orientation,
          workStyle: data.work_style,
          cognitiveProfile: data.cognitive_profile,
          sculptorCompletedAt: data.sculptor_completed_at,
        },
        annualTheme: data.annual_theme ? {
          theme: data.annual_theme,
          year: data.annual_theme_year,
          context: data.annual_theme_context,
        } : null,
      };
    }

    case 'update_identity_profile': {
      const input = UpdateProfileSchema.parse(args);

      const serviceCtx = { supabase, userId: ctx.userUUID, layer: ctx.layer };
      const result = await updateIdentityProfile(serviceCtx, input);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update identity profile');
      }

      const data = result.data;
      return {
        success: true,
        message: 'Identity profile updated.',
        profile: {
          coreValues: data.core_values,
          energyPatterns: data.energy_patterns,
          communicationStyle: data.communication_style,
          interestVectors: data.interest_vectors,
          relationshipOrientation: data.relationship_orientation,
          workStyle: data.work_style,
          cognitiveProfile: data.cognitive_profile,
        },
      };
    }

    case 'set_annual_theme': {
      const input = SetThemeSchema.parse(args);
      const year = input.year || new Date().getFullYear();

      // First, get current profile to archive old theme
      const { data: current } = await schema
        .from('identity_profiles')
        .select('annual_theme, annual_theme_year, annual_theme_context, theme_history')
        .eq('user_id', ctx.userUUID)
        .single();

      // Build theme history
      let themeHistory = current?.theme_history || [];
      if (current?.annual_theme && current?.annual_theme_year && current.annual_theme_year !== year) {
        themeHistory = [
          ...themeHistory,
          {
            year: current.annual_theme_year,
            theme: current.annual_theme,
            context: current.annual_theme_context,
          },
        ];
      }

      // Upsert with new theme
      const { error } = await schema
        .from('identity_profiles')
        .upsert({
          user_id: ctx.userUUID,
          layer: ctx.layer,
          annual_theme: input.theme,
          annual_theme_year: year,
          annual_theme_context: input.context || null,
          theme_history: themeHistory,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        throw new Error(`Failed to set annual theme: ${error.message}`);
      }

      return {
        success: true,
        theme: input.theme,
        year,
        context: input.context,
        message: `Annual theme for ${year} set to "${input.theme}"`,
      };
    }

    case 'get_theme_history': {
      const { data, error } = await schema
        .from('identity_profiles')
        .select('annual_theme, annual_theme_year, annual_theme_context, theme_history')
        .eq('user_id', ctx.userUUID)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get theme history: ${error.message}`);
      }

      const history = data?.theme_history || [];
      const current = data?.annual_theme ? {
        year: data.annual_theme_year,
        theme: data.annual_theme,
        context: data.annual_theme_context,
      } : null;

      return {
        current,
        history,
        totalYears: history.length + (current ? 1 : 0),
      };
    }

    default:
      return null;
  }
}
