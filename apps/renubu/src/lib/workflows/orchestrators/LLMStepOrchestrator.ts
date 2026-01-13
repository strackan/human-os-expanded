/**
 * LLM Step Orchestrator
 *
 * Provides intelligent workflow step orchestration using Claude AI.
 * Implements hybrid control: autonomous for routine steps, confirmation for key decisions.
 *
 * Part of the LLM-driven workflow transformation (0.2.1+)
 */

import {
  AnthropicService,
} from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import type { WorkflowEnrichment } from '@/lib/services/WorkflowEnrichmentService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Step definition for the orchestrator
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  category: 'routine' | 'decision' | 'action' | 'review';
  requiresConfirmation: boolean;
  estimatedMinutes: number;
  prerequisites?: string[];
}

/**
 * Customer context for decision making
 */
export interface CustomerContext {
  id: string;
  name: string;
  arr: number;
  daysToRenewal: number;
  healthScore?: number;
  riskScore?: number;
  growthScore?: number;
  tier?: string;
  industry?: string;
  primaryContact?: {
    name: string;
    title?: string;
    email?: string;
  };
}

/**
 * Current workflow state
 */
export interface WorkflowState {
  currentStepId: string;
  completedSteps: string[];
  stepData: Record<string, unknown>;
  userActions: Array<{
    stepId: string;
    action: string;
    timestamp: string;
  }>;
}

/**
 * Orchestration decision result
 */
export interface StepDecision {
  nextStepId: string;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  requiresConfirmation: boolean;
  suggestedActions?: string[];
  insights?: string[];
}

/**
 * Step generation result
 */
