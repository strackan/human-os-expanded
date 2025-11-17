/**
 * Workflow Loader Service
 *
 * Dual-mode workflow loading service that supports both:
 * - Legacy: Hardcoded TypeScript workflow configs
 * - Template: Database-driven compilation with modifications
 *
 * Part of InHerSight 0.1.9 - Workflow Template System Migration
 */

import { isFeatureEnabled } from '@/lib/constants/feature-flags';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { getWorkflow, WORKFLOW_TEMPLATE_MAPPING } from '@/components/artifacts/workflows/configs/workflows/workflowRegistry';
import { WorkflowCompilationService, type CompiledWorkflowConfig } from './WorkflowCompilationService';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WorkflowLoadOptions {
  workflowId: string;
  customerId: string;
  userId: string;
  triggerContext?: Record<string, any>;
  createExecution?: boolean;
}

export interface WorkflowLoadResult {
  source: 'legacy' | 'template';
  config: WorkflowConfig | CompiledWorkflowConfig;
  executionId?: string;
  metadata: {
    workflowId: string;
    customerId: string;
    templateId?: string;
    templateName?: string;
    modificationsApplied?: number;
    featureFlagEnabled: boolean;
  };
}

export class WorkflowLoaderService {
  /**
   * Load a workflow using either legacy or template system based on feature flag
   */
  static async loadWorkflow(
    options: WorkflowLoadOptions,
    supabaseClient?: SupabaseClient
  ): Promise<WorkflowLoadResult> {
    const useTemplateSystem = isFeatureEnabled('USE_WORKFLOW_TEMPLATE_SYSTEM');

    if (useTemplateSystem) {
      return this.loadFromTemplate(options, supabaseClient);
    } else {
      return this.loadFromLegacy(options);
    }
  }

  /**
   * Load workflow from database template system (NEW)
   */
  private static async loadFromTemplate(
    options: WorkflowLoadOptions,
    supabaseClient?: SupabaseClient
  ): Promise<WorkflowLoadResult> {
    const { workflowId, customerId, userId, triggerContext = {}, createExecution = true } = options;

    // Get template name from mapping
    const templateName = WORKFLOW_TEMPLATE_MAPPING[workflowId];
    if (!templateName) {
      throw new Error(
        `No template mapping found for workflow: ${workflowId}. ` +
        `Add mapping to WORKFLOW_TEMPLATE_MAPPING or use legacy mode.`
      );
    }

    const supabase = supabaseClient || await createClient();

    // Get template ID
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('id, name')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(
        `Template not found: ${templateName}. ` +
        `Run seed-workflow-templates.ts to create base templates.`
      );
    }

    // Get customer data for trigger context enrichment
    const { data: customer } = await supabase
      .from('customers')
      .select('risk_score, opportunity_score, health_score, renewal_date')
      .eq('id', customerId)
      .maybeSingle();

    // Enrich trigger context
    const enrichedContext = {
      risk_score: customer?.risk_score,
      opportunity_score: customer?.opportunity_score,
      health_score: customer?.health_score,
      days_to_renewal: customer?.renewal_date
        ? Math.ceil((new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : undefined,
      ...triggerContext
    };

    // Compile workflow
    const compiledWorkflow = await WorkflowCompilationService.compileWorkflow(
      template.id,
      customerId,
      enrichedContext,
      supabase
    );

    // Create execution if requested
    let executionId: string | undefined;
    if (createExecution) {
      executionId = await WorkflowCompilationService.createExecutionFromCompilation(
        compiledWorkflow,
        userId,
        supabase
      );

      // Track source in execution metadata
      await supabase
        .from('workflow_executions')
        .update({
          metadata: {
            workflow_source: 'template',
            workflow_id: workflowId,
            template_name: templateName,
            feature_flag_enabled: true,
            loaded_at: new Date().toISOString()
          }
        })
        .eq('id', executionId);
    }

    return {
      source: 'template',
      config: compiledWorkflow as any, // Type adapter needed
      executionId,
      metadata: {
        workflowId,
        customerId,
        templateId: template.id,
        templateName: template.name,
        modificationsApplied: compiledWorkflow.applied_modifications.length,
        featureFlagEnabled: true
      }
    };
  }

  /**
   * Load workflow from legacy hardcoded config (FROZEN)
   */
  private static async loadFromLegacy(
    options: WorkflowLoadOptions
  ): Promise<WorkflowLoadResult> {
    const { workflowId, customerId, userId } = options;

    // Get legacy config
    const config = getWorkflow(workflowId);
    if (!config) {
      throw new Error(
        `Legacy workflow not found: ${workflowId}. ` +
        `Available workflows: ${Object.keys(getWorkflow)}`
      );
    }

    // Note: Legacy execution creation happens elsewhere
    // This just returns the config

    return {
      source: 'legacy',
      config,
      metadata: {
        workflowId,
        customerId,
        featureFlagEnabled: false
      }
    };
  }

  /**
   * Check if a workflow should use template system
   */
  static shouldUseTemplate(workflowId: string): boolean {
    if (!isFeatureEnabled('USE_WORKFLOW_TEMPLATE_SYSTEM')) {
      return false;
    }

    // Check if template mapping exists
    return workflowId in WORKFLOW_TEMPLATE_MAPPING;
  }

  /**
   * Get workflow source without loading
   */
  static getWorkflowSource(workflowId: string): 'legacy' | 'template' {
    return this.shouldUseTemplate(workflowId) ? 'template' : 'legacy';
  }

  /**
   * List available workflows from both systems
   */
  static async listAvailableWorkflows(supabaseClient?: SupabaseClient): Promise<{
    legacy: string[];
    template: string[];
  }> {
    const useTemplateSystem = isFeatureEnabled('USE_WORKFLOW_TEMPLATE_SYSTEM');

    let templateWorkflows: string[] = [];
    if (useTemplateSystem) {
      const supabase = supabaseClient || await createClient();
      const { data: templates } = await supabase
        .from('workflow_templates')
        .select('name')
        .eq('is_active', true);

      templateWorkflows = templates?.map(t => t.name) || [];
    }

    return {
      legacy: Object.keys(getWorkflow),
      template: templateWorkflows
    };
  }
}
