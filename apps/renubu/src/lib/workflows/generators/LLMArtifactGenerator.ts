/**
 * LLM Artifact Generator
 *
 * Generates dynamic workflow artifacts using Claude AI.
 * Supports presentations, emails, recommendations, and negotiation guides.
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
 * Customer context for artifact generation
 */
export interface ArtifactCustomerContext {
  id: string;
  name: string;
  arr: number;
  renewalDate: string;
  daysToRenewal: number;
  healthScore?: number;
  riskScore?: number;
  growthScore?: number;
  tier?: string;
  industry?: string;
  productMix?: string[];
  contractTermMonths?: number;
  primaryContact?: {
    name: string;
    title?: string;
    email?: string;
  };
  metrics?: {
    brandImpressions?: string;
    impressionsTrend?: string;
    profileViews?: string;
    viewsTrend?: string;
    applyClicks?: string;
    clicksTrend?: string;
    newRatings?: string;
    ratingsTrend?: string;
  };
}

/**
 * Presentation slide types
 */
export type SlideType = 'title' | 'metrics' | 'highlights' | 'recommendations' | 'next-steps';

/**
 * Generated presentation slide
 */
export interface GeneratedSlide {
  id: string;
  type: SlideType;
  title: string;
  content: Record<string, unknown>;
}

/**
 * Generated presentation
 */
export interface GeneratedPresentation {
  title: string;
  customerName: string;
  slides: GeneratedSlide[];
  editable: boolean;
  generatedAt: string;
}

/**
 * Generated email
 */
export interface GeneratedEmail {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  editable: boolean;
  generatedAt: string;
}

/**
 * Generated recommendation
 */
export interface GeneratedRecommendation {
  title: string;
  summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact?: string;
  }>;
  renewalStrategy: 'expansion' | 'retention' | 'standard';
  proposedPricing?: {
    current: number;
    proposed: number;
    change: string;
    justification: string;
  };
  generatedAt: string;
}

/**
 * Generated negotiation guide
 */
export interface GeneratedNegotiationGuide {
  strategy: string;
  openingPosition: string;
  talkingPoints: string[];
  objectionHandlers: Array<{
    objection: string;
    response: string;
  }>;
  walkAwayPoint?: string;
  bestAlternative?: string;
  generatedAt: string;
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const PRESENTATION_SYSTEM_PROMPT = `You are an expert Customer Success Manager creating a renewal presentation.
Generate professional, data-driven slides that tell a compelling story of partnership value.

Key Principles:
- Lead with customer wins and achievements
- Use specific metrics when available
- Frame recommendations as opportunities, not demands
- Keep content concise and scannable

Output Format:
Respond with a JSON object containing an array of slides.
Each slide must have: id, type, title, content (object matching the slide type).`;

const EMAIL_SYSTEM_PROMPT = `You are a professional Customer Success Manager writing an email.
Write in a warm but professional tone. Be concise and action-oriented.

Key Principles:
- Personalize with customer name and specific context
- Lead with value or the reason for reaching out
- Include a clear call to action
- Keep paragraphs short (2-3 sentences max)

Output Format:
Respond with a JSON object: { subject, body }`;

const RECOMMENDATION_SYSTEM_PROMPT = `You are a strategic advisor creating a renewal recommendation.
Balance customer value with business objectives. Be specific and actionable.

Key Principles:
- Base recommendations on data and observed patterns
- Consider customer budget and priorities
- Provide clear justification for pricing changes
- Offer tiered options when appropriate

Output Format:
Respond with a JSON object containing summary, recommendations array, and pricing details.`;

const NEGOTIATION_SYSTEM_PROMPT = `You are a negotiation coach preparing a CSM for a renewal conversation.
Provide practical, actionable guidance based on the customer context.

Key Principles:
- Understand the customer's likely objections
- Prepare value-based responses, not defensive ones
- Know the walk-away point but aim higher
- Build in flexibility without giving away too much

Output Format:
Respond with a JSON object containing strategy, talking points, and objection handlers.`;

// ============================================================================
// GENERATOR CLASS
// ============================================================================

export class LLMArtifactGenerator {
  private model: string;

  constructor(model?: string) {
    this.model = model || CLAUDE_SONNET_CURRENT;
  }

