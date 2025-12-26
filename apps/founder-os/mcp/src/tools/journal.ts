/**
 * Journal Tools
 *
 * MCP tools for journal creation, mood tracking, and entity linking.
 * Uses @human-os/journal package for backend logic.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';
import {
  createJournalService,
  createModeLoader,
  type JournalServiceContext,
} from '@human-os/journal';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const journalTools: Tool[] = [
  {
    name: 'create_journal_entry',
    description:
      'Create a new journal entry with AI-assisted mood analysis and entity linking. Analyzes content for emotions, themes, and mentioned people/entities. Returns the created entry with linked moods and entity mentions.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The journal entry content (markdown supported)',
        },
        title: {
          type: 'string',
          description: 'Optional title for the entry',
        },
        entry_type: {
          type: 'string',
          enum: ['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review'],
          description: 'Type of journal entry. Defaults to freeform.',
        },
        mode: {
          type: 'string',
          description: 'Optional mode/skill name used for this entry',
        },
        moods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Mood name (e.g., "Joy", "Anxious", "Grateful")' },
              intensity: { type: 'number', minimum: 1, maximum: 10, description: 'Intensity 1-10' },
            },
            required: ['name'],
          },
          description: 'Manually specified moods. AI will also analyze content for additional moods.',
        },
        entry_date: {
          type: 'string',
          description: 'Date of the entry (YYYY-MM-DD). Defaults to today.',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_journal_entry',
    description: 'Update an existing journal entry. Can update content, title, moods, or status.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Journal entry UUID',
        },
        content: {
          type: 'string',
          description: 'Updated content',
        },
        title: {
          type: 'string',
          description: 'Updated title',
        },
        moods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              intensity: { type: 'number', minimum: 1, maximum: 10 },
            },
            required: ['name'],
          },
          description: 'Updated moods (replaces existing)',
        },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          description: 'Update entry status',
        },
        reanalyze: {
          type: 'boolean',
          description: 'Re-run entity extraction on updated content. Defaults to false.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_journal_entry',
    description: 'Get a specific journal entry by ID with all linked moods and entities.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Journal entry UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_journal_entries',
    description: 'List journal entries with optional filters by date, mood, entry type.',
    inputSchema: {
      type: 'object',
      properties: {
        after: {
          type: 'string',
          description: 'Entries after this date (YYYY-MM-DD)',
        },
        before: {
          type: 'string',
          description: 'Entries before this date (YYYY-MM-DD)',
        },
        entry_type: {
          type: 'string',
          enum: ['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review'],
          description: 'Filter by entry type',
        },
        mood: {
          type: 'string',
          description: 'Filter by primary mood name (e.g., "Joy", "Anxious")',
        },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          description: 'Filter by status',
        },
        limit: {
          type: 'number',
          description: 'Max results. Default 20, max 50.',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
        },
      },
    },
  },
  {
    name: 'search_journal',
    description: 'Full-text search across journal entries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms',
        },
        limit: {
          type: 'number',
          description: 'Max results. Default 10.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_mood_trends',
    description: 'Get mood trends and insights over a time period. Analyzes emotional patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to analyze. Default 30.',
        },
      },
    },
  },
  {
    name: 'get_pending_leads',
    description: 'Get unresolved entity mentions (leads) from journal entries. These are people mentioned who could not be matched to existing contacts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resolve_journal_lead',
    description: 'Resolve a journal lead by linking to an existing entity or creating a new one.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'Lead UUID',
        },
        entity_id: {
          type: 'string',
          description: 'Existing entity UUID to link to',
        },
        create_entity: {
          type: 'object',
          properties: {
            entity_type: {
              type: 'string',
              enum: ['person', 'company', 'relationship'],
              description: 'Type of entity to create',
            },
            name: { type: 'string', description: 'Entity name' },
            email: { type: 'string', description: 'Optional email' },
            metadata: { type: 'object', description: 'Optional metadata' },
          },
          required: ['entity_type', 'name'],
          description: 'Create new entity instead of linking to existing',
        },
        ignore: {
          type: 'boolean',
          description: 'Mark lead as ignored (not a real person, analogy, etc.)',
        },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'load_journal_mode',
    description: 'Load a specific journaling mode (gratitude, mindfulness, etc.) to get prompts and guidance for the journaling session.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          description: 'Mode name: freeform, gratitude, mood_check, mindfulness, reflection, daily_review',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'list_journal_modes',
    description: 'List all available journaling modes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_emotion_recommendations',
    description: 'Get mood recommendations based on journal content. Analyzes text for emotional keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Journal content to analyze',
        },
      },
      required: ['content'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateEntrySchema = z.object({
  content: z.string(),
  title: z.string().optional(),
  entry_type: z
    .enum(['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review'])
    .optional(),
  mode: z.string().optional(),
  moods: z
    .array(
      z.object({
        name: z.string(),
        intensity: z.number().min(1).max(10).optional(),
      })
    )
    .optional(),
  entry_date: z.string().optional(),
});

const UpdateEntrySchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  title: z.string().optional(),
  moods: z
    .array(
      z.object({
        name: z.string(),
        intensity: z.number().min(1).max(10).optional(),
      })
    )
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  reanalyze: z.boolean().optional(),
});

const ListEntriesSchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
  entry_type: z
    .enum(['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review'])
    .optional(),
  mood: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

const SearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

const ResolveLeadSchema = z.object({
  lead_id: z.string(),
  entity_id: z.string().optional(),
  create_entity: z
    .object({
      entity_type: z.enum(['person', 'company', 'relationship']),
      name: z.string(),
      email: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .optional(),
  ignore: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create JournalServiceContext from ToolContext
 */
