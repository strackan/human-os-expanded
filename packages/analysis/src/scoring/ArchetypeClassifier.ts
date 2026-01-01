/**
 * Archetype Classifier
 *
 * Classifies candidates into 6 archetypes based on their
 * interview scores and competency signals:
 *
 * 1. Technical Builder - Engineers, developers, technical problem solvers
 * 2. GTM Operator - Sales, marketing, growth specialists
 * 3. Creative Strategist - Product, design, brand thinkers
 * 4. Execution Machine - Ops, project management, get-things-done
 * 5. Generalist Orchestrator - Versatile, can wear many hats
 * 6. Domain Expert - Deep expertise in specific vertical
 */

import type {
  CandidateArchetype,
  ArchetypeClassification,
  InterviewDimension,
  DimensionScore,
  CompetencyProfile,
  CompetencySignal,
} from '../types/index.js';

// =============================================================================
// ARCHETYPE PROFILES
// =============================================================================

interface ArchetypeProfile {
  archetype: CandidateArchetype;
  dimensionWeights: Partial<Record<InterviewDimension, number>>;
  signalWeights: Partial<Record<CompetencySignal, number>>;
  description: string;
}

const ARCHETYPE_PROFILES: ArchetypeProfile[] = [
  {
    archetype: 'technical_builder',
    dimensionWeights: {
      technical: 2.0,
      iq: 1.5,
      work_history: 1.0,
    },
    signalWeights: {
      technical: 2.0,
      problem_solving: 1.5,
      growth_mindset: 1.0,
    },
    description: 'Engineers, developers, and technical problem solvers who build products and systems',
  },
  {
    archetype: 'gtm_operator',
    dimensionWeights: {
      gtm: 2.0,
      personality: 1.5,
      motivation: 1.2,
    },
    signalWeights: {
      communication: 2.0,
      confidence: 1.5,
      leadership: 1.0,
    },
    description: 'Sales, marketing, and growth specialists who drive revenue and market expansion',
  },
  {
    archetype: 'creative_strategist',
    dimensionWeights: {
      passions: 1.5,
      iq: 1.3,
      personality: 1.2,
    },
    signalWeights: {
      problem_solving: 1.5,
      communication: 1.5,
      growth_mindset: 1.2,
    },
    description: 'Product, design, and brand thinkers who shape vision and experience',
  },
  {
    archetype: 'execution_machine',
    dimensionWeights: {
      work_history: 2.0,
      motivation: 1.5,
      self_awareness: 1.0,
    },
    signalWeights: {
      accountability: 2.0,
      stress_response: 1.5,
      leadership: 1.2,
    },
    description: 'Ops and project management professionals who get things done reliably',
  },
  {
    archetype: 'generalist_orchestrator',
    dimensionWeights: {
      culture_fit: 1.5,
      eq: 1.5,
      personality: 1.3,
    },
    signalWeights: {
      collaboration: 2.0,
      leadership: 1.5,
      communication: 1.3,
    },
    description: 'Versatile professionals who can wear many hats and coordinate across functions',
  },
  {
    archetype: 'domain_expert',
    dimensionWeights: {
      technical: 1.5,
      work_history: 1.5,
      passions: 1.3,
    },
    signalWeights: {
      technical: 1.5,
      problem_solving: 1.5,
      accountability: 1.0,
    },
    description: 'Deep specialists with expertise in a specific vertical or domain',
  },
];

// =============================================================================
// ARCHETYPE CLASSIFIER CLASS
// =============================================================================

export class ArchetypeClassifier {
  private profiles: ArchetypeProfile[];

  constructor(customProfiles?: ArchetypeProfile[]) {
    this.profiles = customProfiles || ARCHETYPE_PROFILES;
  }

