/**
 * Slide Library Registry
 *
 * Central registry of all reusable workflow slides.
 * Slides can be composed into workflows via database configuration.
 *
 * Architecture:
 * - Each slide is a builder function that accepts context
 * - Workflows reference slides by ID
 * - Same slide can be reused across multiple workflows with different contexts
 *
 * Usage:
 * const slides = composeWorkflow(workflowComposition, SLIDE_LIBRARY);
 */

import type { UniversalSlideBuilder } from './baseSlide';

// Common slides (used across all workflow types)
import { splashSlide } from './common/splashSlide';
import { greetingSlide } from './common/greetingSlide';
import { reviewAccountSlide } from './common/reviewAccountSlide';
import { workflowSummarySlide } from './common/workflowSummarySlide';

// Action slides (reusable actions)
import { prepareQuoteSlide } from './action/prepareQuoteSlide';
import { draftEmailSlide } from './action/draftEmailSlide';
import { scheduleCallSlide } from './action/scheduleCallSlide';
import { updateCRMSlide } from './action/updateCRMSlide';

// Risk-specific slides
import { assessDepartureSlide } from './risk/assessDepartureSlide';
import { identifyReplacementSlide } from './risk/identifyReplacementSlide';
import { identifyConcernsSlide } from './risk/identifyConcernsSlide';

// Renewal-specific slides
import { reviewContractTermsSlide } from './renewal/reviewContractTermsSlide';
import { pricingStrategySlide } from './renewal/pricingStrategySlide';
import { identifyOpportunitiesSlide } from './renewal/identifyOpportunitiesSlide';
import { meetingDebriefSlide } from './renewal/meetingDebriefSlide';
import { createRecommendationSlide } from './renewal/createRecommendationSlide';
import { negotiationGuideSlide } from './renewal/negotiationGuideSlide';
import { alignStrategySlide } from './renewal/alignStrategySlide';
import { prepareMeetingDeckSlide } from './renewal/prepareMeetingDeckSlide';
import { renewalPresentationSlide } from './renewal/renewalPresentationSlide';

// InHerSight-specific slides
import { reviewBrandPerformanceSlide } from './inhersight/reviewBrandPerformanceSlide';
import { prepareFreebieSlide } from './inhersight/prepareFreebieSlide';
import { deliverFreebieSlide } from './inhersight/deliverFreebieSlide';
import { measureFreebieImpactSlide } from './inhersight/measureFreebieImpactSlide';
import { accountReviewTabbedSlide } from './inhersight/accountReviewTabbedSlide';
import { accountReviewLLMSlide } from './inhersight/accountReviewLLMSlide';
import { strategySynthesisSlide } from './inhersight/strategySynthesisSlide';

// V2 Slides (template-based)
import { pricingAnalysisSlideV2 } from './renewal/pricingAnalysisSlideV2';
import { prepareQuoteSlideV2 } from './renewal/prepareQuoteSlideV2';
import { draftEmailSlideV2 } from './action/draftEmailSlideV2';
import { workflowSummarySlideV2 } from './common/workflowSummarySlideV2';

// Pricing Engine slides (use new composite components)
import { pricingRecommendationSlide } from './renewal/pricingRecommendationSlide';
import { healthDashboardSlide } from './renewal/healthDashboardSlide';

/**
 * Slide Library - All available slides
 *
 * Organized by category:
 * - common: Used across all workflows
 * - action: Specific actions (email, quote, call, etc.)
 * - risk: Risk-specific assessment/mitigation slides
 * - opportunity: Opportunity-specific slides
 * - strategic: Strategic planning slides
 * - renewal: Renewal-specific slides
 *
 * Supports both V1 (legacy) and V2 (template-based) slides
 */
