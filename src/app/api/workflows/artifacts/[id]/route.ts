/**
 * Single Artifact API
 *
 * GET /api/workflows/artifacts/[id]
 * - Get artifact by ID
 *
 * PATCH /api/workflows/artifacts/[id]
 * - Update artifact
 *
 * DELETE /api/workflows/artifacts/[id]
 * - Delete artifact
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// GET - Fetch Single Artifact
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artifactId = resolvedParams.id;

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

    // Get artifact
    const { data: artifact, error: artifactError } = await supabase
      .from('workflow_task_artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();

    if (artifactError || !artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
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
        generationPrompt: artifact.generation_prompt,
        isApproved: artifact.is_approved,
        approvedBy: artifact.approved_by,
        approvedAt: artifact.approved_at,
        createdAt: artifact.created_at,
        updatedAt: artifact.updated_at,
        metadata: artifact.metadata
      }
    });

  } catch (error) {
    console.error('Error in get artifact API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH - Update Artifact
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artifactId = resolvedParams.id;
    const body = await request.json();

    const { title, content, metadata, isApproved } = body;

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

    // Build updates object (only update provided fields)
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      updates.content = typeof content === 'string' ? { text: content } : content;
    }
    if (metadata !== undefined) updates.metadata = metadata;
    if (isApproved !== undefined) {
      updates.is_approved = isApproved;
      if (isApproved) {
        updates.approved_by = user.id;
        updates.approved_at = new Date().toISOString();
      }
    }

    // If no updates provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update artifact
    const { data: artifact, error: updateError } = await supabase
      .from('workflow_task_artifacts')
      .update(updates)
      .eq('id', artifactId)
      .select()
      .single();

    if (updateError || !artifact) {
      console.error('Error updating artifact:', updateError);
      return NextResponse.json(
        { error: 'Failed to update artifact' },
        { status: 500 }
      );
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
        approvedBy: artifact.approved_by,
        approvedAt: artifact.approved_at,
        createdAt: artifact.created_at,
        updatedAt: artifact.updated_at,
        metadata: artifact.metadata
      }
    });

  } catch (error) {
    console.error('Error in update artifact API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE - Delete Artifact
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const artifactId = resolvedParams.id;

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

    // Delete artifact
    const { error: deleteError } = await supabase
      .from('workflow_task_artifacts')
      .delete()
      .eq('id', artifactId);

    if (deleteError) {
      console.error('Error deleting artifact:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Artifact deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete artifact API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
