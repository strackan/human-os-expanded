/**
 * Database-Driven Workflow Composer
 *
 * Fetches workflow definitions from database and composes them using the slide library.
 *
 * This is the Phase 3 evolution that:
 * 1. Loads workflow definition from database (not code)
 * 2. Uses SLIDE_LIBRARY to build slides
 * 3. Supports multi-tenant custom workflows
 * 4. Hydrates placeholders with customer data
 *
 * Architecture:
 * Database (workflow_definitions) → DB Composer → Slide Library → WorkflowConfig
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createSchemaAwareClient } from '@/lib/supabase/schema';
import { SLIDE_LIBRARY } from './slides';
import { composeWorkflow, buildWorkflowConfig, CompositionError } from './composer';
import type { WorkflowComposition } from './slides/baseSlide';
import type { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  hydrateWorkflowConfig,
  createHydrationContext,
  type HydrationContext,
} from './hydration/TemplateHydrator';
import { getPricingSlideContext } from './utils/strategyRecommender';

// IMPORTANT: Import registration modules to auto-register templates and components
// This ensures V2 slides work correctly when loaded from database
import './templates/chatTemplates';
import './components/artifactComponents';

/**
 * Fetch workflow definition from database
 *
 * @param workflowId - Workflow identifier (e.g., 'standard-renewal')
 * @param companyId - Company ID (null for stock workflows)
 * @param supabase - Optional Supabase client (uses browser client if not provided)
 * @returns Workflow definition from database
 *
 * @example
 * const workflowDef = await fetchWorkflowDefinition('standard-renewal', null);
 */
export async function fetchWorkflowDefinition(
  workflowId: string,
  companyId: string | null = null,
  supabase?: SupabaseClient
) {
  const baseClient = supabase || createBrowserClient();
  const client = createSchemaAwareClient(baseClient, companyId);

  // Query workflow_definitions
  // Priority: company-specific > stock workflow
  let query = client
    .from('workflow_definitions')
    .select('*')
    .eq('workflow_id', workflowId);

  // Filter by company
  if (companyId) {
    // For company, get either stock or company-specific
    query = query.or(`company_id.is.null,company_id.eq.${companyId}`);
  } else {
    // For null company, only get stock workflows
    query = query.is('company_id', null);
  }

  const { data, error } = await query
    .order('company_id', { ascending: false, nullsFirst: false }) // Company-specific first
    .limit(1)
    .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

  if (error) {
    throw new CompositionError(
      `Failed to fetch workflow definition: ${error.message}`,
      'DB_FETCH_ERROR',
      { workflowId, companyId, error }
    );
  }

  if (!data) {
    throw new CompositionError(
      `Workflow not found: ${workflowId}`,
      'WORKFLOW_NOT_FOUND',
      { workflowId, companyId }
    );
  }

  return data;
}

/**
 * Compose workflow from database
 *
 * Fetches workflow definition from database and composes it using slide library.
 *
 * @param workflowId - Workflow identifier
 * @param companyId - Company ID (null for stock workflows)
 * @param customerContext - Customer data for placeholders
 * @param supabase - Optional Supabase client
 * @returns Composed workflow config
 *
 * @example
 * const config = await composeFromDatabase(
 *   'standard-renewal',
 *   null,
 *   { name: 'Acme Corp', current_arr: 250000 }
 * );
 */
