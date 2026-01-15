/**
 * EntityExtractor
 *
 * Real-time entity extraction from conversation messages.
 * Uses Claude to identify people, companies, projects, goals, tasks, and events.
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import type {
  ExtractedEntity,
  ExtractionResult,
  ExtractionRequest,
  EntityType,
} from './types';

const EXTRACTION_SYSTEM_PROMPT = `You are an entity extraction system. Analyze the user's message and extract any mentioned entities.

Return a JSON object with this structure:
{
  "entities": [
    {
      "type": "person|company|project|goal|task|event",
      "name": "Entity name",
      "context": "How it was mentioned",
      "confidence": 0.0-1.0,
      "relationships": [
        {
          "toName": "Related entity name",
          "type": "works_at|works_with|reports_to|manages|owns|part_of|related_to|assigned_to|contacts",
          "context": "Relationship context"
        }
      ]
    }
  ],
  "summary": "Brief summary of what was extracted",
  "followUpQuestions": ["Optional questions to ask for more context"]
}

Entity Type Guidelines:
- **person**: Names of people (colleagues, partners, family, etc.)
- **company**: Organizations, businesses, teams
- **project**: Initiatives, products, work streams
- **goal**: Objectives, targets, OKRs
- **task**: Action items, todos, things to do
- **event**: Meetings, deadlines, scheduled activities

Be generous with extraction - if something could be an entity, include it with appropriate confidence.
Don't extract generic things like "work" or "stuff" - only specific, named entities.

Return ONLY valid JSON.`;

export class EntityExtractor {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Extract entities from a message
   */
  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const { message, conversation_history = [], existing_entities = [] } = request;

    // Build context from conversation history
    const conversationContext =
      conversation_history.length > 0
        ? conversation_history
            .slice(-6) // Last 6 messages for context
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n')
        : '';

    // Build existing entities context for deduplication
    const existingContext =
      existing_entities.length > 0
        ? `\n\nPreviously extracted entities (avoid duplicates):\n${existing_entities
            .map((e) => `- ${e.type}: ${e.name}`)
            .join('\n')}`
        : '';

    const userPrompt = `${conversationContext ? `Previous conversation:\n${conversationContext}\n\n---\n\n` : ''}Current message to analyze:
${message}${existingContext}

Extract entities from the current message. Return JSON:`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const content = response.content[0];
      if (!content || content.type !== 'text') {
        return this.emptyResult();
      }

      const parsed = JSON.parse(content.text);

      // Add IDs and source to entities
      const entities: ExtractedEntity[] = (parsed.entities || []).map(
        (e: Omit<ExtractedEntity, 'id' | 'sourceMessage'>) => ({
          ...e,
          id: uuidv4(),
          sourceMessage: message,
          confirmed: false,
        })
      );

      // Deduplicate against existing entities
      const deduped = this.deduplicateEntities(entities, existing_entities);

      return {
        entities: deduped,
        summary: parsed.summary || '',
        followUpQuestions: parsed.followUpQuestions || [],
      };
    } catch (error) {
      console.error('[EntityExtractor] Error:', error);
      return this.emptyResult();
    }
  }

  /**
   * Deduplicate entities against existing ones
   */
  private deduplicateEntities(
    newEntities: ExtractedEntity[],
    existingEntities: ExtractedEntity[]
  ): ExtractedEntity[] {
    return newEntities.filter((newEntity) => {
      const isDuplicate = existingEntities.some(
        (existing) =>
          existing.type === newEntity.type &&
          this.isSimilarName(existing.name, newEntity.name)
      );
      return !isDuplicate;
    });
  }

  /**
   * Check if two names are similar (case-insensitive, handles common variations)
   */
  private isSimilarName(name1: string, name2: string): boolean {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');
    return normalize(name1) === normalize(name2);
  }

  /**
   * Return empty result
   */
  private emptyResult(): ExtractionResult {
    return {
      entities: [],
      summary: 'No entities extracted',
      followUpQuestions: [],
    };
  }

  /**
   * Get a human-readable summary of extracted entities
   */
  static formatEntitiesSummary(entities: ExtractedEntity[]): string {
    if (entities.length === 0) {
      return 'No entities captured.';
    }

    const grouped = entities.reduce(
      (acc, entity) => {
        if (!acc[entity.type]) acc[entity.type] = [];
        acc[entity.type].push(entity.name);
        return acc;
      },
      {} as Record<EntityType, string[]>
    );

    const parts = Object.entries(grouped).map(([type, names]) => {
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      return `**${typeLabel}${names.length > 1 ? 's' : ''}**: ${names.join(', ')}`;
    });

    return parts.join('\n');
  }
}

// Export singleton instance
let extractorInstance: EntityExtractor | null = null;

export function getEntityExtractor(): EntityExtractor {
  if (!extractorInstance) {
    extractorInstance = new EntityExtractor();
  }
  return extractorInstance;
}
