/**
 * Workflow API
 *
 * GET /api/workflows/[workflowId]?tenantId=[tenantId]
 * - Returns workflow configuration from database
 * - Returns core workflows (is_core = TRUE) or tenant-specific workflows
 * - Used by frontend to render workflow steps, notifications, routing, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// Types
// =====================================================

interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  trigger: {
    daysUntilRenewal?: {
      min?: number;
      max?: number;
    };
    earlyTriggers?: Array<{
      condition: string;
      description: string;
    }>;
    manualTriggers?: Array<{
      condition: string;
      description: string;
    }>;
  };
  context: {
    systemPrompt: string;
  };
  steps: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    execution?: {
      llmPrompt?: string;
      processor?: string;
      storeIn?: string;
    };
    routing?: {
      routes?: Array<{
        id: string;
        nextStepId: string;
        condition: string;
      }>;
      defaultRoute?: string;
    };
    notifications?: Array<{
      type: string;
      title: string;
      message?: string;
      priority?: number;
      recipients?: string[];
      condition?: string;
      actionTriggered?: string;
      metadata?: Record<string, any>;
    }>;
    conditional?: boolean;
    conditionalLogic?: {
      condition: string;
      description: string;
    };
  }>;
}

interface WorkflowDatabaseRecord {
  id: string;
  workflow_id: string;
  name: string;
  description: string;
  version: string;
  config: WorkflowConfig;
  is_core: boolean;
}

// =====================================================
// Main Handler
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const resolvedParams = await params;
    const workflowId = resolvedParams.workflowId;

    // Get tenantId from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const tenantIdParam = searchParams.get('tenantId');

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =====================================================
    // 1. Get User's Tenant ID
    // =====================================================

    let tenantId: string | null = tenantIdParam;

    if (!tenantId) {
      // Get tenant ID from user's profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'Failed to fetch user tenant' },
          { status: 500 }
        );
      }

      tenantId = userData.tenant_id;
    }

    // =====================================================
    // 2. Fetch Workflow from Database
    // =====================================================

    // Query: Get core workflows or tenant-specific workflows
    // Core workflows: is_core = TRUE (available to all tenants)
    // Tenant workflows: tenant_id = tenantId (custom workflows)
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('id, workflow_id, name, description, version, config, is_core')
      .eq('workflow_id', workflowId)
      .or(`is_core.eq.true,tenant_id.eq.${tenantId}`)
      .limit(1);

    if (workflowError) {
      console.error('Error fetching workflow:', workflowError);
      return NextResponse.json(
        { error: 'Failed to fetch workflow' },
        { status: 500 }
      );
    }

    if (!workflows || workflows.length === 0) {
      return NextResponse.json(
        { error: `Workflow '${workflowId}' not found` },
        { status: 404 }
      );
    }

    const workflow = workflows[0] as WorkflowDatabaseRecord;

    // =====================================================
    // 3. Return Workflow Config
    // =====================================================

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        workflowId: workflow.workflow_id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        isCore: workflow.is_core,
        config: workflow.config
      }
    });

  } catch (error) {
    console.error('Error in workflow API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
