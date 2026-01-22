/**
 * Tough Love Optional Job
 *
 * Compares actual progress vs stated goals and provides raw feedback.
 * Only runs when tough_love_enabled is true for the user.
 *
 * The Larry David Rule: If user said "no matter what", hold them to it.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DreamConfig,
  ParserOutput,
  PlannerOutput,
  ToughLoveOutput,
  DeficiencyReport,
} from './types.js';

// =============================================================================
// TOUGH LOVE CLASS
// =============================================================================

export class ToughLove {
  private anthropic: Anthropic | null = null;
  private supabase: SupabaseClient;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }
  }

  /**
   * Check if tough love is enabled for user
   */
  async isEnabled(): Promise<boolean> {
    const { data } = await this.supabase
      .schema('founder_os')
      .from('onboarding_state')
      .select('tough_love_enabled')
      .eq('user_id', this.config.userId)
      .single();

    return data?.tough_love_enabled || false;
  }

  /**
   * Run tough love analysis
   */
  async analyze(
    todayOutput: ParserOutput,
    plannerOutput: PlannerOutput
  ): Promise<ToughLoveOutput> {
    // Get historical commitments and goals
    const bindingCommitments = await this.getBindingCommitments();
    const goals = await this.getGoals();

    // If we have Anthropic API, use LLM for analysis
    if (this.anthropic) {
      return this.analyzeWithLLM(todayOutput, plannerOutput, bindingCommitments, goals);
    }

    // Otherwise, use rule-based analysis
    return this.analyzeWithRules(todayOutput, plannerOutput, bindingCommitments, goals);
  }

  /**
   * Get binding commitments from recent journal entries
   */
  private async getBindingCommitments(): Promise<
    Array<{
      statement: string;
      date: string;
      fulfilled: boolean;
    }>
  > {
    // Look for binding commitments stored in journal ai_insights
    const since = new Date();
    since.setDate(since.getDate() - 30); // Last 30 days

    const { data } = await this.supabase
      .schema('human_os')
      .from('journal_entries')
      .select('entry_date, ai_insights')
      .eq('owner_id', this.config.userId)
      .eq('entry_type', 'daily_review')
      .gte('entry_date', since.toISOString().split('T')[0]);

    const commitments: Array<{ statement: string; date: string; fulfilled: boolean }> = [];

    for (const entry of data || []) {
      const insights = entry.ai_insights as {
        commitmentsDetected?: number;
        bindingCommitments?: Array<{ statement: string; isBinding: boolean }>;
      };

      if (insights?.bindingCommitments) {
        for (const c of insights.bindingCommitments) {
          if (c.isBinding) {
            commitments.push({
              statement: c.statement,
              date: entry.entry_date,
              fulfilled: false, // Would need tracking to know this
            });
          }
        }
      }
    }

    return commitments;
  }

  /**
   * Get active goals
   */
  private async getGoals(): Promise<
    Array<{
      id: string;
      title: string;
      targetValue: number;
      currentValue: number;
      timeframe: string;
      endDate?: string;
    }>
  > {
    const { data } = await this.supabase
      .schema('founder_os')
      .from('goals')
      .select('id, title, target_value, current_value, timeframe, end_date')
      .eq('user_id', this.config.userId);

    return (data || []).map((g) => ({
      id: g.id,
      title: g.title,
      targetValue: g.target_value || 0,
      currentValue: g.current_value || 0,
      timeframe: g.timeframe,
      endDate: g.end_date,
    }));
  }

  /**
   * Analyze using Claude for nuanced feedback
   */
  private async analyzeWithLLM(
    today: ParserOutput,
    planner: PlannerOutput,
    commitments: Array<{ statement: string; date: string; fulfilled: boolean }>,
    goals: Array<{
      id: string;
      title: string;
      targetValue: number;
      currentValue: number;
      timeframe: string;
    }>
  ): Promise<ToughLoveOutput> {
    const systemPrompt = `You are a Tough Love analyst for Founder-OS. Your job is to provide direct, honest feedback about the user's progress vs their stated goals and commitments.

You follow the Larry David Rule: If someone said "no matter what", "I promise", or similar binding language, you hold them accountable. You don't let things slide.

Return a JSON object with this structure:
{
  "overallAssessment": "on_track|minor_slip|significant_gap|crisis",
  "deficiencies": [
    {
      "area": "area of deficiency",
      "expected": "what they said they'd do",
      "actual": "what's actually happening",
      "gap": "the delta",
      "recommendation": "what they should do"
    }
  ],
  "bindingCommitmentsStatus": [
    {
      "commitment": "the binding commitment",
      "status": "kept|in_progress|broken",
      "notes": "context"
    }
  ],
  "rawFeedback": "Direct, honest paragraph about how they're really doing. Don't sugarcoat. If they're falling short, say so clearly but constructively. Be the friend who tells them what they need to hear, not what they want to hear.",
  "actionRequired": true|false
}

Be direct but not cruel. The goal is accountability, not punishment.

Return ONLY the JSON object.`;

    const userPrompt = `Analyze this user's actual performance vs expectations:

TODAY'S ACTIVITY:
${JSON.stringify(today, null, 2)}

PLANNER ASSESSMENT:
${JSON.stringify(planner, null, 2)}

BINDING COMMITMENTS (promises they made):
${JSON.stringify(commitments, null, 2)}

GOALS:
${JSON.stringify(goals, null, 2)}

Return your tough love analysis as JSON:`;

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
      return this.analyzeWithRules(today, planner, commitments, goals);
    }
  }

  /**
   * Analyze using rules when LLM is not available
   */
  private analyzeWithRules(
    today: ParserOutput,
    planner: PlannerOutput,
    commitments: Array<{ statement: string; date: string; fulfilled: boolean }>,
    goals: Array<{
      id: string;
      title: string;
      targetValue: number;
      currentValue: number;
      timeframe: string;
    }>
  ): ToughLoveOutput {
    const deficiencies: DeficiencyReport[] = [];
    let overallScore = 0;

    // Check dropped balls
    if (planner.droppedBalls.length > 0) {
      for (const dropped of planner.droppedBalls) {
        deficiencies.push({
          area: 'Task completion',
          expected: dropped.originalCommitment || dropped.description,
          actual: `${dropped.daysMissed} days overdue`,
          gap: `Missed deadline by ${dropped.daysMissed} days`,
          recommendation: `Either complete this immediately or explicitly cancel/reschedule it`,
        });
        overallScore += dropped.urgency === 'critical' ? 3 : dropped.urgency === 'high' ? 2 : 1;
      }
    }

    // Check weekly plan status
    if (!planner.weeklyPlanStatus.onTrack) {
      deficiencies.push({
        area: 'Weekly goals',
        expected: 'On track for weekly objectives',
        actual: `${planner.weeklyPlanStatus.percentComplete}% complete`,
        gap: `Behind schedule - ${planner.weeklyPlanStatus.blockers.join(', ')}`,
        recommendation: 'Reassess weekly priorities or adjust goals to be realistic',
      });
      overallScore += 2;
    }

    // Check goal progress
    for (const goal of goals) {
      if (goal.targetValue > 0) {
        const progress = (goal.currentValue / goal.targetValue) * 100;
        if (progress < 25 && goal.timeframe === 'weekly') {
          deficiencies.push({
            area: `Goal: ${goal.title}`,
            expected: `${goal.targetValue} ${goal.title}`,
            actual: `${goal.currentValue} (${Math.round(progress)}%)`,
            gap: `${Math.round(100 - progress)}% remaining`,
            recommendation: 'Focus on this goal or adjust target',
          });
          overallScore += 1;
        }
      }
    }

    // Check binding commitments
    const bindingStatus: Array<{ commitment: string; status: 'in_progress' | 'kept' | 'broken'; notes?: string }> = commitments.map((c) => ({
      commitment: c.statement,
      status: c.fulfilled ? 'kept' as const : 'in_progress' as const,
      notes: c.fulfilled ? undefined : `Made on ${c.date} - status unknown`,
    }));

    // Calculate overall assessment
    let overallAssessment: ToughLoveOutput['overallAssessment'];
    if (overallScore === 0) {
      overallAssessment = 'on_track';
    } else if (overallScore <= 2) {
      overallAssessment = 'minor_slip';
    } else if (overallScore <= 5) {
      overallAssessment = 'significant_gap';
    } else {
      overallAssessment = 'crisis';
    }

    // Generate raw feedback
    const rawFeedback = this.generateRawFeedback(
      overallAssessment,
      deficiencies,
      planner.droppedBalls.length
    );

    return {
      overallAssessment,
      deficiencies,
      bindingCommitmentsStatus: bindingStatus,
      rawFeedback,
      actionRequired: overallScore > 2,
    };
  }

  /**
   * Generate raw feedback text
   */
  private generateRawFeedback(
    assessment: ToughLoveOutput['overallAssessment'],
    deficiencies: DeficiencyReport[],
    droppedBallCount: number
  ): string {
    switch (assessment) {
      case 'on_track':
        return "You're doing what you said you'd do. Keep it up.";

      case 'minor_slip':
        return `A few things slipping through the cracks. You've got ${droppedBallCount} overdue items. Nothing critical, but don't let these stack up. Pick one and knock it out today.`;

      case 'significant_gap':
        return `Honest assessment: there's a gap between what you committed to and what's happening. ${deficiencies.length} areas need attention. This isn't a crisis yet, but you're trending in the wrong direction. Time to either execute or have an honest conversation with yourself about what you can actually commit to.`;

      case 'crisis':
        return `Real talk: you're significantly behind on multiple fronts. ${deficiencies.length} deficiencies, ${droppedBallCount} dropped balls. Something's not working. Either the goals are unrealistic, something's blocking you that you're not addressing, or you need to make some hard choices about priorities. What's the actual problem here?`;
    }
  }
}

/**
 * Create a tough love instance
 */
export function createToughLove(config: DreamConfig): ToughLove {
  return new ToughLove(config);
}
