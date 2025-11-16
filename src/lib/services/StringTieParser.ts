/**
 * String-Tie LLM Parser
 *
 * Parses natural language reminders into structured format using Claude Haiku.
 * Two-step chain: 1) Split ACTION + TIME, 2) Calculate time offset
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

interface SplitResult {
  action: string;
  timePhrase: string | null;
}

// =====================================================
// StringTieParser
// =====================================================

export class StringTieParser {
  /**
   * Parse natural language reminder into structured format
   *
   * Two-step chain approach:
   * 1. Split input into ACTION + TIME components
   * 2. Parse TIME into actual minutes offset
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

      const anthropic = new Anthropic({ apiKey });

      // Step 1: Split ACTION + TIME
      console.log('[StringTieParser] Step 1: Splitting action and time...');
      const split = await this.splitActionAndTime(anthropic, input);
      console.log('[StringTieParser] Split result:', split);

      // Step 2: Calculate time offset
      let offsetMinutes = defaultOffsetMinutes;
      if (split.timePhrase) {
        console.log('[StringTieParser] Step 2: Calculating time offset...');
        offsetMinutes = await this.calculateTimeOffset(anthropic, split.timePhrase, defaultOffsetMinutes);
        console.log('[StringTieParser] Calculated offset:', offsetMinutes);
      } else {
        console.log('[StringTieParser] No time phrase found, using default:', defaultOffsetMinutes);
      }

      return {
        reminderText: split.action,
        offsetMinutes
      };

    } catch (error) {
      console.error('[StringTieParser] Error parsing with LLM:', error);
      console.log('[StringTieParser] Using fallback parser');
      return this.fallbackParse(input, defaultOffsetMinutes);
    }
  }

  /**
   * Step 1: Split input into action and time phrase
   * Uses Claude Haiku for fast, cheap parsing
   */
  private static async splitActionAndTime(
    anthropic: Anthropic,
    input: string
  ): Promise<SplitResult> {
    const prompt = `Split this reminder into ACTION and TIME components.

Input: "${input}"

ACTION: The task to remember (clean, concise command)
TIME: The time phrase (or null if no time mentioned)

Examples:
- "remind me to call Sarah in 2 hours" → action: "call Sarah", timePhrase: "in 2 hours"
- "check project status in 30 minutes" → action: "check project status", timePhrase: "in 30 minutes"
- "review the contract on Friday" → action: "review the contract", timePhrase: "on Friday"
- "follow up with client at 9am" → action: "follow up with client", timePhrase: "at 9am"
- "ping the team about the release next week" → action: "ping the team about the release", timePhrase: "next week"
- "send email to John in 15 minutes" → action: "send email to John", timePhrase: "in 15 minutes"
- "check in on ABC Hospital renewal in a couple days" → action: "check in on ABC Hospital renewal", timePhrase: "in a couple days"

Remove "remind me to", "reminder to", etc. from action.
Keep action clear and command-like.

Return ONLY valid JSON:
{"action": "...", "timePhrase": "..." or null}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(this.cleanJsonResponse(responseText));

    return {
      action: parsed.action || input,
      timePhrase: parsed.timePhrase || null
    };
  }

  /**
   * Step 2: Calculate time offset from time phrase
   * Uses TypeScript calculation with LLM only for semantic parsing
   */
  private static async calculateTimeOffset(
    anthropic: Anthropic,
    timePhrase: string,
    defaultMinutes: number
  ): Promise<number> {
    const now = new Date();

    // First, ask LLM to parse the semantic meaning
    const prompt = `Parse this time phrase into structured data. Return ONLY valid JSON.

Phrase: "${timePhrase}"

Identify:
1. type: "relative_time" (in X hours/mins), "relative_days" (tomorrow, in 2 days), "specific_day" (Friday, Monday), "relative_week" (next week)
2. value: number if applicable (2 for "2 hours", 1 for "tomorrow")
3. unit: "minutes", "hours", "days", "weeks", "day_name"
4. specificTime: time if mentioned (e.g., "9am" from "tomorrow at 9am"), or null
5. dayName: if type is "specific_day" (e.g., "Friday")
6. isExplicitDate: true if user specified exact date (tomorrow, Saturday, the 17th), false for vague dates (in a few days, next week)

Examples:
- "in 2 hours" → {"type":"relative_time","value":2,"unit":"hours","specificTime":null,"dayName":null,"isExplicitDate":false}
- "in 30 minutes" → {"type":"relative_time","value":30,"unit":"minutes","specificTime":null,"dayName":null,"isExplicitDate":false}
- "tomorrow at 9am" → {"type":"relative_days","value":1,"unit":"days","specificTime":"9am","dayName":null,"isExplicitDate":true}
- "on Friday" → {"type":"specific_day","value":null,"unit":"day_name","specificTime":null,"dayName":"Friday","isExplicitDate":true}
- "this Saturday" → {"type":"specific_day","value":null,"unit":"day_name","specificTime":null,"dayName":"Saturday","isExplicitDate":true}
- "in a couple days" → {"type":"relative_days","value":2,"unit":"days","specificTime":null,"dayName":null,"isExplicitDate":false}
- "in a few days" → {"type":"relative_days","value":3,"unit":"days","specificTime":null,"dayName":null,"isExplicitDate":false}
- "next week" → {"type":"relative_week","value":1,"unit":"weeks","specificTime":null,"dayName":null,"isExplicitDate":false}

Return JSON only:`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    try {
      const parsed = JSON.parse(this.cleanJsonResponse(responseText));

      // Now calculate in TypeScript based on the parsed structure
      return this.calculateMinutesFromParsedTime(parsed, now);
    } catch (error) {
      console.error('[StringTieParser] Failed to parse LLM response:', error);
      return defaultMinutes;
    }
  }

  /**
   * Calculate actual minutes from parsed time structure
   * Pure TypeScript calculation - no LLM involved
   */
  private static calculateMinutesFromParsedTime(
    parsed: any,
    now: Date
  ): number {
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Handle relative time (in X hours/minutes)
    if (parsed.type === 'relative_time') {
      if (parsed.unit === 'minutes') {
        return parsed.value;
      } else if (parsed.unit === 'hours') {
        return parsed.value * 60;
      }
    }

    // Handle relative days (tomorrow, in 2 days)
    if (parsed.type === 'relative_days') {
      const daysToAdd = parsed.value || 1;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);

      // Determine target time
      let targetHour = 9;
      let targetMinute = 30;
      if (parsed.specificTime) {
        const timeMatch = parsed.specificTime.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
        if (timeMatch) {
          targetHour = parseInt(timeMatch[1]);
          targetMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && targetHour < 12) {
            targetHour += 12;
          }
        }
      }

      targetDate.setHours(targetHour, targetMinute, 0, 0);

      // Only apply business day rules if it's an IMPLICIT date (not explicit like "tomorrow")
      const finalDate = parsed.isExplicitDate
        ? targetDate
        : this.adjustForBusinessDay(targetDate);

      return Math.round((finalDate.getTime() - now.getTime()) / 60000);
    }

    // Handle specific day name (Friday, Monday, etc.)
    if (parsed.type === 'specific_day' && parsed.dayName) {
      const targetDayNum = this.getDayNumber(parsed.dayName);
      let daysToAdd = (targetDayNum - currentDay + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7; // Next occurrence

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);

      // Determine target time
      let targetHour = 9;
      let targetMinute = 30;
      if (parsed.specificTime) {
        const timeMatch = parsed.specificTime.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
        if (timeMatch) {
          targetHour = parseInt(timeMatch[1]);
          targetMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          if (timeMatch[3] && timeMatch[3].toLowerCase() === 'pm' && targetHour < 12) {
            targetHour += 12;
          }
        }
      }

      targetDate.setHours(targetHour, targetMinute, 0, 0);

      // Specific day names are EXPLICIT - don't adjust for business days
      // User said "Friday" or "this Saturday", they mean that exact day
      return Math.round((targetDate.getTime() - now.getTime()) / 60000);
    }

    // Handle "next week" → Contextual interpretation based on current day
    // Both cases target the same calendar week, just described differently:
    // Mon-Wed: "next week" = the following Mon-Fri cycle (not this current week)
    // Thu-Sun: "next week" = the upcoming Mon-Fri cycle (the next one starting)
    // Result: Always the next Monday-Friday period, Tuesday at 9:30 AM
    if (parsed.type === 'relative_week') {
      const targetDate = new Date(now);

      // Calculate days until the next Monday (start of next week)
      // From Mon-Wed: next Monday is 5-7 days away (the following week)
      // From Thu-Sun: next Monday is 2-5 days away (upcoming week)
      const daysUntilNextMonday = ((1 - currentDay + 7) % 7) || 7;

      // Target is Tuesday of that week
      const daysUntilTargetTuesday = daysUntilNextMonday + 1;

      targetDate.setDate(targetDate.getDate() + daysUntilTargetTuesday);
      targetDate.setHours(9, 30, 0, 0);

      const adjustedDate = this.adjustForBusinessDay(targetDate);
      return Math.round((adjustedDate.getTime() - now.getTime()) / 60000);
    }

    // Fallback
    return 60;
  }

  /**
   * Adjust date to next business day if it falls on weekend/holiday
   * IMPORTANT: Preserves the time that was already set on the date
   */
  private static adjustForBusinessDay(date: Date): Date {
    const adjusted = new Date(date);
    const holidays = this.getUpcomingHolidays();

    // Preserve the target time (hour/minute)
    const targetHour = adjusted.getHours();
    const targetMinute = adjusted.getMinutes();

    // Skip weekends
    while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(targetHour, targetMinute, 0, 0); // Preserve original time
    }

    // Skip holidays
    const dateStr = adjusted.toDateString();
    while (holidays.some(h => h.date.toDateString() === dateStr)) {
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(targetHour, targetMinute, 0, 0); // Preserve original time
      // Check again for weekend
      while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
        adjusted.setDate(adjusted.getDate() + 1);
        adjusted.setHours(targetHour, targetMinute, 0, 0); // Preserve original time
      }
    }

    return adjusted;
  }

  /**
   * Convert day name to number (0-6)
   */
  private static getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0, sun: 0,
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thur: 4, thurs: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6
    };
    return days[dayName.toLowerCase()] ?? 1; // Default to Monday
  }

  /**
   * Get list of upcoming US federal holidays
   * Used to skip holidays when scheduling business reminders
   */
  private static getUpcomingHolidays(): Array<{ date: Date; name: string }> {
    const now = new Date();

    // US Federal Holidays for current and next year
    const holidays: Array<{ date: Date; name: string }> = [
      // 2025
      { date: new Date(2025, 0, 1), name: "New Year's Day" },
      { date: new Date(2025, 0, 20), name: "MLK Jr. Day" },
      { date: new Date(2025, 1, 17), name: "Presidents' Day" },
      { date: new Date(2025, 4, 26), name: "Memorial Day" },
      { date: new Date(2025, 6, 4), name: "Independence Day" },
      { date: new Date(2025, 8, 1), name: "Labor Day" },
      { date: new Date(2025, 9, 13), name: "Columbus Day" },
      { date: new Date(2025, 10, 11), name: "Veterans Day" },
      { date: new Date(2025, 10, 27), name: "Thanksgiving" },
      { date: new Date(2025, 11, 25), name: "Christmas" },
      // 2026
      { date: new Date(2026, 0, 1), name: "New Year's Day" },
      { date: new Date(2026, 0, 19), name: "MLK Jr. Day" },
      { date: new Date(2026, 1, 16), name: "Presidents' Day" },
      { date: new Date(2026, 4, 25), name: "Memorial Day" },
      { date: new Date(2026, 6, 3), name: "Independence Day" }, // Observed
      { date: new Date(2026, 8, 7), name: "Labor Day" },
      { date: new Date(2026, 9, 12), name: "Columbus Day" },
      { date: new Date(2026, 10, 11), name: "Veterans Day" },
      { date: new Date(2026, 10, 26), name: "Thanksgiving" },
      { date: new Date(2026, 11, 25), name: "Christmas" },
    ];

    // Return only future holidays within next 6 months
    const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    return holidays.filter(h => h.date >= now && h.date <= sixMonthsFromNow);
  }

  /**
   * Clean JSON response - remove markdown code blocks if present
   */
  private static cleanJsonResponse(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '').trim();
    }
    return cleaned;
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
      { pattern: /in a couple days/i, minutes: 2880 },
      { pattern: /in a few days/i, minutes: 2880 },
      { pattern: /tomorrow/i, minutes: 1440 },
      { pattern: /tonight/i, minutes: 720 },
      { pattern: /this afternoon/i, minutes: 240 },
      { pattern: /next week/i, minutes: 4320 },
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
