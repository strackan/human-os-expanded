/**
 * Professional Assessment Handler
 *
 * Transforms assessment results into a traditional HR/recruiting format.
 * Suitable for formal reports and hiring committee reviews.
 */

import type {
  AssessmentResult,
  AssessmentHandler,
  ProfessionalAssessment,
} from '../types.js';

import type { CandidateArchetype, InterviewTier, InterviewDimension } from '../../types/index.js';
import {
  scoreToRating,
  tierToRecommendation,
  getCultureAlignment,
  getRoleFit,
  getBottomDimensions,
  formatDimensionName,
  generateNextSteps,
} from './utils.js';

// =============================================================================
// PROFESSIONAL HANDLER
// =============================================================================

/**
 * Generate a professional summary paragraph
 */
function generateProfessionalSummary(
  name: string,
  score: number,
  tier: InterviewTier,
  archetype: CandidateArchetype,
  strengths: string[]
): string {
  const archetypeDescriptions: Record<CandidateArchetype, string> = {
    technical_builder: 'technical problem-solving and building capabilities',
    gtm_operator: 'go-to-market execution and commercial acumen',
    creative_strategist: 'strategic thinking and creative problem-solving',
    execution_machine: 'operational excellence and consistent delivery',
    generalist_orchestrator: 'versatility and cross-functional collaboration',
    domain_expert: 'deep domain expertise and specialized knowledge',
  };

  const tierDescriptions: Record<InterviewTier, string> = {
    'top_1%': 'an exceptional candidate who demonstrates outstanding capabilities',
    strong: 'a strong candidate who exceeds expectations across key areas',
    moderate: 'a capable candidate who meets core requirements',
    weak: 'a candidate who shows potential but has significant gaps',
    pass: 'a candidate who does not meet the minimum requirements',
  };

  const strengthText =
    strengths.length > 0
      ? ` Key strengths include: ${strengths.slice(0, 2).join('; ')}.`
      : '';

  return `${name} is ${tierDescriptions[tier]}, with a primary profile in ${archetypeDescriptions[archetype]}. Overall assessment score: ${score.toFixed(1)}/10.${strengthText}`;
}

// =============================================================================
// HANDLER EXPORT
// =============================================================================

export const professionalHandler: AssessmentHandler<ProfessionalAssessment> = {
  name: 'Professional Assessment',
  description: 'Formats assessment as a formal HR evaluation with ratings and recommendations',

  format(result: AssessmentResult): ProfessionalAssessment {
    const {
      candidateName,
      dimensions,
      overallScore,
      tier,
      archetype,
      greenFlags,
      completedAt,
    } = result;

    // Map each dimension to CompetencyRating
    const competencyLevels: Record<string, ReturnType<typeof scoreToRating>> = {};
    for (const [dim, data] of Object.entries(dimensions)) {
      const formattedName = formatDimensionName(dim as InterviewDimension);
      competencyLevels[formattedName] = scoreToRating(data.score);
    }

    // Get bottom 3 dimensions as development areas
    const bottomDimensions = getBottomDimensions(dimensions, 3);
    const developmentAreas = bottomDimensions.map((dim) => {
      const score = dimensions[dim].score;
      const name = formatDimensionName(dim);
      if (score < 3) {
        return `${name}: Requires significant development`;
      } else if (score < 5) {
        return `${name}: Area for growth and coaching`;
      } else {
        return `${name}: Opportunity for further development`;
      }
    });

    // Generate professional summary
    const recommendation = tierToRecommendation(tier);
    const summary = generateProfessionalSummary(
      candidateName,
      overallScore,
      tier,
      archetype.primary,
      greenFlags
    );

    // Generate appropriate next steps based on recommendation
    const nextSteps = generateNextSteps(recommendation, tier, archetype.confidence);

    return {
      candidateName,
      assessmentDate: completedAt,
      overallRating: scoreToRating(overallScore),
      recommendation,
      competencyLevels,
      strengths: greenFlags,
      developmentAreas,
      cultureAlignment: getCultureAlignment(dimensions.culture_fit.score),
      rolefit: getRoleFit(archetype.confidence),
      summary,
      nextSteps,
    };
  },
};
