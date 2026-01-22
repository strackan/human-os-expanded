/**
 * Reflector/Calibrator Agent
 *
 * Agent 2 of dream() - analyzes patterns and calibrates persona:
 * - Pattern detection across days/weeks
 * - Avoidance detection
 * - Persona calibration from question answers
 * - Current state updates
 * - Protocol adjustments
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DreamConfig,
  ParserOutput,
  ReflectorOutput,
  PatternObservation,
  PersonaCalibration,
  ProtocolAdjustment,
  QuestionId,
} from './types.js';
import { CALIBRATION_QUESTIONS } from './types.js';

// =============================================================================
// REFLECTOR CALIBRATOR CLASS
// =============================================================================

export class ReflectorCalibrator {
  private anthropic: Anthropic | null = null;
  private supabase: SupabaseClient;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }
  }

  /**
   * Reflect on parser output and historical data
   */
  async reflect(
    todayOutput: ParserOutput,
    recentHistory?: ParserOutput[]
  ): Promise<ReflectorOutput> {
    // Get historical journal entries for pattern analysis
    const history = recentHistory || (await this.getRecentHistory(7));

    // If we have Anthropic API, use LLM for reflection
    if (this.anthropic) {
      return this.reflectWithLLM(todayOutput, history);
    }

    // Otherwise, use rule-based reflection
    return this.reflectWithRules(todayOutput, history);
  }

  /**
   * Get recent parser outputs from journal entries
   */
  private async getRecentHistory(days: number): Promise<ParserOutput[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await this.supabase
      .schema('human_os')
      .from('journal_entries')
      .select('entry_date, ai_insights, extracted_themes')
      .eq('owner_id', this.config.userId)
      .eq('entry_type', 'daily_review')
      .gte('entry_date', since.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    if (!data) return [];

    // Convert to ParserOutput-like format
    return data.map((entry) => ({
      date: entry.entry_date,
      entities: [],
      tasks: [],
      commitments: [],
      questionAnswers: [],
      emotionalMarkers: entry.ai_insights?.emotionalMarkers || [],
      glossaryCandidates: [],
      summary: '',
      themes: entry.extracted_themes || [],
    }));
  }

  /**
   * Reflect using Claude for deeper analysis
   */
  private async reflectWithLLM(
    today: ParserOutput,
    history: ParserOutput[]
  ): Promise<ReflectorOutput> {
    const systemPrompt = `You are a dream() reflector agent for Founder-OS. Your job is to analyze patterns across recent days and calibrate the AI assistant's persona.

Return a JSON object with this structure:
{
  "patterns": [
    {
      "type": "avoidance|recurring|escalating|improvement|anomaly",
      "description": "what you observed",
      "evidence": ["specific examples from transcripts"],
      "daysSeen": number,
      "actionSuggestion": "optional recommendation"
    }
  ],
  "calibrations": [
    {
      "signal": "persona signal name",
      "value": "the calibrated value",
      "source": "question ID or 'inferred'",
      "confidence": 0.0-1.0
    }
  ],
  "protocolAdjustments": [
    {
      "protocol": "which protocol to adjust",
      "adjustment": "what to change",
      "reason": "why"
    }
  ],
  "currentStateUpdate": "markdown summary of current state",
  "moodTrend": "improving|stable|declining|volatile"
}

Focus on:
1. PATTERNS: Look for recurring themes, avoidance behaviors, escalating stress
2. CALIBRATIONS: Extract persona signals from question answers
3. ADJUSTMENTS: Suggest protocol changes based on observations
4. MOOD: Assess overall emotional trajectory

Return ONLY the JSON object.`;

    const userPrompt = `Analyze today's output and recent history:

TODAY'S OUTPUT:
${JSON.stringify(today, null, 2)}

RECENT HISTORY (last 7 days):
${JSON.stringify(history, null, 2)}

Return your reflection as JSON:`;

    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      return JSON.parse((content as { type: 'text'; text: string }).text);
    } catch {
      return this.reflectWithRules(today, history);
    }
  }

  /**
   * Reflect using rules when LLM is not available
   */
  private reflectWithRules(
    today: ParserOutput,
    history: ParserOutput[]
  ): ReflectorOutput {
    const patterns = this.detectPatterns(today, history);
    const calibrations = this.extractCalibrations(today);
    const protocolAdjustments = this.suggestAdjustments(today, patterns);
    const currentStateUpdate = this.generateStateUpdate(today, patterns);
    const moodTrend = this.assessMoodTrend(today, history);

    return {
      patterns,
      calibrations,
      protocolAdjustments,
      currentStateUpdate,
      moodTrend,
    };
  }

  /**
   * Detect patterns in recent data
   */
  private detectPatterns(
    today: ParserOutput,
    history: ParserOutput[]
  ): PatternObservation[] {
    const patterns: PatternObservation[] = [];

    // 1. Recurring themes
    const allThemes = [...today.themes];
    for (const day of history) {
      allThemes.push(...day.themes);
    }

    const themeCounts = new Map<string, number>();
    for (const theme of allThemes) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }

    for (const [theme, count] of themeCounts) {
      if (count >= 3) {
        patterns.push({
          type: 'recurring',
          description: `Theme "${theme}" has appeared ${count} times in the last ${history.length + 1} days`,
          evidence: [`Appeared today and in ${count - 1} previous days`],
          daysSeen: count,
        });
      }
    }

    // 2. Escalating emotions
    const stressMarkers = today.emotionalMarkers.filter(
      (m) => ['stress', 'anxiety', 'overwhelm', 'frustration'].includes(m.emotion)
    );

    if (stressMarkers.length > 0) {
      const avgIntensity =
        stressMarkers.reduce((sum, m) => sum + m.intensity, 0) / stressMarkers.length;

      if (avgIntensity > 6) {
        patterns.push({
          type: 'escalating',
          description: `High stress detected (avg intensity ${avgIntensity.toFixed(1)}/10)`,
          evidence: stressMarkers.map((m) => `${m.emotion}: ${m.intensity}/10`),
          daysSeen: 1,
          actionSuggestion: 'Consider checking in about workload and support needs',
        });
      }
    }

    // 3. Avoidance detection (commitments without follow-through)
    const bindingCommitments = today.commitments.filter((c) => c.isBinding);
    if (bindingCommitments.length > 0) {
      patterns.push({
        type: 'avoidance',
        description: `${bindingCommitments.length} binding commitment(s) detected - watch for follow-through`,
        evidence: bindingCommitments.map((c) => c.statement),
        daysSeen: 1,
        actionSuggestion: 'Track these commitments for accountability',
      });
    }

    return patterns;
  }

  /**
   * Extract persona calibration signals from question answers
   */
  private extractCalibrations(today: ParserOutput): PersonaCalibration[] {
    const calibrations: PersonaCalibration[] = [];

    for (const qa of today.questionAnswers) {
      const questionId = qa.questionId as QuestionId;
      const signal = CALIBRATION_QUESTIONS[questionId];

      if (signal) {
        calibrations.push({
          signal,
          value: this.summarizeAnswer(qa.answer),
          source: questionId,
          confidence: qa.confidence,
        });
      }
    }

    return calibrations;
  }

  /**
   * Summarize an answer into a calibration value
   */
  private summarizeAnswer(answer: string): string {
    // For now, return first 100 chars - LLM version will be smarter
    return answer.length > 100 ? answer.substring(0, 100) + '...' : answer;
  }

  /**
   * Suggest protocol adjustments based on observations
   */
  private suggestAdjustments(
    today: ParserOutput,
    patterns: PatternObservation[]
  ): ProtocolAdjustment[] {
    const adjustments: ProtocolAdjustment[] = [];

    // High stress pattern
    const stressPattern = patterns.find((p) => p.type === 'escalating');
    if (stressPattern) {
      adjustments.push({
        protocol: 'communication',
        adjustment: 'Reduce proactive suggestions, increase supportive listening',
        reason: 'High stress levels detected',
      });
    }

    // Many tasks extracted
    if (today.tasks.length > 5) {
      adjustments.push({
        protocol: 'task_management',
        adjustment: 'Help prioritize rather than adding more tasks',
        reason: `${today.tasks.length} tasks extracted today - potential overwhelm`,
      });
    }

    return adjustments;
  }

  /**
   * Generate current state markdown update
   */
  private generateStateUpdate(
    today: ParserOutput,
    patterns: PatternObservation[]
  ): string {
    const lines: string[] = [
      `# Current State - ${today.date}`,
      '',
      '## Summary',
      today.summary,
      '',
      '## Themes',
      ...today.themes.map((t) => `- ${t}`),
      '',
      '## Emotional State',
    ];

    if (today.emotionalMarkers.length > 0) {
      for (const marker of today.emotionalMarkers) {
        lines.push(`- ${marker.emotion} (${marker.intensity}/10)`);
      }
    } else {
      lines.push('- No significant emotional markers detected');
    }

    if (patterns.length > 0) {
      lines.push('', '## Patterns Observed');
      for (const pattern of patterns) {
        lines.push(`- **${pattern.type}**: ${pattern.description}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Assess mood trend across recent days
   */
  private assessMoodTrend(
    today: ParserOutput,
    history: ParserOutput[]
  ): ReflectorOutput['moodTrend'] {
    // Simple heuristic based on emotional markers
    const todayStress = today.emotionalMarkers.filter((m) =>
      ['stress', 'anxiety', 'overwhelm', 'frustration', 'anger', 'sadness'].includes(m.emotion)
    );

    const todayPositive = today.emotionalMarkers.filter((m) =>
      ['joy', 'excitement', 'gratitude', 'satisfaction'].includes(m.emotion)
    );

    if (todayPositive.length > todayStress.length) {
      return 'improving';
    } else if (todayStress.length > todayPositive.length + 2) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Save calibrations to onboarding state
   */
  async saveCalibrations(calibrations: PersonaCalibration[]): Promise<void> {
    const signals: Record<string, string> = {};

    for (const cal of calibrations) {
      if (cal.confidence > 0.5) {
        signals[cal.signal] = cal.value;
      }
    }

    if (Object.keys(signals).length > 0) {
      // Get current signals and merge
      const { data: current } = await this.supabase
        .schema('founder_os')
        .from('onboarding_state')
        .select('persona_signals')
        .eq('user_id', this.config.userId)
        .single();

      const mergedSignals = {
        ...(current?.persona_signals || {}),
        ...signals,
      };

      await this.supabase
        .schema('founder_os')
        .from('onboarding_state')
        .update({ persona_signals: mergedSignals })
        .eq('user_id', this.config.userId);
    }
  }
}

/**
 * Create a reflector calibrator instance
 */
export function createReflectorCalibrator(config: DreamConfig): ReflectorCalibrator {
  return new ReflectorCalibrator(config);
}
