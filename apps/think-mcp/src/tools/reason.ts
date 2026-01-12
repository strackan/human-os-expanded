/**
 * Structured reasoning tools
 *
 * Provides multi-step reasoning chains with branching and synthesis.
 * Stateful within session - tracks reasoning steps for analysis.
 *
 * Tools:
 * - think_step: Add a reasoning step with explicit logic
 * - think_branch: Explore alternative reasoning paths
 * - think_conclude: Synthesize steps into conclusion
 * - think_compare: Side-by-side evaluation of options
 * - think_reset: Clear reasoning chain for new problem
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// =============================================================================
// TYPES
// =============================================================================

interface ReasoningStep {
  id: string;
  type: 'step' | 'branch' | 'comparison';
  content: string;
  reasoning: string;
  parentId?: string;
  branchLabel?: string;
  timestamp: string;
}

interface ComparisonOption {
  name: string;
  pros: string[];
  cons: string[];
  score?: number;
}

interface ReasoningChain {
  id: string;
  problem: string;
  steps: ReasoningStep[];
  branches: Map<string, ReasoningStep[]>;
  conclusion?: string;
  startedAt: string;
}

// =============================================================================
// STATE
// =============================================================================

// In-memory state for current reasoning chain
let currentChain: ReasoningChain | null = null;
let stepCounter = 0;

function generateId(): string {
  return `step_${++stepCounter}_${Date.now().toString(36)}`;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const reasonTools: Tool[] = [
  {
    name: 'think_step',
    description: `Add a reasoning step to the current chain.

Each step should have clear logic explaining the reasoning.
Steps build on previous steps to form a logical progression.

If no chain exists, provide a 'problem' to start a new one.

Example: think_step({ content: "The API returns 500 errors", reasoning: "Server logs show database connection timeouts", problem: "Why is the checkout failing?" })`,
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The conclusion or observation of this step',
        },
        reasoning: {
          type: 'string',
          description: 'The logic or evidence supporting this step',
        },
        problem: {
          type: 'string',
          description: 'Problem statement (only needed for first step to start a new chain)',
        },
      },
      required: ['content', 'reasoning'],
    },
  },
  {
    name: 'think_branch',
    description: `Explore an alternative reasoning path.

Branches let you explore multiple hypotheses or approaches in parallel.
Each branch is labeled and can have its own sequence of steps.

Example: think_branch({ branchLabel: "Hypothesis A: Network issue", content: "Check for packet loss", reasoning: "Intermittent failures suggest network problems" })`,
    inputSchema: {
      type: 'object',
      properties: {
        branchLabel: {
          type: 'string',
          description: 'Label for this branch (e.g., "Hypothesis A", "Approach 2")',
        },
        content: {
          type: 'string',
          description: 'The conclusion or observation in this branch',
        },
        reasoning: {
          type: 'string',
          description: 'The logic supporting this branch direction',
        },
      },
      required: ['branchLabel', 'content', 'reasoning'],
    },
  },
  {
    name: 'think_compare',
    description: `Compare multiple options side-by-side.

Useful for decision-making when you have several alternatives.
Each option includes pros, cons, and optional score.

Example: think_compare({ options: [{ name: "PostgreSQL", pros: ["ACID compliant", "Rich features"], cons: ["Complex setup"], score: 8 }, { name: "SQLite", pros: ["Simple", "No server"], cons: ["Single writer"], score: 6 }] })`,
    inputSchema: {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Option name' },
              pros: { type: 'array', items: { type: 'string' }, description: 'Advantages' },
              cons: { type: 'array', items: { type: 'string' }, description: 'Disadvantages' },
              score: { type: 'number', description: 'Optional score 1-10' },
            },
            required: ['name', 'pros', 'cons'],
          },
          description: 'Options to compare',
        },
        criteria: {
          type: 'string',
          description: 'What criteria are you evaluating against?',
        },
      },
      required: ['options'],
    },
  },
  {
    name: 'think_conclude',
    description: `Synthesize the reasoning chain into a conclusion.

Reviews all steps and branches to form a final conclusion.
Marks the chain as complete.

Example: think_conclude({ conclusion: "The checkout failures are caused by database connection pool exhaustion during peak traffic", confidence: "high" })`,
    inputSchema: {
      type: 'object',
      properties: {
        conclusion: {
          type: 'string',
          description: 'The final conclusion based on the reasoning chain',
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Confidence level in this conclusion',
        },
      },
      required: ['conclusion'],
    },
  },
  {
    name: 'think_status',
    description: `Get the current state of the reasoning chain.

Returns all steps, branches, and whether a conclusion has been reached.

Example: think_status({})`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'think_reset',
    description: `Clear the current reasoning chain and start fresh.

Use when moving to a new problem.

Example: think_reset({})`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleReasonTools(
  name: string,
  args: Record<string, unknown>
): Promise<unknown | null> {
  switch (name) {
    case 'think_step': {
      const { content, reasoning, problem } = args as {
        content: string;
        reasoning: string;
        problem?: string;
      };
      return thinkStep(content, reasoning, problem);
    }

    case 'think_branch': {
      const { branchLabel, content, reasoning } = args as {
        branchLabel: string;
        content: string;
        reasoning: string;
      };
      return thinkBranch(branchLabel, content, reasoning);
    }

    case 'think_compare': {
      const { options, criteria } = args as {
        options: ComparisonOption[];
        criteria?: string;
      };
      return thinkCompare(options, criteria);
    }

    case 'think_conclude': {
      const { conclusion, confidence } = args as {
        conclusion: string;
        confidence?: 'low' | 'medium' | 'high';
      };
      return thinkConclude(conclusion, confidence);
    }

    case 'think_status': {
      return thinkStatus();
    }

    case 'think_reset': {
      return thinkReset();
    }

    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

function thinkStep(
  content: string,
  reasoning: string,
  problem?: string
): {
  success: boolean;
  step?: ReasoningStep;
  chainId?: string;
  stepCount?: number;
  message: string;
  error?: string;
} {
  try {
    // Start new chain if problem provided or no chain exists
    if (problem || !currentChain) {
      if (!problem && !currentChain) {
        return {
          success: false,
          message: '',
          error: 'No active reasoning chain. Provide a "problem" to start a new chain.',
        };
      }

      currentChain = {
        id: `chain_${Date.now().toString(36)}`,
        problem: problem || 'Unspecified problem',
        steps: [],
        branches: new Map(),
        startedAt: new Date().toISOString(),
      };
      stepCounter = 0;
    }

    const step: ReasoningStep = {
      id: generateId(),
      type: 'step',
      content,
      reasoning,
      parentId: currentChain.steps.length > 0
        ? currentChain.steps[currentChain.steps.length - 1].id
        : undefined,
      timestamp: new Date().toISOString(),
    };

    currentChain.steps.push(step);

    return {
      success: true,
      step,
      chainId: currentChain.id,
      stepCount: currentChain.steps.length,
      message: `Added step ${currentChain.steps.length} to reasoning chain`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function thinkBranch(
  branchLabel: string,
  content: string,
  reasoning: string
): {
  success: boolean;
  step?: ReasoningStep;
  branchLabel?: string;
  branchStepCount?: number;
  message: string;
  error?: string;
} {
  try {
    if (!currentChain) {
      return {
        success: false,
        message: '',
        error: 'No active reasoning chain. Use think_step with a "problem" first.',
      };
    }

    const step: ReasoningStep = {
      id: generateId(),
      type: 'branch',
      content,
      reasoning,
      branchLabel,
      timestamp: new Date().toISOString(),
    };

    // Get or create branch
    const branchSteps = currentChain.branches.get(branchLabel) || [];
    if (branchSteps.length > 0) {
      step.parentId = branchSteps[branchSteps.length - 1].id;
    }
    branchSteps.push(step);
    currentChain.branches.set(branchLabel, branchSteps);

    return {
      success: true,
      step,
      branchLabel,
      branchStepCount: branchSteps.length,
      message: `Added step to branch "${branchLabel}" (${branchSteps.length} steps in branch)`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function thinkCompare(
  options: ComparisonOption[],
  criteria?: string
): {
  success: boolean;
  comparison?: {
    criteria?: string;
    options: ComparisonOption[];
    recommendation?: string;
  };
  message: string;
  error?: string;
} {
  try {
    if (!currentChain) {
      return {
        success: false,
        message: '',
        error: 'No active reasoning chain. Use think_step with a "problem" first.',
      };
    }

    // Determine recommendation based on scores if available
    let recommendation: string | undefined;
    const scoredOptions = options.filter(o => o.score !== undefined);
    if (scoredOptions.length > 0) {
      const best = scoredOptions.reduce((a, b) =>
        (a.score || 0) > (b.score || 0) ? a : b
      );
      recommendation = `Based on scores, "${best.name}" is recommended (score: ${best.score}/10)`;
    }

    // Add comparison as a step
    const step: ReasoningStep = {
      id: generateId(),
      type: 'comparison',
      content: `Compared ${options.length} options${criteria ? ` against: ${criteria}` : ''}`,
      reasoning: options.map(o =>
        `${o.name}: +${o.pros.length} pros, -${o.cons.length} cons${o.score ? `, score: ${o.score}` : ''}`
      ).join('; '),
      timestamp: new Date().toISOString(),
    };

    currentChain.steps.push(step);

    return {
      success: true,
      comparison: {
        criteria,
        options,
        recommendation,
      },
      message: `Compared ${options.length} options`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function thinkConclude(
  conclusion: string,
  confidence: 'low' | 'medium' | 'high' = 'medium'
): {
  success: boolean;
  summary?: {
    problem: string;
    stepCount: number;
    branchCount: number;
    conclusion: string;
    confidence: string;
  };
  message: string;
  error?: string;
} {
  try {
    if (!currentChain) {
      return {
        success: false,
        message: '',
        error: 'No active reasoning chain to conclude.',
      };
    }

    currentChain.conclusion = conclusion;

    const summary = {
      problem: currentChain.problem,
      stepCount: currentChain.steps.length,
      branchCount: currentChain.branches.size,
      conclusion,
      confidence,
    };

    return {
      success: true,
      summary,
      message: `Concluded reasoning chain with ${summary.stepCount} steps and ${summary.branchCount} branches`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function thinkStatus(): {
  success: boolean;
  chain?: {
    id: string;
    problem: string;
    steps: ReasoningStep[];
    branches: { label: string; steps: ReasoningStep[] }[];
    conclusion?: string;
    startedAt: string;
  };
  message: string;
} {
  if (!currentChain) {
    return {
      success: true,
      message: 'No active reasoning chain. Use think_step with a "problem" to start.',
    };
  }

  // Convert Map to array for JSON serialization
  const branchesArray: { label: string; steps: ReasoningStep[] }[] = [];
  currentChain.branches.forEach((steps, label) => {
    branchesArray.push({ label, steps });
  });

  return {
    success: true,
    chain: {
      id: currentChain.id,
      problem: currentChain.problem,
      steps: currentChain.steps,
      branches: branchesArray,
      conclusion: currentChain.conclusion,
      startedAt: currentChain.startedAt,
    },
    message: currentChain.conclusion
      ? 'Reasoning chain complete'
      : `Active reasoning chain with ${currentChain.steps.length} steps`,
  };
}

function thinkReset(): {
  success: boolean;
  message: string;
} {
  const hadChain = currentChain !== null;
  currentChain = null;
  stepCounter = 0;

  return {
    success: true,
    message: hadChain
      ? 'Reasoning chain cleared. Ready for new problem.'
      : 'No chain to clear. Ready for new problem.',
  };
}
