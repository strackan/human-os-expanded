/**
 * Entity extraction from conversation text
 * Uses Claude to identify people, companies, topics, skills, and interests
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedEntity } from './types.js';

const EXTRACTION_PROMPT = `Analyze this conversation text and extract entities. For each entity, identify:
- type: person, company, topic, skill, or interest
- value: the entity name/value
- confidence: 0.0 to 1.0
- context: brief context of how it was mentioned

Output as JSON array. Only include entities with confidence >= 0.6.

Text:
{TEXT}

JSON output (array of {type, value, confidence, context}):`;

/**
 * Extract entities from conversation text using Claude
 */
export async function extractEntities(
  text: string,
  anthropicApiKey: string
): Promise<ExtractedEntity[]> {
  if (!text || text.trim().length < 10) {
    return [];
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT.replace('{TEXT}', text),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return [];
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedEntity[];

    // Validate and filter
    return parsed.filter(
      (e) =>
        e.type &&
        e.value &&
        typeof e.confidence === 'number' &&
        e.confidence >= 0.6 &&
        ['person', 'company', 'topic', 'skill', 'interest'].includes(e.type)
    );
  } catch (err) {
    console.error('[extractor] Entity extraction failed:', err);
    return [];
  }
}

/**
 * Match extracted entities to global entities
 * Returns entity IDs for matched entities
 */
export async function matchToGlobalEntities(
  entities: ExtractedEntity[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<Map<string, string>> {
  const matches = new Map<string, string>();

  // Filter to person and company entities only
  const personCompanyEntities = entities.filter(
    (e) => e.type === 'person' || e.type === 'company'
  );

  if (personCompanyEntities.length === 0) {
    return matches;
  }

  // For each entity, try to find a match in global.entities
  for (const entity of personCompanyEntities) {
    try {
      // Search by name (case-insensitive)
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/resolve_entity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            p_name: entity.value,
            p_company: entity.type === 'company' ? entity.value : null,
          }),
        }
      );

      if (response.ok) {
        const entityId = await response.json();
        if (entityId) {
          matches.set(entity.value, entityId);
        }
      }
    } catch (err) {
      console.warn(`[extractor] Failed to match entity "${entity.value}":`, err);
    }
  }

  return matches;
}

/**
 * Extract and store entities for a conversation turn
 */
export async function processConversationTurn(
  turnId: string,
  content: string,
  supabaseUrl: string,
  supabaseKey: string,
  anthropicApiKey: string
): Promise<ExtractedEntity[]> {
  // Extract entities
  const entities = await extractEntities(content, anthropicApiKey);

  if (entities.length === 0) {
    return [];
  }

  // Update the turn with extracted entities
  await fetch(`${supabaseUrl}/rest/v1/conversation_turns?id=eq.${turnId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      entities: entities,
    }),
  });

  return entities;
}
