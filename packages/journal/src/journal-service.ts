/**
 * Journal Service
 *
 * Core CRUD operations for journal entries with mood tracking,
 * entity linking, and trend analysis.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  JournalEntry,
  JournalEntryMood,
  JournalEntityMention,
  MoodDefinition,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  ListJournalEntriesFilter,
  PaginatedJournalEntries,
  JournalSearchResults,
  MoodTrends,
  MoodTrendPoint,
  LeadResolution,
  JournalServiceContext,
  JournalLead,
} from './types.js';
import { EntityLinker, createEntityLinker } from './entity-linker.js';
import { getEmotionRecommendations, generateEmotionInsights, analyzeEmotion } from './utils/emotion-utils.js';
import { mapEntryRow, mapMoodRow, mapEntryMoodRow } from './mappers.js';

// =============================================================================
// JOURNAL SERVICE CLASS
// =============================================================================

export class JournalService {
  private client: SupabaseClient | null = null;
  private entityLinker: EntityLinker;

  constructor(private ctx: JournalServiceContext) {
    this.entityLinker = createEntityLinker(ctx);
  }

  /**
   * Get or create Supabase client
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.ctx.supabaseUrl, this.ctx.supabaseKey);
    }
    return this.client;
  }

  // ===========================================================================
  // ENTRY CRUD
  // ===========================================================================

  /**
   * Create a new journal entry
   */
  async createEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
    const supabase = this.getClient();

    // Find primary mood if moods provided
    let primaryMoodId: string | undefined;
    let moodIntensity: number | undefined;
    let valence: number | undefined;

    if (input.moods && input.moods.length > 0) {
      const moodResult = await this.resolveMoods(input.moods);
      const firstMood = moodResult[0];
      if (firstMood) {
        primaryMoodId = firstMood.moodId;
        moodIntensity = firstMood.intensity;

        // Get valence from mood definition
        const { data: moodDef } = await supabase
          .from('mood_definitions')
          .select('valence')
          .eq('id', primaryMoodId)
          .single();
        valence = moodDef?.valence;
      }
    }

    // Insert entry
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        owner_id: this.ctx.userId,
        tenant_id: this.ctx.tenantId || null,
        layer: this.ctx.layer,
        title: input.title || null,
        content: input.content,
        entry_type: input.entryType || 'freeform',
        mode: input.mode || null,
        primary_mood_id: primaryMoodId || null,
        mood_intensity: moodIntensity || null,
        valence: valence || null,
        status: 'draft',
        is_private: input.isPrivate ?? true,
        entry_date: input.entryDate ? input.entryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }

    // Link moods
    if (input.moods && input.moods.length > 0) {
      await this.linkMoodsToEntry(entry.id, input.moods);
    }

    // Extract and link entities
    const mentions = this.entityLinker.extractMentions(input.content);
    if (mentions.length > 0) {
      await this.linkEntitiesToEntry(entry.id, input.content, mentions);
    }

    return mapEntryRow(entry);
  }

  /**
   * Update an existing journal entry
   */
  async updateEntry(id: string, input: UpdateJournalEntryInput): Promise<JournalEntry> {
    const supabase = this.getClient();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (input.content !== undefined) {
      updates.content = input.content;
    }
    if (input.title !== undefined) {
      updates.title = input.title;
    }
    if (input.status !== undefined) {
      updates.status = input.status;
    }

    // Update moods if provided
    if (input.moods !== undefined) {
      // Clear existing moods
      await supabase.from('journal_entry_moods').delete().eq('entry_id', id);

      // Link new moods
      if (input.moods.length > 0) {
        await this.linkMoodsToEntry(id, input.moods);

        // Update primary mood
        const moodResult = await this.resolveMoods(input.moods);
        const firstMood = moodResult[0];
        if (firstMood) {
          updates.primary_mood_id = firstMood.moodId;
          updates.mood_intensity = firstMood.intensity;

          const { data: moodDef } = await supabase
            .from('mood_definitions')
            .select('valence')
            .eq('id', firstMood.moodId)
            .single();
          updates.valence = moodDef?.valence;
        }
      } else {
        updates.primary_mood_id = null;
        updates.mood_intensity = null;
        updates.valence = null;
      }
    }

    // Re-analyze entities if content changed
    if (input.content !== undefined && input.reanalyze) {
      // Clear existing mentions
      await supabase.from('journal_entity_mentions').delete().eq('entry_id', id);

      // Extract and link new entities
      const mentions = this.entityLinker.extractMentions(input.content);
      if (mentions.length > 0) {
        await this.linkEntitiesToEntry(id, input.content, mentions);
      }
    }

    // Update entry
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', this.ctx.userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }

    return mapEntryRow(entry);
  }

  /**
   * Get a journal entry by ID
   */
  async getEntry(id: string): Promise<JournalEntry | null> {
    const supabase = this.getClient();

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .select(
        `
        *,
        primary_mood:mood_definitions!primary_mood_id(*)
      `
      )
      .eq('id', id)
      .eq('owner_id', this.ctx.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get journal entry: ${error.message}`);
    }

    // Get moods
    const { data: moods } = await supabase
      .from('journal_entry_moods')
      .select(
        `
        *,
        mood:mood_definitions(*)
      `
      )
      .eq('entry_id', id);

    // Get entity mentions
    const { data: mentions } = await supabase
      .from('journal_entity_mentions')
      .select('*')
      .eq('entry_id', id);

    // Resolve entity details for mentions
    const entityMentions: JournalEntityMention[] = [];
    if (mentions) {
      for (const mention of mentions) {
        const { data: entity } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('id', mention.entity_id)
          .single();

        entityMentions.push({
          id: mention.id,
          entryId: mention.entry_id,
          entityId: mention.entity_id,
          mentionText: mention.mention_text,
          mentionType: mention.mention_type,
          contextSnippet: mention.context_snippet,
          relationshipType: mention.relationship_type,
          sentiment: mention.sentiment,
          createdAt: new Date(mention.created_at),
          entity: entity
            ? {
                id: entity.id,
                name: entity.name,
                entityType: entity.entity_type,
              }
            : undefined,
        });
      }
    }

    const result = mapEntryRow(entry);
    result.primaryMood = entry.primary_mood ? mapMoodRow(entry.primary_mood) : undefined;
    result.moods = moods?.map((m) => mapEntryMoodRow(m)) || [];
    result.entityMentions = entityMentions;

    return result;
  }

  /**
   * List journal entries with filters
   */
  async listEntries(filters: ListJournalEntriesFilter = {}): Promise<PaginatedJournalEntries> {
    const supabase = this.getClient();
    const limit = Math.min(filters.limit || 20, 50);
    const offset = filters.offset || 0;

    let query = supabase
      .from('journal_entries')
      .select(
        `
        *,
        primary_mood:mood_definitions!primary_mood_id(id, name, color_hex)
      `,
        { count: 'exact' }
      )
      .eq('owner_id', this.ctx.userId)
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.after) {
      query = query.gte('entry_date', filters.after.toISOString().split('T')[0]);
    }
    if (filters.before) {
      query = query.lte('entry_date', filters.before.toISOString().split('T')[0]);
    }
    if (filters.entryType) {
      query = query.eq('entry_type', filters.entryType);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.mood) {
      // Filter by primary mood name
      query = query.eq('primary_mood.name', filters.mood);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list journal entries: ${error.message}`);
    }

    return {
      entries: (data || []).map((row) => {
        const entry = mapEntryRow(row);
        entry.primaryMood = row.primary_mood ? mapMoodRow(row.primary_mood) : undefined;
        return entry;
      }),
      totalCount: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Search journal entries
   */
  async searchEntries(query: string, limit: number = 10): Promise<JournalSearchResults> {
    const supabase = this.getClient();

    const { data, error, count } = await supabase
      .from('journal_entries')
      .select(
        `
        id, title, entry_date, entry_type,
        primary_mood:mood_definitions!primary_mood_id(name),
        content
      `,
        { count: 'exact' }
      )
      .eq('owner_id', this.ctx.userId)
      .or(`content.ilike.%${query}%,title.ilike.%${query}%`)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search journal entries: ${error.message}`);
    }

    return {
      results: (data || []).map((row) => {
        // Find matching excerpt
        const content = row.content || '';
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        const matchIndex = contentLower.indexOf(queryLower);

        let excerpt: string | undefined;
        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(content.length, matchIndex + query.length + 50);
          excerpt =
            (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
        }

        // Supabase join returns arrays - get first element for to-one relations
        const primaryMoodArr = row.primary_mood as Array<{ name: string }> | null;
        const primaryMood = primaryMoodArr?.[0] ?? null;

        return {
          id: row.id,
          title: row.title,
          entryDate: new Date(row.entry_date),
          entryType: row.entry_type,
          relevanceScore: matchIndex >= 0 ? 1 : 0.5,
          matchingExcerpt: excerpt,
          primaryMood: primaryMood?.name,
        };
      }),
      totalCount: count || 0,
    };
  }

  // ===========================================================================
  // MOOD OPERATIONS
  // ===========================================================================

  /**
   * Get mood trends over a time period
   */
  async getMoodTrends(days: number = 30): Promise<MoodTrends> {
    const supabase = this.getClient();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select(
        `
        entry_date, mood_intensity, valence,
        primary_mood:mood_definitions!primary_mood_id(name)
      `
      )
      .eq('owner_id', this.ctx.userId)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0])
      .order('entry_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get mood trends: ${error.message}`);
    }

    // Type for raw entries from Supabase (joins return arrays)
    type RawTrendEntry = {
      entry_date: string;
      mood_intensity: number | null;
      valence: number | null;
      primary_mood: Array<{ name: string }> | null;
    };

    // Type for processed trend entries
    type TrendEntry = {
      entry_date: string;
      mood_intensity: number | null;
      valence: number | null;
      primary_mood: { name: string } | null;
    };

    // Convert raw entries - Supabase joins return arrays, get first element
    const rawEntries = (entries || []) as RawTrendEntry[];
    const typedEntries: TrendEntry[] = rawEntries.map((e) => ({
      entry_date: e.entry_date,
      mood_intensity: e.mood_intensity,
      valence: e.valence,
      primary_mood: e.primary_mood?.[0] ?? null,
    }));

    // Group by date
    const byDate = new Map<string, TrendEntry[]>();
    for (const entry of typedEntries) {
      const date = entry.entry_date;
      if (!byDate.has(date)) {
        byDate.set(date, []);
      }
      byDate.get(date)!.push(entry);
    }

    // Build trend points
    const trends: MoodTrendPoint[] = [];
    for (const [date, dayEntries] of byDate) {
      const avgValence =
        dayEntries.reduce((sum, e) => sum + (e.valence || 5), 0) / dayEntries.length;
      const avgIntensity =
        dayEntries.reduce((sum, e) => sum + (e.mood_intensity || 5), 0) / dayEntries.length;

      // Find primary mood for the day (most common)
      const moodCounts = new Map<string, number>();
      for (const entry of dayEntries) {
        const mood = entry.primary_mood?.name;
        if (mood) {
          moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
        }
      }
      const primaryMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

      trends.push({
        date: new Date(date),
        primaryMood,
        averageValence: avgValence,
        averageIntensity: avgIntensity,
        entryCount: dayEntries.length,
      });
    }

    // Calculate dominant moods
    const allMoods = typedEntries
      .map((e) => e.primary_mood?.name)
      .filter((m): m is string => !!m);
    const moodCounts = new Map<string, number>();
    for (const mood of allMoods) {
      moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
    }
    const dominantMoods = [...moodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: (count / allMoods.length) * 100,
      }));

    // Calculate averages
    const avgValence =
      typedEntries.length > 0
        ? typedEntries.reduce((sum, e) => sum + (e.valence || 5), 0) / typedEntries.length
        : 5;
    const avgIntensity =
      typedEntries.length > 0
        ? typedEntries.reduce((sum, e) => sum + (e.mood_intensity || 5), 0) / typedEntries.length
        : 5;

    // Generate insights
    const insights: string[] = [];
    const topMood = dominantMoods[0];
    if (topMood) {
      insights.push(
        `Your most common mood is ${topMood.mood} (${topMood.percentage.toFixed(0)}% of entries).`
      );
    }
    if (avgValence > 7) {
      insights.push('Your overall emotional tone has been positive.');
    } else if (avgValence < 4) {
      insights.push('Your overall emotional tone has been challenging.');
    }

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      trends,
      dominantMoods,
      insights,
      averageValence: avgValence,
      averageIntensity: avgIntensity,
      totalEntries: typedEntries.length,
    };
  }

  /**
   * Get emotion recommendations for content
   */
  async getEmotionRecommendations(content: string): Promise<Array<{ emotion: string; confidence: number; reason: string }>> {
    // Get historical moods for context
    const supabase = this.getClient();
    const { data: recentMoods } = await supabase
      .from('mood_definitions')
      .select('*')
      .limit(50);

    const analyses = (recentMoods || []).map((m) => analyzeEmotion(mapMoodRow(m)));
    return getEmotionRecommendations(content, analyses);
  }

  // ===========================================================================
  // LEAD OPERATIONS
  // ===========================================================================

  /**
   * Resolve a lead by linking to entity or creating new
   */
  async resolveLead(leadId: string, resolution: LeadResolution): Promise<void> {
    const supabase = this.getClient();

    if (resolution.ignore) {
      await supabase
        .from('journal_leads')
        .update({ status: 'ignored', resolved_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('owner_id', this.ctx.userId);
      return;
    }

    let entityId = resolution.entityId;

    // Create new entity if requested
    if (resolution.createEntity) {
      const { data: newEntity, error } = await supabase
        .from('entities')
        .insert({
          name: resolution.createEntity.name,
          entity_type: resolution.createEntity.entityType,
          email: resolution.createEntity.email || null,
          metadata: resolution.createEntity.metadata || {},
          owner_id: this.ctx.userId,
          privacy_scope: 'user',
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create entity: ${error.message}`);
      }

      entityId = newEntity.id;
    }

    // Update lead
    await supabase
      .from('journal_leads')
      .update({
        status: 'resolved',
        resolved_entity_id: entityId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('owner_id', this.ctx.userId);

    // Update any journal entries that referenced this lead
    const { data: lead } = await supabase
      .from('journal_leads')
      .select('name, entry_id')
      .eq('id', leadId)
      .single();

    if (lead?.entry_id && entityId) {
      // Add entity mention to the entry
      await supabase.from('journal_entity_mentions').upsert({
        entry_id: lead.entry_id,
        entity_id: entityId,
        mention_text: lead.name,
        mention_type: 'explicit',
      });
    }
  }

  /**
   * Get pending leads
   */
  async getPendingLeads(): Promise<JournalLead[]> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('journal_leads')
      .select('*')
      .eq('owner_id', this.ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending leads: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      entryId: row.entry_id,
      name: row.name,
      mentionContext: row.mention_context,
      inferredRelationship: row.inferred_relationship,
      status: row.status,
      resolvedEntityId: row.resolved_entity_id,
      actionRequired: row.action_required,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    }));
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Resolve mood names to IDs
   */
  private async resolveMoods(
    moods: Array<{ name: string; intensity?: number }>
  ): Promise<Array<{ moodId: string; intensity: number }>> {
    const supabase = this.getClient();
    const results: Array<{ moodId: string; intensity: number }> = [];

    for (const mood of moods) {
      const { data } = await supabase
        .from('mood_definitions')
        .select('id')
        .ilike('name', mood.name)
        .limit(1)
        .single();

      if (data) {
        results.push({
          moodId: data.id,
          intensity: mood.intensity || 5,
        });
      }
    }

    return results;
  }

  /**
   * Link moods to an entry
   */
  private async linkMoodsToEntry(
    entryId: string,
    moods: Array<{ name: string; intensity?: number }>
  ): Promise<void> {
    const supabase = this.getClient();
    const resolved = await this.resolveMoods(moods);

    if (resolved.length === 0) return;

    const moodLinks = resolved.map((m, index) => ({
      entry_id: entryId,
      mood_id: m.moodId,
      intensity: m.intensity,
      is_primary: index === 0,
    }));

    await supabase.from('journal_entry_moods').insert(moodLinks);
  }

  /**
   * Link entities to an entry
   */
  private async linkEntitiesToEntry(
    entryId: string,
    content: string,
    mentions: string[]
  ): Promise<void> {
    const supabase = this.getClient();
    const resolved = await this.entityLinker.resolveMentions(mentions, content);

    for (const [mentionText, result] of resolved) {
      if (result.resolved && result.entity) {
        // Get context around mention
        const index = content.indexOf(mentionText);
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(content.length, index + mentionText.length + 50);
        const contextSnippet = content.substring(contextStart, contextEnd);

        await supabase.from('journal_entity_mentions').upsert({
          entry_id: entryId,
          entity_id: result.entity.id,
          mention_text: mentionText,
          mention_type: 'explicit',
          context_snippet: contextSnippet,
          relationship_type: this.entityLinker.inferRelationship(contextSnippet),
        });
      }
      // Leads are created in resolveMention, no need to handle here
    }
  }

}

/**
 * Create a journal service instance
 */
export function createJournalService(ctx: JournalServiceContext): JournalService {
  return new JournalService(ctx);
}
