/**
 * String-Tie LLM Parser
 *
 * Parses natural language reminders into structured format using Claude.
 * Handles time expressions like "in 2 hours", "tomorrow", "next week", etc.
 *
 * Phase 1.4: String-Tie Foundation - LLM Integration
 */

import Anthropic from '@anthropic-ai/sdk';
import { ParsedReminder } from '@/types/string-ties';

// =====================================================
// Types
// =====================================================

export interface ParseResult {
  reminderText: string;
  offsetMinutes: number;
}

// =====================================================
// StringTieParser
// =====================================================

export class StringTieParser {
  /**
   * Parse natural language reminder into structured format
   *
   * Examples:
   *   "remind me to call Sarah in 2 hours" → {reminderText: "call Sarah", offsetMinutes: 120}
   *   "follow up with client tomorrow" → {reminderText: "follow up with client", offsetMinutes: 1440}
   *   "check on project status" → {reminderText: "check on project status", offsetMinutes: <default>}
   *
   * @param input - User's natural language input
   * @param defaultOffsetMinutes - Default offset if no time specified
   * @returns Parsed reminder with text and offset
   */
  static async parse(
    input: string,
    defaultOffsetMinutes: number
  ): Promise<ParseResult> {
    try {
      // Validate API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn('[StringTieParser] ANTHROPIC_API_KEY not found, using fallback');
        return this.fallbackParse(input, defaultOffsetMinutes);
      }

      const anthropic = new Anthropic({
        apiKey,
      });

      const prompt = `Parse this reminder request into structured format.

Input: "${input}"

Extract:
1. reminderText: The action to remember (short phrase, no time info)
2. offsetMinutes: Minutes from now (if not specified, use ${defaultOffsetMinutes})

Time parsing examples:
- "in 2 hours" = 120 minutes
- "in 30 minutes" = 30 minutes
- "in 1 hour" = 60 minutes
- "tomorrow" = 1440 minutes (24 hours)
- "tomorrow morning" = 900 minutes (15 hours, assuming evening reminder)
- "tomorrow afternoon" = 1200 minutes (20 hours)
- "this afternoon" = 240 minutes (4 hours)
- "tonight" = 720 minutes (12 hours)
- "next week" = 10080 minutes (7 days)
- "in 3 days" = 4320 minutes
- "monday" = calculate days until next Monday

IMPORTANT:
- Remove all time expressions from reminderText
- Keep reminderText concise and action-oriented
- If no time is mentioned, use ${defaultOffsetMinutes} as offsetMinutes

Return ONLY valid JSON (no markdown, no code blocks):
{
  "reminderText": "...",
  "offsetMinutes": number
}`;

      console.log('[StringTieParser] Calling Claude API...');

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      console.log('[StringTieParser] Claude response:', responseText);

      // Parse JSON response - handle potential markdown code blocks
      let jsonText = responseText.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(jsonText);

      // Validate response
      if (!parsed.reminderText || typeof parsed.offsetMinutes !== 'number') {
        console.warn('[StringTieParser] Invalid LLM response format, using fallback');
        return this.fallbackParse(input, defaultOffsetMinutes);
      }

      console.log('[StringTieParser] Successfully parsed:', parsed);

      return {
        reminderText: parsed.reminderText,
        offsetMinutes: parsed.offsetMinutes
      };

    } catch (error) {
      console.error('[StringTieParser] Error parsing with LLM:', error);
      console.log('[StringTieParser] Using fallback parser');
      return this.fallbackParse(input, defaultOffsetMinutes);
    }
  }

  /**
   * Fallback parser when LLM is unavailable
   * Uses simple regex patterns to extract time and text
   */
  private static fallbackParse(input: string, defaultOffsetMinutes: number): ParseResult {
    const lowerInput = input.toLowerCase();
    let offsetMinutes = defaultOffsetMinutes;
    let reminderText = input;

    // Try to detect common time patterns
    const timePatterns = [
      { pattern: /in (\d+) hour(s)?/i, multiplier: 60 },
      { pattern: /in (\d+) minute(s)?/i, multiplier: 1 },
      { pattern: /in (\d+) day(s)?/i, multiplier: 1440 },
      { pattern: /tomorrow/i, minutes: 1440 },
      { pattern: /tonight/i, minutes: 720 },
      { pattern: /this afternoon/i, minutes: 240 },
      { pattern: /next week/i, minutes: 10080 },
    ];

    // Check for patterns with numbers
    for (const { pattern, multiplier, minutes } of timePatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        if (minutes !== undefined) {
          offsetMinutes = minutes;
        } else if (multiplier !== undefined && match[1]) {
          offsetMinutes = parseInt(match[1]) * multiplier;
        }
        // Remove time expression from reminder text
        reminderText = input.replace(pattern, '').trim();
        break;
      }
    }

    // Clean up common reminder prefixes
    reminderText = reminderText
      .replace(/^(remind me to|reminder to|remind to|to)\s+/i, '')
      .trim();

    // If reminder text is empty, use the original input
    if (!reminderText) {
      reminderText = input;
    }

    console.log('[StringTieParser] Fallback parse result:', { reminderText, offsetMinutes });

    return {
      reminderText,
      offsetMinutes
    };
  }

  /**
   * Convert ParseResult to ParsedReminder format
   */
  static toParsedReminder(
    parseResult: ParseResult,
    currentTime?: Date
  ): ParsedReminder {
    const now = currentTime || new Date();
    const remindAt = new Date(now.getTime() + parseResult.offsetMinutes * 60 * 1000);

    return {
      reminderText: parseResult.reminderText,
      remindAt: remindAt.toISOString(),
      confidence: 0.9, // High confidence for now
      detectedTime: this.formatTimeOffset(parseResult.offsetMinutes)
    };
  }

  /**
   * Format offset minutes into human-readable string
   */
  private static formatTimeOffset(minutes: number): string {
    if (minutes < 60) {
      return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `in ${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}
