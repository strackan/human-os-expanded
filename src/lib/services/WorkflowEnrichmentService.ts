/**
 * Workflow Enrichment Service
 *
 * Provides external enrichment for workflow context via Human-OS integration.
 * Implements graceful degradation when Human-OS is unavailable.
 *
 * Phase 2 of Human-OS 0.2.0 Integration
 */

import { HumanOSClient } from '@/lib/mcp/clients/HumanOSClient';
import type {
  ContactEnrichmentResult,
  CompanyEnrichmentResult,
  FullEnrichmentResult,
  OpinionSummary,
} from '@/lib/mcp/types/humanOS.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Contact info for enrichment (from Renubu internal data)
 */
export interface ContactForEnrichment {
  name: string;
  email?: string;
  linkedin_url?: string;
  company_name?: string;
}

/**
 * Company info for enrichment (from Renubu internal data)
 */
export interface CompanyForEnrichment {
  name: string;
  domain?: string;
  linkedin_url?: string;
}

/**
 * Internal context from Renubu (INTEL, user feedback, etc.)
 */
export interface InternalContext {
  intel?: {
    customer?: {
      summary?: string;
      key_points?: string[];
    };
    contacts?: Array<{
      name: string;
      summary?: string;
    }>;
  };
  userFeedback?: {
    sentiment?: string;
    notes?: string[];
  };
}

/**
 * External context from Human-OS (GFT, opinions)
 */
export interface ExternalContext {
  company?: CompanyEnrichmentResult;
  contacts?: Array<{
    name: string;
    enrichment: ContactEnrichmentResult;
    opinions?: OpinionSummary;
  }>;
  available: boolean;
}

/**
 * Triangulated insight combining internal + external signals
 */
export interface TriangulatedInsight {
  type: 'opportunity' | 'risk' | 'timing' | 'relationship';
  confidence: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  internal_signal?: string;
  external_signal?: string;
}

/**
 * Complete enrichment result for workflow context
 */
