// Unit tests for Badge Evaluator Service

import { BadgeEvaluatorService } from '../BadgeEvaluatorService';
import { AssessmentDimensions, CategoryScores } from '../../assessment/types';

describe('BadgeEvaluatorService', () => {
  const sampleDimensions: AssessmentDimensions = {
    iq: 75,
    eq: 80,
    empathy: 85,
    self_awareness: 82,
    technical: 88,
    ai_readiness: 92,
    gtm: 78,
    personality: 80,
    motivation: 85,
    work_history: 70,
    passions: 88,
    culture_fit: 90,
    organization: 82,
    executive_leadership: 75,
  };

  const sampleCategoryScores: CategoryScores = {
    technical: {
      overall: 84,
      subscores: {
        technical: 88,
        ai_readiness: 92,
        organization: 82,
        iq: 75,
      },
    },
    emotional: {
      overall: 80,
      subscores: {
        eq: 80,
        empathy: 85,
        self_awareness: 82,
        executive_leadership: 75,
        gtm: 78,
      },
    },
    creative: {
      overall: 86,
      subscores: {
        passions: 88,
        culture_fit: 90,
        personality: 80,
        motivation: 85,
      },
    },
  };

  describe('evaluateBadges', () => {
    it('should award AI Prodigy badge for 90+ AI Readiness', () => {
      const context = {
        dimensions: sampleDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 83,
        experience_years: 5,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('ai_prodigy');
    });

    it('should NOT award AI Prodigy badge for <90 AI Readiness', () => {
      const lowAiDimensions: AssessmentDimensions = {
        ...sampleDimensions,
        ai_readiness: 85,
      };

      const context = {
        dimensions: lowAiDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 83,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).not.toContain('ai_prodigy');
    });

    it('should award Technical Maestro badge for 90+ technical category', () => {
      const highTechCategories: CategoryScores = {
        ...sampleCategoryScores,
        technical: {
          overall: 92,
          subscores: {
            technical: 95,
            ai_readiness: 95,
            organization: 90,
            iq: 88,
          },
        },
      };

      const context = {
        dimensions: sampleDimensions,
        category_scores: highTechCategories,
        overall_score: 90,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('technical_maestro');
    });

    it('should award Triple Threat badge for 85+ in all categories', () => {
      const balancedCategories: CategoryScores = {
        technical: { overall: 88, subscores: { technical: 88, ai_readiness: 90, organization: 86, iq: 88 } },
        emotional: { overall: 87, subscores: { eq: 87, empathy: 88, self_awareness: 85, executive_leadership: 85, gtm: 90 } },
        creative: { overall: 86, subscores: { passions: 88, culture_fit: 90, personality: 82, motivation: 85 } },
      };

      const context = {
        dimensions: sampleDimensions,
        category_scores: balancedCategories,
        overall_score: 87,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('triple_threat');
    });

    it('should award Rising Star badge for 80+ overall with <3 years experience', () => {
      const context = {
        dimensions: sampleDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 85,
        experience_years: 2,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('rising_star');
    });

    it('should NOT award Rising Star badge if experience >= 3 years', () => {
      const context = {
        dimensions: sampleDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 85,
        experience_years: 5,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).not.toContain('rising_star');
    });

    it('should award Veteran Pro badge for 85+ overall with 10+ years experience', () => {
      const context = {
        dimensions: sampleDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 88,
        experience_years: 12,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('veteran_pro');
    });

    it('should award Strategic Mind badge for 90+ GTM and Executive Leadership', () => {
      const strategicDimensions: AssessmentDimensions = {
        ...sampleDimensions,
        gtm: 92,
        executive_leadership: 91,
      };

      const context = {
        dimensions: strategicDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 85,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('strategic_mind');
    });

    it('should award Technical Empath badge for 85+ Technical and Empathy', () => {
      const techEmpathDimensions: AssessmentDimensions = {
        ...sampleDimensions,
        technical: 88,
        empathy: 87,
      };

      const context = {
        dimensions: techEmpathDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 85,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('technical_empath');
    });

    it('should award Cultural Fit Star badge for 95+ Culture Fit', () => {
      const highCultureDimensions: AssessmentDimensions = {
        ...sampleDimensions,
        culture_fit: 96,
      };

      const context = {
        dimensions: highCultureDimensions,
        category_scores: sampleCategoryScores,
        overall_score: 85,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toContain('cultural_fit_star');
    });

    it('should award multiple badges when criteria met', () => {
      const excellentDimensions: AssessmentDimensions = {
        iq: 85,
        eq: 88,
        empathy: 90,
        self_awareness: 92,
        technical: 92,
        ai_readiness: 95,
        gtm: 85,
        personality: 88,
        motivation: 96,
        work_history: 85,
        passions: 90,
        culture_fit: 96,
        organization: 91,
        executive_leadership: 88,
      };

      const excellentCategories: CategoryScores = {
        technical: { overall: 91, subscores: { technical: 92, ai_readiness: 95, organization: 91, iq: 85 } },
        emotional: { overall: 89, subscores: { eq: 88, empathy: 90, self_awareness: 92, executive_leadership: 88, gtm: 85 } },
        creative: { overall: 93, subscores: { passions: 90, culture_fit: 96, personality: 88, motivation: 96 } },
      };

      const context = {
        dimensions: excellentDimensions,
        category_scores: excellentCategories,
        overall_score: 91,
        experience_years: 7,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges.length).toBeGreaterThan(1);
      expect(badges).toContain('ai_prodigy');
      expect(badges).toContain('cultural_fit_star');
      expect(badges).toContain('motivation_master');
      expect(badges).toContain('organized_mind');
    });

    it('should return empty array when no badges earned', () => {
      const lowDimensions: AssessmentDimensions = {
        iq: 50,
        eq: 55,
        empathy: 52,
        self_awareness: 48,
        technical: 50,
        ai_readiness: 45,
        gtm: 50,
        personality: 52,
        motivation: 48,
        work_history: 50,
        passions: 45,
        culture_fit: 50,
        organization: 48,
        executive_leadership: 45,
      };

      const lowCategories: CategoryScores = {
        technical: { overall: 48, subscores: { technical: 50, ai_readiness: 45, organization: 48, iq: 50 } },
        emotional: { overall: 50, subscores: { eq: 55, empathy: 52, self_awareness: 48, executive_leadership: 45, gtm: 50 } },
        creative: { overall: 49, subscores: { passions: 45, culture_fit: 50, personality: 52, motivation: 48 } },
      };

      const context = {
        dimensions: lowDimensions,
        category_scores: lowCategories,
        overall_score: 49,
        experience_years: 3,
      };

      const badges = BadgeEvaluatorService.evaluateBadges(context);

      expect(badges).toEqual([]);
    });
  });

  describe('extractExperienceYears', () => {
    it('should extract years from "X years" format', () => {
      const answers = {
        'prof-1': { answer: 'I have 5 years of experience in CS.' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBe(5);
    });

    it('should extract years from "X+ years" format', () => {
      const answers = {
        'prof-1': { answer: '10+ years in customer success' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBe(10);
    });

    it('should extract upper bound from range "X-Y years"', () => {
      const answers = {
        'prof-1': { answer: 'Between 3-5 years of experience' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBe(5); // Takes upper bound
    });

    it('should extract from "years: X" format', () => {
      const answers = {
        'prof-1': { answer: 'Years of experience: 7' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBe(7);
    });

    it('should return undefined when no pattern matches', () => {
      const answers = {
        'prof-1': { answer: 'I have some experience in customer success' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBeUndefined();
    });

    it('should return undefined when prof-1 answer missing', () => {
      const answers = {
        'prof-2': { answer: 'Something else' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBeUndefined();
    });

    it('should handle case insensitivity', () => {
      const answers = {
        'prof-1': { answer: 'I HAVE 8 YEARS OF EXPERIENCE' },
      };

      const years = BadgeEvaluatorService.extractExperienceYears(answers);
      expect(years).toBe(8);
    });
  });

  describe('getBadgeDetails', () => {
    it('should return badge definitions for given IDs', () => {
      const badgeIds = ['ai_prodigy', 'technical_maestro'];
      const details = BadgeEvaluatorService.getBadgeDetails(badgeIds);

      expect(details.length).toBe(2);
      expect(details[0]?.id).toBe("ai_prodigy");
      expect(details[1]?.id).toBe("technical_maestro");
    });

    it('should return empty array for invalid IDs', () => {
      const badgeIds = ['nonexistent_badge'];
      const details = BadgeEvaluatorService.getBadgeDetails(badgeIds);

      expect(details).toEqual([]);
    });

    it('should filter out invalid IDs and return valid ones', () => {
      const badgeIds = ['ai_prodigy', 'invalid_badge', 'rising_star'];
      const details = BadgeEvaluatorService.getBadgeDetails(badgeIds);

      expect(details.length).toBe(2);
      expect(details.map(b => b.id)).toContain('ai_prodigy');
      expect(details.map(b => b.id)).toContain('rising_star');
    });
  });

  describe('formatBadgesForResponse', () => {
    it('should format badges with all required fields', () => {
      const badgeIds = ['ai_prodigy'];
      const formatted = BadgeEvaluatorService.formatBadgesForResponse(badgeIds);

      expect(formatted.length).toBe(1);
      expect(formatted[0]).toHaveProperty('id');
      expect(formatted[0]).toHaveProperty('name');
      expect(formatted[0]).toHaveProperty('description');
      expect(formatted[0]).toHaveProperty('icon');
      expect(formatted[0]).toHaveProperty('earned_at');
    });

    it('should use custom earned_at timestamp if provided', () => {
      const badgeIds = ['ai_prodigy'];
      const customTimestamp = '2024-01-15T10:00:00Z';
      const formatted = BadgeEvaluatorService.formatBadgesForResponse(badgeIds, customTimestamp);

      expect(formatted[0]?.earned_at).toBe(customTimestamp);
    });

    it('should format multiple badges', () => {
      const badgeIds = ['ai_prodigy', 'technical_maestro', 'people_champion'];
      const formatted = BadgeEvaluatorService.formatBadgesForResponse(badgeIds);

      expect(formatted.length).toBe(3);
      formatted.forEach(badge => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
      });
    });

    it('should return empty array for no badges', () => {
      const formatted = BadgeEvaluatorService.formatBadgesForResponse([]);

      expect(formatted).toEqual([]);
    });
  });
});
