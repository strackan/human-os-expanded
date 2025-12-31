/**
 * Journal Tools
 *
 * Unified definitions for journal creation, mood tracking, and entity linking.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

// Mood schema used across multiple tools
const MoodSchema = z.object({
  name: z.string().describe('Mood name (e.g., "Joy", "Anxious", "Grateful")'),
  intensity: z.number().min(1).max(10).optional().describe('Intensity 1-10'),
});

// =============================================================================
// CREATE JOURNAL ENTRY
// =============================================================================

export const createJournalEntry = defineTool({
  name: 'create_journal_entry',
  description: 'Create a new journal entry with AI-assisted mood analysis and entity linking. Analyzes content for emotions, themes, and mentioned people/entities.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    content: z.string().describe('The journal entry content (markdown supported)'),
    title: z.string().optional().describe('Optional title for the entry'),
    entry_type: z.enum(['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review']).optional().describe('Type of journal entry'),
    mode: z.string().optional().describe('Optional mode/skill name used for this entry'),
    moods: z.array(MoodSchema).optional().describe('Manually specified moods'),
    entry_date: z.string().optional().describe('Date of the entry (YYYY-MM-DD). Defaults to today.'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('journal_entries')
      .insert({
        user_id: ctx.userId,
        layer: ctx.layer,
        content: input.content,
        title: input.title || null,
        entry_type: input.entry_type || 'freeform',
        mode: input.mode || null,
        entry_date: input.entry_date || new Date().toISOString().split('T')[0],
        status: 'published',
      })
      .select('id, title, entry_type, entry_date, status')
      .single();

    if (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }

    // Insert moods if provided
    if (input.moods && input.moods.length > 0) {
      for (const mood of input.moods) {
        await ctx.supabase.from('journal_entry_moods').insert({
          journal_entry_id: data.id,
          mood_name: mood.name,
          intensity: mood.intensity || 5,
          is_primary: input.moods.indexOf(mood) === 0,
        });
      }
    }

    return {
      id: data.id,
      title: data.title,
      entryType: data.entry_type,
      entryDate: data.entry_date,
      status: data.status,
      message: 'Journal entry created successfully.',
    };
  },

  rest: { method: 'POST', path: '/journal' },

  alias: {
    pattern: 'journal {content}',
    priority: 20,
  },
});

// =============================================================================
// UPDATE JOURNAL ENTRY
// =============================================================================

export const updateJournalEntry = defineTool({
  name: 'update_journal_entry',
  description: 'Update an existing journal entry. Can update content, title, moods, or status.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    id: z.string().describe('Journal entry UUID'),
    content: z.string().optional().describe('Updated content'),
    title: z.string().optional().describe('Updated title'),
    moods: z.array(MoodSchema).optional().describe('Updated moods (replaces existing)'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Update entry status'),
  }),

  handler: async (ctx, input) => {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.content !== undefined) updates.content = input.content;
    if (input.title !== undefined) updates.title = input.title;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await ctx.supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', input.id)
      .eq('user_id', ctx.userId)
      .select('id, title, status, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }

    // Update moods if provided
    if (input.moods) {
      // Delete existing moods
      await ctx.supabase.from('journal_entry_moods').delete().eq('journal_entry_id', input.id);

      // Insert new moods
      for (const mood of input.moods) {
        await ctx.supabase.from('journal_entry_moods').insert({
          journal_entry_id: input.id,
          mood_name: mood.name,
          intensity: mood.intensity || 5,
          is_primary: input.moods.indexOf(mood) === 0,
        });
      }
    }

    return {
      id: data.id,
      title: data.title,
      status: data.status,
      updatedAt: data.updated_at,
      message: 'Journal entry updated successfully.',
    };
  },

  rest: { method: 'PUT', path: '/journal/:id' },
});

// =============================================================================
// GET JOURNAL ENTRY
// =============================================================================

export const getJournalEntry = defineTool({
  name: 'get_journal_entry',
  description: 'Get a specific journal entry by ID with all linked moods and entities.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    id: z.string().describe('Journal entry UUID'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('journal_entries')
      .select(`
        id,
        title,
        content,
        entry_type,
        mode,
        entry_date,
        status,
        is_private,
        ai_summary,
        extracted_themes,
        created_at,
        updated_at,
        journal_entry_moods (mood_name, intensity, is_primary)
      `)
      .eq('id', input.id)
      .eq('user_id', ctx.userId)
      .single();

    if (error) {
      throw new Error(`Journal entry not found: ${input.id}`);
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      entryType: data.entry_type,
      mode: data.mode,
      entryDate: data.entry_date,
      status: data.status,
      isPrivate: data.is_private,
      moods: data.journal_entry_moods?.map((m: { mood_name: string; intensity: number; is_primary: boolean }) => ({
        name: m.mood_name,
        intensity: m.intensity,
        isPrimary: m.is_primary,
      })),
      aiSummary: data.ai_summary,
      extractedThemes: data.extracted_themes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  rest: { method: 'GET', path: '/journal/:id' },
});

// =============================================================================
// LIST JOURNAL ENTRIES
// =============================================================================

export const listJournalEntries = defineTool({
  name: 'list_journal_entries',
  description: 'List journal entries with optional filters by date, mood, entry type.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    after: z.string().optional().describe('Entries after this date (YYYY-MM-DD)'),
    before: z.string().optional().describe('Entries before this date (YYYY-MM-DD)'),
    entry_type: z.enum(['freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review']).optional().describe('Filter by entry type'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Filter by status'),
    limit: z.number().optional().default(20).describe('Max results'),
    offset: z.number().optional().default(0).describe('Offset for pagination'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('journal_entries')
      .select('id, title, content, entry_type, entry_date, status', { count: 'exact' })
      .eq('user_id', ctx.userId)
      .order('entry_date', { ascending: false });

    if (input.after) {
      query = query.gte('entry_date', input.after);
    }
    if (input.before) {
      query = query.lte('entry_date', input.before);
    }
    if (input.entry_type) {
      query = query.eq('entry_type', input.entry_type);
    }
    if (input.status) {
      query = query.eq('status', input.status);
    }

    const limit = Math.min(input.limit || 20, 50);
    const offset = input.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list journal entries: ${error.message}`);
    }

    return {
      entries: (data || []).map((e: { id: string; title: string; content: string; entry_type: string; entry_date: string; status: string }) => ({
        id: e.id,
        title: e.title,
        entryType: e.entry_type,
        entryDate: e.entry_date,
        status: e.status,
        contentPreview: e.content.substring(0, 150) + (e.content.length > 150 ? '...' : ''),
      })),
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  },

  rest: { method: 'GET', path: '/journal' },

  alias: {
    pattern: 'show my journal entries',
    priority: 40,
  },
});

// =============================================================================
// SEARCH JOURNAL
// =============================================================================

export const searchJournal = defineTool({
  name: 'search_journal',
  description: 'Full-text search across journal entries.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    query: z.string().describe('Search terms'),
    limit: z.number().optional().default(10).describe('Max results'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('journal_entries')
      .select('id, title, entry_date, entry_type, content')
      .eq('user_id', ctx.userId)
      .or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`)
      .order('entry_date', { ascending: false })
      .limit(input.limit || 10);

    if (error) {
      throw new Error(`Failed to search journal: ${error.message}`);
    }

    return {
      results: (data || []).map((r: { id: string; title: string; entry_date: string; entry_type: string; content: string }) => ({
        id: r.id,
        title: r.title,
        entryDate: r.entry_date,
        entryType: r.entry_type,
        matchingExcerpt: extractMatchingExcerpt(r.content, input.query),
      })),
      totalCount: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/journal/search' },

  alias: {
    pattern: 'search journal for {query}',
    priority: 30,
  },
});

// =============================================================================
// GET MOOD TRENDS
// =============================================================================

export const getMoodTrends = defineTool({
  name: 'get_mood_trends',
  description: 'Get mood trends and insights over a time period. Analyzes emotional patterns.',
  platform: 'founder',
  category: 'journal',

  input: z.object({
    days: z.number().optional().default(30).describe('Number of days to analyze'),
  }),

  handler: async (ctx, input) => {
    const days = input.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await ctx.supabase
      .from('journal_entries')
      .select(`
        entry_date,
        journal_entry_moods (mood_name, intensity, is_primary)
      `)
      .eq('user_id', ctx.userId)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .order('entry_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get mood trends: ${error.message}`);
    }

    // Aggregate mood data
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;
    let moodCount = 0;

    for (const entry of data || []) {
      const moods = entry.journal_entry_moods as Array<{ mood_name: string; intensity: number; is_primary: boolean }>;
      for (const mood of moods || []) {
        moodCounts[mood.mood_name] = (moodCounts[mood.mood_name] || 0) + 1;
        totalIntensity += mood.intensity;
        moodCount++;
      }
    }

    const dominantMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
      dominantMoods,
      averageIntensity: moodCount > 0 ? Math.round((totalIntensity / moodCount) * 10) / 10 : 0,
      totalEntries: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/journal/trends' },

  alias: {
    pattern: 'show my mood trends',
    priority: 50,
  },
});

// =============================================================================
// LIST JOURNAL MODES
// =============================================================================

export const listJournalModes = defineTool({
  name: 'list_journal_modes',
  description: 'List all available journaling modes.',
  platform: 'founder',
  category: 'journal',

  input: z.object({}),

  handler: async () => {
    const modes = [
      { mode: 'freeform', title: 'Free Writing', description: 'Open-ended journaling without prompts' },
      { mode: 'gratitude', title: 'Gratitude Journal', description: 'Focus on things you are grateful for' },
      { mode: 'mood_check', title: 'Mood Check-In', description: 'Quick emotional status update' },
      { mode: 'mindfulness', title: 'Mindfulness', description: 'Present-moment awareness and reflection' },
      { mode: 'reflection', title: 'Daily Reflection', description: 'Review and learn from experiences' },
      { mode: 'daily_review', title: 'Daily Review', description: 'End-of-day summary and planning' },
    ];

    return {
      modes,
      message: 'Use create_journal_entry with entry_type to journal in a specific mode.',
    };
  },

  rest: { method: 'GET', path: '/journal/modes' },
});

// =============================================================================
// HELPER
// =============================================================================

function extractMatchingExcerpt(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  let excerpt = content.substring(start, end);

  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}
