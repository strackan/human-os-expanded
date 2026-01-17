/**
 * Dream Service
 *
 * Main orchestrator for the dream() end-of-day processing system.
 * Coordinates Parser, Reflector, Planner, and optional Tough Love agents.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DreamConfig, DayTranscript, DreamResult, MCPProviderSyncResult } from './types.js';
import { ParserRouter } from './parser-router.js';
import { ReflectorCalibrator } from './reflector-calibrator.js';
import { PlannerCloser } from './planner-closer.js';
import { ToughLove } from './tough-love.js';
import { GraduationChecker } from './graduation-check.js';
import { MCPSync } from './mcp-sync.js';

// =============================================================================
// DREAM SERVICE CLASS
// =============================================================================

export class DreamService {
  private supabase: SupabaseClient;
  private parser: ParserRouter;
  private reflector: ReflectorCalibrator;
  private planner: PlannerCloser;
  private toughLove: ToughLove;
  private graduationChecker: GraduationChecker;
  private mcpSync: MCPSync;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.parser = new ParserRouter(config);
    this.reflector = new ReflectorCalibrator(config);
    this.planner = new PlannerCloser(config);
    this.toughLove = new ToughLove(config);
    this.graduationChecker = new GraduationChecker(config);
    this.mcpSync = new MCPSync({
      ...config,
      maxItemsPerProvider: config.mcpMaxItemsPerProvider,
      skipIfExtractedWithin: config.mcpSkipIfExtractedWithin,
    });
  }

  /**
   * Check if dream() needs to run (based on stale threshold)
   */
  async needsToRun(): Promise<boolean> {
    const threshold = this.config.staleThresholdHours || 18;
    const since = new Date();
    since.setHours(since.getHours() - threshold);

    // Check for recent dream() runs
    const { data } = await this.supabase
      .schema('human_os')
      .from('journal_entries')
      .select('created_at')
      .eq('owner_id', this.config.userId)
      .eq('entry_type', 'daily_review')
      .gte('created_at', since.toISOString())
      .limit(1);

    return !data || data.length === 0;
  }

  /**
   * Get today's transcript from stored messages
   */
  async getTodayTranscript(): Promise<DayTranscript | null> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    // Try to get transcripts from human_os.transcripts table
    const { data } = await this.supabase
      .schema('human_os')
      .from('transcripts')
      .select('content, created_at')
      .eq('owner_id', this.config.userId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      return null;
    }

    // Combine all transcript messages
    const messages = data.flatMap((t) => {
      const content = t.content as { messages?: Array<{ role: string; content: string }> };
      return (content.messages || []).map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: t.created_at,
      }));
    });

    if (messages.length === 0) {
      return null;
    }

    return {
      date: today,
      messages,
    };
  }

  /**
   * Run the complete dream() pipeline
   */
  async run(transcript?: DayTranscript): Promise<DreamResult> {
    const startedAt = new Date().toISOString();
    const errors: string[] = [];

    // Phase 0: MCP Provider Sync (if enabled)
    let mcpSyncResults: MCPProviderSyncResult[] = [];
    let mcpTranscript: DayTranscript | null = null;

    if (this.config.enableMCPSync) {
      if (this.config.debug) {
        console.log('[dream] Phase 0: Syncing MCP providers...');
      }

      try {
        const syncResults = await this.mcpSync.syncAll();
        mcpSyncResults = syncResults.map((r) => ({
          providerId: r.providerId,
          providerSlug: r.providerSlug,
          itemsProcessed: r.itemsProcessed,
          entitiesExtracted: r.entitiesExtracted,
          errors: r.errors,
        }));

        // Get combined transcript from MCP providers
        mcpTranscript = await this.mcpSync.getCombinedTranscript();

        if (this.config.debug) {
          const totalItems = mcpSyncResults.reduce((sum, r) => sum + r.itemsProcessed, 0);
          console.log(`[dream] Phase 0 complete: ${totalItems} items from ${mcpSyncResults.length} providers`);
        }
      } catch (e) {
        errors.push(`MCP sync error: ${e}`);
        if (this.config.debug) {
          console.error('[dream] MCP sync failed:', e);
        }
      }
    }

    // Get transcript if not provided - merge with MCP transcript if available
    let actualTranscript = transcript || (await this.getTodayTranscript());

    // Merge MCP transcript with regular transcript
    if (mcpTranscript && mcpTranscript.messages.length > 0) {
      if (actualTranscript) {
        // Combine messages
        actualTranscript = {
          ...actualTranscript,
          messages: [...actualTranscript.messages, ...mcpTranscript.messages],
          sessionIds: [
            ...(actualTranscript.sessionIds || []),
            ...(mcpTranscript.sessionIds || []),
          ],
        };
      } else {
        actualTranscript = mcpTranscript;
      }
    }

    if (!actualTranscript) {
      return {
        date: new Date().toISOString().split('T')[0],
        startedAt,
        completedAt: new Date().toISOString(),
        parser: {
          date: new Date().toISOString().split('T')[0],
          entities: [],
          tasks: [],
          commitments: [],
          questionAnswers: [],
          emotionalMarkers: [],
          glossaryCandidates: [],
          summary: 'No transcript data available for today.',
          themes: [],
        },
        reflector: {
          patterns: [],
          calibrations: [],
          protocolAdjustments: [],
          currentStateUpdate: '',
          moodTrend: 'stable',
        },
        planner: {
          taskCompletions: [],
          droppedBalls: [],
          followUps: [],
          tomorrowPriorities: [],
          weeklyPlanStatus: {
            onTrack: true,
            percentComplete: 0,
            blockers: ['No data to analyze'],
          },
        },
        operations: {
          journalEntriesCreated: 0,
          entityMentionsCreated: 0,
          leadsCreated: 0,
          tasksCreated: 0,
          glossaryEntriesCreated: 0,
          questionAnswersRecorded: 0,
          onboardingStateUpdated: false,
        },
        errors: ['No transcript data available'],
      };
    }

    // Record daily interaction for graduation tracking
    try {
      await this.graduationChecker.recordInteraction();
    } catch (e) {
      errors.push(`Failed to record interaction: ${e}`);
    }

    // Phase 1: Parse and route
    if (this.config.debug) {
      console.log('[dream] Phase 1: Parsing transcript...');
    }

    let parserOutput;
    try {
      parserOutput = await this.parser.parse(actualTranscript);
    } catch (e) {
      errors.push(`Parser error: ${e}`);
      parserOutput = {
        date: actualTranscript.date,
        entities: [],
        tasks: [],
        commitments: [],
        questionAnswers: [],
        emotionalMarkers: [],
        glossaryCandidates: [],
        summary: 'Parser failed',
        themes: [],
      };
    }

    // Route parser output to database
    let routeResults = {
      journalEntriesCreated: 0,
      entityMentionsCreated: 0,
      leadsCreated: 0,
      tasksCreated: 0,
      glossaryEntriesCreated: 0,
      questionAnswersRecorded: 0,
    };

    try {
      routeResults = await this.parser.route(parserOutput);
    } catch (e) {
      errors.push(`Routing error: ${e}`);
    }

    // Phase 2: Reflect and calibrate
    if (this.config.debug) {
      console.log('[dream] Phase 2: Reflecting...');
    }

    let reflectorOutput;
    try {
      reflectorOutput = await this.reflector.reflect(parserOutput);

      // Save calibrations
      if (reflectorOutput.calibrations.length > 0) {
        await this.reflector.saveCalibrations(reflectorOutput.calibrations);
      }
    } catch (e) {
      errors.push(`Reflector error: ${e}`);
      reflectorOutput = {
        patterns: [],
        calibrations: [],
        protocolAdjustments: [],
        currentStateUpdate: '',
        moodTrend: 'stable' as const,
      };
    }

    // Phase 3: Plan and close loops
    if (this.config.debug) {
      console.log('[dream] Phase 3: Planning...');
    }

    let plannerOutput;
    try {
      plannerOutput = await this.planner.plan(parserOutput);

      // Save planner outputs
      await this.planner.save(plannerOutput);
    } catch (e) {
      errors.push(`Planner error: ${e}`);
      plannerOutput = {
        taskCompletions: [],
        droppedBalls: [],
        followUps: [],
        tomorrowPriorities: [],
        weeklyPlanStatus: {
          onTrack: true,
          percentComplete: 0,
          blockers: [],
        },
      };
    }

    // Phase 4: Tough Love (optional)
    let toughLoveOutput;
    try {
      const toughLoveEnabled = await this.toughLove.isEnabled();
      if (toughLoveEnabled) {
        if (this.config.debug) {
          console.log('[dream] Phase 4: Tough love analysis...');
        }
        toughLoveOutput = await this.toughLove.analyze(parserOutput, plannerOutput);
      }
    } catch (e) {
      errors.push(`Tough love error: ${e}`);
    }

    // Check graduation eligibility
    let onboardingStateUpdated = false;
    try {
      const eligibility = await this.graduationChecker.checkEligibility();
      if (eligibility.eligible) {
        const result = await this.graduationChecker.graduate();
        onboardingStateUpdated = result.success;
        if (result.success && this.config.debug) {
          console.log('[dream] User graduated to Development Mode!');
        }
      }
    } catch (e) {
      errors.push(`Graduation check error: ${e}`);
    }

    // Build MCP sync summary if we processed any providers
    const mcpSyncSummary = mcpSyncResults.length > 0
      ? {
          providersProcessed: mcpSyncResults.length,
          totalItemsProcessed: mcpSyncResults.reduce((sum, r) => sum + r.itemsProcessed, 0),
          results: mcpSyncResults,
        }
      : undefined;

    return {
      date: actualTranscript.date,
      startedAt,
      completedAt: new Date().toISOString(),
      mcpSync: mcpSyncSummary,
      parser: parserOutput,
      reflector: reflectorOutput,
      planner: plannerOutput,
      toughLove: toughLoveOutput,
      operations: {
        ...routeResults,
        onboardingStateUpdated,
      },
      errors,
    };
  }

  /**
   * Run dream() only if needed (stale check)
   */
  async runIfNeeded(): Promise<DreamResult | null> {
    const needsRun = await this.needsToRun();
    if (!needsRun) {
      if (this.config.debug) {
        console.log('[dream] Recent run exists, skipping');
      }
      return null;
    }

    return this.run();
  }

  /**
   * Get graduation progress summary
   */
  async getProgressSummary(): Promise<string> {
    return this.graduationChecker.getProgressSummary();
  }

  /**
   * Get onboarding state
   */
  async getOnboardingState() {
    return this.graduationChecker.getOnboardingState();
  }
}

/**
 * Create a dream service instance
 */
export function createDreamService(config: DreamConfig): DreamService {
  return new DreamService(config);
}
