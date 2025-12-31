/**
 * Mood Tools
 *
 * MCP tools for browsing and searching the Plutchik-based mood system.
 * These tools provide access to mood definitions and categories for
 * mood tracking, journaling, and emotional awareness features.
 *
 * Available across all Human OS products (Founder OS, Renubu, etc.)
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

/** Schema where mood tables live */
const HUMAN_OS_SCHEMA = 'human_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const moodTools: Tool[] = [
  {
    name: 'list_mood_categories',
    description: `List available mood categories for organizing and filtering emotions.
Categories are grouped by type:
- life_domain: Career, relationships, health, etc.
- emotional_type: Joy-based, fear-based, anger-based, etc. (Plutchik)
- intensity_level: Mild, moderate, intense
- context: Daily life, special events, crisis situations`,
    inputSchema: {
      type: 'object',
      properties: {
        category_type: {
          type: 'string',
          enum: ['life_domain', 'emotional_type', 'intensity_level', 'context'],
          description: 'Filter by category type',
        },
      },
    },
  },
  {
    name: 'get_moods_by_category',
    description: `Get all moods belonging to a specific category.
Useful for presenting mood options filtered by context (e.g., "show me work-related emotions").`,
    inputSchema: {
      type: 'object',
      properties: {
        category_slug: {
          type: 'string',
          description: 'Category slug (e.g., "career", "joy-emotions", "crisis")',
        },
      },
      required: ['category_slug'],
    },
  },
  {
    name: 'search_moods',
    description: `Search moods with optional filters. Find moods by name, valence (positive/negative),
intensity level, or category type.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to match mood names (partial match)',
        },
        category_type: {
          type: 'string',
          enum: ['life_domain', 'emotional_type', 'intensity_level', 'context'],
          description: 'Filter by category type',
        },
        min_valence: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Minimum valence (1=negative, 10=positive)',
        },
        max_valence: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Maximum valence',
        },
        min_intensity: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Minimum intensity (1=mild, 10=extreme)',
        },
        max_intensity: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Maximum intensity',
        },
      },
    },
  },
  {
    name: 'get_mood_details',
    description: `Get detailed information about a specific mood including its Plutchik dimensions,
intensity, valence, and all linked categories.`,
    inputSchema: {
      type: 'object',
      properties: {
        mood_name: {
          type: 'string',
          description: 'Mood name (e.g., "Joy", "Anxious", "Overwhelmed")',
        },
      },
      required: ['mood_name'],
    },
  },
  {
    name: 'list_core_moods',
    description: `List the core Plutchik emotions and their primary dyads.
These are the foundational emotions from which all others derive.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_mood_suggestions',
    description: `Get mood suggestions based on valence and arousal.
Useful for guiding users to identify their current emotional state.`,
    inputSchema: {
      type: 'object',
      properties: {
        valence: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
          description: 'General feeling direction',
        },
        energy: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Energy/arousal level',
        },
        limit: {
          type: 'number',
          description: 'Max suggestions. Default 10.',
        },
      },
      required: ['valence', 'energy'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListCategoriesSchema = z.object({
  category_type: z
    .enum(['life_domain', 'emotional_type', 'intensity_level', 'context'])
    .optional(),
});

const GetMoodsByCategorySchema = z.object({
  category_slug: z.string().min(1),
});

const SearchMoodsSchema = z.object({
  query: z.string().optional(),
  category_type: z
    .enum(['life_domain', 'emotional_type', 'intensity_level', 'context'])
    .optional(),
  min_valence: z.number().min(1).max(10).optional(),
  max_valence: z.number().min(1).max(10).optional(),
  min_intensity: z.number().min(1).max(10).optional(),
  max_intensity: z.number().min(1).max(10).optional(),
});

const GetMoodDetailsSchema = z.object({
  mood_name: z.string().min(1),
});

const GetSuggestionsSchema = z.object({
  valence: z.enum(['positive', 'negative', 'neutral']),
  energy: z.enum(['high', 'medium', 'low']),
  limit: z.number().optional(),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function handleMoodTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(HUMAN_OS_SCHEMA);

  switch (name) {
    case 'list_mood_categories': {
      const input = ListCategoriesSchema.parse(args);

      let query = schema
        .from('mood_categories')
        .select('id, name, slug, description, color_hex, icon_name, category_type, display_order')
        .eq('is_active', true)
        .order('display_order');

      if (input.category_type) {
        query = query.eq('category_type', input.category_type);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list mood categories: ${error.message}`);
      }

      // Group by category type
      const grouped: Record<string, typeof data> = {};
      for (const cat of data || []) {
        const type = cat.category_type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(cat);
      }

      return {
        categories: grouped,
        totalCount: data?.length || 0,
        types: Object.keys(grouped),
      };
    }

    case 'get_moods_by_category': {
      const input = GetMoodsByCategorySchema.parse(args);

      // Use the helper function
      const { data, error } = await supabase.rpc('get_moods_by_category', {
        p_category_slug: input.category_slug,
      });

      if (error) {
        throw new Error(`Failed to get moods by category: ${error.message}`);
      }

      // Get category info
      const { data: category } = await schema
        .from('mood_categories')
        .select('name, description, color_hex, category_type')
        .eq('slug', input.category_slug)
        .single();

      return {
        category: category
          ? {
              name: category.name,
              description: category.description,
              color: category.color_hex,
              type: category.category_type,
            }
          : null,
        moods: (data || []).map((m: Record<string, unknown>) => ({
          id: m.mood_id,
          name: m.mood_name,
          valence: m.valence,
          intensity: m.intensity,
          color: m.color_hex,
          plutchik: {
            joy: m.joy_rating,
            trust: m.trust_rating,
            fear: m.fear_rating,
            surprise: m.surprise_rating,
            sadness: m.sadness_rating,
            anticipation: m.anticipation_rating,
            anger: m.anger_rating,
            disgust: m.disgust_rating,
          },
        })),
        count: data?.length || 0,
      };
    }

    case 'search_moods': {
      const input = SearchMoodsSchema.parse(args);

      // Use the helper function
      const { data, error } = await supabase.rpc('search_moods', {
        p_search_term: input.query || null,
        p_category_type: input.category_type || null,
        p_min_valence: input.min_valence || null,
        p_max_valence: input.max_valence || null,
        p_min_intensity: input.min_intensity || null,
        p_max_intensity: input.max_intensity || null,
      });

      if (error) {
        throw new Error(`Failed to search moods: ${error.message}`);
      }

      return {
        moods: (data || []).map((m: Record<string, unknown>) => ({
          id: m.mood_id,
          name: m.mood_name,
          category: m.category,
          valence: m.valence,
          intensity: m.intensity,
          color: m.color_hex,
        })),
        count: data?.length || 0,
        filters: {
          query: input.query,
          categoryType: input.category_type,
          valenceRange:
            input.min_valence || input.max_valence
              ? [input.min_valence || 1, input.max_valence || 10]
              : null,
          intensityRange:
            input.min_intensity || input.max_intensity
              ? [input.min_intensity || 1, input.max_intensity || 10]
              : null,
        },
      };
    }

    case 'get_mood_details': {
      const input = GetMoodDetailsSchema.parse(args);

      // Use the helper function
      const { data, error } = await supabase.rpc('get_mood_details', {
        p_mood_name: input.mood_name,
      });

      if (error) {
        throw new Error(`Failed to get mood details: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'MOOD_NOT_FOUND',
          message: `Mood "${input.mood_name}" not found. Try searching with search_moods.`,
        };
      }

      const m = data[0];
      return {
        id: m.mood_id,
        name: m.mood_name,
        isCore: m.is_core,
        color: m.color_hex,
        dimensions: {
          valence: m.valence,
          intensity: m.intensity,
          arousal: m.arousal_level,
          dominance: m.dominance,
        },
        plutchik: {
          joy: m.joy_rating,
          trust: m.trust_rating,
          fear: m.fear_rating,
          surprise: m.surprise_rating,
          sadness: m.sadness_rating,
          anticipation: m.anticipation_rating,
          anger: m.anger_rating,
          disgust: m.disgust_rating,
        },
        categories: m.categories,
      };
    }

    case 'list_core_moods': {
      const { data, error } = await schema
        .from('mood_definitions')
        .select('id, name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, valence, color_hex')
        .eq('is_core', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to list core moods: ${error.message}`);
      }

      // Separate primary and dyads
      const primary = (data || []).filter(
        (m) =>
          [m.joy_rating, m.trust_rating, m.fear_rating, m.surprise_rating, m.sadness_rating, m.anticipation_rating, m.anger_rating, m.disgust_rating].filter((r) => r >= 8).length === 1
      );

      const dyads = (data || []).filter(
        (m) =>
          [m.joy_rating, m.trust_rating, m.fear_rating, m.surprise_rating, m.sadness_rating, m.anticipation_rating, m.anger_rating, m.disgust_rating].filter((r) => r >= 6).length >= 2
      );

      return {
        primaryEmotions: primary.map((m) => ({
          name: m.name,
          color: m.color_hex,
          valence: m.valence,
        })),
        primaryDyads: dyads.map((m) => ({
          name: m.name,
          color: m.color_hex,
          valence: m.valence,
        })),
        description:
          'Plutchik identified 8 primary emotions arranged in opposing pairs. Dyads are combinations of adjacent primary emotions.',
      };
    }

    case 'get_mood_suggestions': {
      const input = GetSuggestionsSchema.parse(args);
      const limit = input.limit || 10;

      // Map inputs to valence and arousal ranges
      const valenceRange =
        input.valence === 'positive'
          ? [6, 10]
          : input.valence === 'negative'
            ? [1, 4]
            : [4, 6];

      const arousalRange =
        input.energy === 'high'
          ? [7, 10]
          : input.energy === 'low'
            ? [1, 4]
            : [4, 7];

      const { data, error } = await schema
        .from('mood_definitions')
        .select('id, name, valence, arousal_level, intensity, color_hex, category')
        .gte('valence', valenceRange[0])
        .lte('valence', valenceRange[1])
        .gte('arousal_level', arousalRange[0])
        .lte('arousal_level', arousalRange[1])
        .order('name')
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get mood suggestions: ${error.message}`);
      }

      return {
        suggestions: (data || []).map((m) => ({
          name: m.name,
          valence: m.valence,
          arousal: m.arousal_level,
          intensity: m.intensity,
          color: m.color_hex,
          category: m.category,
        })),
        count: data?.length || 0,
        criteria: {
          valence: input.valence,
          energy: input.energy,
          valenceRange,
          arousalRange,
        },
      };
    }

    default:
      return null;
  }
}
