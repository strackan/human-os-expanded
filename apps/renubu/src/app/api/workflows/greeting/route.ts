/**
 * API Route: Generate LLM Greeting
 *
 * Server-side endpoint for generating personalized workflow greetings.
 * This runs on the server where we can access the filesystem for INTEL files.
 *
 * Features:
 * - Database-backed caching (24 hour TTL)
 * - Cache key: greeting:{customerId}:{workflowType}
 * - Returns cached response if available to avoid redundant LLM calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateGreeting } from '@/lib/workflows/llm/GreetingGenerator';
import { LLMCacheService } from '@/lib/persistence/LLMCacheService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerId, workflowPurpose, workflowType, slideId, fallbackGreeting } = body;

    if (!customerName) {
      return NextResponse.json(
        { error: 'customerName is required' },
        { status: 400 }
      );
    }

    const effectiveWorkflowType = workflowType || workflowPurpose || 'renewal_preparation';

    // If we have a customerId, use caching
    if (customerId) {
      console.log('[API /workflows/greeting] Checking cache for:', customerName, 'customerId:', customerId);

      const result = await LLMCacheService.getGreeting(
        customerId,
        customerName,
        effectiveWorkflowType,
        async () => {
          // This function is only called on cache miss
          console.log('[API /workflows/greeting] Cache miss - generating new greeting');
          return generateGreeting({
            customerName,
            workflowPurpose: effectiveWorkflowType,
            slideId: slideId || 'greeting',
            fallbackGreeting,
          });
        }
      );

      console.log('[API /workflows/greeting] Result:', {
        textLength: result.text.length,
        toolsUsed: result.toolsUsed,
        tokensUsed: result.tokensUsed,
        cached: result.cached,
      });

      return NextResponse.json(result);
    }

    // No customerId - generate without caching (fallback for legacy calls)
    console.log('[API /workflows/greeting] No customerId - generating without cache for:', customerName);

    const result = await generateGreeting({
      customerName,
      workflowPurpose: effectiveWorkflowType,
      slideId: slideId || 'greeting',
      fallbackGreeting,
    });

    console.log('[API /workflows/greeting] Generated (uncached):', {
      textLength: result.text.length,
      toolsUsed: result.toolsUsed,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json({ ...result, cached: false });
  } catch (error) {
    console.error('[API /workflows/greeting] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
