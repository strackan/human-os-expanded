/**
 * Onboarding Complete API
 *
 * POST /api/onboarding/complete — Mark session as completed or skipped,
 * trigger synthesis of user context via human-os.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AnthropicService } from '@/lib/services/AnthropicService';
import { getSynthesisPrompt, buildSynthesisInput } from '@/lib/onboarding/synthesis-prompt';
import { saveUserContext } from '@/lib/onboarding/human-os-client';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import type { IdentityProfileUpdate } from '@human-os/services';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, optionSelected, skip } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const service = new OnboardingService(supabase);
    const session = await service.getActiveSession(user.id);

    if (!session || session.id !== sessionId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let updatedSession;

    if (skip) {
      updatedSession = await service.skipSession(sessionId);

      // Write minimal profile with GAP markers
      triggerSynthesisAsync(user.id, null);
    } else {
      if (!optionSelected) {
        return NextResponse.json({ error: 'optionSelected required' }, { status: 400 });
      }

      updatedSession = await service.completeSession(sessionId, optionSelected);

      // Fire synthesis asynchronously — don't block the response
      triggerSynthesisAsync(user.id, updatedSession);
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('[Onboarding Complete API] error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

/**
 * Run synthesis in the background. If it fails, the session is still marked
 * complete — user context will have GAP markers and can be retried later.
 */
function triggerSynthesisAsync(
  userId: string,
  session: {
    conversation_log: Array<{ role: string; content: string }>;
    opener_used?: string | null;
    option_selected?: string | null;
    opener_depth?: number;
  } | null
): void {
  (async () => {
    try {
      if (!session || session.conversation_log.length === 0) {
        // Skipped or empty — save minimal GAP profile
        await saveUserContext(userId, {
          communication_style: 'Unknown — needs more interaction [GAP]',
          work_style: 'Unknown — needs more interaction [GAP]',
          energy_patterns: 'Unknown — needs more interaction [GAP]',
          core_values: [],
          interest_vectors: [],
        });
        return;
      }

      const synthesisPrompt = getSynthesisPrompt();
      const synthesisInput = buildSynthesisInput(session.conversation_log, {
        opener_used: session.opener_used,
        option_selected: session.option_selected,
        opener_depth: session.opener_depth,
      });

      const result = await AnthropicService.generateConversation({
        messages: [{ role: 'user', content: synthesisInput }],
        systemPrompt: synthesisPrompt,
        model: CLAUDE_SONNET_CURRENT,
        maxTokens: 1500,
        temperature: 0.3,
      });

      // Parse the JSON response
      let profileData: IdentityProfileUpdate;
      try {
        // Strip markdown fences if present
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        profileData = JSON.parse(cleaned);
      } catch {
        console.error('[Synthesis] Failed to parse synthesis output:', result.content);
        // Save what we can
        await saveUserContext(userId, {
          communication_style: 'Synthesis failed — needs retry [GAP]',
        });
        return;
      }

      await saveUserContext(userId, profileData);
      console.log('[Synthesis] Successfully saved user context for:', userId);
    } catch (error) {
      console.error('[Synthesis] Async synthesis failed:', error);
      // Non-fatal — session is already marked complete
    }
  })();
}
