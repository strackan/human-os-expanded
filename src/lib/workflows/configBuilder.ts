/**
 * Workflow Config Builder
 *
 * The complete pipeline for building database-driven workflow configs:
 * 1. Fetch workflow composition from database (or use hardcoded)
 * 2. Compose slides from slide library
 * 3. Fetch customer data from database
 * 4. Hydrate slides with customer data
 * 5. Return complete WorkflowConfig ready for TaskMode
 *
 * This is the MAIN ENTRY POINT for creating workflows at runtime.
 */

import type { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import type { WorkflowComposition } from './slides/baseSlide';
import { composeWorkflow, buildWorkflowConfig } from './composer';
import {
  fetchCustomerContext,
  fetchCSMData,
  fetchWorkflowExecution,
  fetchDepartedContactData,
} from './dataFetcher';
import { hydrateSlides, buildHydrationContext } from './hydrator';

// Import existing compositions
import { executiveContactLostComposition } from './compositions/executiveContactLostComposition';
import { standardRenewalComposition } from './compositions/standardRenewalComposition';

/**
 * Registry of hardcoded compositions (temporary until database-driven)
 */
const COMPOSITION_REGISTRY: Record<string, WorkflowComposition> = {
  'exec-contact-lost': executiveContactLostComposition,
  'standard-renewal': standardRenewalComposition,
};

/**
 * Build a complete workflow config from workflow ID and customer ID
 *
 * This is the main entry point - fetches everything needed and returns
 * a ready-to-use WorkflowConfig.
 *
 * @param workflowId - Workflow definition ID (e.g., 'exec-contact-lost', 'standard-renewal')
 * @param customerId - Customer UUID
 * @param options - Additional options
 * @returns Complete WorkflowConfig ready for TaskMode
 *
 * @example
 * const config = await buildWorkflowConfigFromDatabase(
 *   'standard-renewal',
 *   'customer-uuid-here'
 * );
 *
 * // Use in TaskMode:
 * <TaskModeFullscreen config={config} />
 */
export async function buildWorkflowConfigFromDatabase(
  workflowId: string,
  customerId: string,
  options?: {
    csmId?: string;
    executionId?: string;
    additionalContext?: any;
  }
): Promise<WorkflowConfig | null> {
  try {
    // 1. Get workflow composition
    // TODO: Fetch from database instead of hardcoded registry
    const composition = COMPOSITION_REGISTRY[workflowId];

    if (!composition) {
      console.error(`Workflow composition '${workflowId}' not found`);
      return null;
    }

    // 2. Fetch customer data
    const customerData = await fetchCustomerContext(customerId);

    if (!customerData) {
      console.error(`Customer '${customerId}' not found`);
      return null;
    }

    // 3. Fetch CSM data (if provided)
    let csmData = undefined;
    if (options?.csmId) {
      csmData = await fetchCSMData(options.csmId) || undefined;
    }

    // 4. Fetch workflow-specific data (if execution ID provided)
    let departedContactData = undefined;
    if (options?.executionId && workflowId === 'exec-contact-lost') {
      departedContactData = await fetchDepartedContactData(options.executionId) || undefined;
    }

    // 5. Compose slides from library
    const slides = composeWorkflow(composition);

    // 6. Build hydration context
    const hydrationContext = buildHydrationContext(customerData, {
      csm: csmData,
      departed_contact: departedContactData,
      ...options?.additionalContext,
    });

    // 7. Hydrate slides with customer data
    const hydratedSlides = hydrateSlides(slides, hydrationContext);

    // 8. Build complete config
    const config: WorkflowConfig = {
      customer: {
        name: customerData.name,
      },
      slides: hydratedSlides,

      // Add settings from composition
      ...(composition.settings?.layout && { layout: composition.settings.layout }),
      ...(composition.settings?.chat && { chat: composition.settings.chat }),
    };

    return config;
  } catch (error) {
    console.error('Error building workflow config:', error);
    return null;
  }
}

/**
 * Build workflow config from execution ID
 *
 * Loads everything from the workflow_executions table.
 *
 * @param executionId - Workflow execution UUID
 * @returns Complete WorkflowConfig
 *
 * @example
 * const config = await buildWorkflowConfigFromExecution('execution-uuid');
 */
export async function buildWorkflowConfigFromExecution(
  executionId: string
): Promise<WorkflowConfig | null> {
  try {
    // Fetch execution data (includes customer_id, workflow_definition_id, etc.)
    const execution = await fetchWorkflowExecution(executionId);

    if (!execution) {
      console.error(`Execution '${executionId}' not found`);
      return null;
    }

    // Get workflow ID from execution
    // TODO: Use execution.workflow_definition.template_file_id when available
    const workflowId = execution.workflow_definition?.id || 'standard-renewal';

    // Build config using customer from execution
    return buildWorkflowConfigFromDatabase(
      workflowId,
      execution.customer_id,
      {
        csmId: execution.assigned_csm_id,
        executionId: executionId,
      }
    );
  } catch (error) {
    console.error('Error building config from execution:', error);
    return null;
  }
}

/**
 * Build workflow config from composition object (no database)
 *
 * Useful for testing or when you have the composition already.
 *
 * @param composition - Workflow composition
 * @param customerId - Customer UUID
 * @param options - Additional options
 * @returns Complete WorkflowConfig
 */
export async function buildWorkflowConfigFromComposition(
  composition: WorkflowComposition,
  customerId: string,
  options?: {
    csmId?: string;
    additionalContext?: any;
  }
): Promise<WorkflowConfig | null> {
  try {
    // Fetch customer data
    const customerData = await fetchCustomerContext(customerId);

    if (!customerData) {
      console.error(`Customer '${customerId}' not found`);
      return null;
    }

    // Fetch CSM data (if provided)
    let csmData = undefined;
    if (options?.csmId) {
      csmData = await fetchCSMData(options.csmId) || undefined;
    }

    // Compose slides
    const slides = composeWorkflow(composition);

    // Build hydration context
    const hydrationContext = buildHydrationContext(customerData, {
      csm: csmData,
      ...options?.additionalContext,
    });

    // Hydrate slides
    const hydratedSlides = hydrateSlides(slides, hydrationContext);

    // Build config
    const config: WorkflowConfig = {
      customer: {
        name: customerData.name,
      },
      slides: hydratedSlides,
      ...(composition.settings?.layout && { layout: composition.settings.layout }),
      ...(composition.settings?.chat && { chat: composition.settings.chat }),
    };

    return config;
  } catch (error) {
    console.error('Error building config from composition:', error);
    return null;
  }
}

/**
 * Preview what a workflow would look like for a customer
 *
 * Returns a summary without full hydration (faster).
 *
 * @param workflowId - Workflow ID
 * @param customerId - Customer UUID
 * @returns Preview summary
 */
export async function previewWorkflow(
  workflowId: string,
  customerId: string
): Promise<{
  workflowId: string;
  workflowName: string;
  customer: { id: string; name: string };
  slideCount: number;
  slideSequence: string[];
} | null> {
  try {
    const composition = COMPOSITION_REGISTRY[workflowId];
    if (!composition) return null;

    const customerData = await fetchCustomerContext(customerId);
    if (!customerData) return null;

    return {
      workflowId: composition.id,
      workflowName: composition.name || composition.id,
      customer: {
        id: customerData.id,
        name: customerData.name,
      },
      slideCount: composition.slideSequence.length,
      slideSequence: composition.slideSequence,
    };
  } catch (error) {
    console.error('Error previewing workflow:', error);
    return null;
  }
}

/**
 * Get list of available workflows
 *
 * @returns Array of available workflow IDs and names
 */
export function getAvailableWorkflows(): Array<{ id: string; name: string; category: string }> {
  return Object.values(COMPOSITION_REGISTRY).map((comp) => ({
    id: comp.id,
    name: comp.name || comp.id,
    category: comp.category,
  }));
}

/**
 * Register a new workflow composition
 *
 * Allows adding compositions at runtime.
 *
 * @param composition - Workflow composition to register
 */
export function registerWorkflowComposition(composition: WorkflowComposition): void {
  COMPOSITION_REGISTRY[composition.id] = composition;
}
