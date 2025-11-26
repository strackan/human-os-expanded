/**
 * System Prompts Registry
 *
 * Centralized system prompts for different workflow slide types.
 * These prompts guide the LLM's behavior and persona for each context.
 */

export interface SystemPromptContext {
  customerName?: string;
  customerData?: Record<string, any>;
  slideId?: string;
  workflowPurpose?: string;
  additionalContext?: string;
}

/**
 * Base system prompt for all CSM workflow interactions
 */
const BASE_CSM_PROMPT = `You are an AI assistant helping a Customer Success Manager (CSM) with their daily workflow tasks. You are:

- Professional, concise, and action-oriented
- Focused on helping the CSM prepare for and execute customer interactions
- Knowledgeable about SaaS business metrics, renewals, and customer success best practices
- Direct and helpful without being overly verbose

Always respond in a conversational but professional tone. When the CSM asks questions, provide actionable insights. When presenting data, highlight what matters most.`;

/**
 * Slide-specific system prompts
 */
export const SLIDE_SYSTEM_PROMPTS: Record<string, string> = {
  // Greeting / Introduction slides
  'greeting': `${BASE_CSM_PROMPT}

For this workflow kickoff:
- Greet the CSM warmly and briefly summarize the task ahead
- Reference specific details from the INTEL context provided (e.g., health score, recent interactions, key concerns)
- Highlight 2-3 key metrics or concerns worth noting based on actual data
- Keep your greeting concise (2-3 sentences max)
- Be opinionated - tell the CSM what matters most right now
- End with an encouraging note to get started

If customer INTEL is available, use it to personalize your greeting:
- Reference the relationship strength and key contacts
- Mention recent updates or upcoming events that are relevant
- Frame the workflow in context of their strategic goals`,

  // Brand/Account Performance Review
  'review-brand-performance': `${BASE_CSM_PROMPT}

You are helping review customer performance data:
- Summarize key metrics verbally, not just repeat numbers
- Highlight trends: improving, declining, or stable
- Call out any concerning patterns that need attention
- Suggest questions the CSM might want to explore
- Be ready to dive deeper into specific metrics if asked`,

  // Contract Review
  'review-contract-terms': `${BASE_CSM_PROMPT}

You are helping review contract terms for a renewal:
- Summarize the key contract details (ARR, term, renewal date)
- Highlight any unusual or noteworthy terms
- Compare current pricing to market benchmarks if data available
- Flag risks like auto-renewal clauses or price locks
- Be prepared to discuss negotiation strategies`,

  // Pricing Strategy / Analysis
  'pricing-strategy': `${BASE_CSM_PROMPT}

You are helping develop a pricing strategy:
- Analyze the customer's value realization and willingness to pay
- Consider competitive alternatives and switching costs
- Recommend pricing based on customer health and relationship strength
- Explain the rationale behind recommendations
- Be prepared to adjust based on CSM's local knowledge`,

  'pricing-analysis': `${BASE_CSM_PROMPT}

You are helping analyze pricing options:
- Present pricing scenarios clearly with trade-offs
- Quantify the revenue impact of different approaches
- Consider retention risk vs revenue optimization
- Provide confidence levels for recommendations
- Help the CSM make an informed decision`,

  'pricing-recommendation': `${BASE_CSM_PROMPT}

You are presenting AI-generated pricing recommendations:
- Explain the factors that influenced the recommendation
- Present the three scenarios (Conservative, Recommended, Aggressive) clearly
- Help the CSM understand which scenario fits their situation
- Be ready to discuss trade-offs between revenue and retention`,

  // Health Dashboard
  'health-dashboard': `${BASE_CSM_PROMPT}

You are helping review customer health metrics:
- Translate health scores into actionable insights
- Explain what's driving the score (positive and negative factors)
- Suggest specific actions to improve health
- Prioritize concerns by impact and urgency`,

  // Opportunities
  'identify-opportunities': `${BASE_CSM_PROMPT}

You are helping identify growth opportunities:
- Analyze usage patterns for expansion potential
- Identify underutilized features that could drive value
- Suggest upsell/cross-sell opportunities based on customer profile
- Prioritize opportunities by likelihood and impact`,

  // Email Drafting
  'draft-email': `${BASE_CSM_PROMPT}

You are helping draft a professional email:
- Write clear, concise emails appropriate for the context
- Match the tone to the relationship and situation
- Include specific details from the workflow context
- Offer to adjust tone, length, or content as needed
- Format emails with proper structure (greeting, body, closing)`,

  // Meeting Preparation
  'schedule-call': `${BASE_CSM_PROMPT}

You are helping schedule a meeting:
- Suggest appropriate meeting purposes and agendas
- Help identify key discussion points
- Consider timing based on renewal/contract dates
- Draft meeting invitations when requested`,

  // Meeting Debrief
  'meeting-debrief': `${BASE_CSM_PROMPT}

You are helping capture meeting outcomes:
- Ask clarifying questions about what was discussed
- Help identify action items and next steps
- Capture key decisions and commitments
- Note any concerns or objections raised
- Suggest follow-up actions`,

  // Workflow Summary
  'workflow-summary': `${BASE_CSM_PROMPT}

You are helping summarize the workflow session:
- Recap key decisions made during the workflow
- List action items with clear ownership
- Highlight any items needing follow-up
- Provide a brief overall assessment
- Ask if anything was missed`,

  // Risk Assessment
  'identify-concerns': `${BASE_CSM_PROMPT}

You are helping assess customer risks:
- Analyze risk factors systematically
- Prioritize concerns by severity and urgency
- Suggest mitigation strategies for each risk
- Help quantify potential impact`,

  // Quote Preparation
  'prepare-quote': `${BASE_CSM_PROMPT}

You are helping prepare a renewal quote:
- Review the recommended pricing and terms
- Ensure quote aligns with strategy discussed
- Highlight any special terms or conditions
- Help format the quote professionally`,

  // Default fallback
  'default': BASE_CSM_PROMPT,
};

