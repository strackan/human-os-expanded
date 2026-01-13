/**
 * Workflow Context Provider
 * Master hook that provides all data needed for workflows
 * Automatically determines what data to fetch based on workflowId
 * Phase: 2B.2 (Data Extraction)
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchStakeholders, type Stakeholder } from './stakeholderProvider';
import { fetchExpansionData, type ExpansionData } from './contractProvider';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';

export interface CustomerContext {
  id: string;
  name: string;
  arr: number;
  healthScore: number;
  renewalDate: string;
  domain?: string;
  industry?: string;
}

export interface WorkflowContext {
  customer: CustomerContext | null;
  expansionData?: ExpansionData;        // Only populated for expansion workflows
  stakeholders?: Stakeholder[];          // Only populated for engagement workflows
  loading: boolean;
  error: Error | null;
}

/**
 * Determine workflow type from workflowId
 */
function getWorkflowType(workflowId: string): 'strategic-planning' | 'expansion' | 'engagement' | 'unknown' {
  const id = workflowId.toLowerCase();

  if (id.includes('strategic') || id.includes('planning')) {
    return 'strategic-planning';
  }

  if (id.includes('expansion') || id.includes('opportunity')) {
    return 'expansion';
  }

  if (id.includes('executive') || id.includes('engagement')) {
    return 'engagement';
  }

  // Pricing workflows also need stakeholders for contact review
  if (id.includes('pricing')) {
    return 'strategic-planning';
  }

  return 'unknown';
}

/**
 * Hook to fetch workflow context data
 * Automatically fetches appropriate data based on workflow type
 */
export function useWorkflowContext(
  workflowId: string,
  customerId: string
): WorkflowContext {
  const [context, setContext] = useState<WorkflowContext>({
    customer: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function loadWorkflowContext() {
      try {
        console.log(`[WorkflowContext] Loading context for workflow: ${workflowId}, customer: ${customerId}`);

        const supabase = createClient();
        const workflowType = getWorkflowType(workflowId);

        // Step 1: Fetch customer data (always needed)
        const { data: customerData, error: customerError } = await supabase
          .from(DB_TABLES.CUSTOMERS)
          .select('*')
          .eq(DB_COLUMNS.ID, customerId)
          .maybeSingle();

        if (customerError) {
          console.error('[WorkflowContext] Customer query error:', customerError);
          throw new Error(`Failed to fetch customer: ${customerError.message}`);
        }

        if (!customerData) {
          console.error('[WorkflowContext] Customer not found:', customerId);
          throw new Error(`Customer not found with ID: ${customerId}`);
        }

        const customer: CustomerContext = {
          id: customerData.id,
          name: customerData.name,
          arr: customerData.current_arr || 0,
          healthScore: customerData.health_score || 0,
          renewalDate: customerData.renewal_date || '',
          domain: customerData.domain,
          industry: customerData.industry
        };

        console.log(`[WorkflowContext] Customer loaded: ${customer.name}`);

        // Step 2: Fetch workflow-specific data
        let expansionData: ExpansionData | undefined;
        let stakeholders: Stakeholder[] | undefined;

        switch (workflowType) {
          case 'expansion':
            console.log('[WorkflowContext] Loading expansion data...');
            expansionData = await fetchExpansionData(customerId);
            console.log(`[WorkflowContext] Expansion data loaded: ${expansionData.scenarios.length} scenarios`);
            break;

          case 'engagement':
          case 'strategic-planning':
            console.log('[WorkflowContext] Loading stakeholders...');
            stakeholders = await fetchStakeholders(customerId);
            console.log(`[WorkflowContext] Stakeholders loaded: ${stakeholders.length} contacts`);
            break;

          default:
            console.warn(`[WorkflowContext] Unknown workflow type: ${workflowType}`);
        }

        // Step 3: Update context
        if (isMounted) {
          setContext({
            customer,
            expansionData,
            stakeholders,
            loading: false,
            error: null
          });
          console.log('[WorkflowContext] Context loaded successfully');
        }

      } catch (error) {
        console.error('[WorkflowContext] Error loading context:', error);
        if (isMounted) {
          setContext({
            customer: null,
            loading: false,
            error: error as Error
          });
        }
      }
    }

    loadWorkflowContext();

    return () => {
      isMounted = false;
    };
  }, [workflowId, customerId]);

  return context;
}

/**
 * Helper function to get context synchronously (for non-React usage)
 * Use this in server components or API routes
 */
export async function getWorkflowContext(
  workflowId: string,
  customerId: string
): Promise<Omit<WorkflowContext, 'loading'>> {
  try {
    const supabase = createClient();
    const workflowType = getWorkflowType(workflowId);

    // Fetch customer
    const { data: customerData, error: customerError } = await supabase
      .from(DB_TABLES.CUSTOMERS)
      .select('*')
      .eq(DB_COLUMNS.ID, customerId)
      .single();

    if (customerError || !customerData) {
      throw new Error(`Failed to fetch customer: ${customerError?.message}`);
    }

    const customer: CustomerContext = {
      id: customerData.id,
      name: customerData.name,
      arr: customerData.current_arr || 0,
      healthScore: customerData.health_score || 0,
      renewalDate: customerData.renewal_date || '',
      domain: customerData.domain,
      industry: customerData.industry
    };

    // Fetch workflow-specific data
    let expansionData: ExpansionData | undefined;
    let stakeholders: Stakeholder[] | undefined;

    switch (workflowType) {
      case 'expansion':
        expansionData = await fetchExpansionData(customerId);
        break;
      case 'engagement':
      case 'strategic-planning':
        stakeholders = await fetchStakeholders(customerId);
        break;
    }

    return {
      customer,
      expansionData,
      stakeholders,
      error: null
    };

  } catch (error) {
    return {
      customer: null,
      error: error as Error
    };
  }
}
