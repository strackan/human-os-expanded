/**
 * Parking Lot LLM Service
 * Intelligent parsing, mode detection, expansion, and brainstorm generation
 * using Claude Sonnet for enhanced idea capture
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  CaptureMode,
  LLMParseResult,
  BrainstormQuestion,
  ExpandedAnalysis,
  Artifact,
  LLMExpansionRequest,
  ParkingLotItem,
  HumanOSExpansionRequest,
  HumanOSExpansionResult,
  HumanOSEnrichment,
} from '@/types/parking-lot';
import { HumanOSClient } from '@/lib/mcp/clients/HumanOSClient';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

const MODEL = 'claude-sonnet-4-5-20250929';

export class ParkingLotLLMService {
  /**
   * Parse user input and detect capture mode from magic keywords
   * This is the core intelligence layer that enhances raw input
   */
  static async parseWithModeDetection(
    rawInput: string,
    context?: {
      currentWorkflows?: any[];
      recentCustomers?: any[];
      userCategories?: string[];
    }
  ): Promise<LLMParseResult> {
    const systemPrompt = `You are an AI assistant helping users capture and organize ideas for their work.

Your job is to:
1. Detect the capture mode from magic keywords
2. Extract key entities (customers, contacts, topics, dates, actions)
3. Suggest relevant categories
4. Calculate readiness score (0-100)
5. Map to potential workflows if applicable

**Magic Keywords & Modes:**
- "Renubu", "Project eyes", "Workflow", "Turn this into workflow" → mode: project
- "Expand", "Flesh out", "Elaborate" → mode: expand
- "Brainstorm", "Think through", "Explore this" → mode: brainstorm
- (no keywords) → mode: passive

**Readiness Factors (each 0-100):**
- informationCompleteness: Do we have enough detail to act?
- urgency: Is this time-sensitive?
- potentialImpact: How valuable is this? (revenue, risk, efficiency)
- effortEstimate: How hard to execute? (lower score = easier)

**Output Format:**
Return ONLY valid JSON with this structure:
{
  "mode": "project" | "expand" | "brainstorm" | "passive",
  "cleanedText": "Clear, concise version of the idea",
  "extractedEntities": {
    "customers": ["customer names"],
    "contacts": ["people mentioned"],
    "workflows": ["workflow types"],
    "dates": ["date references"],
    "topics": ["key themes"],
    "actions": ["action verbs"]
  },
  "suggestedCategories": ["relevant-category", "another-category"],
  "readinessScore": 75,
  "readinessFactors": {
    "informationCompleteness": 80,
    "urgency": 60,
    "potentialImpact": 90,
    "effortEstimate": 40
  },
  "potentialWorkflows": [
    {
      "workflow_config_id": "expansion_workflow",
      "confidence": 0.85,
      "requiredData": ["contact info", "budget"],
      "estimatedEffort": "2 hours"
    }
  ],
  "wakeTriggers": [...],  // Auto-generate based on mode
  "brainstormQuestions": [...],  // Only if mode=brainstorm
  "expandedAnalysis": {...}  // Only if mode=expand
}`;

    const userPrompt = `Parse this idea and detect mode:

**Input:** "${rawInput}"

**Context:**
${context?.currentWorkflows ? `Active workflows: ${JSON.stringify(context.currentWorkflows.map(w => ({ type: w.workflow_type, customer: w.customer_name })))}` : ''}
${context?.recentCustomers ? `Recent customers: ${JSON.stringify(context.recentCustomers.map(c => c.name))}` : ''}
${context?.userCategories ? `User's categories: ${context.userCategories.join(', ')}` : ''}

Return JSON only, no markdown formatting.`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.3,  // Lower temperature for consistent parsing
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      // Parse JSON response
      const result = JSON.parse(content.text) as LLMParseResult;

      // Validate required fields
      if (!result.mode || !result.cleanedText) {
        throw new Error('Invalid LLM response: missing required fields');
      }

      return result;
    } catch (error) {
      console.error('[ParkingLotLLMService] Parse error:', error);

      // Fallback: basic parsing without LLM
      return this.fallbackParse(rawInput);
    }
  }

  /**
   * Generate brainstorm questions for interactive Q&A
   */
  static async generateBrainstormQuestions(
    topic: string,
    category?: string
  ): Promise<BrainstormQuestion[]> {
    const systemPrompt = `You are helping users brainstorm ideas through Socratic questioning.

Generate 5-7 open-ended questions that will help flesh out this idea.

**Question Categories:**
- problem: What problem does this solve?
- solution: How would this work?
- market: Who needs this?
- execution: How would we implement this?
- other: Strategic considerations

Return JSON array:
[
  {
    "id": "q1",
    "question": "What specific problem are you trying to solve?",
    "category": "problem",
    "order": 1
  },
  ...
]`;

    const userPrompt = `Generate brainstorm questions for this topic:

**Topic:** ${topic}
${category ? `**Category:** ${category}` : ''}

Return JSON only.`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response');
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error('[ParkingLotLLMService] Brainstorm generation error:', error);

      // Fallback questions
      return [
        { id: 'q1', question: 'What problem are you trying to solve?', category: 'problem', order: 1 },
        { id: 'q2', question: 'Who would benefit from this?', category: 'market', order: 2 },
        { id: 'q3', question: 'How would this work in practice?', category: 'solution', order: 3 },
        { id: 'q4', question: 'What makes this different from existing solutions?', category: 'solution', order: 4 },
        { id: 'q5', question: 'What would success look like?', category: 'execution', order: 5 }
      ];
    }
  }

  /**
   * Expand idea with deep LLM analysis and generate shareable artifact
   */
  static async expandWithObjectives(
    request: LLMExpansionRequest
  ): Promise<{ expansion: ExpandedAnalysis; artifact: Artifact }> {
    const { idea, context } = request;

    const systemPrompt = `You are helping users flesh out business ideas with deep analysis.

Generate a comprehensive expansion that includes:
1. Background: Current state and context
2. Opportunities: Potential upsides and benefits
3. Risks: Potential downsides and challenges
4. Action Plan: Concrete, sequenced steps
5. Objectives: Clear, measurable goals

Return JSON with this structure:
{
  "background": "Context and current state...",
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "risks": ["Risk 1", "Risk 2"],
  "actionPlan": [
    {
      "step": "Step description",
      "estimatedTime": "30 min",
      "priority": "high",
      "order": 1
    }
  ],
  "objectives": ["Objective 1", "Objective 2"],
  "generatedAt": "${new Date().toISOString()}"
}`;

    const userPrompt = `Expand this idea with deep analysis:

**Idea:** ${idea.cleaned_text}

**Extracted Context:**
- Customers: ${idea.extracted_entities.customers?.join(', ') || 'none'}
- Topics: ${idea.extracted_entities.topics?.join(', ') || 'none'}

**Additional Context:**
${context?.customerData ? `Customer data: ${JSON.stringify(context.customerData)}` : ''}
${context?.workflowData ? `Related workflows: ${JSON.stringify(context.workflowData)}` : ''}

Return JSON only.`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 3072,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response');
      }

      const expansion = JSON.parse(content.text) as ExpandedAnalysis;

      // Generate shareable artifact (Markdown document)
      const artifact = this.generateArtifact(idea, expansion);

      return { expansion, artifact };
    } catch (error) {
      console.error('[ParkingLotLLMService] Expansion error:', error);
      throw error;
    }
  }

  /**
   * Synthesize brainstorm answers into full expansion
   */
  static async synthesizeBrainstorm(
    idea: ParkingLotItem
  ): Promise<ExpandedAnalysis> {
    if (!idea.brainstorm_answers || idea.brainstorm_answers.length === 0) {
      throw new Error('No brainstorm answers to synthesize');
    }

    const systemPrompt = `You are synthesizing brainstorm Q&A into a comprehensive analysis.

Based on the user's answers, generate:
1. Background summary
2. Opportunities identified
3. Risks to consider
4. Action plan
5. Clear objectives

Return JSON matching ExpandedAnalysis structure.`;

    const userPrompt = `Synthesize these brainstorm answers:

**Original Idea:** ${idea.cleaned_text}

**Q&A:**
${idea.brainstorm_questions?.map((q) => {
  const answer = idea.brainstorm_answers?.find(a => a.question_id === q.id);
  return `Q: ${q.question}\nA: ${answer?.answer || 'No answer'}`;
}).join('\n\n')}

Return JSON only.`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response');
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error('[ParkingLotLLMService] Synthesis error:', error);
      throw error;
    }
  }

  /**
   * Generate shareable artifact from expansion
   */
  private static generateArtifact(
    idea: ParkingLotItem,
    expansion: ExpandedAnalysis
  ): Artifact {
    const markdown = `# ${idea.cleaned_text}

**Generated:** ${new Date().toLocaleDateString()}
**Category:** ${idea.user_categories.join(', ') || 'Uncategorized'}
**Readiness Score:** ${idea.readiness_score}/100

---

## Background

${expansion.background}

---

## Opportunities

${expansion.opportunities.map(o => `- ${o}`).join('\n')}

---

## Risks

${expansion.risks.map(r => `- ${r}`).join('\n')}

---

## Objectives

${expansion.objectives.map(obj => `- ${obj}`).join('\n')}

---

## Action Plan

${expansion.actionPlan.map((step, i) =>
  `${i + 1}. **${step.step}** (${step.estimatedTime}) - Priority: ${step.priority}`
).join('\n')}

---

*Generated by Renubu Parking Lot*
`;

    return {
      type: 'plan',
      format: 'markdown',
      content: markdown,
      title: idea.cleaned_text,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Fallback parsing when LLM is unavailable
   */
  private static fallbackParse(rawInput: string): LLMParseResult {
    // Detect mode from keywords
    const lowerInput = rawInput.toLowerCase();
    let mode: CaptureMode = 'passive';

    if (/(renubu|project eyes|workflow|turn.*into)/i.test(lowerInput)) {
      mode = 'project';
    } else if (/(expand|flesh out|elaborate)/i.test(lowerInput)) {
      mode = 'expand';
    } else if (/(brainstorm|think through|explore)/i.test(lowerInput)) {
      mode = 'brainstorm';
    }

    // Basic entity extraction (naive)
    const words = rawInput.split(/\s+/);
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w) && w.length > 2);

    return {
      mode,
      cleanedText: rawInput.replace(/(renubu|project eyes|brainstorm|expand):/gi, '').trim(),
      extractedEntities: {
        customers: capitalizedWords,
        contacts: [],
        workflows: [],
        dates: [],
        topics: [],
        actions: []
      },
      suggestedCategories: ['general'],
      readinessScore: 50,
      readinessFactors: {
        informationCompleteness: 50,
        urgency: 50,
        potentialImpact: 50,
        effortEstimate: 50
      },
      potentialWorkflows: []
    };
  }

  // ============================================================================
  // HUMAN-OS ENHANCED EXPANSION (0.2.0)
  // ============================================================================

  /**
   * Expand idea with Human-OS enrichment and progress reporting
   * Combines internal context with external intelligence for richer analysis
   */
  static async expandWithHumanOS(
    request: HumanOSExpansionRequest
  ): Promise<HumanOSExpansionResult> {
    const { idea, context, onProgress } = request;

    // Report initial progress
    onProgress?.('enriching', 0, 'Starting Human-OS enrichment...');

    let humanOSEnrichment: HumanOSEnrichment | undefined;

    try {
      const humanOS = new HumanOSClient();

      // Step 1: Enrich with Human-OS if available (0-30%)
      if (humanOS.isEnabled()) {
        onProgress?.('enriching', 10, 'Fetching external intelligence...');

        humanOSEnrichment = await this.fetchHumanOSEnrichment(
          humanOS,
          idea,
          (progress) => onProgress?.('enriching', 10 + progress * 0.2, 'Enriching...')
        );

        onProgress?.('enriching', 30, 'Enrichment complete');
      } else {
        onProgress?.('enriching', 30, 'Human-OS not available, using internal context only');
      }

      // Step 2: Analyze with LLM (30-70%)
      onProgress?.('analyzing', 30, 'Analyzing idea with AI...');

      const enrichedPrompt = this.buildEnrichedPrompt(idea, context, humanOSEnrichment);

      onProgress?.('analyzing', 50, 'Generating expansion...');

      const expansion = await this.callLLMForExpansion(idea, enrichedPrompt);

      onProgress?.('analyzing', 70, 'Analysis complete');

      // Step 3: Generate artifact (70-100%)
      onProgress?.('generating', 70, 'Generating shareable document...');

      const artifact = this.generateEnrichedArtifact(idea, expansion, humanOSEnrichment);

      onProgress?.('generating', 90, 'Finalizing...');
      onProgress?.('complete', 100, 'Expansion complete');

      return {
        expansion,
        artifact,
        humanOSEnrichment,
        enrichedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ParkingLotLLMService] expandWithHumanOS error:', error);
      throw error;
    }
  }

  /**
   * Fetch enrichment data from Human-OS
   */
  private static async fetchHumanOSEnrichment(
    humanOS: HumanOSClient,
    idea: ParkingLotItem,
    onProgress?: (progress: number) => void
  ): Promise<HumanOSEnrichment> {
    const enrichment: HumanOSEnrichment = {};

    try {
      // Enrich company if mentioned
      const customers = idea.extracted_entities.customers || [];
      if (customers.length > 0) {
        onProgress?.(0.3);
        const companyResult = await humanOS.enrichCompany({
          company_name: customers[0],
        });

        if (companyResult.found && companyResult.company) {
          enrichment.company = {
            name: companyResult.company.name,
            industry: companyResult.company.industry,
            recentFunding: companyResult.company.recent_funding,
          };
        }
      }

      // Enrich contacts if mentioned
      const contacts = idea.extracted_entities.contacts || [];
      if (contacts.length > 0) {
        onProgress?.(0.6);
        const contactEnrichments = await Promise.all(
          contacts.slice(0, 3).map(async (contactName) => {
            const result = await humanOS.enrichContact({
              contact_name: contactName,
              company_name: customers[0],
            });

            if (result.found && result.contact) {
              return {
                name: contactName,
                headline: result.contact.headline,
                recentPosts: result.contact.recent_posts?.slice(0, 2).map((post) => ({
                  content: post.content,
                  date: post.posted_at,
                })),
              };
            }
            return null;
          })
        );

        enrichment.contacts = contactEnrichments.filter((c): c is NonNullable<typeof c> => c !== null);
      }

      onProgress?.(1.0);

      // Generate triangulation summary
      enrichment.triangulation = this.generateTriangulation(enrichment);

      return enrichment;
    } catch (error) {
      console.warn('[ParkingLotLLMService] Human-OS enrichment failed:', error);
      return enrichment;
    }
  }

  /**
   * Generate triangulation insights from enrichment data
   */
  private static generateTriangulation(
    enrichment: HumanOSEnrichment
  ): { insights: string[]; summary: string } {
    const insights: string[] = [];

    // Check for funding signals
    if (enrichment.company?.recentFunding) {
      const { amount, round, date } = enrichment.company.recentFunding;
      const formattedAmount = amount >= 1_000_000
        ? `$${(amount / 1_000_000).toFixed(1)}M`
        : `$${amount.toLocaleString()}`;
      insights.push(`${enrichment.company.name} raised ${formattedAmount} (${round}) on ${date}`);
    }

    // Check for contact activity
    for (const contact of enrichment.contacts || []) {
      if (contact.recentPosts && contact.recentPosts.length > 0) {
        insights.push(`${contact.name} is recently active on LinkedIn - good time for outreach`);
      }
    }

    // Generate summary
    let summary = '';
    if (insights.length > 0) {
      summary = `External intelligence: ${insights.length} signal${insights.length > 1 ? 's' : ''} detected. `;
      if (enrichment.company?.industry) {
        summary += `${enrichment.company.name} operates in ${enrichment.company.industry}. `;
      }
    }

    return { insights, summary };
  }

  /**
   * Build enriched prompt with Human-OS context
   */
  private static buildEnrichedPrompt(
    idea: ParkingLotItem,
    context?: HumanOSExpansionRequest['context'],
    enrichment?: HumanOSEnrichment
  ): string {
    let prompt = `Expand this idea with deep analysis:

**Idea:** ${idea.cleaned_text}

**Extracted Context:**
- Customers: ${idea.extracted_entities.customers?.join(', ') || 'none'}
- Contacts: ${idea.extracted_entities.contacts?.join(', ') || 'none'}
- Topics: ${idea.extracted_entities.topics?.join(', ') || 'none'}
`;

    // Add internal context
    if (context?.customerData) {
      prompt += `\n**Customer Data:** ${JSON.stringify(context.customerData)}`;
    }
    if (context?.workflowData) {
      prompt += `\n**Related Workflows:** ${JSON.stringify(context.workflowData)}`;
    }

    // Add Human-OS enrichment
    if (enrichment) {
      prompt += '\n\n**External Intelligence (Human-OS):**';

      if (enrichment.company) {
        prompt += `\n- Company: ${enrichment.company.name}`;
        if (enrichment.company.industry) {
          prompt += ` (${enrichment.company.industry})`;
        }
        if (enrichment.company.recentFunding) {
          const { amount, round, date } = enrichment.company.recentFunding;
          prompt += `\n- Recent Funding: ${round} - $${(amount / 1_000_000).toFixed(1)}M on ${date}`;
        }
      }

      if (enrichment.contacts && enrichment.contacts.length > 0) {
        prompt += '\n- Key Contacts:';
        for (const contact of enrichment.contacts) {
          prompt += `\n  - ${contact.name}`;
          if (contact.headline) {
            prompt += ` (${contact.headline})`;
          }
        }
      }

      if (enrichment.triangulation?.insights.length) {
        prompt += '\n- Signals: ' + enrichment.triangulation.insights.join('; ');
      }
    }

    prompt += '\n\nReturn JSON only.';

    return prompt;
  }

  /**
   * Call LLM for expansion with enriched prompt
   */
  private static async callLLMForExpansion(
    idea: ParkingLotItem,
    userPrompt: string
  ): Promise<ExpandedAnalysis> {
    const systemPrompt = `You are helping users flesh out business ideas with deep analysis.

Generate a comprehensive expansion that includes:
1. Background: Current state and context (incorporate any external intelligence)
2. Opportunities: Potential upsides and benefits
3. Risks: Potential downsides and challenges
4. Action Plan: Concrete, sequenced steps
5. Objectives: Clear, measurable goals

When external intelligence is provided (funding, contact info, etc.), incorporate it into your analysis.

Return JSON with this structure:
{
  "background": "Context and current state...",
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "risks": ["Risk 1", "Risk 2"],
  "actionPlan": [
    {
      "step": "Step description",
      "estimatedTime": "30 min",
      "priority": "high",
      "order": 1
    }
  ],
  "objectives": ["Objective 1", "Objective 2"],
  "generatedAt": "${new Date().toISOString()}"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3072,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response');
    }

    return JSON.parse(content.text) as ExpandedAnalysis;
  }

  /**
   * Generate artifact with Human-OS enrichment data
   */
  private static generateEnrichedArtifact(
    idea: ParkingLotItem,
    expansion: ExpandedAnalysis,
    enrichment?: HumanOSEnrichment
  ): Artifact {
    let markdown = `# ${idea.cleaned_text}

**Generated:** ${new Date().toLocaleDateString()}
**Category:** ${idea.user_categories.join(', ') || 'Uncategorized'}
**Readiness Score:** ${idea.readiness_score}/100
`;

    // Add Human-OS enrichment section if available
    if (enrichment && (enrichment.company || enrichment.contacts?.length)) {
      markdown += `\n---\n\n## External Intelligence\n\n`;

      if (enrichment.company) {
        markdown += `**Company:** ${enrichment.company.name}`;
        if (enrichment.company.industry) {
          markdown += ` (${enrichment.company.industry})`;
        }
        markdown += '\n';

        if (enrichment.company.recentFunding) {
          const { amount, round, date } = enrichment.company.recentFunding;
          markdown += `**Recent Funding:** ${round} - $${(amount / 1_000_000).toFixed(1)}M on ${date}\n`;
        }
      }

      if (enrichment.contacts && enrichment.contacts.length > 0) {
        markdown += '\n**Key Contacts:**\n';
        for (const contact of enrichment.contacts) {
          markdown += `- ${contact.name}`;
          if (contact.headline) {
            markdown += ` - ${contact.headline}`;
          }
          markdown += '\n';
        }
      }

      if (enrichment.triangulation?.insights.length) {
        markdown += '\n**Signals:**\n';
        for (const insight of enrichment.triangulation.insights) {
          markdown += `- ${insight}\n`;
        }
      }
    }

    markdown += `
---

## Background

${expansion.background}

---

## Opportunities

${expansion.opportunities.map(o => `- ${o}`).join('\n')}

---

## Risks

${expansion.risks.map(r => `- ${r}`).join('\n')}

---

## Objectives

${expansion.objectives.map(obj => `- ${obj}`).join('\n')}

---

## Action Plan

${expansion.actionPlan.map((step, i) =>
  `${i + 1}. **${step.step}** (${step.estimatedTime}) - Priority: ${step.priority}`
).join('\n')}

---

*Generated by Renubu Parking Lot${enrichment ? ' with Human-OS enrichment' : ''}*
`;

    return {
      type: 'plan',
      format: 'markdown',
      content: markdown,
      title: idea.cleaned_text,
      generatedAt: new Date().toISOString()
    };
  }
}