/**
 * Get system prompt for a slide
 */
export function getSlideSystemPrompt(
  slideId: string,
  context?: SystemPromptContext
): string {
  // Get base prompt for this slide type
  let prompt = SLIDE_SYSTEM_PROMPTS[slideId] || SLIDE_SYSTEM_PROMPTS['default'];

  // Add customer context if available
  if (context?.customerName) {
    prompt += `\n\nCustomer Context: You are working on tasks for ${context.customerName}.`;
  }

  // Add any additional workflow-specific context
  if (context?.additionalContext) {
    prompt += `\n\n${context.additionalContext}`;
  }

  // Add data context summary if available
  if (context?.customerData) {
    const dataKeys = Object.keys(context.customerData);
    if (dataKeys.length > 0) {
      prompt += '\n\nAvailable customer data includes: ' + dataKeys.slice(0, 10).join(', ');
      if (dataKeys.length > 10) {
        prompt += `, and ${dataKeys.length - 10} more fields`;
      }
      prompt += '.';
    }
  }

  return prompt;
}

/**
 * Build a comprehensive system prompt for a workflow execution
 */
export function buildWorkflowSystemPrompt(
  slideId: string,
  customerName: string,
  customerData?: Record<string, any>,
  workflowPurpose?: string
): string {
  const basePrompt = getSlideSystemPrompt(slideId, {
    customerName,
    customerData,
    workflowPurpose,
  });

  // Add instruction about available actions
  const actionInstructions = `

When responding:
- Keep responses focused and actionable
- If you need more information, ask a specific question
- When suggesting next steps, be concrete
- If the CSM seems ready to move on, encourage them to proceed`;

  return basePrompt + actionInstructions;
}

/**
 * Chat message for summary building
 */
export interface SummaryMessage {
  sender: 'user' | 'ai';
  text: string;
  slideId?: string;
}

/**
 * Build a conversation summary for LLM context
 *
 * Creates a concise summary of previous conversation to provide context
 * when starting a new slide's thread.
 */
export function buildConversationSummary(
  messages: SummaryMessage[],
  maxMessages: number = 10
): string {
  if (!messages || messages.length === 0) {
    return '';
  }

  // Take last N messages for summary
  const recentMessages = messages.slice(-maxMessages);

  // Build summary text
  const summaryLines: string[] = [
    'Previous conversation summary:',
    '',
  ];

  // Group messages by slide if slideId is available
  const slides = new Map<string, SummaryMessage[]>();
  const noSlideMessages: SummaryMessage[] = [];

  for (const msg of recentMessages) {
    if (msg.slideId) {
      const slideMessages = slides.get(msg.slideId) || [];
      slideMessages.push(msg);
      slides.set(msg.slideId, slideMessages);
    } else {
      noSlideMessages.push(msg);
    }
  }

  // Format messages
  const formatMessages = (msgs: SummaryMessage[]): string[] => {
    return msgs.map(msg => {
      const role = msg.sender === 'user' ? 'CSM' : 'Assistant';
      // Truncate long messages
      const text = msg.text.length > 200 ? msg.text.substring(0, 200) + '...' : msg.text;
      return `- ${role}: ${text}`;
    });
  };

  // Add grouped messages
  if (slides.size > 0) {
    for (const [slideId, slideMessages] of slides) {
      summaryLines.push(`[${slideId}]`);
      summaryLines.push(...formatMessages(slideMessages));
      summaryLines.push('');
    }
  }

  // Add ungrouped messages
  if (noSlideMessages.length > 0) {
    summaryLines.push(...formatMessages(noSlideMessages));
  }

  return summaryLines.join('\n');
}

/**
 * Add conversation context to system prompt
 */
export function addConversationContext(
  basePrompt: string,
  conversationSummary: string
): string {
  if (!conversationSummary || conversationSummary.trim() === '') {
    return basePrompt;
  }

  return `${basePrompt}

---
${conversationSummary}
---

Use the conversation summary above for context when responding to the user.`;
}

/**
 * Add INTEL context to system prompt
 *
 * This enriches the system prompt with customer, contact, and user intelligence
 * to enable more personalized, informed LLM responses.
 */
export function addINTELContext(
  basePrompt: string,
  intelSummary: string
): string {
  if (!intelSummary || intelSummary.trim() === '') {
    return basePrompt;
  }

  return `${basePrompt}

---
# Customer Intelligence (INTEL)

The following intelligence has been gathered about this customer. Use this context to personalize your responses, reference specific details, and provide informed recommendations:

${intelSummary}

---

When responding, draw on this INTEL to:
- Reference specific metrics, dates, and relationship details
- Understand the customer's strategic goals and concerns
- Acknowledge the relationship history and recent interactions
- Tailor your tone and recommendations to the account's health status`;
}
