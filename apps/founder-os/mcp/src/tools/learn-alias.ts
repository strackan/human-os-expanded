/**
 * Learn Alias Tool - Dynamic Alias Creation
 *
 * Allows creating new aliases from conversation.
 * When do() doesn't match a request, suggest creating an alias
 * so future similar requests work automatically.
 *
 * Key benefits:
 * - User vocabulary evolves over time
 * - Captures patterns from actual usage
 * - Enables personalization without code changes
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext, ToolHandler } from '../lib/context.js';
import {
  AliasResolver,
  type ResolverConfig,
  type CreateAliasInput,
  type AliasAction,
  type ExecutionMode,
} from '@human-os/aliases';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const learnAliasTools: Tool[] = [
  {
    name: 'learn_alias',
    description: `Create a new alias pattern for natural language commands.

Use this when:
- A user request doesn't match any existing alias
- You want to teach the system a new shorthand
- You're defining a workflow the user frequently needs

Example:
  pattern: "snooze {item} until {timing}"
  description: "Defer an item for later"
  toolsRequired: ["update_task"]
  actions: [
    { tool: "update_task", params: { task: "{item}", snooze_until: "{timing}" } }
  ]

Variables in {braces} will be extracted from matching requests.`,
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The pattern with {variable} placeholders, e.g., "snooze {item} until {timing}"',
        },
        description: {
          type: 'string',
          description: 'Human-readable description of what this alias does',
        },
        toolsRequired: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of tool names this alias needs',
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string', description: 'Tool to invoke' },
              params: { type: 'object', description: 'Parameters with {var} interpolation' },
              output: { type: 'string', description: 'Variable name to store result' },
              condition: { type: 'string', description: 'Optional condition for execution' },
            },
            required: ['tool', 'params'],
          },
          description: 'Ordered list of actions to execute',
        },
        mode: {
          type: 'string',
          enum: ['tactical', 'strategic'],
          description: 'Preferred execution mode (tactical for buttons/confirmations, strategic for exploration)',
        },
        context: {
          type: 'array',
          items: { type: 'string' },
          description: 'Modes where this alias is available (empty = always available)',
        },
        priority: {
          type: 'number',
          description: 'Lower = higher priority when patterns overlap (default: 100)',
        },
      },
      required: ['pattern', 'description', 'toolsRequired', 'actions'],
    },
  },
  {
    name: 'suggest_alias',
    description: 'Suggest an alias pattern based on a request that failed to match',
    inputSchema: {
      type: 'object',
      properties: {
        failedRequest: {
          type: 'string',
          description: 'The request that failed to match any alias',
        },
        intendedAction: {
          type: 'string',
          description: 'What the user was trying to do',
        },
        suggestedTools: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tools that would accomplish the action',
        },
      },
      required: ['failedRequest', 'intendedAction'],
    },
  },
  {
    name: 'update_alias',
    description: 'Update an existing alias (by ID or pattern)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Alias ID to update',
        },
        pattern: {
          type: 'string',
          description: 'Current pattern (if ID not provided)',
        },
        updates: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            toolsRequired: { type: 'array', items: { type: 'string' } },
            actions: { type: 'array' },
            mode: { type: 'string', enum: ['tactical', 'strategic'] },
            context: { type: 'array', items: { type: 'string' } },
            priority: { type: 'number' },
            enabled: { type: 'boolean' },
          },
          description: 'Fields to update',
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'disable_alias',
    description: 'Disable an alias (keeps it but stops matching)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Alias ID to disable',
        },
        pattern: {
          type: 'string',
          description: 'Pattern to disable (if ID not provided)',
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle learn alias tool calls
 */
export const handleLearnAliasTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> => {
  switch (name) {
    case 'learn_alias': {
      const pattern = args.pattern as string;
      const description = args.description as string;
      const toolsRequired = args.toolsRequired as string[];
      const actions = args.actions as AliasAction[];
      const mode = args.mode as ExecutionMode | undefined;
      const context = args.context as string[] | undefined;
      const priority = args.priority as number | undefined;

      return createAlias(
        { pattern, description, toolsRequired, actions, mode, context, priority },
        ctx
      );
    }

    case 'suggest_alias': {
      const failedRequest = args.failedRequest as string;
      const intendedAction = args.intendedAction as string;
      const suggestedTools = args.suggestedTools as string[] | undefined;
      return suggestAlias(failedRequest, intendedAction, suggestedTools, ctx);
    }

    case 'update_alias': {
      const id = args.id as string | undefined;
      const pattern = args.pattern as string | undefined;
      const updates = args.updates as Record<string, unknown>;
      return updateAlias(id, pattern, updates, ctx);
    }

    case 'disable_alias': {
      const id = args.id as string | undefined;
      const pattern = args.pattern as string | undefined;
      return disableAlias(id, pattern, ctx);
    }

    default:
      return null;
  }
};

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Create a new alias
 */
