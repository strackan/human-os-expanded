/**
 * INTEL Composer
 *
 * Enhances workflow configs with customer intelligence from INTEL files.
 * This is a separate composer that can be chained with the database composer.
 *
 * Usage:
 *   const dbConfig = await composeFromDatabase(workflowId, companyId, customerContext);
 *   const enrichedConfig = await composeWithINTEL(dbConfig, customerContext.name);
 */

import {
  getINTELContext,
  buildINTELSummary,
  buildGreetingContext,
  type INTELContext,
} from '@/lib/skills/INTELService';
import type { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface INTELEnrichedConfig extends Partial<WorkflowConfig> {
  /** INTEL context for this customer */
  intel?: INTELContext;
  /** Pre-built INTEL summary for LLM system prompts */
  intelSummary?: string;
  /** Greeting context with personalized message and metrics */
  greetingContext?: ReturnType<typeof buildGreetingContext>;
}

/**
 * Compose workflow config with INTEL context
 *
 * Fetches INTEL files for the customer and enriches the workflow config with:
 * - INTEL context (customer, contacts, user)
 * - Pre-built INTEL summary for LLM prompts
 * - Personalized greeting message and metrics
 * - Account summary artifact for greeting slide
 *
 * @param config - Base workflow config from database composer
 * @param customerName - Customer name to look up INTEL for
 * @param userId - User ID for user INTEL (defaults to 'grace')
 * @returns Enriched workflow config with INTEL context
 */
export async function composeWithINTEL(
  config: Partial<WorkflowConfig>,
  customerName: string,
  userId: string = 'grace'
): Promise<INTELEnrichedConfig> {
  try {
    // 1. Fetch INTEL context
    const intel = await getINTELContext(customerName, userId);

    // 2. Build INTEL summary for LLM
    const intelSummary = buildINTELSummary(intel);

    // 3. Build greeting context
    const greetingContext = buildGreetingContext(intel);

    // 4. Enrich greeting slide with INTEL
    const enrichedSlides = enrichGreetingSlide(config.slides || [], intel, greetingContext);

    return {
      ...config,
      slides: enrichedSlides,
      intel,
      intelSummary,
      greetingContext,
    };
  } catch (error) {
    // INTEL is optional - log warning but return original config
    console.warn('[intel-composer] Could not load INTEL context:', error);
    return config;
  }
}

/**
 * Enrich the greeting slide with INTEL data
 *
 * Updates the greeting slide to:
 * - Use INTEL-based greeting message
 * - Add account summary artifact
 * - Include key metrics and status
 */
function enrichGreetingSlide(
  slides: WorkflowSlide[],
  intel: INTELContext,
  greetingContext: ReturnType<typeof buildGreetingContext>
): WorkflowSlide[] {
  if (!intel.customer) {
    return slides;
  }

  return slides.map((slide, index) => {
    // Only enrich the first slide (greeting)
    if (index !== 0 || slide.id !== 'greeting') {
      return slide;
    }

    // Update chat message with INTEL-based greeting
    const enrichedSlide: WorkflowSlide = {
      ...slide,
      chat: slide.chat ? {
        ...slide.chat,
        initialMessage: slide.chat.initialMessage ? {
          ...slide.chat.initialMessage,
          text: greetingContext.greetingText,
        } : undefined,
      } : undefined,
      // Add account summary artifact
      artifacts: {
        ...slide.artifacts,
        sections: [
          // Add account summary at the top
          {
            id: 'account-summary',
            title: 'Account Overview',
            type: 'custom' as const,
            visible: true,
            data: {
              componentType: 'AccountSummaryArtifact',
              props: buildAccountSummaryProps(intel, greetingContext),
            },
          },
          // Keep existing sections (like planning checklist)
          ...(slide.artifacts?.sections || []),
        ],
      },
    };

    return enrichedSlide;
  });
}

/**
 * Build props for AccountSummaryArtifact from INTEL
 */
function buildAccountSummaryProps(
  intel: INTELContext,
  greetingContext: ReturnType<typeof buildGreetingContext>
) {
  const customer = intel.customer!;

  // Determine status from scores
  let status: 'healthy' | 'at-risk' | 'critical' | 'unknown' = 'unknown';
  if (customer.risk_score >= 70) {
    status = 'critical';
  } else if (customer.risk_score >= 50 || customer.health_score < 50) {
    status = 'at-risk';
  } else if (customer.health_score >= 70) {
    status = 'healthy';
  }

  // Build contacts list
  const contacts = (intel.contacts || []).slice(0, 3).map(contact => ({
    name: contact.name,
    role: contact.role,
    relationship: contact.relationship_strength,
    isPrimary: contact.is_primary,
  }));

  // Extract priorities from INTEL content
  const priorities = extractUpcoming(customer.content);

  // Extract risks from INTEL content
  const risks = extractRisks(customer.content);

  // Extract opportunities from INTEL content
  const opportunities = extractOpportunities(customer.content);

  return {
    customerName: customer.name,
    industry: customer.industry,
    tier: customer.tier,
    status,
    renewalDate: customer.renewal_date,
    daysToRenewal: calculateDaysToRenewal(customer.renewal_date),
    metrics: greetingContext.keyMetrics.map(m => ({
      label: m.label,
      value: m.value,
      trend: m.trend,
    })),
    contacts,
    priorities,
    risks,
    opportunities,
  };
}

/**
 * Calculate days until renewal
 */
function calculateDaysToRenewal(renewalDate: string): number | undefined {
  if (!renewalDate) return undefined;
  const renewal = new Date(renewalDate);
  const today = new Date();
  const diffTime = renewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Extract upcoming items from INTEL content
 */
function extractUpcoming(content: string): string[] {
  const items: string[] = [];
  const lines = content.split('\n');
  let inUpcoming = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('## upcoming')) {
      inUpcoming = true;
      continue;
    }
    if (inUpcoming && line.startsWith('## ')) {
      break;
    }
    if (inUpcoming && line.startsWith('- **')) {
      // Extract the bold title
      const match = line.match(/\*\*([^*]+)\*\*/);
      if (match) {
        items.push(match[1]);
      }
    }
  }

  return items.slice(0, 3);
}

/**
 * Extract risk factors from INTEL content
 */
function extractRisks(content: string): string[] {
  const items: string[] = [];
  const lines = content.split('\n');
  let inRisks = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('## risk factors') || line.toLowerCase().includes('### high risk')) {
      inRisks = true;
      continue;
    }
    if (inRisks && (line.startsWith('## ') || line.startsWith('### low'))) {
      break;
    }
    if (inRisks && line.match(/^\d+\.\s+\*\*/)) {
      // Extract numbered bold items like "1. **Low engagement**"
      const match = line.match(/\*\*([^*]+)\*\*/);
      if (match) {
        items.push(match[1]);
      }
    }
  }

  return items.slice(0, 2);
}

/**
 * Extract opportunities from INTEL content
 */
function extractOpportunities(content: string): string[] {
  const items: string[] = [];
  const lines = content.split('\n');
  let inOpportunities = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('## expansion opportunities') || line.toLowerCase().includes('### high confidence')) {
      inOpportunities = true;
      continue;
    }
    if (inOpportunities && (line.startsWith('## ') || line.startsWith('### medium'))) {
      break;
    }
    if (inOpportunities && line.match(/^\d+\.\s+\*\*/)) {
      // Extract numbered bold items
      const match = line.match(/\*\*([^*]+)\*\*/);
      if (match) {
        items.push(match[1]);
      }
    }
  }

  return items.slice(0, 2);
}
