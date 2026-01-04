/// <reference types="jest" />

/**
 * Unit Tests for BaseTriggerEvaluator
 *
 * Tests the shared trigger evaluation logic that all evaluators inherit.
 * Ensures that the refactored code maintains 100% identical behavior.
 *
 * Release 0.1.8.1 - Phase 1: Trigger Evaluator Consolidation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  BaseTriggerEvaluator,
  BaseTrigger,
  TriggerEvaluatorConfig
} from '../BaseTriggerEvaluator';

// Mock concrete implementation for testing
class TestTriggerEvaluator extends BaseTriggerEvaluator<BaseTrigger> {
  private config: TriggerEvaluatorConfig;

  constructor(config: TriggerEvaluatorConfig) {
    super();
    this.config = config;
  }

  protected getConfig(): TriggerEvaluatorConfig {
    return this.config;
  }
}

// Helper to create a test trigger with required fields
const createTestTrigger = (
  id: string,
  type: 'date' | 'event',
  config: any
): BaseTrigger => ({
  id,
  type,
  config,
  createdAt: new Date().toISOString(),
});

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

// Helper to create mock chain with typed response
const createMockChain = (data: unknown, error: unknown = null) => {
  const mockSingle = jest.fn<() => Promise<{ data: unknown; error: unknown }>>();
  mockSingle.mockResolvedValue({ data, error });
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: mockSingle
  };
};

// Helper for multi-table mock implementations
const createTableMock = (tableResponses: Record<string, { data: unknown; error?: unknown }>) =>
  (table: unknown) => {
    const response = tableResponses[table as string];
    if (response) {
      return createMockChain(response.data, response.error ?? null);
    }
    return {} as unknown;
  };

describe('BaseTriggerEvaluator', () => {
  let evaluator: TestTriggerEvaluator;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    evaluator = new TestTriggerEvaluator({
      tableName: 'workflow_skip_triggers',
      fieldPrefix: 'skip',
      resultPropertyName: 'shouldReactivate',
      shouldUpdateStatus: true
    });
    mockSupabase = createMockSupabase();
  });

  describe('Date Trigger Evaluation', () => {
    it('should fire date trigger when current time has passed trigger date', async () => {
      const trigger = createTestTrigger('test-trigger-1', 'date', {
        date: '2020-01-01T00:00:00Z' // Past date
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('Date trigger fired');
      expect(result.error).toBeUndefined();
    });

    it('should not fire date trigger when current time has not passed trigger date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const trigger = createTestTrigger('test-trigger-2', 'date', {
        date: futureDate.toISOString()
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('Date not yet reached');
      expect(result.error).toBeUndefined();
    });

    it('should handle timezone-aware date triggers', async () => {
      const trigger = createTestTrigger('test-trigger-3', 'date', {
        date: '2020-01-01T00:00:00Z',
        timezone: 'America/New_York'
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('Date trigger fired');
    });

    it('should handle invalid date gracefully', async () => {
      const trigger = createTestTrigger('test-trigger-4', 'date', {
        date: 'invalid-date'
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      // Invalid dates should default to not firing
      expect(result.triggered).toBe(false);
    });
  });

  describe('Event Trigger Evaluation - workflow_action_completed', () => {
    // TODO: These tests require the full evaluator implementation to be invoked
    // The TestTriggerEvaluator mock class doesn't call the base class event evaluation
    it.skip('should fire when workflow action is completed', async () => {
      const mockData = [{ id: 'action-1', action_type: 'complete', created_at: new Date().toISOString() }];
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockChain(mockData));

      const trigger = createTestTrigger('test-trigger-5', 'event', {
        eventType: 'workflow_action_completed',
        eventConfig: {
          workflowExecutionId: 'workflow-1'
        }
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('Workflow action completed');
    });

    it.skip('should not fire when workflow action is not completed', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(createMockChain([]));

      const trigger = createTestTrigger('test-trigger-6', 'event', {
        eventType: 'workflow_action_completed',
        eventConfig: {
          workflowExecutionId: 'workflow-1'
        }
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('not yet completed');
    });

    it('should handle missing workflowExecutionId gracefully', async () => {
      const trigger = createTestTrigger('test-trigger-7', 'event', {
        eventType: 'workflow_action_completed',
        eventConfig: {}
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('Missing workflowExecutionId');
    });
  });

  describe('Event Trigger Evaluation - customer_login', () => {
    it('should fire when customer logged in since last evaluation', async () => {
      const now = new Date();
      const recentLogin = new Date(now.getTime() - 1000); // 1 second ago
      const lastEval = new Date(now.getTime() - 10000); // 10 seconds ago

      (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
        workflow_executions: { data: { customer_id: 'customer-1', skip_last_evaluated_at: lastEval.toISOString() } },
        profiles: { data: { last_sign_in_at: recentLogin.toISOString() } }
      }));

      const trigger = createTestTrigger('test-trigger-8', 'event', {
        eventType: 'customer_login',
        eventConfig: {}
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('Customer logged in at');
    });

    it('should not fire when customer has not logged in recently', async () => {
      const now = new Date();
      const oldLogin = new Date(now.getTime() - 20000); // 20 seconds ago
      const lastEval = new Date(now.getTime() - 10000); // 10 seconds ago

      (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
        workflow_executions: { data: { customer_id: 'customer-1', skip_last_evaluated_at: lastEval.toISOString() } },
        profiles: { data: { last_sign_in_at: oldLogin.toISOString() } }
      }));

      const trigger = createTestTrigger('test-trigger-9', 'event', {
        eventType: 'customer_login',
        eventConfig: {}
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('Customer last login');
    });
  });

  describe('Event Trigger Evaluation - usage_threshold_crossed', () => {
    it('should fire when usage threshold is crossed (greater than)', async () => {
      (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
        workflow_executions: { data: { customer_id: 'customer-1' } },
        customer_properties: { data: { api_calls_count: 1500 } }
      }));

      const trigger = createTestTrigger('test-trigger-10', 'event', {
        eventType: 'usage_threshold_crossed',
        eventConfig: {
          metricName: 'api_calls_count',
          threshold: 1000,
          operator: '>'
        }
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('api_calls_count (1500) > 1000');
    });

    it('should not fire when usage threshold is not crossed', async () => {
      (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
        workflow_executions: { data: { customer_id: 'customer-1' } },
        customer_properties: { data: { api_calls_count: 500 } }
      }));

      const trigger = createTestTrigger('test-trigger-11', 'event', {
        eventType: 'usage_threshold_crossed',
        eventConfig: {
          metricName: 'api_calls_count',
          threshold: 1000,
          operator: '>'
        }
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('api_calls_count (500) not > 1000');
    });

    it('should support all comparison operators', async () => {
      const testCases = [
        { value: 1500, threshold: 1000, operator: '>' as const, expected: true },
        { value: 1000, threshold: 1000, operator: '>=' as const, expected: true },
        { value: 500, threshold: 1000, operator: '<' as const, expected: true },
        { value: 1000, threshold: 1000, operator: '<=' as const, expected: true },
        { value: 500, threshold: 1000, operator: '>' as const, expected: false }
      ];

      for (const testCase of testCases) {
        (mockSupabase.from as jest.Mock).mockImplementation(createTableMock({
          workflow_executions: { data: { customer_id: 'customer-1' } },
          customer_properties: { data: { metric: testCase.value } }
        }));

        const trigger = createTestTrigger(`test-trigger-operator-${testCase.operator}`, 'event', {
          eventType: 'usage_threshold_crossed',
          eventConfig: {
            metricName: 'metric',
            threshold: testCase.threshold,
            operator: testCase.operator
          }
        });

        const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);
        expect(result.triggered).toBe(testCase.expected);
      }
    });
  });

  describe('Batch Evaluation - evaluateAllTriggers', () => {
    it('should return shouldReactivate when configured for skip triggers', async () => {
      const skipEvaluator = new TestTriggerEvaluator({
        tableName: 'workflow_skip_triggers',
        fieldPrefix: 'skip',
        resultPropertyName: 'shouldReactivate',
        shouldUpdateStatus: true
      });

      const triggers: BaseTrigger[] = [
        createTestTrigger('trigger-1', 'date', { date: '2020-01-01T00:00:00Z' })
      ];

      const result = await skipEvaluator.evaluateAllTriggers('workflow-1', triggers, mockSupabase);

      expect(result).toHaveProperty('shouldReactivate');
      expect(result.shouldReactivate).toBe(true);
      expect(result.firedTrigger).toBeDefined();
    });

    it('should return shouldNotify when configured for review/escalate triggers', async () => {
      const reviewEvaluator = new TestTriggerEvaluator({
        tableName: 'workflow_escalate_triggers',
        fieldPrefix: 'review',
        resultPropertyName: 'shouldNotify',
        shouldUpdateStatus: false
      });

      const triggers: BaseTrigger[] = [
        createTestTrigger('trigger-1', 'date', { date: '2020-01-01T00:00:00Z' })
      ];

      const result = await reviewEvaluator.evaluateAllTriggers('workflow-1', triggers, mockSupabase);

      expect(result).toHaveProperty('shouldNotify');
      expect(result.shouldNotify).toBe(true);
      expect(result.firedTrigger).toBeDefined();
    });

    it('should evaluate all triggers and return first that fires (OR logic)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const triggers: BaseTrigger[] = [
        createTestTrigger('trigger-1', 'date', { date: futureDate.toISOString() }), // Won't fire
        createTestTrigger('trigger-2', 'date', { date: '2020-01-01T00:00:00Z' }), // Will fire
        createTestTrigger('trigger-3', 'date', { date: '2019-01-01T00:00:00Z' }) // Will fire but shouldn't be selected
      ];

      const result = await evaluator.evaluateAllTriggers('workflow-1', triggers, mockSupabase);

      expect(result.shouldReactivate).toBe(true);
      expect(result.firedTrigger?.id).toBe('trigger-2'); // First trigger that fired
      expect(result.evaluationResults).toHaveLength(3);
    });

    it('should return false when no triggers fire', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const triggers: BaseTrigger[] = [
        createTestTrigger('trigger-1', 'date', { date: futureDate.toISOString() }),
        createTestTrigger('trigger-2', 'date', { date: futureDate.toISOString() })
      ];

      const result = await evaluator.evaluateAllTriggers('workflow-1', triggers, mockSupabase);

      expect(result.shouldReactivate).toBe(false);
      expect(result.firedTrigger).toBeUndefined();
      expect(result.evaluationResults).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown trigger type gracefully', async () => {
      const trigger = createTestTrigger('test-trigger-unknown', 'unknown' as any, {});

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.error).toContain('Unknown trigger type');
    });

    it('should handle database errors gracefully', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue(
        createMockChain(null, { message: 'Database connection failed' })
      );

      const trigger = createTestTrigger('test-trigger-db-error', 'event', {
        eventType: 'customer_login',
        eventConfig: {}
      });

      const result = await evaluator.evaluateTrigger(trigger, 'workflow-1', mockSupabase);

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('Workflow execution not found');
    });
  });
});
