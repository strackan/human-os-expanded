/**
 * Parser/Router Agent
 *
 * Agent 1 of dream() - processes day's transcripts and extracts:
 * - Entities (people, companies, projects)
 * - Tasks (explicit and implicit)
 * - Question answers (the 34 baseline questions)
 * - Emotional markers
 * - Glossary candidates
 * - Commitments
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DreamConfig,
  DayTranscript,
  ParserOutput,
  ExtractedEntity,
  ExtractedTask,
  ExtractedCommitment,
  QuestionAnswer,
  EmotionalMarker,
  GlossaryCandidate,
  QuestionId,
} from './types.js';
import { BASELINE_QUESTIONS } from './types.js';

// =============================================================================
// PARSER ROUTER CLASS
// =============================================================================

export class ParserRouter {
  private anthropic: Anthropic | null = null;
  private supabase: SupabaseClient;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }
  }

  /**
   * Parse a day's transcript and extract all relevant information
   */
  async parse(transcript: DayTranscript): Promise<ParserOutput> {
    const startTime = Date.now();

    // Combine all messages into a single text for analysis
    const fullText = transcript.messages
      .map((m) => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    // If we have Anthropic API, use LLM for extraction
    if (this.anthropic) {
      return this.parseWithLLM(transcript.date, fullText);
    }

    // Otherwise, use rule-based extraction
    return this.parseWithRules(transcript.date, fullText);
  }

  /**
   * Parse using Claude for better extraction
   */
  private async parseWithLLM(date: string, fullText: string): Promise<ParserOutput> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(fullText);

    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      const parsed = JSON.parse(content.text);
      return {
        date,
        ...parsed,
      };
    } catch {
      // If JSON parsing fails, fall back to rules
      if (this.config.debug) {
        console.warn('Failed to parse LLM response as JSON, falling back to rules');
      }
      return this.parseWithRules(date, fullText);
    }
  }

  /**
   * Build system prompt for LLM extraction
   */
  private buildSystemPrompt(): string {
    return `You are a dream() parser agent for Founder-OS. Your job is to analyze a day's conversation transcripts and extract structured information.

You must return a JSON object with the following structure:
{
  "entities": [
    {
      "name": "string",
      "type": "person|company|project|unknown",
      "context": "brief context of mention",
      "sentiment": "positive|neutral|negative"
    }
  ],
  "tasks": [
    {
      "title": "brief task title",
      "description": "optional details",
      "context": "where this was mentioned",
      "priority": "critical|high|medium|low",
      "dueDate": "ISO date if mentioned",
      "isExplicit": true|false
    }
  ],
  "commitments": [
    {
      "statement": "what was committed to",
      "context": "surrounding context",
      "strength": "strong|normal|weak",
      "isBinding": true|false
    }
  ],
  "questionAnswers": [
    {
      "questionId": "A1|B2|G15|etc",
      "answer": "the answer given",
      "quality": "full|partial",
      "context": "surrounding context",
      "confidence": 0.0-1.0
    }
  ],
  "emotionalMarkers": [
    {
      "emotion": "emotion name",
      "intensity": 1-10,
      "context": "what triggered it"
    }
  ],
  "glossaryCandidates": [
    {
      "term": "the term",
      "definition": "inferred definition if possible",
      "context": "usage context",
      "termType": "person|acronym|project|slang|shorthand"
    }
  ],
  "summary": "2-3 sentence summary of the day",
  "themes": ["theme1", "theme2"]
}

IMPORTANT RULES:

1. For tasks, look for:
   - Explicit: "I need to...", "TODO:", "Remind me to...", "I should..."
   - Implicit: Promises made, follow-ups mentioned, deadlines referenced

2. For commitments, flag as "isBinding: true" if user said:
   - "no matter what"
   - "I promise"
   - "this is non-negotiable"
   - "come hell or high water"
   - Any similarly strong language

3. For questionAnswers, match against these baseline questions:
${Object.entries(BASELINE_QUESTIONS)
  .map(([id, q]) => `   ${id}: "${q}"`)
  .join('\n')}

   Only include if the user's response substantively answers the question.
   Use "partial" quality if they touched on it but didn't fully answer.
   Confidence should reflect how directly they answered (vs tangential mention).

4. For emotionalMarkers, note significant emotional shifts:
   - Frustration, stress, overwhelm
   - Excitement, satisfaction, relief
   - Anxiety, worry, fear
   - Joy, gratitude, hope

5. For glossaryCandidates, capture:
   - Acronyms used without explanation
   - Project names or codenames
   - Nicknames for people
   - Company-specific jargon

Return ONLY the JSON object, no other text.`;
  }

  /**
   * Build user prompt with the transcript
   */
  private buildUserPrompt(fullText: string): string {
    return `Analyze this transcript and extract structured information as JSON:

---TRANSCRIPT START---
${fullText}
---TRANSCRIPT END---

Return the JSON extraction:`;
  }

  /**
   * Parse using rules when LLM is not available
   */
  private parseWithRules(date: string, fullText: string): ParserOutput {
    return {
      date,
      entities: this.extractEntitiesWithRules(fullText),
      tasks: this.extractTasksWithRules(fullText),
      commitments: this.extractCommitmentsWithRules(fullText),
      questionAnswers: this.detectQuestionAnswersWithRules(fullText),
      emotionalMarkers: this.extractEmotionalMarkersWithRules(fullText),
      glossaryCandidates: this.extractGlossaryCandidatesWithRules(fullText),
      summary: this.generateSummaryWithRules(fullText),
      themes: this.extractThemesWithRules(fullText),
    };
  }

  /**
   * Extract entities using rules
   */
  private extractEntitiesWithRules(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Pattern: Capitalized names (2 words)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    let match;

    const seen = new Set<string>();
    const excludeWords = new Set([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December', 'Today', 'Tomorrow', 'Yesterday',
      'The', 'This', 'That', 'What', 'When', 'Where', 'Which', 'Who', 'Why', 'How',
      'But', 'And', 'Or', 'So', 'Yet', 'For', 'Nor', 'Work', 'Home', 'Meeting',
    ]);

    while ((match = namePattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name) && !excludeWords.has(name) && name.length > 2) {
        seen.add(name);

        // Get context
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + name.length + 50);
        const context = text.substring(start, end);

        // Infer type
        let type: ExtractedEntity['type'] = 'unknown';
        if (/\b(Inc|LLC|Corp|Company|Co)\b/i.test(name)) {
          type = 'company';
        } else if (/\b(project|initiative|program)\b/i.test(context)) {
          type = 'project';
        } else if (name.split(' ').length === 2) {
          type = 'person'; // Two-word names are likely people
        }

        entities.push({ name, type, context, resolved: false });
      }
    }

    return entities;
  }

  /**
   * Extract tasks using rules
   */
  private extractTasksWithRules(text: string): ExtractedTask[] {
    const tasks: ExtractedTask[] = [];

    // Explicit task patterns
    const taskPatterns = [
      /(?:I need to|I should|I have to|TODO:|TASK:|remind me to|don't forget to)\s+([^.!?\n]+)/gi,
      /(?:need to|should|have to|gotta|must)\s+([^.!?\n]+)/gi,
    ];

    for (const pattern of taskPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 200) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);

          tasks.push({
            title,
            context: text.substring(start, end),
            isExplicit: true,
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Extract commitments using rules
   */
  private extractCommitmentsWithRules(text: string): ExtractedCommitment[] {
    const commitments: ExtractedCommitment[] = [];

    // Strong commitment patterns
    const strongPatterns = [
      /(?:no matter what)[,.]?\s*([^.!?\n]+)/gi,
      /(?:I promise)[,.]?\s*([^.!?\n]+)/gi,
      /(?:non-negotiable)[,.]?\s*([^.!?\n]+)/gi,
      /(?:come hell or high water)[,.]?\s*([^.!?\n]+)/gi,
    ];

    for (const pattern of strongPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const statement = match[1].trim();
        if (statement.length > 5) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);

          commitments.push({
            statement,
            context: text.substring(start, end),
            strength: 'strong',
            isBinding: true,
          });
        }
      }
    }

    // Normal commitment patterns
    const normalPatterns = [
      /(?:I will|I'm going to|I'll)\s+([^.!?\n]+)/gi,
      /(?:I'm committed to)\s+([^.!?\n]+)/gi,
    ];

    for (const pattern of normalPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const statement = match[1].trim();
        if (statement.length > 5 && statement.length < 200) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);

          commitments.push({
            statement,
            context: text.substring(start, end),
            strength: 'normal',
            isBinding: false,
          });
        }
      }
    }

    return commitments;
  }

  /**
   * Detect question answers using rules
   */
  private detectQuestionAnswersWithRules(text: string): QuestionAnswer[] {
    // Rule-based detection is limited - return empty for now
    // LLM extraction is much better for this
    return [];
  }

  /**
   * Extract emotional markers using rules
   */
  private extractEmotionalMarkersWithRules(text: string): EmotionalMarker[] {
    const markers: EmotionalMarker[] = [];

    const emotionPatterns: Array<{ pattern: RegExp; emotion: string; baseIntensity: number }> = [
      { pattern: /\b(frustrated|frustrating|frustration)\b/gi, emotion: 'frustration', baseIntensity: 6 },
      { pattern: /\b(stressed|stressful|stress)\b/gi, emotion: 'stress', baseIntensity: 6 },
      { pattern: /\b(overwhelmed|overwhelming)\b/gi, emotion: 'overwhelm', baseIntensity: 7 },
      { pattern: /\b(excited|exciting|excitement)\b/gi, emotion: 'excitement', baseIntensity: 7 },
      { pattern: /\b(anxious|anxiety|worried|worry)\b/gi, emotion: 'anxiety', baseIntensity: 6 },
      { pattern: /\b(happy|joy|grateful|gratitude)\b/gi, emotion: 'joy', baseIntensity: 7 },
      { pattern: /\b(angry|anger|furious|pissed)\b/gi, emotion: 'anger', baseIntensity: 7 },
      { pattern: /\b(sad|sadness|depressed|down)\b/gi, emotion: 'sadness', baseIntensity: 6 },
    ];

    for (const { pattern, emotion, baseIntensity } of emotionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + match[0].length + 50);

        // Adjust intensity based on amplifiers
        let intensity = baseIntensity;
        const context = text.substring(start, end);
        if (/\b(very|really|extremely|so)\b/i.test(context)) {
          intensity = Math.min(10, intensity + 2);
        }

        markers.push({
          emotion,
          intensity,
          context,
        });
      }
    }

    return markers;
  }

  /**
   * Extract glossary candidates using rules
   */
  private extractGlossaryCandidatesWithRules(text: string): GlossaryCandidate[] {
    const candidates: GlossaryCandidate[] = [];

    // Acronyms (2-5 capital letters)
    const acronymPattern = /\b([A-Z]{2,5})\b/g;
    let match;
    const seen = new Set<string>();

    while ((match = acronymPattern.exec(text)) !== null) {
      const term = match[1];
      if (!seen.has(term)) {
        seen.add(term);

        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + term.length + 50);

        candidates.push({
          term,
          context: text.substring(start, end),
          termType: 'acronym',
        });
      }
    }

    return candidates;
  }

  /**
   * Generate summary using rules
   */
  private generateSummaryWithRules(text: string): string {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    if (sentences.length === 0) return 'No significant content to summarize.';

    // Return first substantive sentence as a basic summary
    return sentences[0].trim() + '.';
  }

  /**
   * Extract themes using rules
   */
  private extractThemesWithRules(text: string): string[] {
    const themes: string[] = [];
    const lowerText = text.toLowerCase();

    const themePatterns: Array<{ pattern: RegExp; theme: string }> = [
      { pattern: /\b(work|job|career|office|meeting)\b/g, theme: 'work' },
      { pattern: /\b(family|mom|dad|kids|children|spouse|wife|husband)\b/g, theme: 'family' },
      { pattern: /\b(health|doctor|medical|pain|sick|tired)\b/g, theme: 'health' },
      { pattern: /\b(money|finance|budget|expense|investment)\b/g, theme: 'finances' },
      { pattern: /\b(goal|plan|strategy|objective)\b/g, theme: 'planning' },
      { pattern: /\b(stress|anxiety|overwhelm|pressure)\b/g, theme: 'stress' },
      { pattern: /\b(success|achievement|win|accomplish)\b/g, theme: 'achievement' },
    ];

    for (const { pattern, theme } of themePatterns) {
      const matches = lowerText.match(pattern);
      if (matches && matches.length >= 2 && !themes.includes(theme)) {
        themes.push(theme);
      }
    }

    return themes.slice(0, 5); // Max 5 themes
  }

  /**
   * Route parsed output to database tables
   */
  async route(output: ParserOutput): Promise<{
    journalEntriesCreated: number;
    entityMentionsCreated: number;
    leadsCreated: number;
    tasksCreated: number;
    glossaryEntriesCreated: number;
    questionAnswersRecorded: number;
  }> {
    const results = {
      journalEntriesCreated: 0,
      entityMentionsCreated: 0,
      leadsCreated: 0,
      tasksCreated: 0,
      glossaryEntriesCreated: 0,
      questionAnswersRecorded: 0,
    };

    // 1. Create journal entry with summary
    const { data: journalEntry, error: journalError } = await this.supabase
      .schema('human_os')
      .from('journal_entries')
      .insert({
        owner_id: this.config.userId,
        title: `dream() Summary - ${output.date}`,
        content: output.summary,
        entry_type: 'daily_review',
        ai_summary: output.summary,
        ai_insights: {
          themes: output.themes,
          emotionalMarkers: output.emotionalMarkers,
          tasksExtracted: output.tasks.length,
          entitiesMentioned: output.entities.length,
          commitmentsDetected: output.commitments.length,
        },
        extracted_themes: output.themes,
        entry_date: output.date,
        status: 'published',
      })
      .select('id')
      .single();

    if (!journalError && journalEntry) {
      results.journalEntriesCreated = 1;

      // 2. Create entity mentions
      for (const entity of output.entities) {
        try {
          // Try to resolve entity first
          const { data: existingEntity } = await this.supabase
            .from('entities')
            .select('id')
            .ilike('name', `%${entity.name}%`)
            .limit(1)
            .single();

          if (existingEntity) {
            // Create mention linking to existing entity
            await this.supabase
              .schema('human_os')
              .from('journal_entity_mentions')
              .insert({
                entry_id: journalEntry.id,
                entity_id: existingEntity.id,
                mention_text: entity.name,
                mention_type: 'explicit',
                context_snippet: entity.context,
                sentiment: entity.sentiment || 'neutral',
              });
            results.entityMentionsCreated++;
          } else {
            // Create lead for unresolved entity
            await this.supabase
              .schema('human_os')
              .from('journal_leads')
              .insert({
                owner_id: this.config.userId,
                entry_id: journalEntry.id,
                name: entity.name,
                mention_context: entity.context,
                inferred_relationship: entity.type === 'person' ? 'unknown' : 'business',
                status: 'pending',
              });
            results.leadsCreated++;
          }
        } catch {
          // Continue on error
        }
      }
    }

    // 3. Create tasks
    for (const task of output.tasks) {
      try {
        await this.supabase.schema('founder_os').from('tasks').insert({
          user_id: this.config.userId,
          title: task.title,
          description: task.description || task.context,
          status: 'todo',
          priority: task.priority || 'medium',
          due_date: task.dueDate,
        });
        results.tasksCreated++;
      } catch {
        // Continue on error
      }
    }

    // 4. Record question answers
    for (const qa of output.questionAnswers) {
      try {
        await this.supabase.rpc('founder_os.record_question_answer', {
          p_user_id: this.config.userId,
          p_question_id: qa.questionId,
          p_quality: qa.quality,
        });
        results.questionAnswersRecorded++;
      } catch {
        // Continue on error
      }
    }

    // 5. Create glossary entries
    for (const candidate of output.glossaryCandidates) {
      try {
        // Check if term already exists
        const { data: existing } = await this.supabase
          .from('glossary')
          .select('id')
          .eq('owner_id', this.config.userId)
          .ilike('term', candidate.term)
          .limit(1)
          .single();

        if (!existing) {
          await this.supabase.from('glossary').insert({
            owner_id: this.config.userId,
            term: candidate.term,
            term_normalized: candidate.term.toLowerCase(),
            definition: candidate.definition,
            term_type: candidate.termType,
            context_tags: [],
          });
          results.glossaryEntriesCreated++;
        }
      } catch {
        // Continue on error
      }
    }

    return results;
  }
}

/**
 * Create a parser router instance
 */
export function createParserRouter(config: DreamConfig): ParserRouter {
  return new ParserRouter(config);
}
