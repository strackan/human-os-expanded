/**
 * Entity Linker
 *
 * Resolves entity mentions in journal entries by:
 * 1. Searching GFT contacts by name
 * 2. Searching human-os entities by name
 * 3. Creating leads for unresolved mentions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  EntityLinkResult,
  InferredRelationship,
  JournalServiceContext,
} from './types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Common words to exclude from entity extraction
 */
const COMMON_WORDS = new Set([
  // Days
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  // Months
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  // Time words
  'Today',
  'Tomorrow',
  'Yesterday',
  'Morning',
  'Evening',
  'Night',
  'Afternoon',
  // Common words that might be capitalized
  'The',
  'This',
  'That',
  'These',
  'Those',
  'What',
  'When',
  'Where',
  'Which',
  'Who',
  'Why',
  'How',
  // Sentence starters
  'But',
  'And',
  'Or',
  'So',
  'Yet',
  'For',
  'Nor',
  // Other
  'I',
  'My',
  'Me',
  'We',
  'Our',
  'You',
  'Your',
  'He',
  'She',
  'It',
  'They',
  'Their',
]);

// =============================================================================
// ENTITY LINKER CLASS
// =============================================================================

export class EntityLinker {
  private client: SupabaseClient | null = null;

  constructor(private ctx: JournalServiceContext) {}

  /**
   * Get or create Supabase client
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.ctx.supabaseUrl, this.ctx.supabaseKey);
    }
    return this.client;
  }

  /**
   * Extract potential entity mentions from text
   */
  extractMentions(content: string): string[] {
    const mentions: string[] = [];

    // Pattern 1: Capitalized words (proper nouns)
    // Match single capitalized words or two-word names
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];

    // Pattern 2: Context patterns - "with [Name]", "met [Name]", etc.
    const contextPatterns = [
      /(?:with|met|saw|called|texted|emailed|messaged)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /(?:talked\s+to|spoke\s+with|caught\s+up\s+with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|told|mentioned|asked|helped|called|texted)/gi,
      /(?:grateful\s+for|thankful\s+for|appreciate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /(?:thinking\s+about|thought\s+about|reminded\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    ];

    for (const pattern of contextPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) mentions.push(match[1]);
      }
    }

    // Combine and deduplicate
    const allMentions = [...new Set([...properNouns, ...mentions])];

