/**
 * Entity Extraction Types
 *
 * Types for real-time entity extraction from conversation.
 */

export type EntityType = 'person' | 'company' | 'project' | 'goal' | 'task' | 'event';

export interface ExtractedEntity {
  /** Unique identifier for this extraction */
  id: string;
  /** Type of entity */
  type: EntityType;
  /** Name or title of the entity */
  name: string;
  /** How the entity was mentioned in context */
  context: string;
  /** Extraction confidence (0-1) */
  confidence: number;
  /** Related entities */
  relationships?: EntityRelationship[];
  /** Has user confirmed this entity? */
  confirmed?: boolean;
  /** When the entity was confirmed */
  confirmedAt?: string;
  /** Source message that contained this entity */
  sourceMessage?: string;
}

export interface EntityRelationship {
  /** ID of the related entity */
  toEntityId?: string;
  /** Name of the related entity (before resolution) */
  toName: string;
  /** Type of relationship */
  type: RelationshipType;
  /** Relationship context */
  context?: string;
}

export type RelationshipType =
  | 'works_at'
  | 'works_with'
  | 'reports_to'
  | 'manages'
  | 'owns'
  | 'part_of'
  | 'related_to'
  | 'assigned_to'
  | 'contacts';

export interface ExtractionResult {
  /** Extracted entities */
  entities: ExtractedEntity[];
  /** Summary of what was extracted */
  summary: string;
  /** Any follow-up questions to ask */
  followUpQuestions?: string[];
}

export interface ExtractionRequest {
  /** User message to analyze */
  message: string;
  /** Previous conversation for context */
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Previously extracted entities for deduplication */
  existing_entities?: ExtractedEntity[];
}

export interface StoredEntity {
  id: string;
  entity_type: EntityType;
  name: string;
  metadata: Record<string, unknown>;
  source_system: string;
  source_id?: string;
  owner_id: string;
  privacy_scope: string;
  created_at: string;
  updated_at: string;
}