export interface StepContent {
  message: string;
  insights?: string[];
  suggestedButtons?: Array<{
    label: string;
    value: string;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  artifactData?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Steps that always require user confirmation (key decision points)
 */
const KEY_DECISION_STEPS = new Set([
  'performance-assessment',
  'strategy-selection',
  'deck-approval',
  'recommendation-approval',
  'negotiation-outcome',
]);

/**
 * System prompt for step orchestration
 */
const ORCHESTRATOR_SYSTEM_PROMPT = `You are an intelligent workflow orchestrator for a Customer Success platform called Renubu.
Your role is to analyze the current workflow state, customer context, and external enrichment data to determine the best next step.

You have access to:
1. Customer data (ARR, health scores, renewal timing)
2. Workflow state (completed steps, user actions)
3. External enrichment (LinkedIn data, company funding, relationship context)

Key Principles:
- Prioritize customer success outcomes
- Consider timing and urgency (days to renewal)
- Use enrichment data to personalize recommendations
- Be concise but insightful

Output Format:
Respond with a JSON object containing:
- nextStepId: The ID of the recommended next step
- confidence: "low", "medium", or "high"
- reasoning: Brief explanation (1-2 sentences)
- insights: Array of relevant observations based on the data`;

/**
 * System prompt for content generation
 */
const CONTENT_SYSTEM_PROMPT = `You are a Customer Success AI assistant helping CSMs work through renewal workflows.
Your role is to generate helpful, personalized content based on customer data and context.

Key Principles:
- Be professional but warm
- Use specific customer data when available
- Highlight key insights from enrichment data
- Suggest actionable next steps

Output Format:
Respond with a JSON object containing:
- message: The main message to display (supports markdown)
- insights: Array of key observations (optional)
- suggestedButtons: Array of button options (optional)`;

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class LLMStepOrchestrator {
  private model: string;

  constructor(model?: string) {
    this.model = model || CLAUDE_SONNET_CURRENT;
  }

  /**
   * Determine the next step in the workflow
   *
   * Uses Claude to analyze context and decide what to do next.
   * Implements hybrid control: routine steps are autonomous, key decisions require confirmation.
   */
  async determineNextStep(
    availableSteps: WorkflowStep[],
    currentState: WorkflowState,
    customerContext: CustomerContext,
    enrichment?: WorkflowEnrichment
  ): Promise<StepDecision> {
    // Build context for the LLM
    const contextPrompt = this.buildDecisionPrompt(
      availableSteps,
      currentState,
      customerContext,
      enrichment
    );

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: contextPrompt }],
        systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 500,
        temperature: 0.3, // Lower temperature for more consistent decisions
      });

      // Parse the JSON response
      const decision = this.parseDecisionResponse(response.content);

      // Override confirmation requirement for key decision steps
      const step = availableSteps.find((s) => s.id === decision.nextStepId);
      if (step && KEY_DECISION_STEPS.has(step.id)) {
        decision.requiresConfirmation = true;
      }

      return decision;
    } catch (error) {
      console.error('[LLMStepOrchestrator] Error determining next step:', error);
      // Fallback to first available uncompleted step
      return this.fallbackDecision(availableSteps, currentState);
    }
  }

  /**
   * Generate personalized content for a step
   *
   * Uses Claude to create dynamic messages, insights, and suggestions.
   */
  async generateStepContent(
    step: WorkflowStep,
    customerContext: CustomerContext,
    enrichment?: WorkflowEnrichment,
    previousStepData?: Record<string, unknown>
  ): Promise<StepContent> {
    const contentPrompt = this.buildContentPrompt(
      step,
      customerContext,
      enrichment,
      previousStepData
    );

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: contentPrompt }],
        systemPrompt: CONTENT_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 1000,
        temperature: 0.7, // Higher temperature for more creative content
      });

      return this.parseContentResponse(response.content, step);
    } catch (error) {
      console.error('[LLMStepOrchestrator] Error generating step content:', error);
      return this.fallbackContent(step, customerContext);
    }
  }

  /**
   * Analyze user action and suggest response
   *
   * Interprets user button clicks or text input and suggests workflow adjustments.
   */
  async analyzeUserAction(
    action: string,
    currentStep: WorkflowStep,
    customerContext: CustomerContext,
    _enrichment?: WorkflowEnrichment
  ): Promise<{
    interpretation: string;
    suggestedNextStep?: string;
    adjustments?: string[];
  }> {
    const prompt = `
Analyze this user action in the context of a ${currentStep.name} step:

User Action: "${action}"
Customer: ${customerContext.name} ($${customerContext.arr.toLocaleString()} ARR)
Days to Renewal: ${customerContext.daysToRenewal}
Health Score: ${customerContext.healthScore || 'N/A'}

What does this action indicate? What should happen next?

Respond with JSON:
{
  "interpretation": "Brief interpretation of user intent",
  "suggestedNextStep": "step-id or null",
  "adjustments": ["Any workflow adjustments to consider"]
}
`;

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are a workflow analysis assistant. Respond only with valid JSON.',
        model: this.model,
        maxTokens: 300,
        temperature: 0.3,
      });

      return JSON.parse(this.extractJSON(response.content));
    } catch (error) {
      console.error('[LLMStepOrchestrator] Error analyzing user action:', error);
      return {
        interpretation: `User selected: ${action}`,
        suggestedNextStep: undefined,
        adjustments: [],
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private buildDecisionPrompt(
    availableSteps: WorkflowStep[],
    currentState: WorkflowState,
    customerContext: CustomerContext,
    enrichment?: WorkflowEnrichment
  ): string {
    const uncompletedSteps = availableSteps.filter(
      (s) => !currentState.completedSteps.includes(s.id)
    );

    let prompt = `
## Current Workflow State

**Customer:** ${customerContext.name}
**ARR:** $${customerContext.arr.toLocaleString()}
**Days to Renewal:** ${customerContext.daysToRenewal}
**Health Score:** ${customerContext.healthScore ?? 'N/A'}
**Risk Score:** ${customerContext.riskScore ?? 'N/A'}
**Growth Score:** ${customerContext.growthScore ?? 'N/A'}

**Current Step:** ${currentState.currentStepId}
**Completed Steps:** ${currentState.completedSteps.join(', ') || 'None'}

## Available Next Steps

${uncompletedSteps.map((s) => `- **${s.id}**: ${s.name} (${s.category}, ~${s.estimatedMinutes}min)`).join('\n')}

## Recent User Actions

${currentState.userActions.slice(-3).map((a) => `- ${a.action} at ${a.stepId}`).join('\n') || 'None'}
`;

    // Add enrichment data if available
    if (enrichment?.external.available) {
      prompt += `
## External Context (Human-OS)

${enrichment.external.company?.found ? `**Company:** ${enrichment.external.company.company?.name || 'N/A'}
- Industry: ${enrichment.external.company.company?.industry || 'N/A'}
- Recent Funding: ${enrichment.external.company.company?.recent_funding ? `$${enrichment.external.company.company.recent_funding.amount}M (${enrichment.external.company.company.recent_funding.round})` : 'None reported'}` : ''}

${enrichment.triangulation.insights.length > 0 ? `**Triangulated Insights:**
${enrichment.triangulation.insights.map((i) => `- [${i.type}] ${i.title}: ${i.description}`).join('\n')}` : ''}
`;
    }

    prompt += `
## Task

Based on the above context, determine the best next step for this workflow.
Consider urgency, customer health, and any external signals.

Respond with JSON:
{
  "nextStepId": "step-id",
  "confidence": "low|medium|high",
  "reasoning": "Brief explanation",
  "insights": ["Relevant observations"]
}
`;

    return prompt;
  }

  private buildContentPrompt(
    step: WorkflowStep,
    customerContext: CustomerContext,
    enrichment?: WorkflowEnrichment,
    previousStepData?: Record<string, unknown>
  ): string {
    let prompt = `
## Generate Content for Step: ${step.name}

**Step Description:** ${step.description}
**Step Category:** ${step.category}

## Customer Context

- **Name:** ${customerContext.name}
- **ARR:** $${customerContext.arr.toLocaleString()}
- **Days to Renewal:** ${customerContext.daysToRenewal}
- **Health Score:** ${customerContext.healthScore ?? 'N/A'}
- **Primary Contact:** ${customerContext.primaryContact?.name || 'N/A'} (${customerContext.primaryContact?.title || 'N/A'})
`;

    if (enrichment?.external.available) {
      prompt += `
## External Enrichment

${enrichment.external.contacts?.map((c) => `
**${c.name}:**
- LinkedIn: ${c.enrichment.contact?.headline || 'N/A'}
- Recent Activity: ${c.enrichment.contact?.recent_posts?.[0]?.content?.slice(0, 100) || 'None'}
${c.opinions?.has_opinions ? `- Relationship Notes: ${c.opinions.key_points.join('; ')}` : ''}
`).join('\n') || 'No contact enrichment available'}

${enrichment.triangulation.summary ? `**Summary:** ${enrichment.triangulation.summary}` : ''}
`;
    }

    if (previousStepData) {
      prompt += `
## Previous Step Data

${JSON.stringify(previousStepData, null, 2)}
`;
    }

    prompt += `
## Task

Generate engaging, personalized content for this step.
Use the customer data and enrichment to make it relevant.

Respond with JSON:
{
  "message": "Main message with **markdown** support",
  "insights": ["Key observation 1", "Key observation 2"],
  "suggestedButtons": [
    {"label": "Button Text", "value": "action-value", "style": "primary|secondary|success|warning|danger"}
  ]
}
`;

    return prompt;
  }

  private parseDecisionResponse(content: string): StepDecision {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return {
        nextStepId: json.nextStepId || 'unknown',
        confidence: json.confidence || 'medium',
        reasoning: json.reasoning || 'No reasoning provided',
        requiresConfirmation: json.requiresConfirmation ?? false,
        suggestedActions: json.suggestedActions,
        insights: json.insights,
      };
    } catch (error) {
      console.error('[LLMStepOrchestrator] Failed to parse decision response:', error);
      return {
        nextStepId: 'unknown',
        confidence: 'low',
        reasoning: 'Failed to parse LLM response',
        requiresConfirmation: true,
      };
    }
  }

  private parseContentResponse(content: string, step: WorkflowStep): StepContent {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return {
        message: json.message || `Let's work on ${step.name}.`,
        insights: json.insights,
        suggestedButtons: json.suggestedButtons,
        artifactData: json.artifactData,
      };
    } catch (error) {
      console.error('[LLMStepOrchestrator] Failed to parse content response:', error);
      return this.fallbackContent(step, { name: 'Customer' } as CustomerContext);
    }
  }

  private extractJSON(content: string): string {
    // Try to extract JSON from markdown code blocks or raw content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // Try to find JSON object directly
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }
    return content;
  }

  private fallbackDecision(
    availableSteps: WorkflowStep[],
    currentState: WorkflowState
  ): StepDecision {
    const uncompletedSteps = availableSteps.filter(
      (s) => !currentState.completedSteps.includes(s.id)
    );
    const nextStep = uncompletedSteps[0];

    return {
      nextStepId: nextStep?.id || 'complete',
      confidence: 'low',
      reasoning: 'Fallback to sequential step order',
      requiresConfirmation: true,
    };
  }

  private fallbackContent(step: WorkflowStep, customerContext: CustomerContext): StepContent {
    return {
      message: `Let's work on **${step.name}** for ${customerContext.name}.\n\n${step.description}`,
      suggestedButtons: [
        { label: 'Continue', value: 'continue', style: 'primary' },
        { label: 'Skip for Now', value: 'skip', style: 'secondary' },
      ],
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LLMStepOrchestrator;
