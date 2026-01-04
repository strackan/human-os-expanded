/**
 * Simple Claude API Test
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_HAIKU_CURRENT } from '@/lib/constants/claude-models';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    console.log('[Test Claude] API Key present:', !!apiKey);
    console.log('[Test Claude] API Key prefix:', apiKey?.substring(0, 20));
    console.log('[Test Claude] Full env keys:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not found in environment' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    console.log('[Test Claude] Calling Anthropic API...');

    const response = await client.messages.create({
      model: CLAUDE_HAIKU_CURRENT,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('[Test Claude] Success! Response received');

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n');

    return NextResponse.json({
      success: true,
      response: text,
      model: response.model,
      tokens: response.usage,
    });
  } catch (error: any) {
    console.error('[Test Claude] Error:', error);
    console.error('[Test Claude] Error status:', error.status);
    console.error('[Test Claude] Error message:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        status: error.status,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
