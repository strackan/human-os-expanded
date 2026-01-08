/**
 * Context Builder
 *
 * Builds injection context for Claude from resolved entities.
 * Handles:
 * - System context string for prompt injection
 * - Entity map for tool parameter substitution
 * - Clarification prompts for ambiguous entities
 * - Network traversal signals for general knowledge queries
 */

import type { ResolvedContext, ResolvedEntity, InjectedContext } from './types.js';

// =============================================================================
// GENERAL KNOWLEDGE PATTERNS
// =============================================================================

/**
 * Patterns that indicate general knowledge queries
 * These can "traverse" outside the HumanOS network
 */
const GENERAL_KNOWLEDGE_PATTERNS = [
  // Unit conversions
  /how many .+ in .+/i,
  /convert .+ to .+/i,
  /what is .+ in .+/i,

  // Definitions and facts
  /what is (?:a |an |the )?(?!my |our ).+/i,
  /what are .+/i,
  /define .+/i,
  /meaning of .+/i,

  // Historical/factual dates
  /when was .+ (?:born|founded|created|invented|discovered)/i,
  /when did .+ (?:happen|occur|start|end|die)/i,

  // Attribution
  /who (?:invented|created|discovered|wrote|painted|composed) .+/i,
  /who is (?!my |our ).+/i,

  // How-to (general)
  /how (?:do you|does one|to) .+/i,

  // Math/calculations
  /what is \d+ .+ \d+/i,
  /calculate .+/i,

  // Weather (if no location entity)
  /(?:what's|what is) the weather/i,

  // Time zones
  /what time is it in .+/i,
];

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

/**
 * Build injection context from resolved entities
 */
export function buildInjectedContext(
  resolved: ResolvedContext
): InjectedContext {
  const entityMap: InjectedContext['entityMap'] = {};

  // Build entity map from grounded entities
  for (const entity of resolved.groundedEntities) {
    // Find all mentions that resolved to this entity
    for (const [mentionKey, resolution] of resolved.resolutions) {
      if (resolution.selectedEntity?.entityId === entity.entityId) {
        entityMap[mentionKey] = {
          id: entity.entityId,
          slug: entity.slug,
          name: entity.name,
          type: entity.type,
        };
      }
    }
  }

  // Build system context string
  const systemContext = buildSystemContextString(resolved);

  // Handle ambiguous cases
  let clarificationPrompt: string | undefined;
  if (resolved.ambiguousEntities.length > 0) {
    clarificationPrompt = buildClarificationPrompt(
      resolved.ambiguousEntities[0]!.mention,
      resolved.ambiguousEntities[0]!.candidates
    );
  }

  // Determine if query can traverse outside HumanOS network
  const canTraverseNetwork = shouldTraverseNetwork(resolved);

  return {
    systemContext,
    entityMap,
    clarificationNeeded: resolved.ambiguousEntities.length > 0,
    clarificationPrompt,
    canTraverseNetwork,
  };
}

/**
 * Build system context string for prompt injection
 */
function buildSystemContextString(resolved: ResolvedContext): string {
  const lines: string[] = [];

  if (resolved.groundedEntities.length > 0) {
    lines.push('## Resolved Entities');
    lines.push(
      'The following entities have been identified in the user\'s request:'
    );
    lines.push('');

    for (const entity of resolved.groundedEntities) {
      lines.push(
        `- **${entity.name}** (${entity.type}): id=\`${entity.entityId}\`, slug=\`${entity.slug}\``
      );
    }

    lines.push('');
    lines.push(
      'Use these grounded IDs/slugs when making tool calls, not the raw text from the user.'
    );
  }

  if (resolved.unresolvedMentions.length > 0) {
    lines.push('');
    lines.push('## Unresolved Mentions');
    lines.push(
      'These potential entities could not be resolved to known records:'
    );
    lines.push('');
    for (const mention of resolved.unresolvedMentions) {
      lines.push(`- "${mention}"`);
    }
    lines.push('');
    lines.push(
      'You may need to ask the user for clarification or search for these entities.'
    );
  }

  return lines.join('\n');
}

/**
 * Build clarification prompt for ambiguous entities
 */
function buildClarificationPrompt(
  mention: string,
  candidates: ResolvedEntity[]
): string {
  const options = candidates
    .map((c, i) => `${i + 1}. **${c.name}** (${c.type}) - ${c.slug}`)
    .join('\n');

  return `I found multiple possible matches for "${mention}". Which one did you mean?\n\n${options}\n\nPlease specify which entity you're referring to.`;
}

/**
 * Determine if the query should traverse outside the HumanOS network
 *
 * Returns true if:
 * - No entities were resolved AND
 * - The query matches general knowledge patterns
 */
function shouldTraverseNetwork(resolved: ResolvedContext): boolean {
  // If entities were resolved, stay in network
  if (resolved.groundedEntities.length > 0) {
    return false;
  }

  // If there are unresolved mentions that look like names, stay in network
  // (might need to search for them)
  if (resolved.unresolvedMentions.some(isLikelyPersonName)) {
    return false;
  }

  // Check if input matches general knowledge patterns
  const input = resolved.originalInput;
  return GENERAL_KNOWLEDGE_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check if a mention looks like a person's name
 */
function isLikelyPersonName(mention: string): boolean {
  // Single capitalized word or two capitalized words
  const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/;
  return namePattern.test(mention);
}

// =============================================================================
// PARAMETER SUBSTITUTION
// =============================================================================

/**
 * Substitute entity references in tool parameters with resolved IDs
 *
 * @example
 * params: { contact: "Scott lease" }
 * entityMap: { "scott lease": { id: "abc", slug: "scott-leese" } }
 * result: { contact: "abc" } (if field name contains 'id')
 */
export function substituteEntityReferences(
  params: Record<string, unknown>,
  entityMap: InjectedContext['entityMap']
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const normalizedValue = value.toLowerCase();
      const entity = entityMap[normalizedValue];

      if (entity) {
        // Determine what to substitute based on field name
        if (
          key.includes('id') ||
          key.includes('Id') ||
          key.endsWith('_id') ||
          key === 'entity'
        ) {
          // Use ID for ID-like fields
          result[key] = entity.id;
        } else if (key.includes('slug') || key.endsWith('_slug')) {
          // Use slug for slug fields
          result[key] = entity.slug;
        } else if (key.includes('name') || key.endsWith('_name')) {
          // Use canonical name for name fields
          result[key] = entity.name;
        } else {
          // Default: keep original but could also use slug
          result[key] = entity.slug;
        }
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      result[key] = substituteEntityReferences(
        value as Record<string, unknown>,
        entityMap
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

// =============================================================================
// DEBUGGING HELPERS
// =============================================================================

/**
 * Format resolution results for debugging/logging
 */
export function formatResolutionDebug(resolved: ResolvedContext): string {
  const lines: string[] = [];

  lines.push(`Input: "${resolved.originalInput}"`);
  lines.push(`Mentions extracted: ${resolved.mentions.length}`);
  lines.push(`Entities resolved: ${resolved.groundedEntities.length}`);
  lines.push(`Ambiguous: ${resolved.ambiguousEntities.length}`);
  lines.push(`Unresolved: ${resolved.unresolvedMentions.length}`);
  lines.push(`Embeddings used: ${resolved.embeddingsUsed}`);

  if (resolved.groundedEntities.length > 0) {
    lines.push('');
    lines.push('Resolved:');
    for (const entity of resolved.groundedEntities) {
      lines.push(
        `  - "${entity.name}" (${entity.matchSource}, ${(entity.confidence * 100).toFixed(0)}%)`
      );
    }
  }

  if (resolved.ambiguousEntities.length > 0) {
    lines.push('');
    lines.push('Ambiguous:');
    for (const { mention, candidates } of resolved.ambiguousEntities) {
      lines.push(`  - "${mention}": ${candidates.map((c) => c.name).join(' | ')}`);
    }
  }

  return lines.join('\n');
}
