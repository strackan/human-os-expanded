/**
 * Talent Enrichment Service
 *
 * Enriches candidate data with external context from Human-OS.
 * Follows the same pattern as WorkflowEnrichmentService for consistency.
 *
 * Features:
 * - LinkedIn profile enrichment via Human-OS
 * - Company enrichment for candidate's current employer
 * - Opinion tracking for relationship context
 * - Graceful degradation when Human-OS unavailable
 */

import { HumanOSClient } from '@/lib/mcp/clients/HumanOSClient';
import type { IntelligenceFile } from '@/types/talent';

/**
 * Enriched candidate data structure
 */
export interface CandidateEnrichment {
  linkedin?: {
    headline?: string;
    about?: string;
    profile_url?: string;
    recent_posts?: Array<{
      content: string;
      engagement?: { likes: number; comments: number };
      posted_at: string;
    }>;
  };
  company?: {
    name?: string;
    industry?: string;
    employee_count?: number;
    domain?: string;
    recent_funding?: {
      amount: number;
      date: string;
      round: string;
    };
  };
  insights?: string[];
  enriched_at: string;
  human_os_available: boolean;
}

/**
 * Input params for candidate enrichment
 */
export interface EnrichCandidateParams {
  name: string;
  email?: string;
  linkedin_url?: string;
  company_name?: string;
}

// Singleton instance
let serviceInstance: TalentEnrichmentService | null = null;

/**
 * Talent Enrichment Service
 */
export class TalentEnrichmentService {
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
   * Enrich a candidate with Human-OS data
   */
  async enrichCandidate(params: EnrichCandidateParams): Promise<CandidateEnrichment> {
    const startTime = Date.now();

    if (!this.isAvailable()) {
      return this.createEmptyEnrichment(false);
    }

    try {
      const enrichment: CandidateEnrichment = {
        enriched_at: new Date().toISOString(),
        human_os_available: true,
        insights: [],
      };

      // Enrich contact (LinkedIn profile)
      const contactResult = await this.humanOS.enrichContact({
        contact_name: params.name,
        contact_email: params.email,
        contact_linkedin_url: params.linkedin_url,
        company_name: params.company_name,
      });

      if (contactResult.found && contactResult.contact) {
        enrichment.linkedin = {
          headline: contactResult.contact.headline,
          about: contactResult.contact.about,
          profile_url: contactResult.contact.linkedin_url,
          recent_posts: contactResult.contact.recent_posts,
        };

        // Generate insights from LinkedIn data
        if (contactResult.contact.headline) {
          enrichment.insights?.push(`Current: ${contactResult.contact.headline}`);
        }
        if (contactResult.contact.recent_posts?.length) {
          enrichment.insights?.push(
            `Active on LinkedIn (${contactResult.contact.recent_posts.length} recent posts)`
          );
        }
      }

      // Enrich company if we have company name
      if (params.company_name) {
        const companyResult = await this.humanOS.enrichCompany({
          company_name: params.company_name,
        });

        if (companyResult.found && companyResult.company) {
          enrichment.company = {
            name: companyResult.company.name,
            industry: companyResult.company.industry,
            employee_count: companyResult.company.employee_count,
            domain: companyResult.company.domain,
            recent_funding: companyResult.company.recent_funding,
          };

          // Generate insights from company data
          if (companyResult.company.recent_funding) {
            const funding = companyResult.company.recent_funding;
            enrichment.insights?.push(
              `Company raised $${(funding.amount / 1000000).toFixed(1)}M (${funding.round})`
            );
          }
          if (companyResult.company.industry) {
            enrichment.insights?.push(`Industry: ${companyResult.company.industry}`);
          }
        }
      }

      console.log(
        '[TalentEnrichmentService] Enriched candidate:',
        params.name,
        'in',
        Date.now() - startTime,
        'ms'
      );

      return enrichment;
    } catch (error) {
      console.error('[TalentEnrichmentService] Error enriching candidate:', error);
      return this.createEmptyEnrichment(true);
    }
  }

  /**
   * Enrich multiple candidates (limited to top 3 for performance)
   */
  async enrichCandidates(
    candidates: EnrichCandidateParams[]
  ): Promise<Map<string, CandidateEnrichment>> {
    const results = new Map<string, CandidateEnrichment>();

    // Limit to top 3 candidates
    const toEnrich = candidates.slice(0, 3);

    // Enrich in parallel
    const enrichments = await Promise.all(
      toEnrich.map(async (candidate) => {
        const enrichment = await this.enrichCandidate(candidate);
        return { name: candidate.name, enrichment };
      })
    );

    for (const { name, enrichment } of enrichments) {
      results.set(name, enrichment);
    }

    return results;
  }

  /**
   * Merge enrichment data into intelligence file where fields are missing
   * Returns a new object with enriched fields filled in
   */
  enrichIntelligenceFile(
    intelligenceFile: IntelligenceFile,
    enrichment: CandidateEnrichment
  ): IntelligenceFile {
    const updated = { ...intelligenceFile };

    // Add LinkedIn headline if current_role is missing
    if (enrichment.linkedin?.headline && !updated.current_role) {
      updated.current_role = enrichment.linkedin.headline;
    }

    // Add company info if missing
    if (enrichment.company?.name && !updated.company) {
      updated.company = enrichment.company.name;
    }

    // Add LinkedIn URL if missing
    if (enrichment.linkedin?.profile_url && !updated.linkedin_url) {
      updated.linkedin_url = enrichment.linkedin.profile_url;
    }

    return updated;
  }

  /**
   * Get enrichment insights as a formatted string for LLM context
   */
  getEnrichmentContext(enrichment: CandidateEnrichment): string {
    if (!enrichment.insights?.length) {
      return '';
    }
    return `\n\nEXTERNAL INSIGHTS (from LinkedIn/public data):\n- ${enrichment.insights.join('\n- ')}`;
  }

  /**
   * Create empty enrichment structure
   */
  private createEmptyEnrichment(wasAvailable: boolean): CandidateEnrichment {
    return {
      enriched_at: new Date().toISOString(),
      human_os_available: wasAvailable,
      insights: [],
    };
  }
}

/**
 * Get singleton instance of TalentEnrichmentService
 */
export function getTalentEnrichmentService(): TalentEnrichmentService {
  if (!serviceInstance) {
    serviceInstance = new TalentEnrichmentService();
  }
  return serviceInstance;
}
