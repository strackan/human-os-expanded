/**
 * LLM Streaming API
 *
 * GET /api/workflows/executions/[id]/steps/[stepId]/stream
 * - Stream LLM-generated content using Server-Sent Events (SSE)
 * - Uses Ollama for local LLM inference with mock fallback
 *
 * Phase 3.4: Workflow Execution Framework - LLM Integration
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// Simple mock response generator
function generateMockResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('renewal') || lowerPrompt.includes('contract')) {
    return "Based on the customer's renewal timeline, I recommend scheduling a QBR within the next 30 days to discuss their success metrics and future goals. This will help position the renewal conversation around value delivered.";
  }

  if (lowerPrompt.includes('risk') || lowerPrompt.includes('churn')) {
    return "The current health score indicates moderate risk. Key factors to address: 1) Declining product usage over the past 2 months, 2) No executive sponsor engagement in last quarter, 3) Recent support tickets show frustration with feature gaps. Recommend immediate intervention.";
  }

  return `I've analyzed your request about: "${prompt}". Here are my recommendations:\n\n1. Review current customer engagement metrics\n2. Schedule strategic touch-points with key stakeholders\n3. Prepare value demonstration materials\n4. Develop success plan for next quarter\n\nWould you like me to elaborate on any of these points?`;
}

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

    // Ollama configuration
    const useOllama = process.env.NEXT_PUBLIC_USE_OLLAMA === 'true';
    const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.1:8b';
    const ollamaUrl = 'http://localhost:11434/api/chat';

    // Create readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          let tokenCount = 0;

          if (useOllama) {
            // Try Ollama streaming
            try {
              const ollamaResponse = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: ollamaModel,
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a helpful AI assistant helping a Customer Success Manager with renewal workflows.'
                    },
                    {
                      role: 'user',
                      content: prompt
                    }
                  ],
                  stream: true
                })
              });

              if (!ollamaResponse.ok) {
                throw new Error(`Ollama returned ${ollamaResponse.status}`);
              }

              // Stream Ollama response
              const reader = ollamaResponse.body?.getReader();
              if (!reader) throw new Error('No response body');

              const decoder = new TextDecoder();
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const data = JSON.parse(line);
                      if (data.message?.content) {
                        const token = data.message.content;
                        fullContent += token;
                        tokenCount++;

                        // Send token to client
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                          type: 'token',
                          content: token,
                          tokenCount
                        })}\n\n`));
                      }
                    } catch (e) {
                      // Skip invalid JSON lines
                    }
                  }
                }
              }

              console.log('[LLM Stream] Ollama stream complete');
            } catch (ollamaError) {
              console.warn('[LLM Stream] Ollama failed, using mock response:', ollamaError);
              // Fall through to mock response
              fullContent = generateMockResponse(prompt);
              tokenCount = fullContent.length;

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'token',
                content: fullContent,
                tokenCount
              })}\n\n`));
            }
          } else {
            // Use mock response
            fullContent = generateMockResponse(prompt);
            tokenCount = fullContent.length;

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'token',
              content: fullContent,
              tokenCount
            })}\n\n`));
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
