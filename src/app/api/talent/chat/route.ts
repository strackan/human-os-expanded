/**
 * API Route: Talent Chat
 *
 * Server-side endpoint for generating LLM responses in talent check-in/interview conversations.
 * Follows the same pattern as /api/workflows/greeting for consistency.
 *
 * Features:
 * - Database-backed caching (1 hour TTL for conversations, shorter than greetings)
 * - Token tracking in response
 * - Sentiment detection
 * - Fallback handling
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateTalentChatResponse,
  generateTalentOpening,
} from '@/lib/talent/TalentChatGenerator';
import { LLMCacheService } from '@/lib/persistence/LLMCacheService';
import type { IntelligenceFile, InterviewMessage } from '@/types/talent';

interface ChatRequestBody {
  action: 'opening' | 'respond';
  candidateId: string;
  candidateName: string;
  intelligenceFile: IntelligenceFile;
  sessionType?: 'initial' | 'check_in' | 'deep_dive';
  // For 'respond' action:
  conversationHistory?: InterviewMessage[];
  userMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    const {
      action,
      candidateId,
      candidateName,
      intelligenceFile,
      sessionType = 'check_in',
    } = body;

    // Validate required fields
    if (!candidateId || !candidateName || !intelligenceFile) {
      return NextResponse.json(
        { error: 'candidateId, candidateName, and intelligenceFile are required' },
        { status: 400 }
      );
    }

    // Handle opening message request
    if (action === 'opening') {
      console.log('[API /talent/chat] Generating opening for:', candidateName, 'candidateId:', candidateId);

      // Check cache for opening message (use shorter TTL - 1 hour)
      const cacheKey = `talent-opening:${candidateId}:${sessionType}`;
      const cached = await LLMCacheService.get(cacheKey);

      if (cached) {
        console.log('[API /talent/chat] Cache HIT for opening');
        return NextResponse.json({
          text: cached.content,
          tokensUsed: 0,
          cached: true,
        });
      }

      // Generate new opening
      const result = await generateTalentOpening({
        candidateId,
        candidateName,
        intelligenceFile,
        sessionType,
      });

      // Cache the result (1 hour TTL for openings)
      LLMCacheService.set(cacheKey, result.text, {
        customerId: candidateId,
        ttlHours: 1,
      }).catch(() => {}); // Fire and forget

      console.log('[API /talent/chat] Generated opening:', {
        textLength: result.text.length,
        tokensUsed: result.tokensUsed,
      });

      return NextResponse.json({
        text: result.text,
        tokensUsed: result.tokensUsed,
        cached: false,
      });
    }

    // Handle respond action
    if (action === 'respond') {
      const { conversationHistory, userMessage } = body;

      if (!userMessage) {
        return NextResponse.json(
          { error: 'userMessage is required for respond action' },
          { status: 400 }
        );
      }

      console.log('[API /talent/chat] Generating response for:', candidateName, 'message:', userMessage.substring(0, 50));

      // Don't cache responses - they're context-dependent
      const result = await generateTalentChatResponse({
        candidateId,
        candidateName,
        intelligenceFile,
        conversationHistory: conversationHistory || [],
        userMessage,
        sessionType,
      });

      console.log('[API /talent/chat] Generated response:', {
        textLength: result.text.length,
        tokensUsed: result.tokensUsed,
        sentiment: result.sentiment,
      });

      return NextResponse.json({
        text: result.text,
        tokensUsed: result.tokensUsed,
        sentiment: result.sentiment,
        suggestedNextTopic: result.suggestedNextTopic,
        cached: false,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "opening" or "respond"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /talent/chat] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
