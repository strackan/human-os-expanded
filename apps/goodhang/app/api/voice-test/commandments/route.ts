/**
 * POST /api/voice-test/commandments
 *
 * Analyze all voice test attempts and generate the final "10 Commandments" document.
 * Also saves the commandments to the user's voice profile in the database.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import {
  getCommandmentsSystemPrompt,
  getCommandmentsUserPrompt,
} from '@/lib/voice-test/prompts';
import type {
  GenerateCommandmentsRequest,
  GenerateCommandmentsResponse,
  VoiceCommandment,
} from '@/lib/voice-test/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// CORS headers for desktop app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Map commandment numbers to database types
const COMMANDMENT_TYPE_MAP: Record<number, string> = {
  1: 'THEMES',
  2: 'VOICE',
  3: 'GUARDRAILS',
  4: 'STORIES',
  5: 'ANECDOTES',
  6: 'OPENINGS',
  7: 'MIDDLES',
  8: 'ENDINGS',
  9: 'BLENDS',
  10: 'EXAMPLES',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCommandmentsRequest = await request.json();
    const { session_id, all_attempts } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!all_attempts || all_attempts.length === 0) {
      return NextResponse.json(
        { error: 'all_attempts is required and must not be empty' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get admin client for database operations
    const supabase = getHumanOSAdminClient();

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, entity_name, user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[voice-test/commandments] Session not found:', sessionError?.message);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate commandments using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const systemPrompt = getCommandmentsSystemPrompt();
    const userPrompt = getCommandmentsUserPrompt(all_attempts);

    console.log('[voice-test/commandments] Generating commandments for:', {
      session_id,
      entity_slug: session.entity_slug,
      attemptsCount: all_attempts.length,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    // Extract content from response
    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text
      : '';

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }

    let result: { commandments: VoiceCommandment[]; summary: string };
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[voice-test/commandments] Failed to parse LLM response:', parseError);
      console.error('[voice-test/commandments] Response text:', responseText);

      // Return a fallback
      result = {
        commandments: generateFallbackCommandments(all_attempts),
        summary: 'Your voice profile has been created based on your feedback. These commandments capture your preferences for tone, structure, and style.',
      };
    }

    // Ensure we have exactly 10 commandments
    while (result.commandments.length < 10) {
      result.commandments.push({
        number: result.commandments.length + 1,
        title: `Commandment ${result.commandments.length + 1}`,
        description: 'To be refined with more examples.',
        examples: [],
        contentTypes: [],
      });
    }

    // Save commandments to database
    await saveCommandmentsToDatabase(supabase, session, result.commandments);

    const finalResult: GenerateCommandmentsResponse = {
      commandments: result.commandments,
      summary: result.summary,
    };

    return NextResponse.json(finalResult, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice-test/commandments] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Save commandments to the voice_profiles and voice_commandments tables
 */
