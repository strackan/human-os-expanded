/**
 * Bounty point calculation from workflow priority_score.
 * Maps score ranges to bounty point tiers for gamified progression.
 */

export interface BountyTier {
  minScore: number;
  maxScore: number;
  points: number;
  label: string;
}

export const BOUNTY_CONFIG = {
  dailyGoal: 100,
  tiers: [
    { minScore: 120, maxScore: Infinity, points: 25, label: 'High Stakes' },
    { minScore: 80, maxScore: 119, points: 20, label: 'Critical' },
    { minScore: 60, maxScore: 79, points: 15, label: 'Important' },
    { minScore: 40, maxScore: 59, points: 10, label: 'Standard' },
    { minScore: 0, maxScore: 39, points: 5, label: 'Quick Win' },
  ] as BountyTier[],
};

export function calculateBountyPoints(priorityScore: number): { points: number; label: string } {
  const tier = BOUNTY_CONFIG.tiers.find(
    (t) => priorityScore >= t.minScore && priorityScore <= t.maxScore
  );
  return tier
    ? { points: tier.points, label: tier.label }
    : { points: 5, label: 'Quick Win' };
}

export function calculateDailyProgress(earned: number): {
  earned: number;
  goal: number;
  percentage: number;
  isComplete: boolean;
} {
  const goal = BOUNTY_CONFIG.dailyGoal;
  const percentage = Math.min((earned / goal) * 100, 100);
  return {
    earned,
    goal,
    percentage,
    isComplete: earned >= goal,
  };
}
