/**
 * Signal derivation from extracted entities and conversation context
 * Derives anonymized signals to contribute to global.entity_signals
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedEntity, DerivedSignal } from './types.js';

const SIGNAL_ANALYSIS_PROMPT = `Analyze this conversation about the mentioned entities and derive signals.

Entities mentioned: {ENTITIES}

Conversation context:
{CONTEXT}

For each person/company entity, derive applicable signals:
- sentiment: positive/negative/neutral (score -1 to 1)
- responsiveness: fast/medium/slow (if discussing response times)
- deal_outcome: won/lost/pending (if discussing deals)
- engagement_level: high/medium/low
- champion: true if acting as internal advocate
- blocker: true if blocking progress

Output as JSON array of {entity_name, signal_type, value, score}:`;

/**
 * Derive signals from entities and conversation context
 */
export async function deriveSignals(
  entities: ExtractedEntity[],
  conversationContext: string,
  anthropicApiKey: string
): Promise<DerivedSignal[]> {
  // Filter to person/company entities
  const relevantEntities = entities.filter(
    (e) => e.type === 'person' || e.type === 'company'
  );

  if (relevantEntities.length === 0) {
    return [];
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const prompt = SIGNAL_ANALYSIS_PROMPT
      .replace('{ENTITIES}', relevantEntities.map((e) => `${e.value} (${e.type})`).join(', '))
      .replace('{CONTEXT}', conversationContext.slice(0, 2000)); // Limit context

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
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

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      entity_name: string;
      signal_type: string;
      value: string;
      score?: number;
    }>;

    // Map to DerivedSignal format (entity_id will be resolved later)
    return parsed
      .filter((s) =>
        ['sentiment', 'responsiveness', 'deal_outcome', 'engagement_level', 'champion', 'blocker'].includes(
          s.signal_type
        )
      )
      .map((s) => ({
        entity_id: '', // Will be resolved by matchToGlobalEntities
        signal_type: s.signal_type as DerivedSignal['signal_type'],
        value: s.value,
        score: s.score,
        _entity_name: s.entity_name, // Temporary for matching
      })) as DerivedSignal[];
  } catch (err) {
    console.error('[signals] Signal derivation failed:', err);
    return [];
  }
}

/**
 * Derive interest signals from extracted topics/interests
 */
export function deriveInterestSignals(entities: ExtractedEntity[]): DerivedSignal[] {
  const interests = entities.filter((e) => e.type === 'interest' || e.type === 'topic');

  return interests.map((interest) => ({
    entity_id: '', // No specific entity - these are conversation-level
    signal_type: 'interest' as const,
    value: interest.value,
    score: interest.confidence,
  }));
}

/**
 * Derive skill signals from extracted skills
 */
export function deriveSkillSignals(entities: ExtractedEntity[]): DerivedSignal[] {
  const skills = entities.filter((e) => e.type === 'skill');

  return skills.map((skill) => ({
    entity_id: '', // Will be linked to mentioned person if any
    signal_type: 'skill' as const,
    value: skill.value,
    score: skill.confidence,
  }));
}

/**
 * Contribute signals to global.entity_signals
 */
export async function contributeSignals(
  signals: DerivedSignal[],
  entityMatches: Map<string, string>,
  userId: string | null,
  supabaseUrl: string,
  supabaseKey: string
): Promise<number> {
  let contributed = 0;

  for (const signal of signals) {
    // Skip if no entity_id and we can't resolve it
    const entityId = signal.entity_id || entityMatches.get((signal as unknown as { _entity_name?: string })._entity_name || '');

    if (!entityId) {
      continue;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/contribute_signal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            p_entity_id: entityId,
            p_signal_type: signal.signal_type,
            p_value: signal.value,
            p_score: signal.score,
            p_user_id: userId,
          }),
        }
      );

      if (response.ok) {
        contributed++;
      }
    } catch (err) {
      console.warn(`[signals] Failed to contribute signal:`, err);
    }
  }

  return contributed;
}
