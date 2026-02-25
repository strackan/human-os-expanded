/**
 * Interview Conductor Tools
 *
 * Protocol-driven MCP tools for running immersive interview experiences.
 * Claude IS the interviewer -- these tools provide context and track signals.
 *
 * Flow:
 * 1. interview_start - Get protocol context and character guidance
 * 2. Claude (as character) conducts natural conversation
 * 3. interview_log - Log exchanges, track captured attributes
 * 4. interview_transition - Move between scenes when ready
 * 5. interview_complete - End interview and get assessment
 * 6. interview_format - Format results for different audiences
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  createSessionManager,
  ATTRIBUTE_SETS,
  dndHandler,
  professionalHandler,
  hiringManagerHandler,
  candidateSummaryHandler,
  formatResult,
  LLMAssessmentSchema,
  buildHybridAssessment,
  generateAssessmentPrompt,
  type SessionManager,
  type SessionContext,
  type AssessmentResult,
  type Scene,
  type LLMAssessment,
} from '@human-os/analysis';

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Store active session managers by user ID
 */
const userSessions = new Map<string, SessionManager>();

/**
 * Store completed results for formatting
 */
const completedResults = new Map<string, AssessmentResult>();

/**
 * Get or create session manager for a user
 */
function getSessionManager(userId: string): SessionManager {
  let manager = userSessions.get(userId);
  if (!manager) {
    manager = createSessionManager();
    userSessions.set(userId, manager);
  }
  return manager;
}

/**
 * Load the interview protocol
 */
function loadProtocol(): string {
  try {
    // Try to load from file system (development)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const protocolPath = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'packages',
      'analysis',
      'src',
      'conductor',
      'protocol.md'
    );
    return readFileSync(protocolPath, 'utf-8');
  } catch {
    // Return embedded version for standalone builds
    return EMBEDDED_PROTOCOL;
  }
}