export async function composeFromDatabase(
  workflowId: string,
  companyId: string | null = null,
  customerContext?: {
    name: string;
    [key: string]: any;
  },
  supabase?: SupabaseClient
): Promise<Partial<WorkflowConfig>> {
  // 1. Fetch workflow definition from database
  const workflowDef = await fetchWorkflowDefinition(workflowId, companyId, supabase);

  // 2. Convert database format to WorkflowComposition
  // NOTE: Splash slide is NO LONGER auto-prepended (deprecated)
  // LLM prefetch now happens at the "Launch Workflow" button click
  // Use settings.includeSplash = true if splash slide is explicitly needed
  let slideSequence = workflowDef.slide_sequence || [];
  const includeSplash = workflowDef.settings?.includeSplash === true;

  if (includeSplash && slideSequence.length > 0 && slideSequence[0] !== 'splash') {
    slideSequence = ['splash', ...slideSequence];
  }

  // Compute slide contexts - merge static contexts with computed recommendations
  // TEMPORARY: This ensures slides "sing from the same hymnal" until we have live data
  let slideContexts = workflowDef.slide_contexts || {};

  // If pricing-strategy slide exists in sequence, compute recommended strategy from customer data
  if (slideSequence.includes('pricing-strategy') && customerContext) {
    const pricingContext = getPricingSlideContext({
      utilizationPercent: customerContext.utilizationPercent ?? customerContext.utilization_percent,
      healthScore: customerContext.healthScore ?? customerContext.health_score,
      riskScore: customerContext.riskScore ?? customerContext.risk_score,
      currentPrice: customerContext.currentPrice ?? customerContext.price_per_seat,
      marketAverage: customerContext.marketAverage ?? customerContext.market_average,
      yoyGrowth: customerContext.yoyGrowth ?? customerContext.yoy_growth,
      currentARR: customerContext.currentARR ?? customerContext.current_arr,
    });

    slideContexts = {
      ...slideContexts,
      'pricing-strategy': {
        ...slideContexts['pricing-strategy'],
        variables: {
          ...slideContexts['pricing-strategy']?.variables,
          ...pricingContext,
        },
      },
    };
  }

  const composition: WorkflowComposition = {
    id: workflowDef.workflow_id,
    name: workflowDef.name,
    moduleId: (workflowDef as any).module_id || 'customer-success', // Default to CS module for legacy workflows
    category: workflowDef.workflow_type as any,
    description: workflowDef.description || '',
    slideSequence,
    slideContexts,
    settings: workflowDef.settings || undefined,
  };

  // 3. Compose using slide library
  const config = buildWorkflowConfig(composition, customerContext, SLIDE_LIBRARY);

  // 4. Hydrate template placeholders with customer data
  const hydrationContext = createHydrationContext(customerContext);
  const hydratedConfig = hydrateWorkflowConfig(config, hydrationContext);

  // 5. Add workflow metadata
  return {
    ...hydratedConfig,
    workflowId: workflowDef.workflow_id,
    workflowName: workflowDef.name,
    workflowType: workflowDef.workflow_type,
  };
}

/**
 * List available workflows for a company
 *
 * Returns both stock workflows and company-specific workflows.
 *
 * @param companyId - Company ID (null for stock workflows only)
 * @param supabase - Optional Supabase client
 * @returns Array of workflow definitions
 *
 * @example
 * const workflows = await listAvailableWorkflows(companyId);
 */
export async function listAvailableWorkflows(
  companyId: string | null = null,
  supabase?: SupabaseClient
) {
  const baseClient = supabase || createBrowserClient();
  const client = createSchemaAwareClient(baseClient, companyId);

  let query = client
    .from('workflow_definitions')
    .select('workflow_id, name, workflow_type, description, is_stock_workflow, company_id');

  if (companyId) {
    // For company: show stock workflows + company-specific
    query = query.or(`is_stock_workflow.eq.true,company_id.eq.${companyId}`);
  } else {
    // For null company: only show stock workflows
    query = query.eq('is_stock_workflow', true);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new CompositionError(
      `Failed to list workflows: ${error.message}`,
      'DB_LIST_ERROR',
      { companyId, error }
    );
  }

  return data || [];
}

/**
 * Clone a stock workflow for a company
 *
 * Creates a company-specific copy of a stock workflow.
 *
 * @param stockWorkflowId - Stock workflow to clone
 * @param companyId - Company ID
 * @param modifications - Optional modifications to apply
 * @param supabase - Optional Supabase client
 * @returns Cloned workflow definition
 *
 * @example
 * const customWorkflow = await cloneStockWorkflow(
 *   'standard-renewal',
 *   companyId,
 *   { name: 'Our Custom Renewal Process' }
 * );
 */
