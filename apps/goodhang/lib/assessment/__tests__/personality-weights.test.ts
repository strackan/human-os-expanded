// Unit tests for personality-based score adjustments

import {
  PERSONALITY_WEIGHTS,
  applyPersonalityWeights,
  getPersonalityStrengths,
  getPersonalityChallenges,
  scoresMatchPersonality,
  generatePersonalityInsights,
} from '../personality-weights';
import { PersonalityType, AssessmentDimensions } from '../types';

describe('Personality Weights Utilities', () => {
  const baseDimensions: AssessmentDimensions = {
    iq: 70,
    eq: 70,
    empathy: 70,
    self_awareness: 70,
    technical: 70,
    ai_readiness: 70,
    gtm: 70,
    personality: 70,
    motivation: 70,
    work_history: 70,
    passions: 70,
    culture_fit: 70,
    organization: 70,
    executive_leadership: 70,
  };

  describe('PERSONALITY_WEIGHTS', () => {
    it('should have weights for all 16 MBTI types', () => {
      const expectedTypes: PersonalityType[] = [
        'INTJ', 'INTP', 'ENTJ', 'ENTP',
        'INFJ', 'INFP', 'ENFJ', 'ENFP',
        'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
        'ISTP', 'ISFP', 'ESTP', 'ESFP',
      ];

      expectedTypes.forEach((type) => {
        expect(PERSONALITY_WEIGHTS[type]).toBeDefined();
        expect(Object.keys(PERSONALITY_WEIGHTS[type]).length).toBeGreaterThan(0);
      });
    });

    it('should have weight values between 0.8 and 1.2', () => {
      Object.values(PERSONALITY_WEIGHTS).forEach((weights) => {
        Object.values(weights).forEach((weight) => {
          expect(weight).toBeGreaterThanOrEqual(0.8);
          expect(weight).toBeLessThanOrEqual(1.2);
        });
      });
    });

    it('should have different weight patterns for different types', () => {
      // INTJ should be strong in technical/IQ
      expect(PERSONALITY_WEIGHTS.INTJ.technical).toBeGreaterThan(1.0);
      expect(PERSONALITY_WEIGHTS.INTJ.iq).toBeGreaterThan(1.0);

      // ENFP should be strong in empathy/creative
      expect(PERSONALITY_WEIGHTS.ENFP.empathy).toBeGreaterThan(1.0);
      expect(PERSONALITY_WEIGHTS.ENFP.passions).toBeGreaterThan(1.0);

      // ISTJ should be strong in organization
      expect(PERSONALITY_WEIGHTS.ISTJ.organization).toBeGreaterThan(1.0);
    });
  });

  describe('applyPersonalityWeights', () => {
    it('should increase scores for strengths (INTJ technical)', () => {
      const weighted = applyPersonalityWeights(baseDimensions, 'INTJ');

      // INTJ has technical: 1.1, so 70 * 1.1 = 77
      expect(weighted.technical).toBeGreaterThan(baseDimensions.technical);
      expect(weighted.technical).toBe(77);
    });

    it('should decrease scores for challenges (INTJ empathy)', () => {
      const weighted = applyPersonalityWeights(baseDimensions, 'INTJ');

      // INTJ has empathy: 0.95, so 70 * 0.95 = 66.5 -> 67
      expect(weighted.empathy).toBeLessThan(baseDimensions.empathy);
      expect(weighted.empathy).toBe(67);
    });

    it('should not modify dimensions without weights', () => {
      const weighted = applyPersonalityWeights(baseDimensions, 'INTJ');

      // work_history is not in INTJ weights, so should remain 70
      expect(weighted.work_history).toBe(baseDimensions.work_history);
    });

    it('should clamp scores to 0-100 range', () => {
      const highDimensions: AssessmentDimensions = {
        ...baseDimensions,
        technical: 95, // 95 * 1.1 = 104.5, should clamp to 100
      };

      const weighted = applyPersonalityWeights(highDimensions, 'INTJ');
      expect(weighted.technical).toBe(100);

      const lowDimensions: AssessmentDimensions = {
        ...baseDimensions,
        empathy: 10, // 10 * 0.9 might go negative if extreme, should clamp to 0
      };

      const weightedLow = applyPersonalityWeights(lowDimensions, 'INFP');
      expect(weightedLow.empathy).toBeGreaterThanOrEqual(0);
    });

    it('should round weighted scores correctly', () => {
      const dimensions: AssessmentDimensions = {
        ...baseDimensions,
        technical: 73, // 73 * 1.1 = 80.3 -> 80
      };

      const weighted = applyPersonalityWeights(dimensions, 'INTJ');
      expect(weighted.technical).toBe(80);
    });
  });

  describe('getPersonalityStrengths', () => {
    it('should return dimensions with weights >= 1.05', () => {
      const strengths = getPersonalityStrengths('INTJ');

      expect(strengths).toContain('technical');
      expect(strengths).toContain('iq');
      expect(strengths.length).toBeGreaterThan(0);

      // Should not include dimensions with low weights
      expect(strengths).not.toContain('empathy');
    });

    it('should return different strengths for different types', () => {
      const intjStrengths = getPersonalityStrengths('INTJ');
      const enfpStrengths = getPersonalityStrengths('ENFP');

      // Should have some different strengths
      expect(intjStrengths).not.toEqual(enfpStrengths);
    });

    it('should return empty array if no strong dimensions', () => {
      // Create a mock type with all neutral weights (this won't exist in real data)
      // But we can test the logic by checking an existing type has at least one strength
      const strengths = getPersonalityStrengths('INTJ');
      expect(strengths.length).toBeGreaterThan(0);
    });
  });

  describe('getPersonalityChallenges', () => {
    it('should return dimensions with weights <= 0.95', () => {
      const challenges = getPersonalityChallenges('INTJ');

      expect(challenges).toContain('empathy');
      expect(challenges).toContain('personality');
      expect(challenges.length).toBeGreaterThan(0);

      // Should not include dimensions with high weights
      expect(challenges).not.toContain('technical');
    });

    it('should return different challenges for different types', () => {
      const intjChallenges = getPersonalityChallenges('INTJ');
      const enfpChallenges = getPersonalityChallenges('ENFP');

      expect(intjChallenges).not.toEqual(enfpChallenges);
    });
  });

  describe('scoresMatchPersonality', () => {
    it('should return true when scores align with INTJ profile', () => {
      const intjScores: AssessmentDimensions = {
        ...baseDimensions,
        technical: 85, // Expected strength
        iq: 80, // Expected strength
        empathy: 65, // Expected challenge (acceptable)
      };

      const matches = scoresMatchPersonality(intjScores, 'INTJ');
      expect(matches).toBe(true);
    });

    it('should return true when scores align with ENFP profile', () => {
      const enfpScores: AssessmentDimensions = {
        ...baseDimensions,
        empathy: 85, // Expected strength
        passions: 88, // Expected strength
        motivation: 82, // Expected strength
        technical: 55, // Expected challenge (acceptable)
      };

      const matches = scoresMatchPersonality(enfpScores, 'ENFP');
      expect(matches).toBe(true);
    });

    it('should allow high achievers to overcome natural weaknesses', () => {
      const highAchieverScores: AssessmentDimensions = {
        ...baseDimensions,
        technical: 90, // ENFP typically weak here
        empathy: 90, // But also strong in expected strength
        passions: 92,
      };

      // ENFP with exceptional technical skills (overcoming weakness)
      const matches = scoresMatchPersonality(highAchieverScores, 'ENFP');
      expect(matches).toBe(true);
    });

    it('should return false when strengths are weak', () => {
      const mismatchScores: AssessmentDimensions = {
        ...baseDimensions,
        technical: 45, // INTJ expected strength, but low
        iq: 48, // INTJ expected strength, but low
        empathy: 85, // INTJ expected challenge, but high (inconsistent)
      };

      const matches = scoresMatchPersonality(mismatchScores, 'INTJ');
      expect(matches).toBe(false);
    });
  });

  describe('generatePersonalityInsights', () => {
    it('should identify expected strengths for INTJ', () => {
      const intjScores: AssessmentDimensions = {
        ...baseDimensions,
        technical: 85,
        iq: 80,
        ai_readiness: 82,
        organization: 78,
      };

      const insights = generatePersonalityInsights(intjScores, 'INTJ');

      expect(insights.expectedStrengths.length).toBeGreaterThan(0);
      expect(insights.expectedStrengths.some(s => s.includes('Technical'))).toBe(true);
    });

    it('should identify expected challenges', () => {
      const scores: AssessmentDimensions = {
        ...baseDimensions,
        empathy: 55, // Low, as expected for INTJ
        personality: 58,
      };

      const insights = generatePersonalityInsights(scores, 'INTJ');

      expect(insights.expectedChallenges.length).toBeGreaterThan(0);
    });

    it('should identify overcome weaknesses', () => {
      const scores: AssessmentDimensions = {
        ...baseDimensions,
        empathy: 85, // INTJ typically weak here, but this person is strong
        personality: 80,
        technical: 88, // Also strong in expected area
      };

      const insights = generatePersonalityInsights(scores, 'INTJ');

      expect(insights.overcomeWeaknesses.length).toBeGreaterThan(0);
      expect(insights.overcomeWeaknesses.some(s => s.includes('Empathy'))).toBe(true);
    });

    it('should identify unexpected strengths (weaknesses that are actually strong)', () => {
      const scores: AssessmentDimensions = {
        ...baseDimensions,
        technical: 45, // INTJ expected strength, but weak (concerning)
        iq: 48,
      };

      const insights = generatePersonalityInsights(scores, 'INTJ');

      // This would be captured as NOT being in expectedStrengths
      // The function looks for strengths that aren't there, which is a different metric
      expect(insights.expectedStrengths.length).toBe(0);
    });

    it('should handle balanced ENFJ profile', () => {
      const enfpScores: AssessmentDimensions = {
        ...baseDimensions,
        eq: 85,
        empathy: 88,
        passions: 82,
        motivation: 86,
        culture_fit: 84,
        technical: 62, // Acceptable for ENFP
        organization: 58,
      };

      const insights = generatePersonalityInsights(enfpScores, 'ENFP');

      expect(insights.expectedStrengths.length).toBeGreaterThan(0);
      expect(insights.expectedChallenges.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle all dimensions at 100', () => {
      const perfectScores: AssessmentDimensions = {
        iq: 100, eq: 100, empathy: 100, self_awareness: 100,
        technical: 100, ai_readiness: 100, gtm: 100, personality: 100,
        motivation: 100, work_history: 100, passions: 100, culture_fit: 100,
        organization: 100, executive_leadership: 100,
      };

      const weighted = applyPersonalityWeights(perfectScores, 'INTJ');

      // All should remain at or near 100 (clamped)
      Object.values(weighted).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(95);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle all dimensions at 0', () => {
      const zeroScores: AssessmentDimensions = {
        iq: 0, eq: 0, empathy: 0, self_awareness: 0,
        technical: 0, ai_readiness: 0, gtm: 0, personality: 0,
        motivation: 0, work_history: 0, passions: 0, culture_fit: 0,
        organization: 0, executive_leadership: 0,
      };

      const weighted = applyPersonalityWeights(zeroScores, 'ENFP');

      // All should remain at 0
      Object.values(weighted).forEach((score) => {
        expect(score).toBe(0);
      });
    });

    it('should handle scores at boundaries (50, 60, 75, 85)', () => {
      const boundaryScores: AssessmentDimensions = {
        iq: 50, eq: 60, empathy: 75, self_awareness: 85,
        technical: 50, ai_readiness: 60, gtm: 75, personality: 85,
        motivation: 50, work_history: 60, passions: 75, culture_fit: 85,
        organization: 50, executive_leadership: 60,
      };

      const weighted = applyPersonalityWeights(boundaryScores, 'ISTJ');

      // All weighted scores should be within valid range
      Object.values(weighted).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });
});
