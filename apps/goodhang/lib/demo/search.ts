/**
 * Good Hang Network Search
 *
 * Multi-mode semantic search across the trusted network.
 * Implements 4 search modes:
 * - thought_leadership: Find people by ideas/expertise
 * - social: Find compatible people for social activities
 * - professional: Find people for career/business networking
 * - guy_for_that: Find someone in network who can help with X
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  ALIGNMENT_DEFINITIONS,
  CLASS_DISPLAY_NAMES,
  RACE_DEFINITIONS,
} from '@/lib/character/types';
import type {
  CharacterAlignment,
  CharacterClass,
  CharacterRace,
} from '@/lib/types/database';

// =============================================================================
// TYPES
// =============================================================================

export type SearchMode = 'thought_leadership' | 'social' | 'professional' | 'guy_for_that';

export interface SearchFilters {
  location?: string;
  industry?: string;
  connectionDegree?: number;
  alignment?: CharacterAlignment[];
  minConfidence?: number;
}

export interface SearchRequest {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
  limit?: number;
  userId?: string; // For network-scoped search
}

export interface SearchResult {
  entityId: string;
  name: string;
  headline: string;
  company: string;
  title: string;
  location: string;
  race: CharacterRace;
  characterClass: CharacterClass;
  alignment: CharacterAlignment;
  similarity: number;
  relevanceScore: number;
  explanation?: string;
  matchReasons: string[];
  connectionPath?: string[];
  sharedInterests?: string[];
  mutualConnections?: { name: string; id: string }[];
  actions: SearchAction[];
}

export interface SearchAction {
  type: 'draft_intro' | 'schedule_meeting' | 'save_to_list' | 'request_intro' | 'view_profile';
  label: string;
  data: Record<string, string>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: SearchMode;
  totalMatches: number;
  executionTimeMs: number;
}

// =============================================================================
// SEARCH ENGINE
// =============================================================================

export class NetworkSearchEngine {
  private supabase: SupabaseClient;
  private anthropic: Anthropic | null;
  private openaiKey: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string,
    anthropicKey?: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiKey = openaiKey;
    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    // 1. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(request.query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }

    // 2. Determine embedding type(s) based on mode
    const embeddingTypes = this.getEmbeddingTypesForMode(request.mode);

    // 3. Vector search across relevant embedding types
    const vectorResults = await this.vectorSearch(
      queryEmbedding,
      embeddingTypes,
      request.limit || 20
    );

    // 4. Load full profile data for results
    const profiles = await this.loadProfiles(vectorResults.map(r => r.entityId));

    // 5. Apply mode-specific ranking and filtering
    const rankedResults = await this.rankResults(
      vectorResults,
      profiles,
      request.mode,
      request.filters
    );

    // 6. Add network context (connection paths, mutual connections)
    const enrichedResults = await this.enrichWithNetworkContext(
      rankedResults,
      request.userId
    );

    // 7. Generate explanations (why each result matches)
    const finalResults = await this.generateExplanations(
      enrichedResults,
      request.query,
      request.mode
    );

    // 8. Add actions
    const resultsWithActions = this.addActions(finalResults, request.mode);

    return {
      results: resultsWithActions.slice(0, request.limit || 10),
      query: request.query,
      mode: request.mode,
      totalMatches: vectorResults.length,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // ---------------------------------------------------------------------------
  // EMBEDDING GENERATION
  // ---------------------------------------------------------------------------

  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
        }),
      });

      if (!response.ok) {
        throw new Error('Embedding API failed');
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (err) {
      console.error('Embedding generation failed:', err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // MODE-SPECIFIC CONFIGURATION
  // ---------------------------------------------------------------------------

  private getEmbeddingTypesForMode(mode: SearchMode): string[] {
    switch (mode) {
      case 'thought_leadership':
        return ['conversation', 'profile']; // thought_leadership mapped to conversation
      case 'social':
        return ['interests', 'profile'];
      case 'professional':
        return ['skills', 'profile']; // professional mapped to skills
      case 'guy_for_that':
        return ['skills', 'conversation', 'profile']; // Multi-embedding search
      default:
        return ['profile'];
    }
  }

  private getModeBoostFactors(mode: SearchMode): {
    attributeBoosts: Partial<Record<string, number>>;
    alignmentBoosts: Partial<Record<CharacterAlignment, number>>;
    classBoosts: string[];
  } {
    switch (mode) {
      case 'thought_leadership':
        return {
          attributeBoosts: { intelligence: 1.2, wisdom: 1.15 },
          alignmentBoosts: { LG: 1.1, NG: 1.05 },
          classBoosts: ['sage', 'lorekeeper', 'enchanter', 'priest', 'healer'],
        };
      case 'social':
        return {
          attributeBoosts: { charisma: 1.25, constitution: 1.1 },
          alignmentBoosts: { CG: 1.15, NG: 1.1, CN: 1.05 },
          classBoosts: ['minstrel', 'troubadour', 'performer', 'pathfinder', 'wanderer'],
        };
      case 'professional':
        return {
          attributeBoosts: { intelligence: 1.1, wisdom: 1.05 },
          alignmentBoosts: { LN: 1.1, LG: 1.05 },
          classBoosts: ['sage', 'diplomat', 'soldier', 'guardian'],
        };
      case 'guy_for_that':
        return {
          attributeBoosts: {},
          alignmentBoosts: { NG: 1.1, LG: 1.05 }, // Helpful alignments
          classBoosts: [],
        };
      default:
        return { attributeBoosts: {}, alignmentBoosts: {}, classBoosts: [] };
    }
  }

  // ---------------------------------------------------------------------------
  // VECTOR SEARCH
  // ---------------------------------------------------------------------------

  private async vectorSearch(
    queryEmbedding: number[],
    embeddingTypes: string[],
    limit: number
  ): Promise<Array<{ entityId: string; similarity: number; embeddingType: string }>> {
    const results: Array<{ entityId: string; similarity: number; embeddingType: string }> = [];

    for (const embeddingType of embeddingTypes) {
      const { data, error } = await this.supabase
        .schema('global')
        .rpc('search_entities_semantic', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          embedding_type: embeddingType,
          match_threshold: 0.3,
          match_count: limit * 2,
        });

      if (error) {
        console.warn(`Vector search failed for ${embeddingType}:`, error.message);
        continue;
      }

      for (const row of data || []) {
        results.push({
          entityId: row.entity_id,
          similarity: row.similarity,
          embeddingType,
        });
      }
    }

    // Dedupe by entity, keeping highest similarity
    const deduped = new Map<string, { entityId: string; similarity: number; embeddingType: string }>();
    for (const result of results) {
      const existing = deduped.get(result.entityId);
      if (!existing || result.similarity > existing.similarity) {
        deduped.set(result.entityId, result);
      }
    }

    return Array.from(deduped.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit * 2);
  }

  // ---------------------------------------------------------------------------
  // PROFILE LOADING
  // ---------------------------------------------------------------------------

  private async loadProfiles(entityIds: string[]): Promise<Map<string, ProfileData>> {
    const profiles = new Map<string, ProfileData>();
    if (entityIds.length === 0) return profiles;

    // Load entities
    const { data: entities } = await this.supabase
      .schema('global')
      .from('entities')
      .select('id, name, headline, current_company, current_title, location')
      .in('id', entityIds);

    // Load characters (linked via GFT contacts)
    const { data: contacts } = await this.supabase
      .schema('gft')
      .from('contacts')
      .select('global_entity_id, owner_id, labels')
      .in('global_entity_id', entityIds);

    const ownerIds = contacts?.map(c => c.owner_id).filter(Boolean) || [];

    const { data: characters } = await this.supabase
      .from('member_characters')
      .select('user_id, race, class, alignment, enneagram_type, attr_strength, attr_dexterity, attr_constitution, attr_intelligence, attr_wisdom, attr_charisma')
      .in('user_id', ownerIds);

    // Load identity packs
    const { data: packs } = await this.supabase
      .from('identity_packs')
      .select('entity_id, pack_type, headline, summary, tags')
      .in('entity_id', entityIds);

    // Build profile map
    for (const entity of entities || []) {
      const contact = contacts?.find(c => c.global_entity_id === entity.id);
      const character = characters?.find(c => c.user_id === contact?.owner_id);
      const entityPacks = packs?.filter(p => p.entity_id === entity.id) || [];

      const packMap: Record<string, { headline: string; summary: string; tags: string[] }> = {};
      for (const pack of entityPacks) {
        packMap[pack.pack_type] = {
          headline: pack.headline,
          summary: pack.summary,
          tags: pack.tags || [],
        };
      }

      profiles.set(entity.id, {
        entityId: entity.id,
        name: entity.name,
        headline: entity.headline || '',
        company: entity.current_company || '',
        title: entity.current_title || '',
        location: entity.location || '',
        race: character?.race || 'human',
        characterClass: character?.class || 'sage',
        alignment: character?.alignment || 'TN',
        enneagram: character?.enneagram_type,
        attributes: {
          strength: character?.attr_strength || 10,
          dexterity: character?.attr_dexterity || 10,
          constitution: character?.attr_constitution || 10,
          intelligence: character?.attr_intelligence || 10,
          wisdom: character?.attr_wisdom || 10,
          charisma: character?.attr_charisma || 10,
        },
        packs: packMap,
        clusterTags: contact?.labels || [],
      });
    }

    return profiles;
  }

  // ---------------------------------------------------------------------------
  // RANKING
  // ---------------------------------------------------------------------------

  private async rankResults(
    vectorResults: Array<{ entityId: string; similarity: number }>,
    profiles: Map<string, ProfileData>,
    mode: SearchMode,
    filters?: SearchFilters
  ): Promise<Array<SearchResult>> {
    const boosts = this.getModeBoostFactors(mode);
    const results: SearchResult[] = [];

    for (const vr of vectorResults) {
      const profile = profiles.get(vr.entityId);
      if (!profile) continue;

      // Apply filters
      if (filters?.location && !profile.location.toLowerCase().includes(filters.location.toLowerCase())) {
        continue;
      }
      if (filters?.alignment && !filters.alignment.includes(profile.alignment)) {
        continue;
      }

      // Calculate relevance score
      let relevanceScore = vr.similarity;
      const matchReasons: string[] = [];

      // Apply attribute boosts
      for (const [attr, boost] of Object.entries(boosts.attributeBoosts)) {
        const attrValue = profile.attributes[attr as keyof typeof profile.attributes];
        if (attrValue && attrValue >= 14) {
          relevanceScore *= boost;
          matchReasons.push(`High ${attr}`);
        }
      }

      // Apply alignment boosts
      const alignmentBoost = boosts.alignmentBoosts[profile.alignment];
      if (alignmentBoost) {
        relevanceScore *= alignmentBoost;
        matchReasons.push(`${ALIGNMENT_DEFINITIONS[profile.alignment].shortName} alignment`);
      }

      // Apply class boosts
      if (boosts.classBoosts.includes(profile.characterClass)) {
        relevanceScore *= 1.1;
        matchReasons.push(`${CLASS_DISPLAY_NAMES[profile.characterClass]} archetype`);
      }

      // Trust weighting for guy_for_that mode
      if (mode === 'guy_for_that') {
        // Would check connection degree here if userId provided
        // 1st degree: 1.5x, 2nd degree: 1.2x
        relevanceScore *= 1.2; // Default 2nd degree assumption for demo
      }

      results.push({
        entityId: profile.entityId,
        name: profile.name,
        headline: profile.headline,
        company: profile.company,
        title: profile.title,
        location: profile.location,
        race: profile.race,
        characterClass: profile.characterClass,
        alignment: profile.alignment,
        similarity: vr.similarity,
        relevanceScore,
        matchReasons,
        sharedInterests: profile.packs.interests?.tags || [],
        actions: [],
      });
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // ---------------------------------------------------------------------------
  // NETWORK CONTEXT
  // ---------------------------------------------------------------------------

  private async enrichWithNetworkContext(
    results: SearchResult[],
    userId?: string
  ): Promise<SearchResult[]> {
    if (!userId) return results;

    // Load user's connections
    const { data: connections } = await this.supabase
      .from('entity_links')
      .select('source_entity_id, target_entity_id, link_type')
      .or(`source_entity_id.eq.${userId},target_entity_id.eq.${userId}`);

    const connectedIds = new Set(
      (connections || []).flatMap(c => [c.source_entity_id, c.target_entity_id])
    );

    for (const result of results) {
      // Check if directly connected
      if (connectedIds.has(result.entityId)) {
        result.connectionPath = ['You', result.name];
      } else {
        // Find mutual connections (simplified)
        // In production, would do proper path finding
        result.connectionPath = ['You', '...', result.name];
      }
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // EXPLANATIONS
  // ---------------------------------------------------------------------------

  private async generateExplanations(
    results: SearchResult[],
    query: string,
    mode: SearchMode
  ): Promise<SearchResult[]> {
    if (!this.anthropic) return results;

    // Generate explanations in batch for top 5 results
    const topResults = results.slice(0, 5);

    const prompt = `Generate brief (1-2 sentence) explanations for why each person matches the search.

Search query: "${query}"
Search mode: ${mode}

People:
${topResults.map((r, i) => `${i + 1}. ${r.name} - ${r.title} at ${r.company}
   Match reasons: ${r.matchReasons.join(', ')}
   Interests: ${r.sharedInterests?.slice(0, 5).join(', ') || 'N/A'}`).join('\n\n')}

For each person, provide a JSON array of explanations:
[
  "Brief explanation for person 1...",
  "Brief explanation for person 2...",
  ...
]

Be specific about why they're a good match for the query.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const explanations = JSON.parse(jsonMatch[0]) as string[];
        for (let i = 0; i < Math.min(explanations.length, topResults.length); i++) {
          topResults[i]!.explanation = explanations[i];
        }
      }
    } catch (err) {
      console.warn('Explanation generation failed:', err);
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

  private addActions(results: SearchResult[], mode: SearchMode): SearchResult[] {
    for (const result of results) {
      const actions: SearchAction[] = [
        {
          type: 'view_profile',
          label: 'View Profile',
          data: { entityId: result.entityId, slug: result.name.toLowerCase().replace(/\s+/g, '-') },
        },
      ];

      // Mode-specific actions
      if (mode === 'guy_for_that' || mode === 'professional') {
        if (result.connectionPath && result.connectionPath.length > 2) {
          actions.push({
            type: 'draft_intro',
            label: `Draft Intro via ${result.connectionPath[1]}`,
            data: {
              targetId: result.entityId,
              targetName: result.name,
              introducerName: result.connectionPath[1] || 'mutual connection',
            },
          });
        }
        actions.push({
          type: 'request_intro',
          label: 'Request Introduction',
          data: { targetId: result.entityId, targetName: result.name },
        });
      }

      if (mode === 'social') {
        actions.push({
          type: 'schedule_meeting',
          label: 'Suggest Hangout',
          data: { targetId: result.entityId, targetName: result.name },
        });
      }

      actions.push({
        type: 'save_to_list',
        label: 'Save to List',
        data: { entityId: result.entityId, name: result.name },
      });

      result.actions = actions;
    }

    return results;
  }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

interface ProfileData {
  entityId: string;
  name: string;
  headline: string;
  company: string;
  title: string;
  location: string;
  race: CharacterRace;
  characterClass: CharacterClass;
  alignment: CharacterAlignment;
  enneagram?: string | null;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  packs: Record<string, { headline: string; summary: string; tags: string[] }>;
  clusterTags: string[];
}

// =============================================================================
// EXPORT FACTORY
// =============================================================================

export function createSearchEngine(
  supabaseUrl: string,
  supabaseKey: string,
  openaiKey: string,
  anthropicKey?: string
): NetworkSearchEngine {
  return new NetworkSearchEngine(supabaseUrl, supabaseKey, openaiKey, anthropicKey);
}