    // Filter out common words
    return allMentions.filter(
      (name) => !COMMON_WORDS.has(name) && name.length > 1 && !this.isLikelyNotAName(name)
    );
  }

  /**
   * Check if a word is likely not a person's name
   */
  private isLikelyNotAName(word: string): boolean {
    // Single letter words
    if (word.length === 1) return true;

    // All caps (likely an acronym)
    if (word === word.toUpperCase()) return true;

    // Common English words that might be capitalized
    const notNames = [
      'Work',
      'Home',
      'Office',
      'Meeting',
      'Project',
      'Team',
      'Company',
      'Client',
      'Customer',
      'Boss',
      'Manager',
      'Report',
      'Email',
      'Call',
      'Zoom',
      'Slack',
      'Google',
      'Apple',
      'Amazon',
      'Microsoft',
    ];

    return notNames.includes(word);
  }

  /**
   * Resolve a mention to an entity
   */
  async resolveMention(mention: string, context: string): Promise<EntityLinkResult> {
    const supabase = this.getClient();

    // Step 1: Search GFT contacts by name
    try {
      const { data: gftContact } = await supabase
        .from('gft.contacts')
        .select('id, name, entity_id')
        .eq('owner_id', this.ctx.userId)
        .ilike('name', `%${mention}%`)
        .limit(1)
        .single();

      if (gftContact) {
        return {
          mentionText: mention,
          resolved: true,
          entity: {
            id: gftContact.entity_id || gftContact.id,
            name: gftContact.name,
            type: 'person',
            source: 'gft',
          },
        };
      }
    } catch {
      // GFT table might not exist or no match found, continue
    }

    // Step 2: Search public.entities by name
    try {
      const { data: publicEntity } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .ilike('name', `%${mention}%`)
        .limit(1)
        .single();

      if (publicEntity) {
        return {
          mentionText: mention,
          resolved: true,
          entity: {
            id: publicEntity.id,
            name: publicEntity.name,
            type: publicEntity.entity_type,
            source: 'entities',
          },
        };
      }
    } catch {
      // No match found, continue
    }

    // Step 3: Not found - create a lead
    const inferredRelationship = this.inferRelationship(context);

    try {
      const { data: lead } = await supabase
        .from('journal_leads')
        .insert({
          owner_id: this.ctx.userId,
          name: mention,
          mention_context: context.substring(0, 500),
          inferred_relationship: inferredRelationship,
          status: 'pending',
          action_required: 'gather_details',
        })
        .select('id, name')
        .single();

      return {
        mentionText: mention,
        resolved: false,
        lead: lead
          ? {
              id: lead.id,
              name: lead.name,
              inferredRelationship,
            }
          : undefined,
      };
    } catch {
      // Failed to create lead, return unresolved
      return {
        mentionText: mention,
        resolved: false,
      };
    }
  }

  /**
   * Resolve multiple mentions in parallel
   */
  async resolveMentions(
    mentions: string[],
    content: string
  ): Promise<Map<string, EntityLinkResult>> {
    const results = new Map<string, EntityLinkResult>();

    // Get context for each mention
    const mentionContexts = mentions.map((mention) => ({
      mention,
      context: this.getContextAroundMention(content, mention),
    }));

    // Resolve in parallel
    const resolved = await Promise.all(
      mentionContexts.map(({ mention, context }) => this.resolveMention(mention, context))
    );

    // Build results map
    for (let i = 0; i < mentions.length; i++) {
      const mention = mentions[i];
      const result = resolved[i];
      if (mention && result) {
        results.set(mention, result);
      }
    }

    return results;
  }

  /**
   * Get context around a mention in the content
   */
  private getContextAroundMention(content: string, mention: string): string {
    const index = content.indexOf(mention);
    if (index === -1) return content.substring(0, 200);

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + mention.length + 100);

    return content.substring(start, end);
  }

  /**
   * Infer relationship type from context
   */
  inferRelationship(context: string): InferredRelationship {
    const lowerContext = context.toLowerCase();

    // Family patterns
    if (
      /\b(family|mom|dad|mother|father|brother|sister|parent|child|son|daughter|spouse|wife|husband|grandma|grandpa|aunt|uncle|cousin)\b/.test(
        lowerContext
      )
    ) {
      return 'family';
    }

    // Colleague patterns
    if (
      /\b(colleague|coworker|boss|manager|team|work|office|meeting|project|client|company|job|career)\b/.test(
        lowerContext
      )
    ) {
      return 'colleague';
    }

    // Friend patterns
    if (
      /\b(friend|buddy|pal|hangout|party|drinks|dinner|lunch|coffee|catch up|fun|hang)\b/.test(
        lowerContext
      )
    ) {
      return 'friend';
    }

    // Business patterns
    if (
      /\b(customer|lead|prospect|deal|sales|investor|partner|vendor|contract|business)\b/.test(
        lowerContext
      )
    ) {
      return 'business';
    }

    return 'unknown';
  }

  /**
   * Check if an existing lead matches a mention
   */
  async findExistingLead(mention: string): Promise<{ id: string; name: string } | null> {
    const supabase = this.getClient();

    try {
      const { data } = await supabase
        .from('journal_leads')
        .select('id, name')
        .eq('owner_id', this.ctx.userId)
        .eq('status', 'pending')
        .ilike('name', `%${mention}%`)
        .limit(1)
        .single();

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get all pending leads for the user
   */
  async getPendingLeads(): Promise<
    Array<{
      id: string;
      name: string;
      mentionContext: string | null;
      inferredRelationship: string;
      createdAt: string;
    }>
  > {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('journal_leads')
      .select('id, name, mention_context, inferred_relationship, created_at')
      .eq('owner_id', this.ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending leads: ${error.message}`);
    }

    return (data || []).map((lead) => ({
      id: lead.id,
      name: lead.name,
      mentionContext: lead.mention_context,
      inferredRelationship: lead.inferred_relationship,
      createdAt: lead.created_at,
    }));
  }
}

/**
 * Create an entity linker instance
 */
export function createEntityLinker(ctx: JournalServiceContext): EntityLinker {
  return new EntityLinker(ctx);
}
