/**
 * Workflow Context Provider
 *
 * Provides workflow context data (customer, CSM, workflow state, company, account team)
 * to all workflow components for template rendering.
 *
 * Fetches data from `/api/workflows/context/[customerId]` endpoint.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createContext as createSafeContext } from '@/utils/templateResolver';
import { API_ROUTES } from '@/lib/constants/api-routes';

// =====================================================
// Types
// =====================================================

export interface WorkflowContextData {
  customer: {
    id: string;
    name: string;
    slug?: string;
    arr?: number;
    renewalDate?: string;
    contractTerm?: number;
    industry?: string;
    employeeCount?: number;
    hasAccountPlan?: boolean;
    accountPlan?: {
      owner?: string;
      ownerName?: string;
      team?: string;
      lastUpdated?: string;
    };
  };
  csm?: {
    id: string;
    email: string;
    name: string;
    title?: string;
    manager?: string;
    managerName?: string;
    managerTitle?: string;
  };
  workflow?: {
    executionId?: string;
    currentStage?: string;
    daysUntilRenewal?: number;
    hoursUntilRenewal?: number;
    renewalARR?: number;
    currentDate?: string;
    currentTimestamp?: string;
    isOverdue?: boolean;
    daysOverdue?: number;
  };
  company?: {
    name?: string;
    vpCustomerSuccess?: string;
    vpCustomerSuccessName?: string;
    ceo?: string;
    ceoName?: string;
    csTeamEmail?: string;
    execTeamEmail?: string;
  };
  accountTeam?: {
    ae?: string;
    aeName?: string;
    sa?: string;
    saName?: string;
    executiveSponsor?: string;
    executiveSponsorName?: string;
    allEmails?: string;
  };
}

interface WorkflowContextState {
  context: WorkflowContextData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// =====================================================
// Context
// =====================================================

const WorkflowContext = createContext<WorkflowContextState | null>(null);

// =====================================================
// Provider Component
// =====================================================

interface WorkflowContextProviderProps {
  customerId: string;
  executionId?: string;
  children: ReactNode;
}

export const WorkflowContextProvider: React.FC<WorkflowContextProviderProps> = ({
  customerId,
  executionId,
  children
}) => {
  const [context, setContext] = useState<WorkflowContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ROUTES.WORKFLOWS.CONTEXT_BY_CUSTOMER(customerId));

      if (!response.ok) {
        throw new Error(`Failed to fetch context: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Extract context from wrapper (API returns {success: true, context: {...}})
      const contextData = responseData.context || responseData;

      // Add execution ID if provided
      if (executionId && contextData.workflow) {
        contextData.workflow.executionId = executionId;
      }

      setContext(contextData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workflow context';
      console.error('[WorkflowContext] Error fetching context:', err);
      setError(errorMessage);

      // Provide minimal fallback context so templates don't crash
      setContext({
        customer: {
          id: customerId,
          name: 'Unknown Customer'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchContext();
    }
  }, [customerId, executionId]);

  const value: WorkflowContextState = {
    context,
    isLoading,
    error,
    refetch: fetchContext
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// =====================================================
// Hook
// =====================================================

/**
 * Use workflow context in components
 *
 * Returns the current workflow context data for template rendering.
 * Includes Math utilities for template calculations.
 */
export function useWorkflowContext(): WorkflowContextState & {
  templateContext: any;
} {
  const contextState = useContext(WorkflowContext);

  if (!contextState) {
    throw new Error('useWorkflowContext must be used within WorkflowContextProvider');
  }

  // Create template-safe context with Math utilities
  const templateContext = contextState.context
    ? createSafeContext(contextState.context)
    : null;

  return {
    ...contextState,
    templateContext
  };
}

/**
 * Get template context only (without loading states)
 *
 * Useful for components that just need the context for rendering.
 * Returns null if context is not loaded yet.
 */
export function useTemplateContext(): any {
  const { templateContext } = useWorkflowContext();
  return templateContext;
}
