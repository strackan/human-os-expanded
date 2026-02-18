import { describe, it, expect } from '@jest/globals';
import { getTriggerReason } from '../trigger-reasons';

describe('getTriggerReason', () => {
  it('generates renewal reason with days and ARR', () => {
    const reason = getTriggerReason({
      workflowType: 'renewal',
      daysUntilRenewal: 90,
      currentArr: 185000,
    });
    expect(reason).toContain('Renewal in 90 days');
    expect(reason).toContain('$185K ARR');
  });

  it('generates renewal reason with days only', () => {
    const reason = getTriggerReason({
      workflowType: 'renewal',
      daysUntilRenewal: 30,
    });
    expect(reason).toBe('Renewal in 30 days');
  });

  it('generates risk reason with health score', () => {
    const reason = getTriggerReason({
      workflowType: 'risk',
      healthScore: 42,
    });
    expect(reason).toContain('Health score dropped to 42');
  });

  it('generates opportunity reason with ARR', () => {
    const reason = getTriggerReason({
      workflowType: 'opportunity',
      currentArr: 500000,
    });
    expect(reason).toContain('$500K');
    expect(reason).toContain('growth');
  });

  it('generates strategic reason with ARR', () => {
    const reason = getTriggerReason({
      workflowType: 'strategic',
      currentArr: 1200000,
    });
    expect(reason).toContain('$1.2M');
    expect(reason).toContain('growth plan');
  });

  it('returns fallback for unknown type', () => {
    const reason = getTriggerReason({ workflowType: 'unknown' });
    expect(reason).toBe('Workflow requires attention');
  });
});
