/**
 * API Route: Generate LLM Greeting
 *
 * Server-side endpoint for generating personalized workflow greetings.
 * This runs on the server where we can access the filesystem for INTEL files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateGreeting } from '@/lib/workflows/llm/GreetingGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, workflowPurpose, slideId, fallbackGreeting } = body;

    if (!customerName) {
      return NextResponse.json(
        { error: 'customerName is required' },
        { status: 400 }
      );
    }

    console.log('[API /workflows/greeting] Generating greeting for:', customerName);

    const result = await generateGreeting({
      customerName,
      workflowPurpose: workflowPurpose || 'renewal_preparation',
      slideId: slideId || 'greeting',
      fallbackGreeting,
    });

    console.log('[API /workflows/greeting] Generated:', {
      textLength: result.text.length,
      toolsUsed: result.toolsUsed,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /workflows/greeting] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
