/**
 * Journal Database Mappers
 *
 * Pure functions for mapping database rows to typed objects.
 */

import type {
  JournalEntry,
  JournalEntryMood,
  MoodDefinition,
} from './types.js';

/**
 * Map database row to JournalEntry
 */
export function mapEntryRow(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    tenantId: row.tenant_id as string | undefined,
    layer: row.layer as JournalEntry['layer'],
    title: row.title as string | undefined,
    content: row.content as string,
    contentHtml: row.content_html as string | undefined,
    entryType: row.entry_type as JournalEntry['entryType'],
    mode: row.mode as string | undefined,
    primaryMoodId: row.primary_mood_id as string | undefined,
    moodIntensity: row.mood_intensity as number | undefined,
    valence: row.valence as number | undefined,
    energyLevel: row.energy_level as number | undefined,
    stressLevel: row.stress_level as number | undefined,
    aiSummary: row.ai_summary as string | undefined,
    aiInsights: row.ai_insights as string[] | undefined,
    extractedThemes: row.extracted_themes as string[] | undefined,
    status: row.status as JournalEntry['status'],
    isPrivate: row.is_private as boolean,
    entryDate: new Date(row.entry_date as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map database row to MoodDefinition
 */
export function mapMoodRow(row: Record<string, unknown>): MoodDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    joyRating: row.joy_rating as number,
    trustRating: row.trust_rating as number,
    fearRating: row.fear_rating as number,
    surpriseRating: row.surprise_rating as number,
    sadnessRating: row.sadness_rating as number,
    anticipationRating: row.anticipation_rating as number,
    angerRating: row.anger_rating as number,
    disgustRating: row.disgust_rating as number,
    intensity: row.intensity as number,
    arousalLevel: row.arousal_level as number,
    valence: row.valence as number,
    dominance: row.dominance as number,
    category: row.category as string | undefined,
    colorHex: row.color_hex as string,
    isCore: row.is_core as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map database row to JournalEntryMood
 */
export function mapEntryMoodRow(row: Record<string, unknown>): JournalEntryMood {
  return {
    id: row.id as string,
    entryId: row.entry_id as string,
    moodId: row.mood_id as string,
    mood: row.mood ? mapMoodRow(row.mood as Record<string, unknown>) : undefined,
    intensity: row.intensity as number,
    isPrimary: row.is_primary as boolean,
    contextSnippet: row.context_snippet as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}
