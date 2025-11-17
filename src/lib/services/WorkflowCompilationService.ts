/**
 * Workflow Compilation Service
 *
 * Compiles workflow templates with modifications into executable configurations.
 * Supports inheritance and priority-based modification application.
 *
 * Architecture:
 * - Base templates (renewal_base, contact_recovery, etc.)
 * - Modifications with scope (global, company, customer, industry, segment)
 * - Priority-based application (global: 100, company: 200, customer: 300)
 * - Runtime hydration with customer data
 *
 * Part of InHerSight 0.1.9 Release - Workflow Template System
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

/**
 * Workflow Template - Base configuration for a journey type
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  base_steps: WorkflowStepDefinition[];
  base_artifacts: ArtifactDefinition[];
  default_triggers?: Record<string, any>;
  estimated_time_minutes?: number;
  pain_score?: number;
  impact_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Workflow Step Definition
 */
export interface WorkflowStepDefinition {
  step_id: string;
  step_name: string;
  step_type?: string;
  description?: string;
  shows_artifacts?: string[];
  creates_tasks?: string[];
  branch_logic?: BranchLogic;
  metadata?: Record<string, any>;
}

/**
 * Artifact Definition
 */
export interface ArtifactDefinition {
  artifact_id: string;
  artifact_type: string;
  artifact_name: string;
  template_content?: string;
  config?: Record<string, any>;
}

/**
 * Branch Logic
 */
export interface BranchLogic {
  condition: string;
  branches: {
    value: string;
    next_step_id?: string;
    skip_steps?: string[];
    add_steps?: WorkflowStepDefinition[];
  }[];
}

/**
 * Workflow Modification
 */
export interface WorkflowModification {
  id: string;
  workflow_template_id: string;
  scope_type: 'global' | 'company' | 'customer' | 'industry' | 'segment';
  scope_id?: string;
  scope_criteria?: Record<string, any>;
  modification_type:
    | 'add_step'
    | 'remove_step'
    | 'replace_step'
    | 'modify_step'
    | 'add_artifact'
    | 'remove_artifact'
    | 'change_branch_logic'
    | 'add_task_template';
  target_step_id?: string;
  target_position?: number;
  modification_data: any;
  priority: number;
  reason?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Compilation Context
 */
export interface CompilationContext {
  customer: any;
  trigger_context: {
    risk_score?: number;
    opportunity_score?: number;
    days_to_renewal?: number;
    health_score?: number;
    [key: string]: any;
  };
}

/**
 * Compiled Workflow Configuration
 */
export interface CompiledWorkflowConfig {
  template_id: string;
  template_name: string;
  steps: WorkflowStepDefinition[];
  artifacts: ArtifactDefinition[];
  applied_modifications: string[];
  compilation_metadata: {
    compiled_at: string;
    customer_id: string;
    trigger_context: Record<string, any>;
    total_steps: number;
    modifications_applied: number;
  };
}

export class WorkflowCompilationService {
  /**
   * Compile a workflow template into an executable configuration
   */
  static async compileWorkflow(
    templateId: string,
    customerId: string,
    triggerContext: Record<string, any>,
    supabaseClient?: SupabaseClient
  ): Promise<CompiledWorkflowConfig> {
    const supabase = supabaseClient || createClient();

    // 1. Load base template
    const template = await this.loadTemplate(templateId, supabase);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    // 2. Get customer context
    const customer = await this.loadCustomerContext(customerId, supabase);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // 3. Find applicable modifications (ordered by priority)
    const modifications = await this.findApplicableModifications(
      templateId,
      customer,
      triggerContext,
      supabase
    );

    // 4. Apply modifications in priority order
    let compiledSteps = [...template.base_steps];
    let compiledArtifacts = [...template.base_artifacts];

    for (const mod of modifications) {
      const result = this.applyModification(
        mod,
        compiledSteps,
        compiledArtifacts
      );
      compiledSteps = result.steps;
      compiledArtifacts = result.artifacts;
    }

    // 5. Hydrate templates with customer data
    const hydratedSteps = this.hydrateSteps(compiledSteps, customer, triggerContext);
    const hydratedArtifacts = this.hydrateArtifacts(compiledArtifacts, customer, triggerContext);

    // 6. Return compiled configuration
    return {
      template_id: template.id,
      template_name: template.name,
      steps: hydratedSteps,
      artifacts: hydratedArtifacts,
      applied_modifications: modifications.map(m => m.id),
      compilation_metadata: {
        compiled_at: new Date().toISOString(),
        customer_id: customerId,
        trigger_context: triggerContext,
        total_steps: hydratedSteps.length,
        modifications_applied: modifications.length
      }
    };
  }

