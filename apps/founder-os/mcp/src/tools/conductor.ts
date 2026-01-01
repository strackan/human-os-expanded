/**
 * Interview Conductor Tools
 *
 * MCP tools for running immersive interview experiences.
 * Manages multi-turn conversations through 3 scenes (elevator → reception → office)
 * and produces assessments in multiple formats.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';
import {
  createConductorEngine,
  dndHandler,
  professionalHandler,
  hiringManagerHandler,
  candidateSummaryHandler,
  formatResult,
  type ConductorEngine,
  type ScenePrompt,
  type InterviewComplete,
} from '@human-os/analysis';

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Store active interview sessions by session ID
 * In production, this could be persisted to database
 */
const activeSessions = new Map<string, {
  engine: ConductorEngine;
  candidateName: string;
  startedAt: Date;
}>();

/**
 * Generate a session ID from user context
 */
function getSessionId(ctx: ToolContext, candidateName?: string): string {
  // Use user ID + candidate name as session key
  // This allows one interview per candidate per user
  return `${ctx.userId}:${candidateName || 'current'}`;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const conductorTools: Tool[] = [
  {
    name: 'interview_start',
    description: `Start a new immersive interview session. The interview flows through 3 scenes:
1. Elevator - Warmup with Earl the elevator operator (2-3 exchanges)
2. Reception - Maria asks about goals and interests (3-4 exchanges)
3. Office - Deep dive interview questions (5-7 exchanges)

Each scene has a distinct character. The candidate's responses are analyzed across 11 dimensions
to produce scores, archetype classification, and hiring recommendations.`,
    inputSchema: {
      type: 'object',
      properties: {
        candidate_name: {
          type: 'string',
          description: 'Name of the candidate being interviewed',
        },
      },
      required: ['candidate_name'],
    },
  },
  {
    name: 'interview_respond',
    description: `Submit the candidate's response and get the next prompt from the current character.
The interview automatically transitions between scenes. When the interview is complete,
returns the full assessment results including scores, archetype, and recommendations.`,
    inputSchema: {
      type: 'object',
      properties: {
        response: {
          type: 'string',
          description: "The candidate's response to the previous prompt",
        },
        candidate_name: {
          type: 'string',
          description: 'Name of the candidate (to identify the session)',
        },
      },
      required: ['response', 'candidate_name'],
    },
  },
  {
    name: 'interview_status',
    description: `Get the current status of an interview session.
Shows the current scene, exchange count, and whether the interview is in progress.`,
    inputSchema: {
      type: 'object',
      properties: {
        candidate_name: {
          type: 'string',
          description: 'Name of the candidate to check status for',
        },
      },
      required: ['candidate_name'],
    },
  },
  {
    name: 'interview_format',
    description: `Format a completed interview result in a specific format.
Available formats:
- dnd: D&D Character Sheet (gamified, fun)
- professional: Standard HR assessment (formal)
- hiring_manager: Detailed internal report with risks and follow-up questions
- candidate: Shareable summary for the candidate (no scores exposed)`,
    inputSchema: {
      type: 'object',
      properties: {
        candidate_name: {
          type: 'string',
          description: 'Name of the candidate',
        },
        format: {
          type: 'string',
          enum: ['dnd', 'professional', 'hiring_manager', 'candidate'],
          description: 'Output format to use',
        },
      },
      required: ['candidate_name', 'format'],
    },
  },
  {
    name: 'interview_list',
    description: 'List all active interview sessions for the current user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const StartSchema = z.object({
  candidate_name: z.string().min(1),
});

const RespondSchema = z.object({
  response: z.string().min(1),
  candidate_name: z.string().min(1),
});

const StatusSchema = z.object({
  candidate_name: z.string().min(1),
});

const FormatSchema = z.object({
  candidate_name: z.string().min(1),
  format: z.enum(['dnd', 'professional', 'hiring_manager', 'candidate']),
});

// =============================================================================
// RESULT STORAGE (for formatting after completion)
// =============================================================================

const completedResults = new Map<string, InterviewComplete>();

// =============================================================================
// HANDLER
// =============================================================================

export async function handleConductorTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'interview_start': {
      const input = StartSchema.parse(args);
      const sessionId = getSessionId(ctx, input.candidate_name);

      // Check if session already exists
      if (activeSessions.has(sessionId)) {
        const existing = activeSessions.get(sessionId)!;
        return {
          error: true,
          message: `Interview already in progress for ${input.candidate_name}. Use interview_respond to continue or start with a different name.`,
          session: {
            candidateName: existing.candidateName,
            startedAt: existing.startedAt.toISOString(),
            currentScene: existing.engine.getState()?.currentScene,
          },
        };
      }

      // Create new conductor engine
      const engine = createConductorEngine();
      const prompt = engine.startInterview(input.candidate_name);

      // Store session
      activeSessions.set(sessionId, {
        engine,
        candidateName: input.candidate_name,
        startedAt: new Date(),
      });

      return {
        success: true,
        message: `Interview started for ${input.candidate_name}`,
        scene: prompt.scene,
        character: prompt.characterName,
        prompt: prompt.prompt,
        hint: 'The candidate should respond naturally. Their responses will be analyzed for signals across 11 dimensions.',
      };
    }

    case 'interview_respond': {
      const input = RespondSchema.parse(args);
      const sessionId = getSessionId(ctx, input.candidate_name);

      // Get session
      const session = activeSessions.get(sessionId);
      if (!session) {
        return {
          error: true,
          message: `No active interview for ${input.candidate_name}. Use interview_start to begin.`,
        };
      }

      // Process response
      const result = session.engine.processResponse(input.response);

      // Check if complete
      if ('complete' in result) {
        // Store result for formatting later
        completedResults.set(sessionId, result);

        // Remove from active sessions
        activeSessions.delete(sessionId);

        // Format results with all handlers
        const assessment = result.result;
        const dnd = formatResult(assessment, dndHandler);
        const professional = formatResult(assessment, professionalHandler);

        return {
          complete: true,
          candidateName: assessment.candidateName,
          summary: {
            overallScore: assessment.overallScore.toFixed(1),
            tier: assessment.tier,
            archetype: assessment.archetype.primary,
            recommendation: professional.recommendation,
          },
          dndPreview: {
            class: dnd.class,
            level: dnd.level,
            stats: dnd.stats,
          },
          greenFlags: assessment.greenFlags.slice(0, 5),
          redFlags: assessment.redFlags.slice(0, 5),
          hint: 'Use interview_format to get detailed reports in different formats.',
        };
      }

      // Continue interview
      const prompt = result as ScenePrompt;
      return {
        complete: false,
        scene: prompt.scene,
        character: prompt.characterName,
        prompt: prompt.prompt,
        isTransition: prompt.isTransition,
        progress: `${prompt.exchangeNumber}/${prompt.totalExchanges} exchanges`,
      };
    }

    case 'interview_status': {
      const input = StatusSchema.parse(args);
      const sessionId = getSessionId(ctx, input.candidate_name);

      // Check active sessions
      const session = activeSessions.get(sessionId);
      if (session) {
        const state = session.engine.getState();
        return {
          status: 'in_progress',
          candidateName: session.candidateName,
          startedAt: session.startedAt.toISOString(),
          currentScene: state?.currentScene,
          currentExchange: state?.currentExchange,
          transcriptLength: state?.transcript.length,
        };
      }

      // Check completed results
      if (completedResults.has(sessionId)) {
        const result = completedResults.get(sessionId)!;
        return {
          status: 'completed',
          candidateName: result.result.candidateName,
          overallScore: result.result.overallScore.toFixed(1),
          tier: result.result.tier,
          archetype: result.result.archetype.primary,
          completedAt: result.result.completedAt.toISOString(),
        };
      }

      return {
        status: 'not_found',
        message: `No interview found for ${input.candidate_name}`,
      };
    }

    case 'interview_format': {
      const input = FormatSchema.parse(args);
      const sessionId = getSessionId(ctx, input.candidate_name);

      // Get completed result
      const completed = completedResults.get(sessionId);
      if (!completed) {
        return {
          error: true,
          message: `No completed interview found for ${input.candidate_name}. Complete an interview first.`,
        };
      }

      const assessment = completed.result;

      switch (input.format) {
        case 'dnd':
          return {
            format: 'D&D Character Sheet',
            ...formatResult(assessment, dndHandler),
          };

        case 'professional':
          return {
            format: 'Professional Assessment',
            ...formatResult(assessment, professionalHandler),
          };

        case 'hiring_manager':
          return {
            format: 'Hiring Manager Report',
            ...formatResult(assessment, hiringManagerHandler),
          };

        case 'candidate':
          return {
            format: 'Candidate Summary',
            ...formatResult(assessment, candidateSummaryHandler),
          };
      }
      break;
    }

    case 'interview_list': {
      const userPrefix = `${ctx.userId}:`;
      const sessions: Array<{
        candidateName: string;
        status: string;
        scene?: string;
        startedAt?: string;
      }> = [];

      // Active sessions
      for (const [key, session] of activeSessions.entries()) {
        if (key.startsWith(userPrefix)) {
          sessions.push({
            candidateName: session.candidateName,
            status: 'in_progress',
            scene: session.engine.getState()?.currentScene,
            startedAt: session.startedAt.toISOString(),
          });
        }
      }

      // Completed sessions
      for (const [key, result] of completedResults.entries()) {
        if (key.startsWith(userPrefix)) {
          sessions.push({
            candidateName: result.result.candidateName,
            status: 'completed',
          });
        }
      }

      return {
        sessions,
        total: sessions.length,
        message: sessions.length === 0
          ? 'No interview sessions found. Use interview_start to begin.'
          : `Found ${sessions.length} interview session(s).`,
      };
    }

    default:
      return null;
  }
}
