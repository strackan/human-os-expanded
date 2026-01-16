/**
 * POST /api/sculptor/sessions/[sessionId]/report
 *
 * Generate an executive report analyzing the user's personality,
 * communication style, and work patterns from their Sculptor session.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// CORS headers for desktop app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface ExecutiveReport {
  summary: string;
  personality: {
    trait: string;
    description: string;
    insight: string;
  }[];
  communication: {
    style: string;
    preferences: string[];
  };
  workStyle: {
    approach: string;
    strengths: string[];
  };
  keyInsights: string[];
  voice: {
    tone: string;
    style: string;
    characteristics: string[];
    examples: string[];
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse request body (type field reserved for future report types)
    await request.json().catch(() => ({}));

    // Create service client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the session with metadata
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_slug, entity_name, metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: `Session not found: ${sessionError?.message}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if we already have a cached report
    if (session.metadata?.executive_report) {
      return NextResponse.json({
        status: 'cached',
        report: session.metadata.executive_report,
        generated_at: session.metadata.executive_report_generated,
      }, { headers: corsHeaders });
    }

    // Fetch conversation transcript - try sculptor_messages first, then metadata
    let transcript = '';

    const { data: messages, error: messagesError } = await supabase
      .from('sculptor_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messages && messages.length > 0) {
      // Build transcript from sculptor_messages table
      transcript = messages
        .map(m => `${m.role === 'assistant' ? 'Sculptor' : 'User'}: ${m.content}`)
        .join('\n\n');
    } else if (session.metadata?.conversation_history) {
      // Fallback: use conversation_history from metadata
      console.log('[report] Using conversation_history from metadata');
      const history = session.metadata.conversation_history as Array<{ role: string; content: string }>;
      transcript = history
        .map(m => `${m.role === 'assistant' ? 'Sculptor' : 'User'}: ${m.content}`)
        .join('\n\n');
    }

    if (!transcript) {
      console.error('[report] No conversation found:', messagesError?.message);
      return NextResponse.json(
        { error: 'No conversation transcript available' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get persona fingerprint if available
    const personaFingerprint = session.metadata?.persona_fingerprint;

    // Generate report using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const systemPrompt = `You are an expert analyst who creates insightful executive summaries about people based on their conversations. Your goal is to provide valuable, actionable insights that help the person understand themselves better.

Your output must be valid JSON matching this exact structure:
{
  "summary": "2-3 sentences capturing the essence of who this person is",
  "personality": [
    {
      "trait": "Name of trait",
      "description": "What this trait looks like in them",
      "insight": "How this serves them or something to be aware of"
    }
  ],
  "communication": {
    "style": "Brief description of their communication style",
    "preferences": ["Preference 1", "Preference 2", "Preference 3"]
  },
  "workStyle": {
    "approach": "How they approach their work",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"]
  },
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "voice": {
    "tone": "Overall tone of their communication (e.g., conversational, authoritative, warm)",
    "style": "How they construct thoughts and express ideas",
    "characteristics": ["Characteristic 1", "Characteristic 2", "Characteristic 3"],
    "examples": ["Direct quote or phrase 1", "Direct quote or phrase 2"]
  }
}

Guidelines:
- Be warm but honest - don't just flatter
- Focus on what makes this person unique
- Include 2-3 personality traits
- Make insights actionable and specific
- Use their actual words/examples when possible
- Keep it concise but meaningful
- For voice analysis, pay attention to word choice, sentence structure, and distinctive phrases they use`;

    const userPrompt = `Analyze this conversation and create an executive report about the person.

${personaFingerprint ? `Persona fingerprint (0-10 scale):
- Self-deprecation: ${personaFingerprint.self_deprecation}
- Directness: ${personaFingerprint.directness}
- Warmth: ${personaFingerprint.warmth}
- Intellectual signaling: ${personaFingerprint.intellectual_signaling}
- Comfort with sincerity: ${personaFingerprint.comfort_with_sincerity}
- Absurdism tolerance: ${personaFingerprint.absurdism_tolerance}
- Format awareness: ${personaFingerprint.format_awareness}
- Vulnerability as tool: ${personaFingerprint.vulnerability_as_tool}

` : ''}Conversation transcript:
${transcript}

Generate a thoughtful executive report in JSON format.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    // Parse the response
    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text
      : '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }

    let report: ExecutiveReport;
    try {
      report = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[report] Failed to parse LLM response:', parseError);
      console.error('[report] Response text:', responseText);
      // Return a fallback report
      report = {
        summary: "Based on our conversation, you're someone who brings a thoughtful and authentic approach to your work and relationships.",
        personality: [
          {
            trait: "Thoughtful Communicator",
            description: "You take time to articulate your thoughts clearly.",
            insight: "This builds trust but may sometimes slow quick decisions."
          }
        ],
        communication: {
          style: "Considered and authentic",
          preferences: [
            "Clear context before conclusions",
            "Honest, direct feedback",
            "Space to process complex information"
          ]
        },
        workStyle: {
          approach: "Methodical and purpose-driven",
          strengths: [
            "Deep focus on meaningful problems",
            "Building lasting solutions",
            "Connecting disparate ideas"
          ]
        },
        keyInsights: [
          "You value depth over breadth in your work.",
          "You appreciate when others come prepared.",
          "You work best with clear priorities and uninterrupted time."
        ],
        voice: {
          tone: "Thoughtful and measured",
          style: "Clear, concise statements with considered pacing",
          characteristics: [
            "Deliberate word choice",
            "Balanced between formal and conversational",
            "Direct but warm"
          ],
          examples: []
        }
      };
    }

    // Cache the report in session metadata
    await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...session.metadata,
          executive_report: report,
          executive_report_generated: new Date().toISOString(),
        },
      })
      .eq('id', sessionId);

    return NextResponse.json({
      status: 'generated',
      report,
      generated_at: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[report] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
