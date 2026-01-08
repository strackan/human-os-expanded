/**
 * Entity Mention Extractor
 *
 * Extracts potential entity references from raw text input.
 * Uses pattern matching to identify proper nouns, context patterns,
 * and known product names.
 */

import type { EntityMention } from './types.js';

// =============================================================================
// COMMON WORDS TO EXCLUDE
// =============================================================================

/**
 * Words that are commonly capitalized but aren't entity names
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
  // Pronouns and articles
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
  // Conjunctions
  'But',
  'And',
  'Or',
  'So',
  'Yet',
  'For',
  'Nor',
  // Common verbs/nouns that might be capitalized at sentence start
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
  'Task',
  'Note',
  'Check',
  'Add',
  'Get',
  'Set',
  'Make',
  'Create',
  'Update',
  'Delete',
  'Find',
  'Search',
  'Show',
  'Help',
  'Please',
  'Thanks',
  'Sure',
  'Yes',
  'No',
  'Maybe',
  'Okay',
  'Done',
  'Ready',
  'Need',
  'Want',
  'Like',
  'Think',
  'Know',
]);

/**
 * Known product/project names in the Human OS ecosystem
 */
const PRODUCT_NAMES = new Map<string, string>([
  ['good hang', 'Good Hang'],
  ['goodhang', 'Good Hang'],
  ['hanging', 'Good Hang'],
  ['human os', 'Human OS'],
  ['humanos', 'Human OS'],
  ['guy for that', 'Guy For That'],
  ['guyforthat', 'Guy For That'],
  ['gft', 'Guy For That'],
  ['renubu', 'Renubu'],
  ['sculptor', 'Sculptor'],
  ['founder os', 'Founder OS'],
  ['founderos', 'Founder OS'],
  ['voice os', 'Voice OS'],
  ['voiceos', 'Voice OS'],
]);

// =============================================================================
// ENTITY MENTION EXTRACTOR
// =============================================================================

export class EntityMentionExtractor {
  /**
   * Extract potential entity mentions from raw text input
   */
  extract(input: string): EntityMention[] {
    const mentions: EntityMention[] = [];

    // Pattern 1: Proper nouns (capitalized word sequences)
    this.extractProperNouns(input, mentions);

    // Pattern 2: Context-driven patterns ("with Sarah", "call Ruth")
    this.extractContextPatterns(input, mentions);

    // Pattern 3: Known product/project names
    this.extractProductNames(input, mentions);

    // Deduplicate and filter
    return this.deduplicateAndFilter(mentions);
  }

  /**
   * Extract proper nouns (1-3 word capitalized sequences)
   */
  private extractProperNouns(input: string, mentions: EntityMention[]): void {
    // Match 1-3 word proper noun sequences
    // e.g., "Scott", "Scott Leese", "Acme Corporation Inc"
    const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
    let match;

    while ((match = pattern.exec(input)) !== null) {
      const text = match[1]!;

      // Skip if it's a common word
      if (COMMON_WORDS.has(text)) continue;

      // Skip if it's likely not an entity name
      if (this.isLikelyNotEntity(text, input, match.index)) continue;

      mentions.push({
        text,
        startIndex: match.index,
        endIndex: match.index + text.length,
        context: this.getContext(input, match.index),
        inferredType: this.inferType(text, input, match.index),
      });
    }
  }

