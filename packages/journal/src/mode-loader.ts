/**
 * Mode Loader
 *
 * Loads journal mode skill files from the contexts directory.
 * Parses YAML frontmatter and markdown content.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { JournalMode, ModePrompt, JournalServiceContext } from './types.js';

// =============================================================================
// YAML FRONTMATTER PARSER
// =============================================================================

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlString = match[1] ?? '';
  const body = match[2] ?? '';

  // Simple YAML parser for our frontmatter format
  const frontmatter: Record<string, unknown> = {};
  let currentKey = '';
  let inArray = false;
  let arrayItems: unknown[] = [];

  const lines = yamlString.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith('- ')) {
      if (inArray) {
        const itemContent = trimmed.substring(2);
        // Check if it's an object item (has colon)
        if (itemContent.includes(':')) {
          const obj: Record<string, string> = {};
          // Parse inline object
          const parts = itemContent.split(':').map((p) => p.trim());
          const key = parts[0];
          if (parts.length >= 2 && key) {
            obj[key] = parts.slice(1).join(':').replace(/^["']|["']$/g, '');
          }
          arrayItems.push(obj);
        } else {
          arrayItems.push(itemContent.replace(/^["']|["']$/g, ''));
        }
      }
      continue;
    }

    // End array if we hit a new key
    if (inArray && trimmed.includes(':') && !trimmed.startsWith('-')) {
      frontmatter[currentKey] = arrayItems;
      inArray = false;
      arrayItems = [];
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (!value) {
        // Empty value means start of array or nested object
        currentKey = key;
        inArray = true;
        arrayItems = [];
      } else {
        // Parse value
        let parsedValue: unknown = value;

        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          parsedValue = value.slice(1, -1);
        }
        // Boolean
        else if (value === 'true') {
          parsedValue = true;
        } else if (value === 'false') {
          parsedValue = false;
        }
        // Number
        else if (!isNaN(Number(value))) {
          parsedValue = Number(value);
        }
        // Array inline [a, b, c]
        else if (value.startsWith('[') && value.endsWith(']')) {
          parsedValue = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''));
        }

        frontmatter[key] = parsedValue;
      }
    }
  }

  // Handle final array
  if (inArray && arrayItems.length > 0) {
    frontmatter[currentKey] = arrayItems;
  }

  return { frontmatter, body };
}

// =============================================================================
// MODE LOADER CLASS
// =============================================================================

/**
 * Default journal modes (fallback when storage not available)
 */
const DEFAULT_MODES: Record<string, JournalMode> = {
  freeform: {
    title: 'Freeform Journaling',
    mode: 'freeform',
    prompts: [
      { starter: "What's on your mind?" },
      { follow_up: 'Tell me more about that.' },
    ],
    moodFocus: ['all'],
    content: 'Write freely about anything on your mind.',
  },
  gratitude: {
    title: 'Gratitude Journaling',
    mode: 'gratitude',
    prompts: [
      { starter: "What are three things you're grateful for today?" },
      { follow_up: 'Why does this matter to you?' },
      { deeper: 'How did this person or thing make a difference?' },
    ],
    moodFocus: ['joy', 'trust', 'love'],
    typicalEntities: ['people', 'experiences'],
    content: 'Focus on appreciation and positive reflection.',
  },
  mood_check: {
    title: 'Mood Check-In',
    mode: 'mood_check',
    prompts: [
      { starter: 'How are you feeling right now, in a word or two?' },
      { rating: 'On a scale of 1-10, how intense is this feeling?' },
      { exploration: "What's contributing to this feeling?" },
    ],
    moodFocus: ['all'],
    usePlutchikWheel: true,
    content: 'Quick emotional temperature check with Plutchik mapping.',
  },
  mindfulness: {
    title: 'Mindfulness Reflection',
    mode: 'mindfulness',
    prompts: [
      { starter: 'Take a deep breath. What do you notice in this moment?' },
      { follow_up: 'Where do you feel this in your body?' },
      { deeper: 'What would help you feel more grounded right now?' },
    ],
    moodFocus: ['trust', 'anticipation'],
    content: 'Present-moment awareness and grounding exercises.',
  },
  reflection: {
    title: 'Deep Reflection',
    mode: 'reflection',
    prompts: [
      { starter: 'What experience has been on your mind lately?' },
      { follow_up: "What did you learn from this? What surprised you?" },
      { deeper: 'How might this shape your future decisions?' },
    ],
    moodFocus: ['all'],
    content: 'Deeper exploration of experiences and their meaning.',
  },
  daily_review: {
    title: 'Daily Review',
    mode: 'daily_review',
    prompts: [
      { starter: 'What was the highlight of your day?' },
      { follow_up: 'What challenged you today?' },
      { deeper: "What will you carry forward to tomorrow?" },
    ],
    moodFocus: ['all'],
    typicalEntities: ['people', 'tasks', 'experiences'],
    content: 'End-of-day reflection on wins, challenges, and lessons.',
  },
};