export async function cloneStockWorkflow(
  stockWorkflowId: string,
  companyId: string,
  modifications?: {
    name?: string;
    description?: string;
    slideSequence?: string[];
    slideContexts?: any;
  },
  supabase?: SupabaseClient
) {
  const baseClient = supabase || createBrowserClient();
  const client = createSchemaAwareClient(baseClient, companyId) as SupabaseClient;

  // 1. Fetch stock workflow
  const stockWorkflow = await fetchWorkflowDefinition(stockWorkflowId, null, client);

  if (!stockWorkflow.is_stock_workflow) {
    throw new CompositionError(
      `Workflow ${stockWorkflowId} is not a stock workflow`,
      'NOT_STOCK_WORKFLOW',
      { stockWorkflowId }
    );
  }

  // 2. Create cloned workflow
  const { data, error } = await client
    .from('workflow_definitions')
    .insert({
      workflow_id: stockWorkflowId, // Same ID, different company
      name: modifications?.name || `${stockWorkflow.name} (Custom)`,
      workflow_type: stockWorkflow.workflow_type,
      description: modifications?.description || stockWorkflow.description,
      company_id: companyId,
      is_stock_workflow: false,
      cloned_from: stockWorkflow.id,
      slide_sequence: modifications?.slideSequence || stockWorkflow.slide_sequence,
      slide_contexts: modifications?.slideContexts || stockWorkflow.slide_contexts,
      trigger_conditions: stockWorkflow.trigger_conditions,
      priority_weight: stockWorkflow.priority_weight,
      version: 1,
    })
    .select()
    .single();

  if (error) {
    throw new CompositionError(
      `Failed to clone workflow: ${error.message}`,
      'CLONE_ERROR',
      { stockWorkflowId, companyId, error }
    );
  }

  return data;
}

/**
 * Update workflow definition
 *
 * Updates a company-specific workflow.
 *
 * @param workflowId - Workflow identifier
 * @param companyId - Company ID
 * @param updates - Updates to apply
 * @param supabase - Optional Supabase client
 * @returns Updated workflow definition
 *
 * @example
 * const updated = await updateWorkflow(
 *   'standard-renewal',
 *   companyId,
 *   {
 *     slideSequence: ['greeting', 'review-account', 'prepare-quote'],
 *     slideContexts: { greeting: { urgency: 'high' } }
 *   }
 * );
 */
export async function updateWorkflow(
  workflowId: string,
  companyId: string,
  updates: {
    name?: string;
    description?: string;
    slideSequence?: string[];
    slideContexts?: any;
  },
  supabase?: SupabaseClient
) {
  const baseClient = supabase || createBrowserClient();
  const client = createSchemaAwareClient(baseClient, companyId);

  const { data, error } = await client
    .from('workflow_definitions')
    .update({
      ...updates,
      version: client.rpc('increment_version'), // Increment version
      updated_at: new Date().toISOString(),
    })
    .eq('workflow_id', workflowId)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    throw new CompositionError(
      `Failed to update workflow: ${error.message}`,
      'UPDATE_ERROR',
      { workflowId, companyId, error }
    );
  }

  return data;
}

/**
 * Get workflow execution with composed config
 *
 * Fetches both workflow execution state and composes the workflow config.
 *
 * @param executionId - Workflow execution ID
 * @param supabase - Optional Supabase client
 * @returns Execution record + composed config
 *
 * @example
 * const { execution, config } = await getWorkflowExecution(executionId);
 */
export async function getWorkflowExecution(
  executionId: string,
  supabase?: SupabaseClient
) {
  const baseClient = supabase || createBrowserClient();

  // First, fetch without schema to get customer info
  // (workflow_executions might be in different schema than we expect initially)
  const { data: execution, error: execError } = await baseClient
    .from('workflow_executions')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', executionId)
    .single();

  if (execError) {
    throw new CompositionError(
      `Failed to fetch execution: ${execError.message}`,
      'EXECUTION_FETCH_ERROR',
      { executionId, error: execError }
    );
  }

  // Extract company_id from customer
  const companyId = execution.customer?.company_id || null;

  // 2. Compose workflow config with proper schema
  const config = await composeFromDatabase(
    execution.workflow_config_id,
    companyId,
    {
      name: execution.customer?.name || 'Customer',
      ...execution.customer,
    },
    baseClient
  );

  return {
    execution,
    config,
  };
}