async function saveCommandmentsToDatabase(
  supabase: SupabaseClient,
  session: { id: string; entity_slug: string; entity_name: string; user_id?: string },
  commandments: VoiceCommandment[]
) {
  try {
    // Check if voice profile exists for this entity
    const { data: existingProfile } = await supabase
      .from('voice_profiles')
      .select('id')
      .eq('entity_slug', session.entity_slug)
      .single();

    let profileId: string;

    if (existingProfile && typeof existingProfile === 'object' && 'id' in existingProfile) {
      profileId = (existingProfile as { id: string }).id;
      // Update completeness
      await supabase
        .from('voice_profiles')
        .update({
          completeness: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
    } else {
      // Create new voice profile
      const { data: newProfile, error: createError } = await supabase
        .from('voice_profiles')
        .insert({
          entity_slug: session.entity_slug,
          display_name: session.entity_name || session.entity_slug,
          layer: 'private',
          completeness: 100,
        })
        .select('id')
        .single();

      if (createError || !newProfile || typeof newProfile !== 'object' || !('id' in newProfile)) {
        console.error('[voice-test/commandments] Failed to create voice profile:', createError);
        return;
      }
      profileId = (newProfile as { id: string }).id;
    }

    // Upsert commandments
    for (const cmd of commandments) {
      const commandmentType = COMMANDMENT_TYPE_MAP[cmd.number] || 'EXAMPLES';

      // Build markdown content for the commandment
      const content = `# ${cmd.title}

${cmd.description}

## Examples
${cmd.examples.map(ex => `- ${ex}`).join('\n')}

## Applies To
${cmd.contentTypes.length > 0 ? cmd.contentTypes.join(', ') : 'All content types'}
`;

      // Check if commandment exists
      const { data: existing } = await supabase
        .from('voice_commandments')
        .select('id, version')
        .eq('profile_id', profileId)
        .eq('commandment_type', commandmentType)
        .single();

      if (existing && typeof existing === 'object' && 'id' in existing) {
        // Update existing
        const existingObj = existing as { id: string; version: string };
        const newVersion = incrementVersion(existingObj.version);
        await supabase
          .from('voice_commandments')
          .update({
            content,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingObj.id);
      } else {
        // Insert new
        await supabase
          .from('voice_commandments')
          .insert({
            profile_id: profileId,
            commandment_type: commandmentType,
            content,
            version: '1.0',
          });
      }
    }

    console.log('[voice-test/commandments] Saved commandments to database for profile:', profileId);
  } catch (error) {
    console.error('[voice-test/commandments] Error saving to database:', error);
    // Don't throw - we still want to return the commandments even if DB save fails
  }
}

function incrementVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[1] || '0', 10);
  return `${parts[0]}.${minor + 1}`;
}

function generateFallbackCommandments(attempts: GenerateCommandmentsRequest['all_attempts']): VoiceCommandment[] {
  // Generate basic commandments from feedback patterns
  const commandments: VoiceCommandment[] = [];

  // Analyze feedback for patterns
  const negatives: string[] = [];
  const positives: string[] = [];
  const instructions: string[] = [];

  attempts.forEach(a => {
    if (a.feedback) {
      if (a.feedback.whatDidntWork) negatives.push(a.feedback.whatDidntWork);
      if (a.feedback.whatTenLooksLike) positives.push(a.feedback.whatTenLooksLike);
      if (a.feedback.helpfulInstruction) instructions.push(a.feedback.helpfulInstruction);
    }
  });

  // Create basic commandments
  commandments.push({
    number: 1,
    title: 'Know Your Core Themes',
    description: 'Identify the topics and beliefs you consistently return to in your content.',
    examples: positives.slice(0, 2),
    contentTypes: ['linkedin_post', 'email'],
  });

  commandments.push({
    number: 2,
    title: 'Match Your Natural Voice',
    description: 'Write in your authentic voice - don\'t over-formalize or sanitize.',
    examples: [],
    contentTypes: ['linkedin_post', 'email', 'connection_request'],
  });

  commandments.push({
    number: 3,
    title: 'Avoid These Patterns',
    description: negatives.length > 0 ? `Based on your feedback: ${negatives[0]}` : 'Avoid generic corporate speak and buzzwords.',
    examples: negatives.slice(0, 2),
    contentTypes: ['linkedin_post', 'email'],
  });

  // Fill remaining with placeholder commandments
  const placeholderTitles = [
    'Tell Stories That Resonate',
    'Use Memorable Anecdotes',
    'Open Strong',
    'Structure with Purpose',
    'End with Impact',
    'Find Your Blend',
    'Reference Your Best Work',
  ];

  for (let i = 4; i <= 10; i++) {
    commandments.push({
      number: i,
      title: placeholderTitles[i - 4] || `Commandment ${i}`,
      description: instructions[i - 4] || 'To be refined with more examples.',
      examples: [],
      contentTypes: [],
    });
  }

  return commandments;
}