  /**
   * Classify a candidate based on dimension scores and competency profile
   */
  classify(
    dimensionScores: Record<InterviewDimension, DimensionScore>,
    competencyProfile: CompetencyProfile
  ): ArchetypeClassification {
    const archetypeScores: Record<CandidateArchetype, number> = {
      technical_builder: 0,
      gtm_operator: 0,
      creative_strategist: 0,
      execution_machine: 0,
      generalist_orchestrator: 0,
      domain_expert: 0,
    };

    // Score each archetype
    for (const profile of this.profiles) {
      let score = 0;
      let weight = 0;

      // Add dimension-based scores
      for (const [dim, dimWeight] of Object.entries(profile.dimensionWeights)) {
        const dimScore = dimensionScores[dim as InterviewDimension];
        if (dimScore) {
          score += dimScore.score * dimWeight;
          weight += dimWeight;
        }
      }

      // Add competency signal scores
      for (const [signal, signalWeight] of Object.entries(profile.signalWeights)) {
        const signalScore = competencyProfile.signals[signal as CompetencySignal];
        if (signalScore !== undefined) {
          score += signalScore * 10 * signalWeight; // Scale to 0-10
          weight += signalWeight;
        }
      }

      // Normalize score
      archetypeScores[profile.archetype] = weight > 0 ? score / weight : 0;
    }

    // Normalize scores to 0-1 range
    const maxScore = Math.max(...Object.values(archetypeScores), 1);
    const normalizedScores = Object.fromEntries(
      Object.entries(archetypeScores).map(([k, v]) => [k, v / maxScore])
    ) as Record<CandidateArchetype, number>;

    // Find primary and secondary archetypes
    const sorted = Object.entries(normalizedScores)
      .sort(([, a], [, b]) => b - a);

    const [primaryArchetype, primaryScore] = sorted[0];
    const [secondaryArchetype, secondaryScore] = sorted[1];

    // Generate reasoning
    const reasoning = this.generateReasoning(
      primaryArchetype as CandidateArchetype,
      dimensionScores,
      competencyProfile
    );

    return {
      primary: primaryArchetype as CandidateArchetype,
      primaryScore,
      secondary: primaryScore - secondaryScore < 0.15
        ? secondaryArchetype as CandidateArchetype
        : undefined,
      secondaryScore: primaryScore - secondaryScore < 0.15
        ? secondaryScore
        : undefined,
      allScores: normalizedScores,
      reasoning,
    };
  }

  /**
   * Get archetype description
   */
  getArchetypeDescription(archetype: CandidateArchetype): string {
    const profile = this.profiles.find(p => p.archetype === archetype);
    return profile?.description || '';
  }

  /**
   * Get all archetype descriptions
   */
  getAllArchetypeDescriptions(): Record<CandidateArchetype, string> {
    return this.profiles.reduce((acc, profile) => {
      acc[profile.archetype] = profile.description;
      return acc;
    }, {} as Record<CandidateArchetype, string>);
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private generateReasoning(
    archetype: CandidateArchetype,
    dimensionScores: Record<InterviewDimension, DimensionScore>,
    competencyProfile: CompetencyProfile
  ): string {
    const profile = this.profiles.find(p => p.archetype === archetype);
    if (!profile) return '';

    const parts: string[] = [];

    // Add dimension insights
    const topDimensions = Object.entries(profile.dimensionWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([dim]) => dim);

    for (const dim of topDimensions) {
      const score = dimensionScores[dim as InterviewDimension];
      if (score && score.score >= 7) {
        parts.push(`Strong ${dim.replace('_', ' ')} (${score.score.toFixed(1)}/10)`);
      }
    }

    // Add competency signal insights
    const dominantSignals = competencyProfile.dominantSignals.slice(0, 2);
    if (dominantSignals.length > 0) {
      parts.push(`Key signals: ${dominantSignals.map(s => s.replace('_', ' ')).join(', ')}`);
    }

    // Add archetype-specific reasoning
    switch (archetype) {
      case 'technical_builder':
        parts.push('Shows technical depth and building orientation');
        break;
      case 'gtm_operator':
        parts.push('Demonstrates commercial acumen and market focus');
        break;
      case 'creative_strategist':
        parts.push('Exhibits strategic thinking and creative problem-solving');
        break;
      case 'execution_machine':
        parts.push('Displays strong execution track record and accountability');
        break;
      case 'generalist_orchestrator':
        parts.push('Shows versatility and cross-functional coordination skills');
        break;
      case 'domain_expert':
        parts.push('Demonstrates deep domain knowledge and specialization');
        break;
    }

    return parts.join('. ') + '.';
  }
}

// =============================================================================
// SINGLETON & CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Default classifier instance
 */
export const archetypeClassifier = new ArchetypeClassifier();

/**
 * Quick classification function
 */
export function classifyArchetype(
  dimensionScores: Record<InterviewDimension, DimensionScore>,
  competencyProfile: CompetencyProfile
): ArchetypeClassification {
  return archetypeClassifier.classify(dimensionScores, competencyProfile);
}
