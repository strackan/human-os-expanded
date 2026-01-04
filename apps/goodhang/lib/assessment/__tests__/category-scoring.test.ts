// Unit tests for category scoring utilities

import {
  calculateCategoryScores,
  calculateOverallScore,
  getStrongestCategory,
  getWeakestCategory,
  isWellRounded,
  generateCategoryInsights,
} from '../category-scoring';
import { AssessmentDimensions } from '../types';

describe('Category Scoring Utilities', () => {
  // Sample dimension scores for testing
  const sampleDimensions: AssessmentDimensions = {
    // Technical category (avg should be 80)
    technical: 85,
    ai_readiness: 90,
    organization: 75,
    iq: 70,
    // Emotional category (avg should be 70)
    eq: 75,
    empathy: 80,
    self_awareness: 65,
    executive_leadership: 60,
    gtm: 70,
    // Creative category (avg should be 85)
    passions: 90,
    culture_fit: 85,
    personality: 80,
    motivation: 85,
    work_history: 75, // Not used in categories
  };

  describe('calculateCategoryScores', () => {
    it('should calculate technical category correctly', () => {
      const result = calculateCategoryScores(sampleDimensions);

      // (85 + 90 + 75 + 70) / 4 = 80
      expect(result.technical.overall).toBe(80);
      expect(result.technical.subscores.technical).toBe(85);
      expect(result.technical.subscores.ai_readiness).toBe(90);
      expect(result.technical.subscores.organization).toBe(75);
      expect(result.technical.subscores.iq).toBe(70);
    });

    it('should calculate emotional category correctly', () => {
      const result = calculateCategoryScores(sampleDimensions);

      // (75 + 80 + 65 + 60 + 70) / 5 = 70
      expect(result.emotional.overall).toBe(70);
      expect(result.emotional.subscores.eq).toBe(75);
      expect(result.emotional.subscores.empathy).toBe(80);
      expect(result.emotional.subscores.self_awareness).toBe(65);
      expect(result.emotional.subscores.executive_leadership).toBe(60);
      expect(result.emotional.subscores.gtm).toBe(70);
    });

    it('should calculate creative category correctly', () => {
      const result = calculateCategoryScores(sampleDimensions);

      // (90 + 85 + 80 + 85) / 4 = 85
      expect(result.creative.overall).toBe(85);
      expect(result.creative.subscores.passions).toBe(90);
      expect(result.creative.subscores.culture_fit).toBe(85);
      expect(result.creative.subscores.personality).toBe(80);
      expect(result.creative.subscores.motivation).toBe(85);
    });

    it('should round scores correctly', () => {
      const oddDimensions: AssessmentDimensions = {
        ...sampleDimensions,
        technical: 83,
        ai_readiness: 84,
        organization: 85,
        iq: 86,
      };

      const result = calculateCategoryScores(oddDimensions);
      // (83 + 84 + 85 + 86) / 4 = 84.5 -> 85 (rounded)
      expect(result.technical.overall).toBe(85);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate overall score as average of categories', () => {
      const categoryScores = calculateCategoryScores(sampleDimensions);
      const overall = calculateOverallScore(categoryScores);

      // (80 + 70 + 85) / 3 = 78.33 -> 78
      expect(overall).toBe(78);
    });

    it('should handle equal category scores', () => {
      const equalDimensions: AssessmentDimensions = {
        technical: 80, ai_readiness: 80, organization: 80, iq: 80,
        eq: 80, empathy: 80, self_awareness: 80, executive_leadership: 80, gtm: 80,
        passions: 80, culture_fit: 80, personality: 80, motivation: 80,
        work_history: 80,
      };

      const categoryScores = calculateCategoryScores(equalDimensions);
      const overall = calculateOverallScore(categoryScores);

      expect(overall).toBe(80);
    });
  });

  describe('getStrongestCategory', () => {
    it('should identify creative as strongest category', () => {
      const categoryScores = calculateCategoryScores(sampleDimensions);
      const strongest = getStrongestCategory(categoryScores);

      expect(strongest).toBe('creative'); // 85 is highest
    });

    it('should return first category when tied', () => {
      const tiedDimensions: AssessmentDimensions = {
        technical: 80, ai_readiness: 80, organization: 80, iq: 80,
        eq: 80, empathy: 80, self_awareness: 80, executive_leadership: 80, gtm: 80,
        passions: 80, culture_fit: 80, personality: 80, motivation: 80,
        work_history: 80,
      };

      const categoryScores = calculateCategoryScores(tiedDimensions);
      const strongest = getStrongestCategory(categoryScores);

      expect(strongest).toBe('technical'); // First in object order
    });
  });

  describe('getWeakestCategory', () => {
    it('should identify emotional as weakest category', () => {
      const categoryScores = calculateCategoryScores(sampleDimensions);
      const weakest = getWeakestCategory(categoryScores);

      expect(weakest).toBe('emotional'); // 70 is lowest
    });
  });

  describe('isWellRounded', () => {
    it('should return true when categories are within 15 points', () => {
      const balancedDimensions: AssessmentDimensions = {
        technical: 75, ai_readiness: 75, organization: 75, iq: 75,
        eq: 70, empathy: 70, self_awareness: 70, executive_leadership: 70, gtm: 70,
        passions: 80, culture_fit: 80, personality: 80, motivation: 80,
        work_history: 75,
      };

      const categoryScores = calculateCategoryScores(balancedDimensions);
      expect(isWellRounded(categoryScores)).toBe(true);
    });

    it('should return false when categories differ by more than 15 points', () => {
      const imbalancedDimensions: AssessmentDimensions = {
        technical: 95, ai_readiness: 95, organization: 95, iq: 95,
        eq: 50, empathy: 50, self_awareness: 50, executive_leadership: 50, gtm: 50,
        passions: 75, culture_fit: 75, personality: 75, motivation: 75,
        work_history: 75,
      };

      const categoryScores = calculateCategoryScores(imbalancedDimensions);
      expect(isWellRounded(categoryScores)).toBe(false);
    });

    it('should handle edge case of exactly 15 point difference', () => {
      const edgeDimensions: AssessmentDimensions = {
        technical: 85, ai_readiness: 85, organization: 85, iq: 85,
        eq: 70, empathy: 70, self_awareness: 70, executive_leadership: 70, gtm: 70,
        passions: 77.5, culture_fit: 77.5, personality: 77.5, motivation: 77.5,
        work_history: 75,
      };

      const categoryScores = calculateCategoryScores(edgeDimensions);
      // Max: 85, Min: 70, Diff: 15 (should be true)
      expect(isWellRounded(categoryScores)).toBe(true);
    });
  });

  describe('generateCategoryInsights', () => {
    it('should generate comprehensive insights', () => {
      const categoryScores = calculateCategoryScores(sampleDimensions);
      const insights = generateCategoryInsights(categoryScores);

      expect(insights.strongest).toBe('Creative');
      expect(insights.weakest).toBe('Emotional');
      expect(insights.isBalanced).toBe(true); // 85-70 = 15 points
      expect(Array.isArray(insights.gaps)).toBe(true);
    });

    it('should identify gaps below 50', () => {
      const lowScoreDimensions: AssessmentDimensions = {
        technical: 45, ai_readiness: 48, organization: 52, iq: 49,
        eq: 70, empathy: 75, self_awareness: 70, executive_leadership: 65, gtm: 70,
        passions: 80, culture_fit: 85, personality: 75, motivation: 80,
        work_history: 60,
      };

      const categoryScores = calculateCategoryScores(lowScoreDimensions);
      const insights = generateCategoryInsights(categoryScores);

      expect(insights.gaps.length).toBeGreaterThan(0);
      expect(insights.gaps.some(gap => gap.includes('Technical skills'))).toBe(true);
      expect(insights.gaps.some(gap => gap.includes('AI readiness'))).toBe(true);
    });

    it('should return empty gaps when all scores are high', () => {
      const highScoreDimensions: AssessmentDimensions = {
        technical: 85, ai_readiness: 90, organization: 88, iq: 82,
        eq: 85, empathy: 88, self_awareness: 80, executive_leadership: 78, gtm: 84,
        passions: 90, culture_fit: 92, personality: 85, motivation: 88,
        work_history: 85,
      };

      const categoryScores = calculateCategoryScores(highScoreDimensions);
      const insights = generateCategoryInsights(categoryScores);

      expect(insights.gaps.length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle all zero scores', () => {
      const zeroDimensions: AssessmentDimensions = {
        technical: 0, ai_readiness: 0, organization: 0, iq: 0,
        eq: 0, empathy: 0, self_awareness: 0, executive_leadership: 0, gtm: 0,
        passions: 0, culture_fit: 0, personality: 0, motivation: 0,
        work_history: 0,
      };

      const categoryScores = calculateCategoryScores(zeroDimensions);
      expect(categoryScores.technical.overall).toBe(0);
      expect(categoryScores.emotional.overall).toBe(0);
      expect(categoryScores.creative.overall).toBe(0);

      const overall = calculateOverallScore(categoryScores);
      expect(overall).toBe(0);
    });

    it('should handle all perfect scores', () => {
      const perfectDimensions: AssessmentDimensions = {
        technical: 100, ai_readiness: 100, organization: 100, iq: 100,
        eq: 100, empathy: 100, self_awareness: 100, executive_leadership: 100, gtm: 100,
        passions: 100, culture_fit: 100, personality: 100, motivation: 100,
        work_history: 100,
      };

      const categoryScores = calculateCategoryScores(perfectDimensions);
      expect(categoryScores.technical.overall).toBe(100);
      expect(categoryScores.emotional.overall).toBe(100);
      expect(categoryScores.creative.overall).toBe(100);

      const overall = calculateOverallScore(categoryScores);
      expect(overall).toBe(100);

      expect(isWellRounded(categoryScores)).toBe(true);
    });
  });
});