// Embedded protocol for standalone builds
const EMBEDDED_PROTOCOL = `# Interview Conductor Protocol

You are conducting an immersive interview experience.

## Your Role

You ARE the interviewer. You don't execute scripts -- you embody characters and respond naturally.

**Your twin objectives:**
1. Create a positive, memorable experience for the candidate
2. Capture signals across the required attribute set

## The Journey

**Scene 1: Elevator (Earl)** - 2-3 exchanges, warmup
**Scene 2: Reception (Maria)** - 3-4 exchanges, interests/goals
**Scene 3: Office (You)** - 5-7 exchanges, deep dive

## Handling Creative Directions

Let candidates explore IF positive/playful.
Redirect IF dismissive, negative, or cruel.
You have autonomy to make the call.

## The North Star

Create a conversation so good they'd want to do it again.
`;

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const conductorTools: Tool[] = [
  {
    name: 'interview_start',
    description: `Start a new protocol-driven interview session.

Returns:
- Protocol guidance for conducting the interview
- Character personas for each scene
- Attribute set to capture
- Session context

You (Claude) then conduct the interview naturally as each character.
Use interview_log to track exchanges and capture signals.`,
    inputSchema: {
      type: 'object',
      properties: {
        candidate_name: {
          type: 'string',
          description: 'Name of the candidate being interviewed',
        },
        attribute_set: {
          type: 'string',
          enum: Object.keys(ATTRIBUTE_SETS),
          description: 'Which attribute set to capture (default: goodhang_full)',
        },
      },
      required: ['candidate_name'],
    },
  },
  {
    name: 'interview_log',
    description: `Log an interview exchange and detect captured attributes.

Call this after each exchange to:
- Track the conversation transcript
- Detect which attributes were signaled
- Get progress toward complete capture
- Get suggestions for uncaptured attributes`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID from interview_start',
        },
        character_line: {
          type: 'string',
          description: 'What you (as the character) said',
        },
        candidate_response: {
          type: 'string',
          description: "The candidate's response",
        },
      },
      required: ['session_id', 'character_line', 'candidate_response'],
    },
  },
  {
    name: 'interview_transition',
    description: `Transition to the next scene.

Call when you're ready to move:
- elevator -> reception
- reception -> office

The tool updates the session and returns the new scene context.`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID',
        },
        new_scene: {
          type: 'string',
          enum: ['elevator', 'reception', 'office'],
          description: 'The scene to transition to',
        },
      },
      required: ['session_id', 'new_scene'],
    },
  },
  {
    name: 'interview_status',
    description: `Get current interview status and capture progress.

Returns session context, progress, and suggestions.`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'interview_complete',
    description: `Complete the interview using algorithmic-only scoring (legacy).

For better results, use interview_submit_assessment instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'interview_submit_assessment',
    description: `Submit your assessment of the candidate (RECOMMENDED).

After conducting the interview, provide your evaluation. Your semantic assessment
will be validated against transcript evidence to detect potential bias.

The assessment JSON should include:
- dimensions: Your 0-10 scores for each of the 11 dimensions
- archetype: Primary archetype with confidence and reasoning
- observedAttributes: Evidence for observed attributes
- greenFlags/redFlags: Signals you noticed
- overallImpression: 1-2 sentence summary
- recommendedTier: top_1%, strong, moderate, weak, or pass

Your assessment will be validated and bias-adjusted before final output.`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID',
        },
        assessment: {
          type: 'object',
          description: 'Your assessment in the specified JSON format',
        },
      },
      required: ['session_id', 'assessment'],
    },
  },
  {
    name: 'interview_format',
    description: `Format a completed interview in a specific style.

Available formats:
- dnd: D&D Character Sheet (gamified, fun)
- professional: Standard HR assessment (formal)
- hiring_manager: Detailed internal report
- candidate: Shareable summary (no scores)`,
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID of a completed interview',
        },
        format: {
          type: 'string',
          enum: ['dnd', 'professional', 'hiring_manager', 'candidate'],
          description: 'Output format to use',
        },
      },
      required: ['session_id', 'format'],
    },
  },
  {
    name: 'interview_list',
    description: 'List all interview sessions for the current user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'interview_protocol',
    description: 'Get the full interview protocol guidance.',
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
  attribute_set: z.string().optional().default('goodhang_full'),
});

const LogSchema = z.object({
  session_id: z.string().min(1),
  character_line: z.string().min(1),
  candidate_response: z.string().min(1),
});

const TransitionSchema = z.object({
  session_id: z.string().min(1),
  new_scene: z.enum(['elevator', 'reception', 'office']),
});

const SessionIdSchema = z.object({
  session_id: z.string().min(1),
});

const FormatSchema = z.object({
  session_id: z.string().min(1),
  format: z.enum(['dnd', 'professional', 'hiring_manager', 'candidate']),
});

const SubmitAssessmentSchema = z.object({
  session_id: z.string().min(1),
  assessment: z.any(), // Will be validated against LLMAssessmentSchema
});

// Store session start times for duration calculation
const sessionStartTimes = new Map<string, Date>();

// =============================================================================
// HANDLER
// =============================================================================

export async function handleConductorTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const manager = getSessionManager(ctx.userId);

  switch (name) {
    case 'interview_start': {
      const input = StartSchema.parse(args);

      // Validate attribute set
      if (!ATTRIBUTE_SETS[input.attribute_set]) {
        return {
          error: true,
          message: `Unknown attribute set: ${input.attribute_set}`,
          available: Object.keys(ATTRIBUTE_SETS),
        };
      }

      // Start session
      const context = manager.startSession(input.candidate_name, input.attribute_set);

      // Store start time for duration calculation
      sessionStartTimes.set(context.session.id, new Date());

      // Load protocol
      const protocol = loadProtocol();

      // Get assessment prompt
      const assessmentPrompt = generateAssessmentPrompt(input.attribute_set);

      return {
        success: true,
        message: `Interview session started for ${input.candidate_name}`,
        session: context.session,
        attributeSet: context.attributeSet,
        characters: context.characters,
        guidance: context.guidance,
        protocol,
        assessmentPrompt,
        hint: 'You are now Earl. Start the elevator scene naturally. When done, use interview_submit_assessment with your evaluation.',
      };
    }

    case 'interview_log': {
      const input = LogSchema.parse(args);

      try {
        const result = manager.logExchange(
          input.session_id,
          input.character_line,
          input.candidate_response
        );

        return {
          success: true,
          newCaptures: result.newCaptures,
          progress: result.progress,
          suggestions: result.suggestions,
          hint:
            result.progress.requiredComplete
              ? 'All required attributes captured! You can continue or complete the interview.'
              : `${result.progress.percentage}% captured. Missing required: ${result.progress.missingRequired.join(', ')}`,
        };
      } catch (error) {
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Failed to log exchange',
        };
      }
    }

    case 'interview_transition': {
      const input = TransitionSchema.parse(args);

      try {
        manager.transitionScene(input.session_id, input.new_scene as Scene);
        const context = manager.getSessionContext(input.session_id);

        return {
          success: true,
          message: `Transitioned to ${input.new_scene} scene`,
          currentScene: input.new_scene,
          guidance: context.guidance,
          hint: `You are now ${context.guidance.currentCharacter}. ${context.guidance.sceneGoal}`,
        };
      } catch (error) {
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Failed to transition',
        };
      }
    }

    case 'interview_status': {
      const input = SessionIdSchema.parse(args);

      try {
        const context = manager.getSessionContext(input.session_id);

        return {
          session: context.session,
          progress: context.progress,
          guidance: context.guidance,
        };
      } catch (error) {
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Session not found',
        };
      }
    }

    case 'interview_complete': {
      const input = SessionIdSchema.parse(args);

      try {
        const result = manager.completeSession(input.session_id);

        // Store for later formatting
        completedResults.set(input.session_id, result);

        // Format previews
        const dnd = formatResult(result, dndHandler);
        const professional = formatResult(result, professionalHandler);

        return {
          complete: true,
          candidateName: result.candidateName,
          summary: {
            overallScore: result.overallScore.toFixed(1),
            tier: result.tier,
            archetype: result.archetype.primary,
            recommendation: professional.recommendation,
          },
          dndPreview: {
            race: dnd.race,
            class: dnd.class,
            level: dnd.level,
            stats: dnd.stats,
          },
          greenFlags: result.greenFlags.slice(0, 5),
          redFlags: result.redFlags.slice(0, 5),
          hint: 'Use interview_format to get detailed reports in different styles.',
        };
      } catch (error) {
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Failed to complete interview',
        };
      }
    }

    case 'interview_submit_assessment': {
      const input = SubmitAssessmentSchema.parse(args);

      try {
        // Validate Claude's assessment against schema
        const llmAssessment = LLMAssessmentSchema.parse(input.assessment);

        // Get session context for transcript
        const context = manager.getSessionContext(input.session_id);
        const startTime = sessionStartTimes.get(input.session_id) || new Date();

        // Get transcript from session (we need to access it from the manager)
        // For now, we'll complete the session to get the transcript
        const algorithmicResult = manager.completeSession(input.session_id);

        // Build hybrid assessment with bias validation
        const { assessment, validation } = buildHybridAssessment(
          algorithmicResult.candidateName,
          algorithmicResult.transcript,
          llmAssessment,
          startTime
        );

        // Store for later formatting
        completedResults.set(input.session_id, assessment);

        // Format previews
        const dnd = formatResult(assessment, dndHandler);
        const professional = formatResult(assessment, professionalHandler);

        return {
          complete: true,
          method: 'hybrid',
          candidateName: assessment.candidateName,
          validation: {
            isValid: validation.isValid,
            biasWarnings: validation.biasWarnings,
            confidenceAdjustment: validation.confidenceAdjustment.toFixed(2),
          },
          summary: {
            overallScore: assessment.overallScore.toFixed(1),
            tier: assessment.tier,
            archetype: assessment.archetype.primary,
            archetypeConfidence: (assessment.archetype.confidence * 100).toFixed(0) + '%',
            recommendation: professional.recommendation,
          },
          llmImpression: llmAssessment.overallImpression,
          dndPreview: {
            race: dnd.race,
            class: dnd.class,
            level: dnd.level,
            stats: dnd.stats,
          },
          greenFlags: assessment.greenFlags.slice(0, 5),
          redFlags: assessment.redFlags.slice(0, 5),
          hint: validation.biasWarnings.length > 0
            ? `⚠️ ${validation.biasWarnings.length} bias warning(s) detected. Scores adjusted.`
            : '✅ Assessment validated. Use interview_format for detailed reports.',
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            error: true,
            message: 'Invalid assessment format',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          };
        }
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Failed to submit assessment',
        };
      }
    }

    case 'interview_format': {
      const input = FormatSchema.parse(args);

      const result = completedResults.get(input.session_id);
      if (!result) {
        return {
          error: true,
          message: 'No completed interview found. Complete the interview first.',
        };
      }

      switch (input.format) {
        case 'dnd':
          return {
            format: 'D&D Character Sheet',
            ...formatResult(result, dndHandler),
          };

        case 'professional':
          return {
            format: 'Professional Assessment',
            ...formatResult(result, professionalHandler),
          };

        case 'hiring_manager':
          return {
            format: 'Hiring Manager Report',
            ...formatResult(result, hiringManagerHandler),
          };

        case 'candidate':
          return {
            format: 'Candidate Summary',
            ...formatResult(result, candidateSummaryHandler),
          };
      }
      break;
    }

    case 'interview_list': {
      const sessions = manager.listSessions();

      return {
        sessions,
        total: sessions.length,
        message:
          sessions.length === 0
            ? 'No interview sessions found. Use interview_start to begin.'
            : `Found ${sessions.length} interview session(s).`,
      };
    }

    case 'interview_protocol': {
      return {
        protocol: loadProtocol(),
        attributeSets: Object.entries(ATTRIBUTE_SETS).map(([id, set]: [string, { name: string; description: string; attributes: unknown[]; requiredAttributes: unknown[] }]) => ({
          id,
          name: set.name,
          description: set.description,
          attributeCount: set.attributes.length,
          requiredCount: set.requiredAttributes.length,
        })),
      };
    }

    default:
      return null;
  }
}
