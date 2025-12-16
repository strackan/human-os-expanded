/**
 * Relationship Context Tools
 *
 * CRUD operations for relationship opinions/notes about contacts.
 * These are private, layer-scoped notes attached to GFT contact IDs.
 *
 * PERMISSION BOUNDARY:
 * - Renubu can read/write to 'renubu:tenant-*' layers
 * - Cannot access 'founder:*' or other private layers
 */

import { createClient } from '@supabase/supabase-js';

export type OpinionType =
  | 'general'
  | 'work_style'
  | 'communication'
  | 'trust'
  | 'negotiation'
  | 'decision_making'
  | 'responsiveness'
  | 'relationship_history';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';
export type Confidence = 'low' | 'medium' | 'high';

export interface Opinion {
  id: string;
  opinion_type: OpinionType;
  content: string;
  sentiment?: Sentiment;
  confidence: Confidence;
  evidence?: string[];
  source_system: string;
  source_context?: string;
  created_at: string;
  updated_at: string;
}

export interface GetOpinionsResult {
  contact_entity_id: string;
  contact_name?: string;
  opinions: Opinion[];
}

export interface UpsertOpinionInput {
  contact_entity_id: string;
  gft_contact_id?: string;
  opinion_type: OpinionType;
  content: string;
  sentiment?: Sentiment;
  confidence?: Confidence;
  evidence?: string[];
  source_context?: string;
}

export interface UpsertOpinionResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface SearchOpinionsResult {
  results: Array<{
    id: string;
    contact_entity_id: string;
    opinion_type: OpinionType;
    content: string;
    sentiment?: Sentiment;
    source_system: string;
    rank: number;
  }>;
}

/**
 * Get all opinions about a contact
 */
export async function getContactOpinions(
  supabaseUrl: string,
  supabaseKey: string,
  ownerId: string,
  contactEntityId: string,
  layer: string
): Promise<GetOpinionsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get opinions
  const { data: opinions, error } = await supabase
    .from('relationship_context')
    .select(`
      id,
      opinion_type,
      content,
      sentiment,
      confidence,
      evidence,
      source_system,
      source_context,
      created_at,
      updated_at
    `)
    .eq('contact_entity_id', contactEntityId)
    .eq('layer', layer)
    .order('opinion_type');

  if (error) {
    console.error('Error fetching opinions:', error);
    return { contact_entity_id: contactEntityId, opinions: [] };
  }

  // Get contact name from entities
  const { data: entity } = await supabase
    .from('entities')
    .select('name')
    .eq('id', contactEntityId)
    .single();

  return {
    contact_entity_id: contactEntityId,
    contact_name: entity?.name,
    opinions: (opinions || []) as Opinion[],
  };
}

/**
 * Upsert (create or update) an opinion about a contact
 */
export async function upsertOpinion(
  supabaseUrl: string,
  supabaseKey: string,
  ownerId: string,
  layer: string,
  input: UpsertOpinionInput
): Promise<UpsertOpinionResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('relationship_context')
    .upsert({
      owner_id: ownerId,
      contact_entity_id: input.contact_entity_id,
      gft_contact_id: input.gft_contact_id,
      opinion_type: input.opinion_type,
      content: input.content,
      sentiment: input.sentiment,
      confidence: input.confidence || 'medium',
      evidence: input.evidence,
      source_context: input.source_context,
      layer,
      source_system: 'renubu',
    }, {
      onConflict: 'owner_id,contact_entity_id,opinion_type',
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * Delete an opinion
 */
export async function deleteOpinion(
  supabaseUrl: string,
  supabaseKey: string,
  ownerId: string,
  opinionId: string,
  layer: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('relationship_context')
    .delete()
    .eq('id', opinionId)
    .eq('owner_id', ownerId)
    .eq('layer', layer);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Search opinions by keyword
 */
export async function searchOpinions(
  supabaseUrl: string,
  supabaseKey: string,
  query: string,
  layer: string,
  opinionType?: OpinionType,
  limit: number = 20
): Promise<SearchOpinionsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use RPC to call the search function
  const { data, error } = await supabase.rpc('search_opinions', {
    p_query: query,
    p_layer: layer,
    p_opinion_type: opinionType || null,
    p_limit: limit,
  });

  if (error) {
    console.error('Error searching opinions:', error);
    return { results: [] };
  }

  return { results: data || [] };
}

/**
 * Get opinions for multiple contacts at once (batch)
 */
export async function getBatchOpinions(
  supabaseUrl: string,
  supabaseKey: string,
  ownerId: string,
  contactEntityIds: string[],
  layer: string
): Promise<Map<string, Opinion[]>> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: opinions, error } = await supabase
    .from('relationship_context')
    .select(`
      id,
      contact_entity_id,
      opinion_type,
      content,
      sentiment,
      confidence,
      evidence,
      source_system,
      source_context,
      created_at,
      updated_at
    `)
    .in('contact_entity_id', contactEntityIds)
    .eq('layer', layer)
    .order('contact_entity_id')
    .order('opinion_type');

  if (error) {
    console.error('Error fetching batch opinions:', error);
    return new Map();
  }

  // Group by contact_entity_id
  const grouped = new Map<string, Opinion[]>();
  for (const opinion of opinions || []) {
    const existing = grouped.get(opinion.contact_entity_id) || [];
    existing.push(opinion as Opinion);
    grouped.set(opinion.contact_entity_id, existing);
  }

  return grouped;
}

/**
 * Get a summary of opinions for a contact (for quick context)
 */
export async function getOpinionSummary(
  supabaseUrl: string,
  supabaseKey: string,
  contactEntityId: string,
  layer: string
): Promise<{
  has_opinions: boolean;
  opinion_types: OpinionType[];
  overall_sentiment?: Sentiment;
  key_points: string[];
}> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: opinions, error } = await supabase
    .from('relationship_context')
    .select('opinion_type, content, sentiment')
    .eq('contact_entity_id', contactEntityId)
    .eq('layer', layer);

  if (error || !opinions || opinions.length === 0) {
    return {
      has_opinions: false,
      opinion_types: [],
      key_points: [],
    };
  }

  // Calculate overall sentiment
  const sentiments = opinions
    .map(o => o.sentiment)
    .filter(Boolean) as Sentiment[];

  let overall_sentiment: Sentiment | undefined;
  if (sentiments.length > 0) {
    const counts = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
    sentiments.forEach(s => counts[s]++);
    const max = Math.max(...Object.values(counts));
    overall_sentiment = (Object.keys(counts) as Sentiment[]).find(k => counts[k] === max);
  }

  // Extract key points (first 50 chars of each opinion)
  const key_points = opinions.map(o => {
    const truncated = o.content.length > 50
      ? o.content.substring(0, 50) + '...'
      : o.content;
    return `[${o.opinion_type}] ${truncated}`;
  });

  return {
    has_opinions: true,
    opinion_types: [...new Set(opinions.map(o => o.opinion_type))] as OpinionType[],
    overall_sentiment,
    key_points,
  };
}
