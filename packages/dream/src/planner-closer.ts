/**
 * Planner/Closer Agent
 *
 * Agent 3 of dream() - ensures accountability and plans tomorrow:
 * - Task completion tracking
 * - Dropped ball detection
 * - Follow-up scheduling
 * - Tomorrow's priorities
 * - Weekly plan status
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DreamConfig,
  ParserOutput,
  PlannerOutput,
  TaskCompletion,
  DroppedBall,
  FollowUp,
  TomorrowPriority,
} from './types.js';

// =============================================================================
// PLANNER CLOSER CLASS
// =============================================================================

export class PlannerCloser {
  private anthropic: Anthropic | null = null;
  private supabase: SupabaseClient;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }
  }

  /**
   * Plan and close loops based on today's activity
   */
  async plan(todayOutput: ParserOutput): Promise<PlannerOutput> {
    // Get current tasks and commitments
    const openTasks = await this.getOpenTasks();
    const weeklyPlan = await this.getWeeklyPlan();

    // If we have Anthropic API, use LLM for planning
    if (this.anthropic) {
      return this.planWithLLM(todayOutput, openTasks, weeklyPlan);
    }

    // Otherwise, use rule-based planning
    return this.planWithRules(todayOutput, openTasks, weeklyPlan);
  }

  /**
   * Get open tasks for user
   */
  private async getOpenTasks(): Promise<
    Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      createdAt: string;
    }>
  > {
    const { data } = await this.supabase
      .schema('founder_os')
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('user_id', this.config.userId)
      .in('status', ['todo', 'in_progress', 'blocked'])
      .order('due_date', { ascending: true, nullsFirst: false });

    return (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      createdAt: t.created_at,
    }));
  }

  /**
   * Get weekly plan (goals for the week)
   */
  private async getWeeklyPlan(): Promise<{
    goals: Array<{ id: string; title: string; progress: number }>;
    weekStart: string;
  }> {
    const weekStart = this.getWeekStart();

    const { data } = await this.supabase
      .schema('founder_os')
      .from('goals')
      .select('id, title, current_value, target_value')
      .eq('user_id', this.config.userId)
      .eq('timeframe', 'weekly')
      .gte('start_date', weekStart);

    const goals = (data || []).map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0,
    }));

    return { goals, weekStart };
  }

  /**
   * Get start of current week (Monday)
   */
  private getWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Plan using Claude for smarter prioritization
   */
  private async planWithLLM(
    today: ParserOutput,
    openTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      createdAt: string;
    }>,
    weeklyPlan: {
      goals: Array<{ id: string; title: string; progress: number }>;
      weekStart: string;
    }
  ): Promise<PlannerOutput> {
    const systemPrompt = `You are a dream() planner agent for Founder-OS. Your job is to close loops and plan for tomorrow.

Return a JSON object with this structure:
{
  "taskCompletions": [
    {
      "taskId": "uuid",
      "title": "task title",
      "status": "completed|in_progress|blocked|dropped",
      "notes": "optional notes"
    }
  ],
  "droppedBalls": [
    {
      "description": "what was dropped",
      "originalCommitment": "if there was one",
      "daysMissed": number,
      "urgency": "critical|high|medium|low"
    }
  ],
  "followUps": [
    {
      "description": "what to follow up on",
      "targetDate": "YYYY-MM-DD",
      "relatedEntity": "person/company if relevant",
      "priority": "high|medium|low"
    }
  ],
  "tomorrowPriorities": [
    {
      "rank": 1,
      "description": "what to focus on",
      "reason": "why this is important",
      "estimatedMinutes": number
    }
  ],
  "weeklyPlanStatus": {
    "onTrack": true|false,
    "percentComplete": number,
    "blockers": ["list of blockers"]
  }
}

Focus on:
1. TASK STATUS: Update any tasks that appear completed or blocked based on today's activity
2. DROPPED BALLS: Identify overdue tasks or unfulfilled commitments
3. FOLLOW UPS: Schedule follow-ups mentioned in conversations
4. PRIORITIES: Suggest top 3-5 priorities for tomorrow based on urgency and importance
5. WEEKLY STATUS: Assess progress against weekly goals

Return ONLY the JSON object.`;

    const userPrompt = `Plan based on today's activity and current state:

TODAY'S PARSED OUTPUT:
${JSON.stringify(today, null, 2)}

OPEN TASKS:
${JSON.stringify(openTasks, null, 2)}

WEEKLY PLAN:
${JSON.stringify(weeklyPlan, null, 2)}

Return your plan as JSON:`;

    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return this.planWithRules(today, openTasks, weeklyPlan);
    }
  }

  /**
   * Plan using rules when LLM is not available
   */
  private planWithRules(
    today: ParserOutput,
    openTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      createdAt: string;
    }>,
    weeklyPlan: {
      goals: Array<{ id: string; title: string; progress: number }>;
      weekStart: string;
    }
  ): PlannerOutput {
    return {
      taskCompletions: this.detectCompletions(today, openTasks),
      droppedBalls: this.detectDroppedBalls(openTasks),
      followUps: this.extractFollowUps(today),
      tomorrowPriorities: this.calculatePriorities(openTasks, today),
      weeklyPlanStatus: this.assessWeeklyStatus(weeklyPlan),
    };
  }

  /**
   * Detect task completions based on today's activity
   */
  private detectCompletions(
    today: ParserOutput,
    openTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
    }>
  ): TaskCompletion[] {
    // Simple heuristic: look for completion keywords in summary/themes
    const completionKeywords = ['done', 'finished', 'completed', 'shipped', 'launched'];
    const lowerSummary = today.summary.toLowerCase();

    // This is a placeholder - real implementation would need task matching
    return [];
  }

  /**
   * Detect dropped balls (overdue tasks)
   */
  private detectDroppedBalls(
    openTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      createdAt: string;
    }>
  ): DroppedBall[] {
    const dropped: DroppedBall[] = [];
    const today = new Date();

    for (const task of openTasks) {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < today) {
          const daysMissed = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          let urgency: DroppedBall['urgency'] = 'medium';
          if (task.priority === 'critical' || daysMissed > 7) {
            urgency = 'critical';
          } else if (task.priority === 'high' || daysMissed > 3) {
            urgency = 'high';
          }

          dropped.push({
            description: task.title,
            daysMissed,
            urgency,
          });
        }
      }
    }

    return dropped;
  }

  /**
   * Extract follow-ups from today's activity
   */
  private extractFollowUps(today: ParserOutput): FollowUp[] {
    const followUps: FollowUp[] = [];

    // Look for follow-up patterns in tasks
    for (const task of today.tasks) {
      if (
        task.title.toLowerCase().includes('follow up') ||
        task.title.toLowerCase().includes('check in')
      ) {
        // Default to 2 days out
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);

        followUps.push({
          description: task.title,
          targetDate: targetDate.toISOString().split('T')[0],
          priority: task.priority === 'critical' || task.priority === 'high' ? 'high' : 'medium',
        });
      }
    }

    // Look for mentioned entities that might need follow-up
    for (const entity of today.entities) {
      if (entity.type === 'person') {
        // Check if there's a related commitment
        const relatedCommitment = today.commitments.find(
          (c) => c.context.toLowerCase().includes(entity.name.toLowerCase())
        );

        if (relatedCommitment) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);

          followUps.push({
            description: `Follow up with ${entity.name} re: ${relatedCommitment.statement.substring(0, 50)}`,
            targetDate: targetDate.toISOString().split('T')[0],
            relatedEntity: entity.name,
            priority: relatedCommitment.isBinding ? 'high' : 'medium',
          });
        }
      }
    }

    return followUps;
  }

  /**
   * Calculate tomorrow's priorities
   */
  private calculatePriorities(
    openTasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
    }>,
    today: ParserOutput
  ): TomorrowPriority[] {
    const priorities: TomorrowPriority[] = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Add due-tomorrow tasks as top priority
    const dueTomorrow = openTasks.filter((t) => t.dueDate === tomorrowStr);
    for (const task of dueTomorrow) {
      priorities.push({
        rank: priorities.length + 1,
        description: task.title,
        reason: 'Due tomorrow',
        estimatedMinutes: 60, // Default estimate
      });
    }

    // Add critical tasks
    const criticalTasks = openTasks.filter(
      (t) => t.priority === 'critical' && !dueTomorrow.includes(t)
    );
    for (const task of criticalTasks.slice(0, 2)) {
      priorities.push({
        rank: priorities.length + 1,
        description: task.title,
        reason: 'Critical priority',
        estimatedMinutes: 90,
      });
    }

    // Add blocked items that need unblocking
    const blockedTasks = openTasks.filter((t) => t.status === 'blocked');
    for (const task of blockedTasks.slice(0, 2)) {
      priorities.push({
        rank: priorities.length + 1,
        description: `Unblock: ${task.title}`,
        reason: 'Currently blocked - needs attention',
        estimatedMinutes: 30,
      });
    }

    // Limit to top 5
    return priorities.slice(0, 5).map((p, i) => ({ ...p, rank: i + 1 }));
  }

  /**
   * Assess weekly plan status
   */
  private assessWeeklyStatus(weeklyPlan: {
    goals: Array<{ id: string; title: string; progress: number }>;
    weekStart: string;
  }): PlannerOutput['weeklyPlanStatus'] {
    if (weeklyPlan.goals.length === 0) {
      return {
        onTrack: true,
        percentComplete: 0,
        blockers: ['No weekly goals set'],
      };
    }

    const avgProgress =
      weeklyPlan.goals.reduce((sum, g) => sum + g.progress, 0) / weeklyPlan.goals.length;

    // Calculate expected progress based on day of week
    const now = new Date();
    const weekStart = new Date(weeklyPlan.weekStart);
    const dayOfWeek = Math.floor(
      (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = (dayOfWeek / 7) * 100;

    const onTrack = avgProgress >= expectedProgress - 10; // 10% buffer

    const blockers: string[] = [];
    for (const goal of weeklyPlan.goals) {
      if (goal.progress < expectedProgress - 20) {
        blockers.push(`${goal.title} is behind schedule (${Math.round(goal.progress)}%)`);
      }
    }

    return {
      onTrack,
      percentComplete: Math.round(avgProgress),
      blockers,
    };
  }

  /**
   * Save planner output to database
   */
  async save(output: PlannerOutput): Promise<void> {
    // Update task statuses
    for (const completion of output.taskCompletions) {
      if (completion.taskId) {
        await this.supabase
          .schema('founder_os')
          .from('tasks')
          .update({
            status: completion.status === 'dropped' ? 'cancelled' : completion.status,
            completed_at: completion.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', completion.taskId);
      }
    }

    // Create follow-up tasks
    for (const followUp of output.followUps) {
      await this.supabase.schema('founder_os').from('tasks').insert({
        user_id: this.config.userId,
        title: followUp.description,
        status: 'todo',
        priority: followUp.priority,
        due_date: followUp.targetDate,
      });
    }
  }
}

/**
 * Create a planner closer instance
 */
export function createPlannerCloser(config: DreamConfig): PlannerCloser {
  return new PlannerCloser(config);
}
