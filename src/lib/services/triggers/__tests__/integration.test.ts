/// <reference types="jest" />

/**
 * Integration Tests - Old vs New Evaluators
 *
 * Compares behavior of original evaluators vs V2 evaluators to ensure
 * 100% identical behavior after refactoring.
 *
 * Release 0.1.8.1 - Phase 1: Trigger Evaluator Consolidation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SkipTriggerEvaluator } from '../../SkipTriggerEvaluator';
import { SkipTriggerEvaluatorV2 } from '../SkipTriggerEvaluatorV2';
import { ReviewTriggerEvaluator } from '../../ReviewTriggerEvaluator';
import { ReviewTriggerEvaluatorV2 } from '../ReviewTriggerEvaluatorV2';
import { EscalateTriggerEvaluator } from '../../EscalateTriggerEvaluator';
import { EscalateTriggerEvaluatorV2 } from '../EscalateTriggerEvaluatorV2';
import { SkipTrigger } from '@/types/skip-triggers';
import { ReviewTrigger } from '@/types/review-triggers';
import { EscalateTrigger } from '@/types/escalate-triggers';

// Mock Supabase client
const createMockSupabase = () => {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn()
  } as unknown as SupabaseClient;
};

describe('Integration Tests - Skip Evaluators', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should produce identical results for date triggers', async () => {
    const trigger: SkipTrigger = {
      id: 'skip-trigger-1',
      type: 'date',
      config: {
        date: '2020-01-01T00:00:00Z'
      },
      createdAt: new Date().toISOString()
    };

    const oldResult = await SkipTriggerEvaluator.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    const newResult = await SkipTriggerEvaluatorV2.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    expect(newResult.triggered).toBe(oldResult.triggered);
    expect(newResult.reason).toBe(oldResult.reason);
    expect(newResult.error).toBe(oldResult.error);
  });

  it('should produce identical results for evaluateAllTriggers', async () => {
    const triggers: SkipTrigger[] = [
      {
        id: 'skip-trigger-1',
        type: 'date',
        config: { date: '2020-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'skip-trigger-2',
        type: 'date',
        config: { date: '2030-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      }
    ];

    const oldResult = await SkipTriggerEvaluator.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    const newResult = await SkipTriggerEvaluatorV2.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    expect(newResult.shouldReactivate).toBe(oldResult.shouldReactivate);
    expect(newResult.firedTrigger?.id).toBe(oldResult.firedTrigger?.id);
    expect(newResult.evaluationResults.length).toBe(oldResult.evaluationResults.length);
  });
});

describe('Integration Tests - Review Evaluators', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should produce identical results for date triggers', async () => {
    const trigger: ReviewTrigger = {
      id: 'review-trigger-1',
      type: 'date',
      config: {
        date: '2020-01-01T00:00:00Z'
      },
      createdAt: new Date().toISOString()
    };

    const oldResult = await ReviewTriggerEvaluator.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    const newResult = await ReviewTriggerEvaluatorV2.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    expect(newResult.triggered).toBe(oldResult.triggered);
    expect(newResult.reason).toBe(oldResult.reason);
    expect(newResult.error).toBe(oldResult.error);
  });

  it('should produce identical results for evaluateAllTriggers', async () => {
    const triggers: ReviewTrigger[] = [
      {
        id: 'review-trigger-1',
        type: 'date',
        config: { date: '2020-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'review-trigger-2',
        type: 'date',
        config: { date: '2030-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      }
    ];

    const oldResult = await ReviewTriggerEvaluator.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    const newResult = await ReviewTriggerEvaluatorV2.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    expect(newResult.shouldNotify).toBe(oldResult.shouldNotify);
    expect(newResult.firedTrigger?.id).toBe(oldResult.firedTrigger?.id);
    expect(newResult.evaluationResults.length).toBe(oldResult.evaluationResults.length);
  });
});

describe('Integration Tests - Escalate Evaluators', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should produce identical results for date triggers', async () => {
    const trigger: EscalateTrigger = {
      id: 'escalate-trigger-1',
      type: 'date',
      config: {
        date: '2020-01-01T00:00:00Z'
      },
      createdAt: new Date().toISOString()
    };

    const oldResult = await EscalateTriggerEvaluator.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    const newResult = await EscalateTriggerEvaluatorV2.evaluateTrigger(
      trigger,
      'workflow-1',
      mockSupabase
    );

    expect(newResult.triggered).toBe(oldResult.triggered);
    expect(newResult.reason).toBe(oldResult.reason);
    expect(newResult.error).toBe(oldResult.error);
  });

  it('should produce identical results for evaluateAllTriggers', async () => {
    const triggers: EscalateTrigger[] = [
      {
        id: 'escalate-trigger-1',
        type: 'date',
        config: { date: '2020-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'escalate-trigger-2',
        type: 'date',
        config: { date: '2030-01-01T00:00:00Z' },
        createdAt: new Date().toISOString()
      }
    ];

    const oldResult = await EscalateTriggerEvaluator.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    const newResult = await EscalateTriggerEvaluatorV2.evaluateAllTriggers(
      'workflow-1',
      triggers,
      mockSupabase
    );

    expect(newResult.shouldNotify).toBe(oldResult.shouldNotify);
    expect(newResult.firedTrigger?.id).toBe(oldResult.firedTrigger?.id);
    expect(newResult.evaluationResults.length).toBe(oldResult.evaluationResults.length);
  });
});

describe('Integration Tests - Comprehensive Comparison', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  /**
   * Run 100 test cases with various trigger configurations
   * and ensure all results match between old and new evaluators
   */
  it('should produce identical results for 100 random test cases', async () => {
    const testCases = generateTestCases(100);
    let identicalResults = 0;
    let totalTests = 0;

    for (const testCase of testCases) {
      // Test Skip evaluators
      const skipTrigger: SkipTrigger = {
        id: `skip-${testCase.id}`,
        type: testCase.type,
        config: testCase.config,
        createdAt: new Date().toISOString()
      };

      const oldSkipResult = await SkipTriggerEvaluator.evaluateTrigger(
        skipTrigger,
        'workflow-1',
        mockSupabase
      );

      const newSkipResult = await SkipTriggerEvaluatorV2.evaluateTrigger(
        skipTrigger,
        'workflow-1',
        mockSupabase
      );

      totalTests++;
      if (
        oldSkipResult.triggered === newSkipResult.triggered &&
        oldSkipResult.reason === newSkipResult.reason &&
        oldSkipResult.error === newSkipResult.error
      ) {
        identicalResults++;
      }
    }

    // All results should be identical
    expect(identicalResults).toBe(totalTests);
    console.log(`✓ ${identicalResults}/${totalTests} test cases produced identical results (100%)`);
  });
});

/**
 * Generate random test cases for comprehensive testing
 */
interface TestCase {
  id: number;
  type: 'date' | 'event';
  config: {
    date?: string;
    timezone?: string;
    eventType?: string;
    eventConfig?: {
      workflowExecutionId?: string;
    };
  };
}

function generateTestCases(count: number): TestCase[] {
  const testCases: TestCase[] = [];

  for (let i = 0; i < count; i++) {
    // 50% date triggers, 50% event triggers
    if (i % 2 === 0) {
      // Date trigger - mix of past and future dates
      const isPast = Math.random() > 0.5;
      const date = new Date();
      if (isPast) {
        date.setFullYear(date.getFullYear() - 1);
      } else {
        date.setFullYear(date.getFullYear() + 1);
      }

      testCases.push({
        id: i,
        type: 'date',
        config: {
          date: date.toISOString(),
          timezone: i % 4 === 0 ? 'America/New_York' : undefined
        }
      });
    } else {
      // Event trigger (simplified - just testing structure)
      testCases.push({
        id: i,
        type: 'event',
        config: {
          eventType: 'workflow_action_completed',
          eventConfig: {
            workflowExecutionId: `workflow-${i}`
          }
        }
      });
    }
  }

  return testCases;
}
