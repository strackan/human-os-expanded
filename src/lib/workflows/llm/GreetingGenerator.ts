/**
 * Greeting Generator Service
 *
 * Generates LLM-powered personalized greetings for workflow initialization.
 * Uses INTEL tools to fetch customer context and generates contextual greetings.
 */

import { AnthropicService } from '@/lib/services/AnthropicService';
import { CLAUDE_HAIKU_CURRENT } from '@/lib/constants/claude-models';
import { getINTELToolDefinitions, executeINTELTool, isINTELTool } from './tools';
import { SLIDE_SYSTEM_PROMPTS } from './systemPrompts';

export interface GeneratedGreeting {
  text: string;
  toolsUsed: string[];
  tokensUsed: number;
}

export interface GreetingGeneratorParams {
  customerName: string;
  workflowPurpose?: string;
  slideId?: string;
  fallbackGreeting?: string;
}

/**
 * Generate a personalized greeting for workflow initialization
 *
 * This triggers an LLM call that:
 * 1. Has access to INTEL tools
 * 2. Can call get_pre_workflow_context to fetch customer context
 * 3. Generates a contextual, personalized greeting
 */
export async function generateGreeting(
  params: GreetingGeneratorParams
): Promise<GeneratedGreeting> {
  const { customerName, workflowPurpose = 'renewal_preparation', slideId = 'greeting', fallbackGreeting } = params;

  try {
    // Build system prompt for greeting generation
    const basePrompt = SLIDE_SYSTEM_PROMPTS['greeting'] || SLIDE_SYSTEM_PROMPTS['default'];
    const systemPrompt = `${basePrompt}

IMPORTANT: You are generating the INITIAL greeting message for a workflow about ${customerName}.

Your task:
1. Call the get_pre_workflow_context tool with customer_name="${customerName}" to understand the current situation
2. After receiving the context, generate a personalized greeting that:
   - Acknowledges key facts from the customer context
   - Highlights 1-2 most important items (risks, opportunities, recent events)
   - Sets the tone based on account health (celebratory for healthy, concerned for at-risk)
   - Is concise (2-4 sentences max)
   - Ends with readiness to proceed

Do NOT include any tool call syntax in your final response - just the greeting text.
The workflow purpose is: ${workflowPurpose}`;

    // Get INTEL tool definitions
    const tools = getINTELToolDefinitions().map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    // Initial LLM call - it should call the tool
    const initialResponse = await AnthropicService.generateConversation({
      messages: [
        {
          role: 'user',
          content: `Generate a personalized greeting for the ${customerName} workflow. Start by getting their context.`,
        },
      ],
      systemPrompt,
      model: CLAUDE_HAIKU_CURRENT,
      temperature: 0.7,
      maxTokens: 1000,
      tools,
    });

    let finalContent = initialResponse.content;
    let totalTokens = initialResponse.tokensUsed.total;
    const toolsUsed: string[] = [];

    // Handle tool calls if any
    if (initialResponse.toolUses && initialResponse.toolUses.length > 0) {
      // Build conversation history - start with original user message
      const toolResults: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: `Generate a personalized greeting for the ${customerName} workflow. Start by getting their context.` },
      ];

      // Only add assistant message if it has content
      if (initialResponse.content && initialResponse.content.trim()) {
        toolResults.push({ role: 'assistant', content: initialResponse.content });
      }

      // Execute each tool call and add results
      for (const toolUse of initialResponse.toolUses) {
        if (isINTELTool(toolUse.name)) {
          toolsUsed.push(toolUse.name);
          const toolResult = await executeINTELTool(toolUse.name, toolUse.input as Record<string, any>);

          // Add tool result as user message
          toolResults.push({
            role: 'user',
            content: `Tool result for ${toolUse.name}:\n\n${toolResult}`,
          });
        }
      }

      // Continue conversation with tool results (need at least the original + tool result)
      if (toolResults.length >= 2) {
        const continuationResponse = await AnthropicService.generateConversation({
          messages: toolResults,
          systemPrompt,
          model: CLAUDE_HAIKU_CURRENT,
          temperature: 0.7,
          maxTokens: 500,
        });

        finalContent = continuationResponse.content;
        totalTokens += continuationResponse.tokensUsed.total;
      }
    }

    // Clean up the response (remove any markdown formatting if present)
    let cleanedContent = finalContent.trim();

    // Remove any leading/trailing quotes or markdown
    cleanedContent = cleanedContent.replace(/^["']|["']$/g, '');
    cleanedContent = cleanedContent.replace(/^\*\*|\*\*$/g, '');

    return {
      text: cleanedContent || fallbackGreeting || `Let's work on ${customerName}.`,
      toolsUsed,
      tokensUsed: totalTokens,
    };
  } catch (error) {
    console.error('[GreetingGenerator] Error generating greeting:', error);

    // Return fallback on error
    return {
      text: fallbackGreeting || `Let's work on ${customerName}.`,
      toolsUsed: [],
      tokensUsed: 0,
    };
  }
}

/**
 * Generate greeting with caching (for repeated requests)
 */
const greetingCache = new Map<string, { greeting: GeneratedGreeting; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function generateGreetingCached(
  params: GreetingGeneratorParams
): Promise<GeneratedGreeting> {
  const cacheKey = `${params.customerName}-${params.workflowPurpose}-${params.slideId}`;
  const cached = greetingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.greeting;
  }

  const greeting = await generateGreeting(params);
  greetingCache.set(cacheKey, { greeting, timestamp: Date.now() });

  return greeting;
}