async function createAlias(
  input: CreateAliasInput,
  ctx: ToolContext
): Promise<{
  success: boolean;
  alias: {
    id: string;
    pattern: string;
    description: string;
  };
  hint: string;
}> {
  const resolverConfig: ResolverConfig = {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    defaultLayer: ctx.layer,
    enableSemanticFallback: false,
    semanticThreshold: 0.7,
  };

  const resolver = new AliasResolver(resolverConfig);

  const alias = await resolver.createAlias({
    ...input,
    layer: ctx.layer,
  });

  return {
    success: true,
    alias: {
      id: alias.id,
      pattern: alias.pattern,
      description: alias.description,
    },
    hint: `Alias created! You can now use: "${alias.pattern}"`,
  };
}

/**
 * Suggest an alias based on a failed request
 */
async function suggestAlias(
  failedRequest: string,
  intendedAction: string,
  suggestedTools: string[] | undefined,
  _ctx: ToolContext
): Promise<{
  suggestion: {
    pattern: string;
    description: string;
    toolsRequired: string[];
    actions: AliasAction[];
    mode: ExecutionMode;
  };
  instructions: string;
}> {
  // Extract potential variables from the failed request
  const variables = extractPotentialVariables(failedRequest);

  // Build a suggested pattern
  let pattern = failedRequest.toLowerCase();
  for (const [word, varName] of Object.entries(variables)) {
    pattern = pattern.replace(word.toLowerCase(), `{${varName}}`);
  }

  // Build suggested actions
  const actions: AliasAction[] = [];
  const tools = suggestedTools || ['search_entities'];

  for (const tool of tools) {
    actions.push({
      tool,
      params: buildDefaultParams(tool, variables),
    });
  }

  return {
    suggestion: {
      pattern,
      description: intendedAction,
      toolsRequired: tools,
      actions,
      mode: 'tactical',
    },
    instructions: `Here's a suggested alias based on your request. Review and modify as needed, then use learn_alias to create it.`,
  };
}

/**
 * Update an existing alias
 */
async function updateAlias(
  id: string | undefined,
  pattern: string | undefined,
  updates: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = ctx.getClient();

  // Build query
  let query = supabase.from('aliases').update({
    description: updates.description,
    tools_required: updates.toolsRequired,
    actions: updates.actions,
    mode: updates.mode,
    context: updates.context,
    priority: updates.priority,
    enabled: updates.enabled,
    updated_at: new Date().toISOString(),
  });

  if (id) {
    query = query.eq('id', id);
  } else if (pattern) {
    query = query.eq('pattern', pattern).eq('layer', ctx.layer);
  } else {
    return { success: false, message: 'Must provide either id or pattern' };
  }

  const { error } = await query;

  if (error) {
    return { success: false, message: `Update failed: ${error.message}` };
  }

  return { success: true, message: 'Alias updated successfully' };
}

/**
 * Disable an alias
 */
async function disableAlias(
  id: string | undefined,
  pattern: string | undefined,
  ctx: ToolContext
): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = ctx.getClient();

  let query = supabase.from('aliases').update({
    enabled: false,
    updated_at: new Date().toISOString(),
  });

  if (id) {
    query = query.eq('id', id);
  } else if (pattern) {
    query = query.eq('pattern', pattern).eq('layer', ctx.layer);
  } else {
    return { success: false, message: 'Must provide either id or pattern' };
  }

  const { error } = await query;

  if (error) {
    return { success: false, message: `Disable failed: ${error.message}` };
  }

  return { success: true, message: 'Alias disabled successfully' };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract potential variables from a request
 * Looks for proper nouns, quoted strings, and time expressions
 */
function extractPotentialVariables(request: string): Record<string, string> {
  const variables: Record<string, string> = {};

  // Look for capitalized words (potential names)
  const nameMatches = request.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
  if (nameMatches && nameMatches.length > 0) {
    variables[nameMatches[0]!] = 'person';
  }

  // Look for time expressions
  const timePatterns = [
    /after\s+(?:the\s+)?(\w+)/i,
    /before\s+(?:the\s+)?(\w+)/i,
    /in\s+(\w+\s+\w+)/i,
    /until\s+(\w+)/i,
    /by\s+(\w+)/i,
  ];

  for (const pattern of timePatterns) {
    const match = request.match(pattern);
    if (match && match[1]) {
      variables[match[0]!] = 'timing';
      break;
    }
  }

  // Look for quoted strings
  const quotedMatches = request.match(/"([^"]+)"/g);
  if (quotedMatches) {
    for (let i = 0; i < quotedMatches.length; i++) {
      variables[quotedMatches[i]!] = `item${i > 0 ? i + 1 : ''}`;
    }
  }

  return variables;
}

/**
 * Build default parameters for common tools
 */
function buildDefaultParams(
  tool: string,
  variables: Record<string, string>
): Record<string, string> {
  const params: Record<string, string> = {};

  // Map variable names to common parameter names
  for (const [_word, varName] of Object.entries(variables)) {
    switch (varName) {
      case 'person':
        if (tool.includes('contact') || tool.includes('entity')) {
          params['query'] = `{${varName}}`;
        }
        break;
      case 'timing':
        if (tool.includes('task') || tool.includes('snooze')) {
          params['timing'] = `{${varName}}`;
        }
        break;
      default:
        params[varName] = `{${varName}}`;
    }
  }

  return params;
}
