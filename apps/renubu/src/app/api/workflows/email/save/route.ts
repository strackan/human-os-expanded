/**
 * Email Save API Route
 *
 * POST /api/workflows/email/save
 *
 * Saves generated email to workflow_task_artifacts table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import type { SaveEmailRequest, SaveEmailResponse } from '@/types/email';

/**
 * POST /api/workflows/email/save
 *
 * Save generated email draft to database
 *
 * Request body:
 * {
 *   customerId: string;
 *   workflowTaskId?: string;
 *   email: {
 *     subject: string;
 *     body: string;
 *     tone: EmailTone;
 *     recipientContactId?: string;
 *   };
 *   metadata: EmailMetadata;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   artifactId?: string;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SaveEmailRequest = await request.json();
    const { customerId, workflowTaskId, email, metadata } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: customerId',
        } as SaveEmailResponse,
        { status: 400 }
      );
    }

    if (!email || !email.subject || !email.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required email fields (subject, body)',
        } as SaveEmailResponse,
        { status: 400 }
      );
    }

    if (!metadata || !metadata.emailType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required metadata fields',
        } as SaveEmailResponse,
        { status: 400 }
      );
    }

    // Auth handling - support demo mode
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    const supabase =
      demoMode || authBypassEnabled
        ? createServiceRoleClient()
        : await createServerSupabaseClient();

    // Get authenticated user (for audit trail)
    let userId: string | null = null;
    if (!demoMode && !authBypassEnabled) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized. Please sign in.',
          } as SaveEmailResponse,
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // Build artifact content (JSONB format)
    const artifactContent = {
      subject: email.subject,
      body: email.body,
      tone: email.tone,
      recipientContactId: email.recipientContactId,
      metadata: {
        ...metadata,
        generatedAt: metadata.generatedAt?.toISOString() || new Date().toISOString(),
      },
    };

    // Prepare insert data
    const insertData: any = {
      // Link to task if provided
      task_id: workflowTaskId || null,

      // Artifact details
      artifact_type: 'email_draft',
      title: email.subject,
      content: artifactContent,

      // Generation metadata
      generated_by: 'ai',
      ai_model: metadata.aiModel || 'claude-haiku-4-5-20251001',
      generation_prompt: `Email type: ${metadata.emailType}`,

      // Approval workflow (not approved by default)
      is_approved: false,
    };

    // If we have a user ID, track who generated it
    if (userId) {
      insertData.metadata = { generated_by_user: userId };
    }

    // Insert into workflow_task_artifacts table
    console.log('[Email Save] Saving email artifact:', {
      customerId,
      emailType: metadata.emailType,
      taskId: workflowTaskId,
    });

    const { data, error } = await supabase
      .from('workflow_task_artifacts')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('[Email Save] Database error:', error);
      throw new Error(`Failed to save email: ${error.message}`);
    }

    console.log('[Email Save] Success! Artifact ID:', data.id);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        artifactId: data.id,
      } as SaveEmailResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('[Email Save API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        } as SaveEmailResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      } as SaveEmailResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/email/save
 *
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/workflows/email/save',
      method: 'POST',
      description: 'Save generated email draft to workflow_task_artifacts table',
      requestBody: {
        customerId: 'string (required)',
        workflowTaskId: 'string (optional) - Link to specific workflow task',
        email: {
          subject: 'string (required)',
          body: 'string (required)',
          tone: 'string (required) - formal | casual | urgent',
          recipientContactId: 'string (optional)',
        },
        metadata: {
          emailType: 'string (required)',
          customerId: 'string (required)',
          generatedAt: 'Date (optional)',
          aiModel: 'string (optional)',
          tokensUsed: 'number (optional)',
        },
      },
      response: {
        success: 'boolean',
        artifactId: 'string (UUID of created artifact)',
        error: 'string (if success = false)',
      },
    },
    { status: 200 }
  );
}