function toJournalContext(ctx: ToolContext): JournalServiceContext {
  return {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    userId: ctx.userId,
    layer: ctx.layer,
  };
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle journal tool calls
 * Returns result if handled, null if not a journal tool
 */
export async function handleJournalTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const journalCtx = toJournalContext(ctx);

  switch (name) {
    case 'create_journal_entry': {
      const data = CreateEntrySchema.parse(args);
      const service = createJournalService(journalCtx);

      const entry = await service.createEntry({
        content: data.content,
        title: data.title,
        entryType: data.entry_type,
        mode: data.mode,
        moods: data.moods,
        entryDate: data.entry_date ? new Date(data.entry_date) : undefined,
      });

      return {
        id: entry.id,
        title: entry.title,
        entryType: entry.entryType,
        entryDate: entry.entryDate.toISOString().split('T')[0],
        status: entry.status,
        primaryMood: entry.primaryMood?.name,
        moodIntensity: entry.moodIntensity,
        message: 'Journal entry created successfully.',
      };
    }

    case 'update_journal_entry': {
      const data = UpdateEntrySchema.parse(args);
      const service = createJournalService(journalCtx);

      const entry = await service.updateEntry(data.id, {
        content: data.content,
        title: data.title,
        moods: data.moods,
        status: data.status,
        reanalyze: data.reanalyze,
      });

      return {
        id: entry.id,
        title: entry.title,
        status: entry.status,
        updatedAt: entry.updatedAt.toISOString(),
        message: 'Journal entry updated successfully.',
      };
    }

    case 'get_journal_entry': {
      const { id } = z.object({ id: z.string() }).parse(args);
      const service = createJournalService(journalCtx);

      const entry = await service.getEntry(id);
      if (!entry) {
        throw new Error(`Journal entry not found: ${id}`);
      }

      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        entryType: entry.entryType,
        mode: entry.mode,
        entryDate: entry.entryDate.toISOString().split('T')[0],
        status: entry.status,
        isPrivate: entry.isPrivate,
        primaryMood: entry.primaryMood
          ? {
              name: entry.primaryMood.name,
              color: entry.primaryMood.colorHex,
              intensity: entry.moodIntensity,
              valence: entry.valence,
            }
          : null,
        moods: entry.moods?.map((m) => ({
          name: m.mood?.name,
          intensity: m.intensity,
          isPrimary: m.isPrimary,
        })),
        entityMentions: entry.entityMentions?.map((em) => ({
          mentionText: em.mentionText,
          entityName: em.entity?.name,
          entityType: em.entity?.entityType,
          relationshipType: em.relationshipType,
        })),
        aiSummary: entry.aiSummary,
        extractedThemes: entry.extractedThemes,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      };
    }

    case 'list_journal_entries': {
      const data = ListEntriesSchema.parse(args);
      const service = createJournalService(journalCtx);

      const result = await service.listEntries({
        after: data.after ? new Date(data.after) : undefined,
        before: data.before ? new Date(data.before) : undefined,
        entryType: data.entry_type,
        mood: data.mood,
        status: data.status,
        limit: data.limit,
        offset: data.offset,
      });

      return {
        entries: result.entries.map((e) => ({
          id: e.id,
          title: e.title,
          entryType: e.entryType,
          entryDate: e.entryDate.toISOString().split('T')[0],
          status: e.status,
          primaryMood: e.primaryMood?.name,
          contentPreview: e.content.substring(0, 150) + (e.content.length > 150 ? '...' : ''),
        })),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
      };
    }

    case 'search_journal': {
      const data = SearchSchema.parse(args);
      const service = createJournalService(journalCtx);

      const result = await service.searchEntries(data.query, data.limit);

      return {
        results: result.results.map((r) => ({
          id: r.id,
          title: r.title,
          entryDate: r.entryDate.toISOString().split('T')[0],
          entryType: r.entryType,
          primaryMood: r.primaryMood,
          matchingExcerpt: r.matchingExcerpt,
        })),
        totalCount: result.totalCount,
      };
    }

    case 'get_mood_trends': {
      const { days } = z.object({ days: z.number().optional() }).parse(args);
      const service = createJournalService(journalCtx);

      const trends = await service.getMoodTrends(days || 30);

      return {
        period: {
          start: trends.period.start.toISOString().split('T')[0],
          end: trends.period.end.toISOString().split('T')[0],
          days: trends.period.days,
        },
        dominantMoods: trends.dominantMoods,
        averageValence: Math.round(trends.averageValence * 10) / 10,
        averageIntensity: Math.round(trends.averageIntensity * 10) / 10,
        totalEntries: trends.totalEntries,
        insights: trends.insights,
        dailyTrends: trends.trends.map((t) => ({
          date: t.date.toISOString().split('T')[0],
          primaryMood: t.primaryMood,
          averageValence: Math.round(t.averageValence * 10) / 10,
          entryCount: t.entryCount,
        })),
      };
    }

    case 'get_pending_leads': {
      const service = createJournalService(journalCtx);
      const leads = await service.getPendingLeads();

      return {
        leads: leads.map((l) => ({
          id: l.id,
          name: l.name,
          inferredRelationship: l.inferredRelationship,
          mentionContext: l.mentionContext?.substring(0, 200),
          actionRequired: l.actionRequired,
          createdAt: l.createdAt.toISOString().split('T')[0],
        })),
        count: leads.length,
        message:
          leads.length > 0
            ? `Found ${leads.length} unresolved entity mention(s). Use resolve_journal_lead to link them to existing contacts or create new entities.`
            : 'No pending leads.',
      };
    }

    case 'resolve_journal_lead': {
      const data = ResolveLeadSchema.parse(args);
      const service = createJournalService(journalCtx);

      // Transform snake_case to camelCase for the service
      const createEntity = data.create_entity
        ? {
            entityType: data.create_entity.entity_type,
            name: data.create_entity.name,
            email: data.create_entity.email,
            metadata: data.create_entity.metadata,
          }
        : undefined;

      await service.resolveLead(data.lead_id, {
        entityId: data.entity_id,
        createEntity,
        ignore: data.ignore,
      });

      return {
        success: true,
        message: data.ignore
          ? 'Lead marked as ignored.'
          : data.create_entity
            ? 'New entity created and linked to lead.'
            : 'Lead resolved and linked to existing entity.',
      };
    }

    case 'load_journal_mode': {
      const { mode } = z.object({ mode: z.string() }).parse(args);
      const loader = createModeLoader(journalCtx);

      const modeConfig = await loader.loadMode(mode);
      if (!modeConfig) {
        throw new Error(`Journal mode not found: ${mode}`);
      }

      return {
        mode: modeConfig.mode,
        title: modeConfig.title,
        prompts: modeConfig.prompts,
        moodFocus: modeConfig.moodFocus,
        typicalEntities: modeConfig.typicalEntities,
        usePlutchikWheel: modeConfig.usePlutchikWheel,
        guidance: modeConfig.content,
      };
    }

    case 'list_journal_modes': {
      const loader = createModeLoader(journalCtx);
      const modes = await loader.listModes();

      return {
        modes,
        message: 'Use load_journal_mode to get detailed prompts and guidance for a specific mode.',
      };
    }

    case 'get_emotion_recommendations': {
      const { content } = z.object({ content: z.string() }).parse(args);
      const service = createJournalService(journalCtx);

      const recommendations = await service.getEmotionRecommendations(content);

      return {
        recommendations: recommendations.slice(0, 5).map((r) => ({
          emotion: r.emotion,
          confidence: Math.round(r.confidence * 100) / 100,
          reason: r.reason,
        })),
        message: 'These moods were detected based on keywords in the content.',
      };
    }

    default:
      return null;
  }
}