  /**
   * Load workflow template by ID
   */
  private static async loadTemplate(
    templateId: string,
    supabase: SupabaseClient
  ): Promise<WorkflowTemplate | null> {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error loading workflow template:', error);
      return null;
    }

    return data as WorkflowTemplate;
  }

  /**
   * Load customer context with related data
   */
  private static async loadCustomerContext(
    customerId: string,
    supabase: SupabaseClient
  ): Promise<any | null> {
    // Load customer first
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Error loading customer context:', customerError);
      return null;
    }

    // Load related data separately (handle missing tables gracefully)
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', customer.company_id)
      .maybeSingle();

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId);

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .limit(1000);

    const { data: metrics } = await supabase
      .from('customer_engagement_metrics')
      .select('*')
      .eq('customer_id', customerId);

    // Enrich customer object
    return {
      ...customer,
      company: company || null,
      contracts: contracts || [],
      contacts: contacts || [],
      customer_engagement_metrics: metrics || []
    };
  }

  /**
   * Find applicable modifications based on scope and criteria
   */
  private static async findApplicableModifications(
    templateId: string,
    customer: any,
    triggerContext: Record<string, any>,
    supabase: SupabaseClient
  ): Promise<WorkflowModification[]> {
    // Get all modifications for this template
    const { data: allMods, error } = await supabase
      .from('workflow_modifications')
      .select('*')
      .eq('workflow_template_id', templateId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error loading workflow modifications:', error);
      return [];
    }

    if (!allMods || allMods.length === 0) {
      return [];
    }

    // Filter modifications based on scope
    const applicableMods: WorkflowModification[] = [];

    for (const mod of allMods as WorkflowModification[]) {
      if (this.isModificationApplicable(mod, customer, triggerContext)) {
        applicableMods.push(mod);
      }
    }

    return applicableMods;
  }

  /**
   * Check if a modification is applicable
   */
  private static isModificationApplicable(
    mod: WorkflowModification,
    customer: any,
    triggerContext: Record<string, any>
  ): boolean {
    switch (mod.scope_type) {
      case 'global':
        // Global mods apply if criteria matches
        return this.matchesCriteria(mod.scope_criteria, {
          ...customer,
          ...triggerContext
        });

      case 'company':
        // Company mods apply if company_id matches
        return mod.scope_id === customer.company_id;

      case 'customer':
        // Customer mods apply if customer_id matches
        return mod.scope_id === customer.id;

      case 'industry':
        // Industry mods apply if industry matches
        return mod.scope_criteria?.industry === customer.industry;

      case 'segment':
        // Segment mods apply if criteria matches
        return this.matchesCriteria(mod.scope_criteria, customer);

      default:
        return false;
    }
  }

  /**
   * Check if data matches criteria
   */
  private static matchesCriteria(
    criteria: Record<string, any> | undefined,
    data: Record<string, any>
  ): boolean {
    if (!criteria) return true;

    for (const [key, value] of Object.entries(criteria)) {
      // Support comparison operators
      if (typeof value === 'object' && value !== null) {
        const dataValue = this.getNestedValue(data, key);

        if ('$gt' in value && !(dataValue > value.$gt)) return false;
        if ('$gte' in value && !(dataValue >= value.$gte)) return false;
        if ('$lt' in value && !(dataValue < value.$lt)) return false;
        if ('$lte' in value && !(dataValue <= value.$lte)) return false;
        if ('$eq' in value && !(dataValue === value.$eq)) return false;
        if ('$ne' in value && !(dataValue !== value.$ne)) return false;
        if ('$in' in value && !value.$in.includes(dataValue)) return false;
      } else {
        // Simple equality check
        const dataValue = this.getNestedValue(data, key);
        if (dataValue !== value) return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  /**
   * Apply a single modification to steps and artifacts
   */
  private static applyModification(
    mod: WorkflowModification,
    steps: WorkflowStepDefinition[],
    artifacts: ArtifactDefinition[]
  ): { steps: WorkflowStepDefinition[]; artifacts: ArtifactDefinition[] } {
    let newSteps = [...steps];
    let newArtifacts = [...artifacts];

    switch (mod.modification_type) {
      case 'add_step':
        // Insert new step at target position
        const insertPosition = mod.target_position ?? newSteps.length;
        newSteps.splice(insertPosition, 0, mod.modification_data as WorkflowStepDefinition);
        break;

      case 'remove_step':
        // Remove step by step_id
        newSteps = newSteps.filter(s => s.step_id !== mod.target_step_id);
        break;

      case 'replace_step':
        // Replace entire step
        const replaceIdx = newSteps.findIndex(s => s.step_id === mod.target_step_id);
        if (replaceIdx >= 0) {
          newSteps[replaceIdx] = mod.modification_data as WorkflowStepDefinition;
        }
        break;

      case 'modify_step':
        // Merge properties into existing step
        const modifyIdx = newSteps.findIndex(s => s.step_id === mod.target_step_id);
        if (modifyIdx >= 0) {
          newSteps[modifyIdx] = {
            ...newSteps[modifyIdx],
            ...mod.modification_data
          };
        }
        break;

      case 'add_artifact':
        // Add artifact to step
        const step = newSteps.find(s => s.step_id === mod.target_step_id);
        if (step) {
          step.shows_artifacts = [
            ...(step.shows_artifacts || []),
            mod.modification_data.artifact_id
          ];

          // Add artifact definition if provided
          if (mod.modification_data.artifact_definition) {
            newArtifacts.push(mod.modification_data.artifact_definition);
          }
        }
        break;

      case 'remove_artifact':
        // Remove artifact from step
        const removeArtifactStep = newSteps.find(s => s.step_id === mod.target_step_id);
        if (removeArtifactStep) {
          removeArtifactStep.shows_artifacts = (removeArtifactStep.shows_artifacts || [])
            .filter(a => a !== mod.modification_data.artifact_id);
        }
        break;

      case 'change_branch_logic':
        // Update branch logic for step
        const branchStep = newSteps.find(s => s.step_id === mod.target_step_id);
        if (branchStep) {
          branchStep.branch_logic = mod.modification_data as BranchLogic;
        }
        break;

      case 'add_task_template':
        // Add task template reference to step
        const taskStep = newSteps.find(s => s.step_id === mod.target_step_id);
        if (taskStep) {
          taskStep.creates_tasks = [
            ...(taskStep.creates_tasks || []),
            mod.modification_data.task_template_id
          ];
        }
        break;
    }

    return { steps: newSteps, artifacts: newArtifacts };
  }

  /**
   * Hydrate step definitions with customer data
   */
  private static hydrateSteps(
    steps: WorkflowStepDefinition[],
    customer: any,
    triggerContext: Record<string, any>
  ): WorkflowStepDefinition[] {
    const context = this.buildHydrationContext(customer, triggerContext);

    return steps.map(step => ({
      ...step,
      step_name: this.hydrateString(step.step_name, context),
      description: step.description ? this.hydrateString(step.description, context) : undefined,
      metadata: step.metadata ? this.hydrateObject(step.metadata, context) : undefined
    }));
  }

  /**
   * Hydrate artifact definitions with customer data
   */
  private static hydrateArtifacts(
    artifacts: ArtifactDefinition[],
    customer: any,
    triggerContext: Record<string, any>
  ): ArtifactDefinition[] {
    const context = this.buildHydrationContext(customer, triggerContext);

    return artifacts.map(artifact => ({
      ...artifact,
      artifact_name: this.hydrateString(artifact.artifact_name, context),
      template_content: artifact.template_content
        ? this.hydrateString(artifact.template_content, context)
        : undefined,
      config: artifact.config ? this.hydrateObject(artifact.config, context) : undefined
    }));
  }

  /**
   * Build hydration context from customer and trigger data
   */
  private static buildHydrationContext(
    customer: any,
    triggerContext: Record<string, any>
  ): Record<string, any> {
    return {
      customer: {
        id: customer.id,
        name: customer.name,
        current_arr: customer.current_arr,
        renewal_date: customer.renewal_date,
        health_score: customer.health_score,
        risk_score: customer.risk_score,
        opportunity_score: customer.opportunity_score,
        industry: customer.industry,
        segment: customer.segment,
        ...customer
      },
      company: customer.company || {},
      contracts: customer.contracts || [],
      contacts: customer.contacts || [],
      engagement_metrics: customer.customer_engagement_metrics?.[0] || {},
      trigger: triggerContext
    };
  }

  /**
   * Hydrate a string with template placeholders
   * Supports {{customer.name}}, {{trigger.risk_score}}, etc.
   */
  private static hydrateString(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Hydrate an object recursively
   */
  private static hydrateObject(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.hydrateString(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.hydrateObject(item, context));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.hydrateObject(value, context);
      }
      return result;
    }

    return obj;
  }

  /**
   * Create a workflow execution from compiled config
   */
  static async createExecutionFromCompilation(
    compiledConfig: CompiledWorkflowConfig,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<string> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_template_id: compiledConfig.template_id,
        workflow_name: compiledConfig.template_name,
        customer_id: compiledConfig.compilation_metadata.customer_id,
        user_id: userId,
        applied_modifications: compiledConfig.applied_modifications,
        compiled_config: compiledConfig,
        status: 'not_started',
        current_step_index: 0,
        total_steps: compiledConfig.steps.length,
        completed_steps_count: 0,
        skipped_steps_count: 0,
        completion_percentage: 0
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating workflow execution:', error);
      throw new Error(`Failed to create workflow execution: ${error.message}`);
    }

    return data.id;
  }
}
