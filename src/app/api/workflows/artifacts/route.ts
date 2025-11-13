/**
 * Workflow Artifacts API
 *
 * POST /api/workflows/artifacts
 * - Save workflow artifacts (email drafts, recommendations, analyses, etc.)
 *
 * GET /api/workflows/artifacts?taskId=[id]
 * - Fetch artifacts for a specific task
 *
 * Phase 3: Artifact Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// POST - Create/Save Artifact
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      taskId,
      artifactType,
      title,
      content,
      generatedBy = 'manual',
      aiModel,
      generationPrompt,
      metadata = {}
    } = body;

    // Validate required fields
    if (!taskId || !artifactType || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, artifactType, title, content' },
        { status: 400 }
      );
    }

    // Verify task ownership via customer
    const { data: task } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!task || task.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate artifact type
    const validTypes = ['email_draft', 'contract_analysis', 'meeting_notes', 'proposal_draft', 'recommendation', 'custom'];
    if (!validTypes.includes(artifactType)) {
      return NextResponse.json(
        { error: `Invalid artifact type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create artifact
    const { data: artifact, error } = await supabase
      .from('workflow_task_artifacts')
      .insert({
        task_id: taskId,
        artifact_type: artifactType,
        title,
        content: typeof content === 'string' ? { text: content } : content, // Ensure JSONB format
        generated_by: generatedBy,
        ai_model: aiModel || null,
        generation_prompt: generationPrompt || null,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('[Artifacts API] Insert error:', error);
      throw new Error(`Failed to create artifact: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      artifact: {
        id: artifact.id,
        taskId: artifact.task_id,
        artifactType: artifact.artifact_type,
        title: artifact.title,
        content: artifact.content,
        generatedBy: artifact.generated_by,
        aiModel: artifact.ai_model,
        isApproved: artifact.is_approved,
        createdAt: artifact.created_at
      },
      message: 'Artifact saved successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating artifact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create artifact' },
      { status: 500 }
    );
  }
}

// =====================================================
// GET - Fetch Artifacts
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const artifactType = searchParams.get('artifactType');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Verify task ownership via customer
    const { data: task } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!task || task.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('workflow_task_artifacts')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    // Apply artifact type filter if provided
    if (artifactType) {
      query = query.eq('artifact_type', artifactType);
    }

    const { data: artifacts, error } = await query;

    if (error) {
      console.error('[Artifacts API] Query error:', error);
      throw new Error(`Failed to fetch artifacts: ${error.message}`);
    }

    // Transform to frontend format
    const artifactsArray = (artifacts || []).map(artifact => ({
      id: artifact.id,
      taskId: artifact.task_id,
      artifactType: artifact.artifact_type,
      title: artifact.title,
      content: artifact.content,
      generatedBy: artifact.generated_by,
      aiModel: artifact.ai_model,
      generationPrompt: artifact.generation_prompt,
      isApproved: artifact.is_approved,
      approvedBy: artifact.approved_by,
      approvedAt: artifact.approved_at,
      createdAt: artifact.created_at,
      updatedAt: artifact.updated_at,
      metadata: artifact.metadata
    }));

    return NextResponse.json({
      success: true,
      artifacts: artifactsArray,
      total: artifactsArray.length
    });

  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
}
