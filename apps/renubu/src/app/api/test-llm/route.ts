/**
 * Simple LLM Test Endpoint
 *
 * Basic test to verify Anthropic API connection works.
 * GET /api/test-llm?name=GrowthStack
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnthropicService } from '@/lib/services/AnthropicService';
import { CLAUDE_HAIKU_CURRENT } from '@/lib/constants/claude-models';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const customerName = searchParams.get('name') || 'Acme';

  console.log('[test-llm] Testing basic LLM call for:', customerName);

  try {
    // Simple test: Say a word starting with the same letter
    const response = await AnthropicService.generateConversation({
      messages: [
        {
          role: 'user',
          content: `Say a single word that starts with the same letter as "${customerName}". Just respond with the word, nothing else.`,
        },
      ],
      systemPrompt: 'You are a helpful assistant. Keep responses minimal.',
      model: CLAUDE_HAIKU_CURRENT,
      temperature: 0.7,
      maxTokens: 50,
    });

    console.log('[test-llm] Success! Response:', response.content);

    return NextResponse.json({
      success: true,
      customerName,
      response: response.content,
      tokensUsed: response.tokensUsed,
      model: CLAUDE_HAIKU_CURRENT,
    });
  } catch (error) {
    console.error('[test-llm] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