  /**
   * Extract entity mentions from context patterns
   * e.g., "call Ruth", "with Sarah", "about Scott"
   */
  private extractContextPatterns(input: string, mentions: EntityMention[]): void {
    const patterns = [
      // Action + Name: "call/email/text/message [Name]"
      {
        regex: /\b(?:call|email|text|message|meet|see|contact|ping|reach)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        type: 'person' as const,
      },
      // With/About: "with [Name]", "about [Name]"
      {
        regex: /\b(?:with|about|for|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        type: 'person' as const,
      },
      // Name + Action: "[Name] said/told/mentioned"
      {
        regex: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|told|mentioned|asked|called|texted|emailed)/gi,
        type: 'person' as const,
      },
      // Check on: "check on [Name/Project]"
      {
        regex: /\bcheck\s+(?:on|in\s+on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        type: 'unknown' as const,
      },
      // Update: "update [Project]", "update on [Name]"
      {
        regex: /\bupdate\s+(?:on\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        type: 'unknown' as const,
      },
    ];

    for (const { regex, type } of patterns) {
      let match;
      while ((match = regex.exec(input)) !== null) {
        const text = match[1];
        if (!text) continue;

        // Skip common words
        if (COMMON_WORDS.has(text)) continue;

        mentions.push({
          text,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: this.getContext(input, match.index),
          inferredType: type,
        });
      }
    }
  }

  /**
   * Extract known product/project names (case-insensitive)
   */
  private extractProductNames(input: string, mentions: EntityMention[]): void {
    const lowerInput = input.toLowerCase();

    for (const [pattern, canonicalName] of PRODUCT_NAMES) {
      const index = lowerInput.indexOf(pattern);
      if (index !== -1) {
        mentions.push({
          text: canonicalName,
          startIndex: index,
          endIndex: index + pattern.length,
          context: this.getContext(input, index),
          inferredType: 'project',
        });
      }
    }
  }

  /**
   * Infer entity type based on surrounding context
   */
  private inferType(
    text: string,
    input: string,
    index: number
  ): EntityMention['inferredType'] {
    const context = this.getContext(input, index).toLowerCase();

    // Company indicators
    if (/\b(?:inc|llc|corp|corporation|company|startup|enterprise)\b/i.test(context)) {
      return 'company';
    }

    // Project indicators
    if (/\b(?:project|product|app|feature|release|sprint|milestone)\b/i.test(context)) {
      return 'project';
    }

    // Person indicators (actions that imply a person)
    if (/\b(?:call|meet|email|text|said|told|asked|with|talked|spoke)\b/i.test(context)) {
      return 'person';
    }

    return 'unknown';
  }

  /**
   * Get surrounding context for a mention
   */
  private getContext(input: string, index: number): string {
    const contextRadius = 50;
    const start = Math.max(0, index - contextRadius);
    const end = Math.min(input.length, index + contextRadius);
    return input.slice(start, end);
  }

  /**
   * Check if text is likely NOT an entity name
   */
  private isLikelyNotEntity(text: string, input: string, index: number): boolean {
    // Single character
    if (text.length < 2) return true;

    // All caps (likely an acronym, but we still want to try to resolve it)
    // Actually, let's keep acronyms since they might be in the glossary

    // Check if it's at the start of a sentence (might just be capitalized)
    if (index === 0) {
      // Only filter out common sentence starters
      const sentenceStarters = ['Please', 'Can', 'Could', 'Would', 'Will', 'Should', 'Just', 'Also', 'Then', 'Now', 'First', 'Next', 'Finally'];
      if (sentenceStarters.includes(text)) return true;
    }

    // After a period, it might just be a sentence start
    if (index > 1) {
      const preceding = input.slice(Math.max(0, index - 2), index).trim();
      if (preceding.endsWith('.') || preceding.endsWith('!') || preceding.endsWith('?')) {
        // It's a sentence start - check if it's a common word
        const sentenceStartWords = ['The', 'This', 'That', 'We', 'You', 'I', 'It', 'My', 'Our', 'Your'];
        if (sentenceStartWords.includes(text)) return true;
      }
    }

    return false;
  }

  /**
   * Deduplicate mentions and filter out low-quality ones
   */
  private deduplicateAndFilter(mentions: EntityMention[]): EntityMention[] {
    const seen = new Set<string>();
    const result: EntityMention[] = [];

    for (const mention of mentions) {
      const key = mention.text.toLowerCase();

      // Skip duplicates
      if (seen.has(key)) continue;
      seen.add(key);

      // Skip very short mentions (single letter)
      if (mention.text.length < 2) continue;

      result.push(mention);
    }

    return result;
  }
}

/**
 * Create an extractor instance
 */
export function createExtractor(): EntityMentionExtractor {
  return new EntityMentionExtractor();
}