export class ModeLoader {
  private client: SupabaseClient | null = null;
  private modeCache = new Map<string, JournalMode>();

  constructor(private ctx: JournalServiceContext) {}

  /**
   * Get or create Supabase client
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.ctx.supabaseUrl, this.ctx.supabaseKey);
    }
    return this.client;
  }

  /**
   * Load a journal mode by name
   */
  async loadMode(modeName: string): Promise<JournalMode | null> {
    // Check cache
    if (this.modeCache.has(modeName)) {
      return this.modeCache.get(modeName)!;
    }

    // Try to load from storage
    try {
      const supabase = this.getClient();
      const filePath = `journal-modes/${modeName}.md`;

      const { data, error } = await supabase.storage
        .from('contexts')
        .download(filePath);

      if (error) {
        // Fall back to default mode
        const defaultMode = DEFAULT_MODES[modeName];
        if (defaultMode) {
          this.modeCache.set(modeName, defaultMode);
          return defaultMode;
        }
        return null;
      }

      // Parse the file
      const content = await data.text();
      const mode = this.parseMode(content);

      if (mode) {
        this.modeCache.set(modeName, mode);
      }

      return mode;
    } catch {
      // Fall back to default mode
      const defaultMode = DEFAULT_MODES[modeName];
      if (defaultMode) {
        this.modeCache.set(modeName, defaultMode);
        return defaultMode;
      }
      return null;
    }
  }

  /**
   * List all available modes
   */
  async listModes(): Promise<Array<{ mode: string; title: string }>> {
    const modes: Array<{ mode: string; title: string }> = [];

    // Add default modes
    for (const [mode, config] of Object.entries(DEFAULT_MODES)) {
      modes.push({ mode, title: config.title });
    }

    // Try to list from storage
    try {
      const supabase = this.getClient();
      const { data } = await supabase.storage.from('contexts').list('journal-modes');

      if (data) {
        for (const file of data) {
          if (file.name.endsWith('.md')) {
            const modeName = file.name.replace('.md', '');
            if (!modes.find((m) => m.mode === modeName)) {
              const mode = await this.loadMode(modeName);
              if (mode) {
                modes.push({ mode: modeName, title: mode.title });
              }
            }
          }
        }
      }
    } catch {
      // Ignore storage errors, use defaults
    }

    return modes;
  }

  /**
   * Parse a mode file content
   */
  private parseMode(content: string): JournalMode | null {
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter.mode) {
      return null;
    }

    // Parse prompts
    const prompts: ModePrompt[] = [];
    const rawPrompts = frontmatter.prompts as Array<Record<string, string>> | undefined;
    if (rawPrompts) {
      for (const prompt of rawPrompts) {
        prompts.push(prompt as ModePrompt);
      }
    }

    return {
      title: (frontmatter.title as string) || (frontmatter.mode as string),
      mode: frontmatter.mode as string,
      version: frontmatter.version as string | undefined,
      prompts,
      moodFocus: (frontmatter.mood_focus as string[]) || ['all'],
      typicalEntities: frontmatter.typical_entities as string[] | undefined,
      usePlutchikWheel: frontmatter.use_plutchik_wheel as boolean | undefined,
      content: body.trim(),
    };
  }

  /**
   * Get the default mode
   */
  getDefaultMode(): JournalMode {
    // freeform is always defined in DEFAULT_MODES
    return DEFAULT_MODES.freeform!;
  }

  /**
   * Clear the mode cache
   */
  clearCache(): void {
    this.modeCache.clear();
  }
}

/**
 * Create a mode loader instance
 */
export function createModeLoader(ctx: JournalServiceContext): ModeLoader {
  return new ModeLoader(ctx);
}
