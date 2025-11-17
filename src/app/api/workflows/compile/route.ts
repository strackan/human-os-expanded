/**
 * Workflow Compilation API
 *
 * Compiles workflow templates with modifications into executable configurations.
 * Used when USE_WORKFLOW_TEMPLATE_SYSTEM feature flag is enabled.
 *
 * Part of InHerSight 0.1.9 Release - Workflow Template System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowCompilationService } from '@/lib/services/WorkflowCompilationService';

/**
 * POST /api/workflows/compile
 *
 * Compiles a workflow template for a specific customer
 *
 * Body:
 * {
 *   templateId?: string,           // Template UUID (optional if templateName provided)
 *   templateName?: string,          // Template name like 'renewal_base' (optional if templateId provided)
 *   customerId: string,             // Customer UUID
 *   userId: string,                 // User who triggered the workflow
 *   triggerContext?: {              // Optional context for modification matching
 *     risk_score?: number,
 *     opportunity_score?: number,
 *     health_score?: number,
 *     days_to_renewal?: number,
 *     [key: string]: any
 *   },
 *   createExecution?: boolean       // Whether to create workflow_execution record (default: true)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     compiledWorkflow: CompiledWorkflowConfig,
 *     executionId?: string            // Only if createExecution=true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const {
      templateId,
      templateName,
      customerId,
      userId,
      triggerContext = {},
      createExecution = true
    } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!templateId && !templateName) {
      return NextResponse.json(
        { success: false, error: 'Either templateId or templateName is required' },
        { status: 400 }
      );
    }

    // Resolve template ID if name was provided
    let resolvedTemplateId = templateId;
    if (!resolvedTemplateId && templateName) {
      const { data: template, error: templateError } = await supabase
        .from('workflow_templates')
        .select('id')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: `Template not found: ${templateName}` },
          { status: 404 }
        );
      }

      resolvedTemplateId = template.id;
    }

    // Get customer data for trigger context enrichment
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('risk_score, opportunity_score, health_score, renewal_date')
      .eq('id', customerId)
      .single();

    if (customerError) {
      return NextResponse.json(
        { success: false, error: `Customer not found: ${customerId}` },
        { status: 404 }
      );
    }

    // Enrich trigger context with customer data
    const enrichedTriggerContext = {
      risk_score: customer.risk_score,
      opportunity_score: customer.opportunity_score,
      health_score: customer.health_score,
      days_to_renewal: customer.renewal_date
        ? Math.ceil((new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : undefined,
      ...triggerContext // User-provided context can override
    };

    // Compile workflow
    const compiledWorkflow = await WorkflowCompilationService.compileWorkflow(
      resolvedTemplateId,
      customerId,
      enrichedTriggerContext,
      supabase
    );

    // Create execution record if requested
    let executionId: string | undefined;
    if (createExecution) {
      executionId = await WorkflowCompilationService.createExecutionFromCompilation(
        compiledWorkflow,
        userId,
        supabase
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        compiledWorkflow,
        executionId,
        metadata: {
          templateId: resolvedTemplateId,
          customerId,
          totalSteps: compiledWorkflow.steps.length,
          modificationsApplied: compiledWorkflow.applied_modifications.length,
          compiledAt: compiledWorkflow.compilation_metadata.compiled_at
        }
      }
    });

  } catch (error: any) {
    console.error('Workflow compilation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to compile workflow',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/compile/templates
 *
 * List available workflow templates
 *
 * Query params:
 * - category?: string (filter by category)
 * - active?: boolean (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const active = searchParams.get('active') !== 'false'; // Default to true

    let query = supabase
      .from('workflow_templates')
      .select('id, name, display_name, description, category, estimated_time_minutes, is_active')
      .eq('is_active', active)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templates,
        count: templates?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