export interface WorkflowEnrichment {
  external: ExternalContext;
  triangulation: {
    insights: TriangulatedInsight[];
    summary: string;
  };
  metadata: {
    enriched_at: string;
    human_os_available: boolean;
    enrichment_duration_ms: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class WorkflowEnrichmentService {
  private humanOS: HumanOSClient;

  constructor() {
    this.humanOS = new HumanOSClient();
  }

  /**
   * Check if Human-OS enrichment is available
   */
  isAvailable(): boolean {
    return this.humanOS.isEnabled();
  }

  /**
   * Enrich workflow context with Human-OS data
   *
   * @param company Company info for enrichment
   * @param contacts Array of contacts for enrichment
   * @param internalContext Internal context for triangulation
   */
  async enrichWorkflowContext(
    company: CompanyForEnrichment,
    contacts: ContactForEnrichment[],
    internalContext?: InternalContext
  ): Promise<WorkflowEnrichment> {
    const startTime = Date.now();

    // Default response when Human-OS is not available
    if (!this.isAvailable()) {
      return this.createEmptyEnrichment(startTime, false);
    }

    try {
      // Enrich company
      const companyEnrichment = await this.humanOS.enrichCompany({
        company_name: company.name,
        company_domain: company.domain,
        company_linkedin_url: company.linkedin_url,
      });

      // Enrich contacts (limit to top 3 for performance)
      const contactEnrichments = await Promise.all(
        contacts.slice(0, 3).map(async (contact) => {
          const enrichment = await this.humanOS.enrichContact({
            contact_name: contact.name,
            contact_email: contact.email,
            contact_linkedin_url: contact.linkedin_url,
            company_name: contact.company_name || company.name,
          });

          // Get opinion summary if contact was found
          let opinions: OpinionSummary | undefined;
          if (enrichment.found && enrichment.contact) {
            // Note: We'd need entity_id from GFT mapping - for now use name-based lookup
            // This will be enhanced in Phase 3
            opinions = undefined;
          }

          return {
            name: contact.name,
            enrichment,
            opinions,
          };
        })
      );

      // Build external context
      const externalContext: ExternalContext = {
        company: companyEnrichment,
        contacts: contactEnrichments,
        available: true,
      };

      // Generate triangulated insights
      const triangulation = this.generateTriangulation(
        externalContext,
        internalContext
      );

      return {
        external: externalContext,
        triangulation,
        metadata: {
          enriched_at: new Date().toISOString(),
          human_os_available: true,
          enrichment_duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('[WorkflowEnrichmentService] Enrichment failed:', error);
      return this.createEmptyEnrichment(startTime, true);
    }
  }

  /**
   * Get full enrichment for a single contact + company
   * Convenience method for simpler use cases
   */
  async getFullEnrichment(
    contactName: string,
    companyName: string,
    companyDomain?: string
  ): Promise<FullEnrichmentResult> {
    return this.humanOS.getFullEnrichment({
      contact_name: contactName,
      company_name: companyName,
      company_domain: companyDomain,
    });
  }

  /**
   * Generate triangulated insights by combining internal and external signals
   */
  private generateTriangulation(
    external: ExternalContext,
    internal?: InternalContext
  ): { insights: TriangulatedInsight[]; summary: string } {
    const insights: TriangulatedInsight[] = [];

    // Check for funding signal
    if (external.company?.found && external.company.company?.recent_funding) {
      const funding = external.company.company.recent_funding;
      const internalSays = internal?.userFeedback?.notes?.find((n) =>
        n.toLowerCase().includes('budget') || n.toLowerCase().includes('stingy')
      );

      insights.push({
        type: 'opportunity',
        confidence: 'high',
        title: 'Recent Funding',
        description: `${external.company.company.name} raised ${this.formatCurrency(funding.amount)} (${funding.round}) on ${funding.date}`,
        internal_signal: internalSays,
        external_signal: `Funding: ${funding.round} - ${this.formatCurrency(funding.amount)}`,
      });

      // Add triangulated insight if internal says budget constraints
      if (internalSays) {
        insights.push({
          type: 'opportunity',
          confidence: 'high',
          title: 'Budget Constraints May Have Lifted',
          description: `Internal notes mention budget concerns, but they just raised ${this.formatCurrency(funding.amount)}. Consider expansion conversation.`,
          internal_signal: internalSays,
          external_signal: `Recent ${funding.round} funding`,
        });
      }
    }

    // Check for contact activity
    for (const contact of external.contacts || []) {
      if (contact.enrichment.found && contact.enrichment.contact?.recent_posts?.length) {
        const recentPost = contact.enrichment.contact.recent_posts[0];
        insights.push({
          type: 'timing',
          confidence: 'medium',
          title: `${contact.name} Recently Active`,
          description: `${contact.name} posted on LinkedIn recently. Good time for outreach.`,
          external_signal: `Recent post: "${recentPost.content.slice(0, 100)}..."`,
        });
      }

      // Check for job change signal
      if (contact.enrichment.found && contact.enrichment.contact?.headline) {
        const headline = contact.enrichment.contact.headline;
        const internalContact = internal?.intel?.contacts?.find(
          (c) => c.name.toLowerCase() === contact.name.toLowerCase()
        );

        // If internal has different title than LinkedIn, might be job change
        if (internalContact?.summary && !internalContact.summary.includes(headline.split(' ')[0])) {
          insights.push({
            type: 'relationship',
            confidence: 'low',
            title: `Possible Role Change for ${contact.name}`,
            description: `LinkedIn shows "${headline}" - verify this matches your records.`,
            internal_signal: internalContact.summary,
            external_signal: `LinkedIn: ${headline}`,
          });
        }
      }
    }

    // Generate summary
    const summary = this.generateTriangulationSummary(insights, external, internal);

    return { insights, summary };
  }

  /**
   * Generate a human-readable summary of triangulation
   */
  private generateTriangulationSummary(
    insights: TriangulatedInsight[],
    external: ExternalContext,
    internal?: InternalContext
  ): string {
    if (!external.available || insights.length === 0) {
      return '';
    }

    const parts: string[] = [];

    // Company summary
    if (external.company?.found && external.company.company) {
      const company = external.company.company;
      let companyPart = `${company.name}`;

      if (company.industry) {
        companyPart += ` (${company.industry})`;
      }

      if (company.recent_funding) {
        companyPart += ` recently raised ${this.formatCurrency(company.recent_funding.amount)}`;
      }

      parts.push(companyPart);
    }

    // Insight summary
    const opportunities = insights.filter((i) => i.type === 'opportunity');
    const risks = insights.filter((i) => i.type === 'risk');
    const timing = insights.filter((i) => i.type === 'timing');

    if (opportunities.length > 0) {
      parts.push(`${opportunities.length} opportunity signal${opportunities.length > 1 ? 's' : ''} detected`);
    }

    if (risks.length > 0) {
      parts.push(`${risks.length} risk signal${risks.length > 1 ? 's' : ''} to monitor`);
    }

    if (timing.length > 0) {
      parts.push(`Good timing for outreach`);
    }

    // Internal context note
    if (internal?.intel?.customer?.summary) {
      parts.push(`Internal intel available`);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Create empty enrichment result for graceful degradation
   */
  private createEmptyEnrichment(
    startTime: number,
    wasError: boolean
  ): WorkflowEnrichment {
    return {
      external: {
        available: false,
      },
      triangulation: {
        insights: [],
        summary: '',
      },
      metadata: {
        enriched_at: new Date().toISOString(),
        human_os_available: !wasError && this.isAvailable(),
        enrichment_duration_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let enrichmentService: WorkflowEnrichmentService | null = null;

/**
 * Get or create WorkflowEnrichmentService instance
 */
export function getWorkflowEnrichmentService(): WorkflowEnrichmentService {
  if (!enrichmentService) {
    enrichmentService = new WorkflowEnrichmentService();
  }
  return enrichmentService;
}
