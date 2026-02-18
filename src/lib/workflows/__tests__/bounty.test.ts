import { describe, it, expect } from '@jest/globals';
import { calculateBountyPoints, calculateDailyProgress, BOUNTY_CONFIG } from '../bounty';

describe('calculateBountyPoints', () => {
  it('returns 25 pts for High Stakes (score >= 120)', () => {
    expect(calculateBountyPoints(120)).toEqual({ points: 25, label: 'High Stakes' });
    expect(calculateBountyPoints(200)).toEqual({ points: 25, label: 'High Stakes' });
  });

  it('returns 20 pts for Critical (score 80-119)', () => {
    expect(calculateBountyPoints(80)).toEqual({ points: 20, label: 'Critical' });
    expect(calculateBountyPoints(119)).toEqual({ points: 20, label: 'Critical' });
  });

  it('returns 15 pts for Important (score 60-79)', () => {
    expect(calculateBountyPoints(60)).toEqual({ points: 15, label: 'Important' });
    expect(calculateBountyPoints(79)).toEqual({ points: 15, label: 'Important' });
  });

  it('returns 10 pts for Standard (score 40-59)', () => {
    expect(calculateBountyPoints(40)).toEqual({ points: 10, label: 'Standard' });
    expect(calculateBountyPoints(59)).toEqual({ points: 10, label: 'Standard' });
  });

  it('returns 5 pts for Quick Win (score 0-39)', () => {
    expect(calculateBountyPoints(0)).toEqual({ points: 5, label: 'Quick Win' });
    expect(calculateBountyPoints(39)).toEqual({ points: 5, label: 'Quick Win' });
  });
});

describe('calculateDailyProgress', () => {
  it('calculates correct percentage', () => {
    const result = calculateDailyProgress(42);
    expect(result.earned).toBe(42);
    expect(result.goal).toBe(BOUNTY_CONFIG.dailyGoal);
    expect(result.percentage).toBe(42);
    expect(result.isComplete).toBe(false);
  });

  it('caps percentage at 100', () => {
    const result = calculateDailyProgress(150);
    expect(result.percentage).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it('handles zero earned', () => {
    const result = calculateDailyProgress(0);
    expect(result.percentage).toBe(0);
    expect(result.isComplete).toBe(false);
  });
});