export const SLIDE_LIBRARY: Record<string, UniversalSlideBuilder> = {
  // ========================================
  // COMMON SLIDES
  // ========================================
  'splash': splashSlide,
  'greeting': greetingSlide,
  'review-account': reviewAccountSlide,
  'workflow-summary': workflowSummarySlide,

  // ========================================
  // ACTION SLIDES (Reusable across workflows)
  // ========================================
  'prepare-quote': prepareQuoteSlide,
  'draft-email': draftEmailSlide,
  'schedule-call': scheduleCallSlide,
  'update-crm': updateCRMSlide,

  // ========================================
  // RISK-SPECIFIC SLIDES
  // ========================================
  'assess-departure': assessDepartureSlide,
  'identify-replacement': identifyReplacementSlide,
  'identify-concerns': identifyConcernsSlide,

  // ========================================
  // RENEWAL-SPECIFIC SLIDES
  // ========================================
  'review-contract-terms': reviewContractTermsSlide,
  'pricing-strategy': pricingStrategySlide,
  'pricing-analysis': pricingStrategySlide, // Alias for pricing-strategy
  'identify-opportunities': identifyOpportunitiesSlide,
  'meeting-debrief': meetingDebriefSlide,
  'create-recommendation': createRecommendationSlide,
  'negotiation-guide': negotiationGuideSlide,
  'align-strategy': alignStrategySlide,
  'prepare-meeting-deck': prepareMeetingDeckSlide,
  'renewal-presentation': renewalPresentationSlide,

  // ========================================
  // INHERSIGHT-SPECIFIC SLIDES
  // ========================================
  'review-brand-performance': reviewBrandPerformanceSlide,
  'prepare-freebie': prepareFreebieSlide,
  'deliver-freebie': deliverFreebieSlide,
  'measure-freebie-impact': measureFreebieImpactSlide,
  'account-review-tabbed': accountReviewTabbedSlide,
  // v0.1.12: LLM-driven account review with phase approval
  'account-review-llm': accountReviewLLMSlide,
  // v0.1.12: Strategy synthesis after all phases approved
  'strategy-synthesis': strategySynthesisSlide,

  // ========================================
  // V2 SLIDES (Template-based - New Architecture)
  // ========================================
  'pricing-analysis-v2': pricingAnalysisSlideV2,
  'prepare-quote-v2': prepareQuoteSlideV2,
  'draft-email-v2': draftEmailSlideV2,
  'workflow-summary-v2': workflowSummarySlideV2,

  // ========================================
  // PRICING ENGINE SLIDES (Composite Components)
  // ========================================
  'pricing-recommendation': pricingRecommendationSlide,
  'health-dashboard': healthDashboardSlide,

  // ========================================
  // OPPORTUNITY-SPECIFIC SLIDES
  // ========================================
  // TODO: Add opportunity slides:
  // 'analyze-expansion-potential': analyzeExpansionPotentialSlide,
  // 'calculate-expansion-roi': calculateExpansionROISlide,
  // 'prepare-business-case': prepareBusinessCaseSlide,

  // ========================================
  // STRATEGIC-SPECIFIC SLIDES
  // ========================================
  // TODO: Add strategic slides:
  // 'annual-assessment': annualAssessmentSlide,
  // 'strategic-goals-planning': strategicGoalsPlanningSlide,
  // 'account-plan-creation': accountPlanCreationSlide,
};

/**
 * Get slide by ID
 */
export function getSlide(slideId: string): UniversalSlideBuilder | undefined {
  return SLIDE_LIBRARY[slideId];
}

/**
 * Get all slide IDs
 */
export function getAllSlideIds(): string[] {
  return Object.keys(SLIDE_LIBRARY);
}

/**
 * Get slides by category
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSlidesByCategory(_category: string): Record<string, UniversalSlideBuilder> {
  // This would filter based on slide.category
  // For now, returning all since we need to build out the slide metadata
  return SLIDE_LIBRARY;
}

/**
 * Validate that all slides in a sequence exist
 */
export function validateSlideSequence(slideIds: string[]): { valid: boolean; missing: string[] } {
  const missing = slideIds.filter(id => !SLIDE_LIBRARY[id]);
  return {
    valid: missing.length === 0,
    missing
  };
}

// Re-export types and utilities
export * from './baseSlide';
