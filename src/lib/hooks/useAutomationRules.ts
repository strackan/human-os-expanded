/**
 * useAutomationRules Hook
 *
 * React Query hook for managing automation rules API calls.
 * Provides CRUD operations and real-time updates for automation rules.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type {
  AutomationRule,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation-rules';

// =====================================================
// Types
// =====================================================

interface UseAutomationRulesOptions {
  isActive?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAutomationRulesReturn {
  rules: AutomationRule[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateAutomationRuleReturn {
  createRule: (input: CreateAutomationRuleInput) => Promise<AutomationRule>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateAutomationRuleReturn {
  updateRule: (id: string, input: UpdateAutomationRuleInput) => Promise<AutomationRule>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteAutomationRuleReturn {
  deleteRule: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseToggleAutomationRuleReturn {
  toggleRule: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseTestAutomationRuleReturn {
  testRule: (id: string) => Promise<{
    wouldTrigger: boolean;
    matchedConditions: string[];
    workflowWouldLaunch: string;
  }>;
  loading: boolean;
  error: string | null;
}

// =====================================================
// Main Hook: Fetch Automation Rules
// =====================================================

export function useAutomationRules(
  options: UseAutomationRulesOptions = {}
): UseAutomationRulesReturn {
  const { isActive, autoRefresh = false, refreshInterval = 30000 } = options;
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setRules(data || []);
    } catch (err) {
      console.error('Error fetching automation rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch automation rules');
    } finally {
      setLoading(false);
    }
  }, [isActive, supabase]);

  // Initial fetch with useEffect
  useEffect(() => {
    fetchRules();

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchRules, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchRules, autoRefresh, refreshInterval]);

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
  };
}

// =====================================================
// Create Automation Rule
// =====================================================

export function useCreateAutomationRule(): UseCreateAutomationRuleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRule = useCallback(async (input: CreateAutomationRuleInput): Promise<AutomationRule> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowConfigId: input.workflow_config_id,
          name: input.name,
          description: input.description,
          eventConditions: input.event_conditions,
          logicOperator: input.logic_operator,
          assignToUserId: input.assign_to_user_id,
          isActive: input.is_active ?? true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create automation rule');
      }

      const data = await response.json();
      return data.rule;
    } catch (err) {
      console.error('Error creating automation rule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create automation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createRule,
    loading,
    error,
  };
}

// =====================================================
// Update Automation Rule
// =====================================================

export function useUpdateAutomationRule(): UseUpdateAutomationRuleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRule = useCallback(
    async (id: string, input: UpdateAutomationRuleInput): Promise<AutomationRule> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/automation/rules/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: input.name,
            description: input.description,
            eventConditions: input.event_conditions,
            logicOperator: input.logic_operator,
            assignToUserId: input.assign_to_user_id,
            isActive: input.is_active,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update automation rule');
        }

        const data = await response.json();
        return data.rule;
      } catch (err) {
        console.error('Error updating automation rule:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update automation rule';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateRule,
    loading,
    error,
  };
}

// =====================================================
// Delete Automation Rule
// =====================================================

export function useDeleteAutomationRule(): UseDeleteAutomationRuleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete automation rule');
      }
    } catch (err) {
      console.error('Error deleting automation rule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete automation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteRule,
    loading,
    error,
  };
}

// =====================================================
// Toggle Automation Rule Active Status
// =====================================================

export function useToggleAutomationRule(): UseToggleAutomationRuleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRule = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/automation/rules/${id}/toggle`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle automation rule');
      }
    } catch (err) {
      console.error('Error toggling automation rule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle automation rule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    toggleRule,
    loading,
    error,
  };
}

// =====================================================
// Test Automation Rule
// =====================================================

export function useTestAutomationRule(): UseTestAutomationRuleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testRule = useCallback(
    async (
      id: string
    ): Promise<{
      wouldTrigger: boolean;
      matchedConditions: string[];
      workflowWouldLaunch: string;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/automation/rules/${id}/test`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to test automation rule');
        }

        const data = await response.json();
        return {
          wouldTrigger: data.wouldTrigger,
          matchedConditions: data.matchedConditions,
          workflowWouldLaunch: data.workflowWouldLaunch,
        };
      } catch (err) {
        console.error('Error testing automation rule:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to test automation rule';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    testRule,
    loading,
    error,
  };
}
