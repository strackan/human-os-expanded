/**
 * LLM Streaming API
 *
 * GET /api/workflows/executions/[id]/steps/[stepId]/stream
 * - Stream LLM-generated content using Server-Sent Events (SSE)
 *
 * Phase 3.4: Workflow Execution Framework - LLM Integration
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: executionId, stepId } = resolvedParams;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const contextStr = searchParams.get('context');
    const context = contextStr ? JSON.parse(contextStr) : {};

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { status: 400 }
      );
    }

    console.log('[LLM Stream] Starting stream for execution:', executionId, 'step:', stepId);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    // Create readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create LLM stream
          const messageStream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            stream: true
          });

          let fullContent = '';
          let tokenCount = 0;

          // Stream tokens
          for await (const event of messageStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const token = event.delta.text;
              fullContent += token;
              tokenCount++;

              // Send token to client
              const data = JSON.stringify({
                type: 'token',
                content: token,
                tokenCount
              });

              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save artifact to database
          const { error: artifactError } = await supabase
            .from('step_executions')
            .update({
              artifacts: {
                id: stepId,
                title: context.title || 'Generated Content',
                content: fullContent,
                createdAt: new Date().toISOString(),
                type: 'markdown'
              }
            })
            .eq('workflow_execution_id', executionId)
            .eq('step_number', parseInt(stepId));

          if (artifactError) {
            console.error('[LLM Stream] Error saving artifact:', artifactError);
          }

          // Send completion event
          const completeData = JSON.stringify({
            type: 'complete',
            content: fullContent,
            tokenCount
          });

          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          controller.close();

          console.log('[LLM Stream] Stream complete, tokens:', tokenCount);
        } catch (error) {
          console.error('[LLM Stream] Error:', error);

          const errorData = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          });

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('[LLM Stream] Setup error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to start stream'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