  /**
   * Generate a renewal presentation deck
   */
  async generatePresentation(
    customerContext: ArtifactCustomerContext,
    enrichment?: WorkflowEnrichment,
    options?: {
      slideTypes?: SlideType[];
      focusArea?: 'expansion' | 'retention' | 'balanced';
    }
  ): Promise<GeneratedPresentation> {
    const slideTypes = options?.slideTypes || ['title', 'metrics', 'highlights', 'recommendations', 'next-steps'];
    const focusArea = options?.focusArea || 'balanced';

    const prompt = this.buildPresentationPrompt(customerContext, enrichment, slideTypes, focusArea);

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: PRESENTATION_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 2000,
        temperature: 0.7,
      });

      const slides = this.parsePresentationResponse(response.content, customerContext);

      return {
        title: `${customerContext.name} - Renewal Review`,
        customerName: customerContext.name,
        slides,
        editable: true,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[LLMArtifactGenerator] Presentation generation failed:', error);
      return this.fallbackPresentation(customerContext);
    }
  }

  /**
   * Generate a meeting request or follow-up email
   */
  async generateEmail(
    type: 'meeting-request' | 'follow-up' | 'proposal',
    customerContext: ArtifactCustomerContext,
    enrichment?: WorkflowEnrichment,
    additionalContext?: {
      meetingNotes?: string;
      proposedPricing?: { current: number; proposed: number };
      previousInteractions?: string[];
    }
  ): Promise<GeneratedEmail> {
    const prompt = this.buildEmailPrompt(type, customerContext, enrichment, additionalContext);

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: EMAIL_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 1000,
        temperature: 0.7,
      });

      const email = this.parseEmailResponse(response.content);

      return {
        to: customerContext.primaryContact?.email || '',
        subject: email.subject,
        body: email.body,
        editable: true,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[LLMArtifactGenerator] Email generation failed:', error);
      return this.fallbackEmail(type, customerContext);
    }
  }

  /**
   * Generate a renewal recommendation document
   */
  async generateRecommendation(
    customerContext: ArtifactCustomerContext,
    enrichment?: WorkflowEnrichment,
    meetingFeedback?: {
      sentiment: 'positive' | 'neutral' | 'negative';
      concerns?: string[];
      interests?: string[];
    }
  ): Promise<GeneratedRecommendation> {
    const prompt = this.buildRecommendationPrompt(customerContext, enrichment, meetingFeedback);

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: RECOMMENDATION_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 1500,
        temperature: 0.6,
      });

      return this.parseRecommendationResponse(response.content, customerContext);
    } catch (error) {
      console.error('[LLMArtifactGenerator] Recommendation generation failed:', error);
      return this.fallbackRecommendation(customerContext);
    }
  }

  /**
   * Generate a negotiation guide
   */
  async generateNegotiationGuide(
    customerContext: ArtifactCustomerContext,
    recommendation: GeneratedRecommendation,
    enrichment?: WorkflowEnrichment
  ): Promise<GeneratedNegotiationGuide> {
    const prompt = this.buildNegotiationPrompt(customerContext, recommendation, enrichment);

    try {
      const response = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: NEGOTIATION_SYSTEM_PROMPT,
        model: this.model,
        maxTokens: 1200,
        temperature: 0.6,
      });

      return this.parseNegotiationResponse(response.content);
    } catch (error) {
      console.error('[LLMArtifactGenerator] Negotiation guide generation failed:', error);
      return this.fallbackNegotiationGuide(customerContext, recommendation);
    }
  }

  // ============================================================================
  // PROMPT BUILDERS
  // ============================================================================

  private buildPresentationPrompt(
    customer: ArtifactCustomerContext,
    enrichment: WorkflowEnrichment | undefined,
    slideTypes: SlideType[],
    focusArea: string
  ): string {
    let prompt = `
## Generate Renewal Presentation

**Customer:** ${customer.name}
**ARR:** $${customer.arr.toLocaleString()}
**Renewal Date:** ${customer.renewalDate} (${customer.daysToRenewal} days)
**Health Score:** ${customer.healthScore ?? 'N/A'}
**Tier:** ${customer.tier || 'Standard'}
**Primary Contact:** ${customer.primaryContact?.name || 'N/A'} (${customer.primaryContact?.title || 'N/A'})

**Focus Area:** ${focusArea}
**Requested Slides:** ${slideTypes.join(', ')}
`;

    if (customer.metrics) {
      prompt += `
## Performance Metrics

- Brand Impressions: ${customer.metrics.brandImpressions || 'N/A'} (${customer.metrics.impressionsTrend || 'N/A'})
- Profile Views: ${customer.metrics.profileViews || 'N/A'} (${customer.metrics.viewsTrend || 'N/A'})
- Apply Clicks: ${customer.metrics.applyClicks || 'N/A'} (${customer.metrics.clicksTrend || 'N/A'})
- New Ratings: ${customer.metrics.newRatings || 'N/A'} (${customer.metrics.ratingsTrend || 'N/A'})
`;
    }

    if (enrichment?.triangulation.insights.length) {
      prompt += `
## External Insights

${enrichment.triangulation.insights.map((i) => `- [${i.type}] ${i.title}: ${i.description}`).join('\n')}
`;
    }

    prompt += `
## Output Requirements

Generate a JSON object with a "slides" array. Each slide needs:

For "title" type:
{ id, type: "title", title, content: { subtitle, date, preparedBy } }

For "metrics" type:
{ id, type: "metrics", title, content: { impressions: {value, trend, trendValue}, profileViews: {...}, applyClicks: {...}, newRatings: {...}, reportingPeriod } }

For "highlights" type:
{ id, type: "highlights", title, content: { items: ["win 1", "win 2", ...] } }

For "recommendations" type:
{ id, type: "recommendations", title, content: { items: [{title, description, priority}] } }

For "next-steps" type:
{ id, type: "next-steps", title, content: { items: [{title, owner, dueDate, completed}] } }
`;

    return prompt;
  }

  private buildEmailPrompt(
    type: string,
    customer: ArtifactCustomerContext,
    enrichment: WorkflowEnrichment | undefined,
    additionalContext?: Record<string, unknown>
  ): string {
    let prompt = `
## Generate ${type} Email

**To:** ${customer.primaryContact?.name || 'Customer Contact'} (${customer.primaryContact?.title || 'N/A'})
**Company:** ${customer.name}
**ARR:** $${customer.arr.toLocaleString()}
**Renewal Date:** ${customer.renewalDate} (${customer.daysToRenewal} days)
`;

    if (type === 'meeting-request') {
      prompt += `
**Purpose:** Schedule a renewal review meeting to discuss performance and next year's partnership.

Include:
- Warm greeting referencing the partnership
- Specific metrics or achievements to discuss
- Proposed meeting length (30 min)
- Request for their availability
`;
    } else if (type === 'follow-up') {
      prompt += `
**Purpose:** Follow up after a renewal meeting with next steps and proposal.

Meeting Context:
${additionalContext?.meetingNotes || 'Discussed renewal options and pricing.'}

Include:
- Thank them for their time
- Summarize key discussion points
- Outline next steps with owners
- Attach proposal (mention as attachment)
`;
    } else if (type === 'proposal') {
      prompt += `
**Purpose:** Send a formal renewal proposal with pricing.

Proposed Pricing:
- Current: $${(additionalContext?.proposedPricing as { current?: number; proposed?: number } | undefined)?.current?.toLocaleString() || customer.arr.toLocaleString()}
- Proposed: $${(additionalContext?.proposedPricing as { current?: number; proposed?: number } | undefined)?.proposed?.toLocaleString() || customer.arr.toLocaleString()}

Include:
- Value delivered summary
- Proposal highlights
- Clear pricing breakdown
- Timeline for decision
`;
    }

    if (enrichment?.external.contacts?.[0]?.enrichment.contact) {
      const contact = enrichment.external.contacts[0].enrichment.contact;
      prompt += `
## Contact Context (for personalization)
- LinkedIn Headline: ${contact.headline || 'N/A'}
- Recent Post: ${contact.recent_posts?.[0]?.content?.slice(0, 100) || 'None'}
`;
    }

    prompt += `
## Output

Generate JSON: { "subject": "Email subject line", "body": "Full email body with line breaks" }
`;

    return prompt;
  }

  private buildRecommendationPrompt(
    customer: ArtifactCustomerContext,
    enrichment: WorkflowEnrichment | undefined,
    meetingFeedback?: Record<string, unknown>
  ): string {
    let prompt = `
## Generate Renewal Recommendation

**Customer:** ${customer.name}
**Current ARR:** $${customer.arr.toLocaleString()}
**Renewal Date:** ${customer.renewalDate} (${customer.daysToRenewal} days)
**Health Score:** ${customer.healthScore ?? 'N/A'}
**Risk Score:** ${customer.riskScore ?? 'N/A'}
**Growth Score:** ${customer.growthScore ?? 'N/A'}
**Products:** ${customer.productMix?.join(', ') || 'Standard package'}
`;

    if (meetingFeedback) {
      prompt += `
## Meeting Feedback

**Sentiment:** ${meetingFeedback.sentiment}
**Concerns:** ${(meetingFeedback.concerns as string[])?.join(', ') || 'None stated'}
**Interests:** ${(meetingFeedback.interests as string[])?.join(', ') || 'None stated'}
`;
    }

    if (enrichment?.triangulation.insights.length) {
      prompt += `
## External Signals

${enrichment.triangulation.insights.map((i) => `- [${i.type}] ${i.title}: ${i.description}`).join('\n')}
`;
    }

    prompt += `
## Output

Generate JSON:
{
  "summary": "2-3 sentence executive summary",
  "renewalStrategy": "expansion|retention|standard",
  "recommendations": [
    { "title": "...", "description": "...", "priority": "high|medium|low", "impact": "..." }
  ],
  "proposedPricing": {
    "current": ${customer.arr},
    "proposed": <calculated>,
    "change": "+X% or -X%",
    "justification": "..."
  }
}
`;

    return prompt;
  }

  private buildNegotiationPrompt(
    customer: ArtifactCustomerContext,
    recommendation: GeneratedRecommendation,
    enrichment?: WorkflowEnrichment
  ): string {
    let prompt = `
## Generate Negotiation Guide

**Customer:** ${customer.name}
**Current ARR:** $${customer.arr.toLocaleString()}
**Proposed ARR:** $${recommendation.proposedPricing?.proposed.toLocaleString() || customer.arr.toLocaleString()}
**Change:** ${recommendation.proposedPricing?.change || 'Flat renewal'}
**Strategy:** ${recommendation.renewalStrategy}

## Recommendations Being Proposed

${recommendation.recommendations.map((r) => `- ${r.title} (${r.priority}): ${r.description}`).join('\n')}
`;

    if (enrichment?.external.company?.company?.recent_funding) {
      prompt += `
## Company Context

Recent Funding: $${enrichment.external.company.company.recent_funding.amount}M (${enrichment.external.company.company.recent_funding.round})
This may indicate budget flexibility.
`;
    }

    prompt += `
## Output

Generate JSON:
{
  "strategy": "Overall negotiation approach (1-2 sentences)",
  "openingPosition": "How to open the negotiation",
  "talkingPoints": ["Point 1", "Point 2", ...],
  "objectionHandlers": [
    { "objection": "...", "response": "..." }
  ],
  "walkAwayPoint": "Minimum acceptable terms",
  "bestAlternative": "BATNA if deal falls through"
}
`;

    return prompt;
  }

  // ============================================================================
  // RESPONSE PARSERS
  // ============================================================================

  private parsePresentationResponse(content: string, customer: ArtifactCustomerContext): GeneratedSlide[] {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return json.slides || [];
    } catch (error) {
      console.error('[LLMArtifactGenerator] Failed to parse presentation:', error);
      return this.fallbackPresentation(customer).slides;
    }
  }

  private parseEmailResponse(content: string): { subject: string; body: string } {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return {
        subject: json.subject || 'Regarding your renewal',
        body: json.body || 'Please let me know if you have any questions.',
      };
    } catch (error) {
      console.error('[LLMArtifactGenerator] Failed to parse email:', error);
      return { subject: 'Regarding your renewal', body: 'Please let me know if you have any questions.' };
    }
  }

  private parseRecommendationResponse(content: string, customer: ArtifactCustomerContext): GeneratedRecommendation {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return {
        title: `${customer.name} - Renewal Recommendation`,
        summary: json.summary || 'Recommendation summary not available.',
        recommendations: json.recommendations || [],
        renewalStrategy: json.renewalStrategy || 'standard',
        proposedPricing: json.proposedPricing,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[LLMArtifactGenerator] Failed to parse recommendation:', error);
      return this.fallbackRecommendation(customer);
    }
  }

  private parseNegotiationResponse(content: string): GeneratedNegotiationGuide {
    try {
      const json = JSON.parse(this.extractJSON(content));
      return {
        strategy: json.strategy || 'Value-based negotiation approach.',
        openingPosition: json.openingPosition || 'Start with partnership value.',
        talkingPoints: json.talkingPoints || [],
        objectionHandlers: json.objectionHandlers || [],
        walkAwayPoint: json.walkAwayPoint,
        bestAlternative: json.bestAlternative,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[LLMArtifactGenerator] Failed to parse negotiation guide:', error);
      return {
        strategy: 'Value-based negotiation approach.',
        openingPosition: 'Start by highlighting partnership value.',
        talkingPoints: ['Emphasize ROI', 'Reference customer wins', 'Present options'],
        objectionHandlers: [],
        generatedAt: new Date().toISOString(),
      };
    }
  }

  private extractJSON(content: string): string {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return jsonMatch[1].trim();
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];
    return content;
  }

  // ============================================================================
  // FALLBACKS
  // ============================================================================

  private fallbackPresentation(customer: ArtifactCustomerContext): GeneratedPresentation {
    return {
      title: `${customer.name} - Renewal Review`,
      customerName: customer.name,
      slides: [
        {
          id: 'title',
          type: 'title',
          title: customer.name,
          content: {
            subtitle: 'Renewal Review',
            date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            preparedBy: 'Your CSM',
          },
        },
        {
          id: 'next-steps',
          type: 'next-steps',
          title: 'Next Steps',
          content: {
            items: [
              { title: 'Schedule renewal discussion', owner: 'CSM', dueDate: 'This Week', completed: false },
              { title: 'Review proposal', owner: customer.primaryContact?.name || 'Customer', dueDate: 'Next Week', completed: false },
            ],
          },
        },
      ],
      editable: true,
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackEmail(type: string, customer: ArtifactCustomerContext): GeneratedEmail {
    const contactName = customer.primaryContact?.name || 'there';
    return {
      to: customer.primaryContact?.email || '',
      subject: type === 'meeting-request' ? `${customer.name} - Renewal Review Meeting` : `${customer.name} - Next Steps`,
      body: `Hi ${contactName},

I hope this email finds you well.

I wanted to reach out to discuss ${customer.name}'s upcoming renewal on ${customer.renewalDate}.

Would you have time for a brief call this week or next?

Best regards,
Your CSM`,
      editable: true,
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackRecommendation(customer: ArtifactCustomerContext): GeneratedRecommendation {
    return {
      title: `${customer.name} - Renewal Recommendation`,
      summary: `Based on the current partnership, we recommend a standard renewal for ${customer.name}.`,
      recommendations: [
        {
          title: 'Continue Current Partnership',
          description: 'Maintain current service levels and pricing.',
          priority: 'high',
        },
      ],
      renewalStrategy: 'standard',
      proposedPricing: {
        current: customer.arr,
        proposed: customer.arr,
        change: '0%',
        justification: 'Flat renewal recommended.',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackNegotiationGuide(customer: ArtifactCustomerContext, _recommendation: GeneratedRecommendation): GeneratedNegotiationGuide {
    return {
      strategy: `Value-based negotiation focusing on ${customer.name}'s partnership success.`,
      openingPosition: 'Start by highlighting key wins and partnership value.',
      talkingPoints: [
        'Reference specific customer achievements',
        'Emphasize platform ROI',
        'Present renewal options clearly',
      ],
      objectionHandlers: [
        {
          objection: 'The price is too high',
          response: 'Let me walk you through the value delivered this year and discuss options that fit your budget.',
        },
      ],
      walkAwayPoint: `Minimum acceptable: $${(customer.arr * 0.9).toLocaleString()}`,
      bestAlternative: 'Multi-year commitment at reduced rate',
      generatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LLMArtifactGenerator;
