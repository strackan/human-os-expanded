/**
 * POST /api/tutorial/tools-testing/extract
 *
 * Extract entities from a brain dump text using Claude.
 * Returns people, tasks, projects, goals, and parking lot items.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ExtractRequest {
  brain_dump: string;
  session_id: string;
  user_id: string;
  commandments?: {
    WORK_STYLE?: string;
    CONVERSATION_PROTOCOLS?: string;
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are an entity extraction system for a personal productivity tool. Your job is to analyze a "brain dump" - a stream-of-consciousness text from a user - and extract structured entities.

You must return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "people": [
    {
      "name": "Person's Name",
      "relationship_type": "colleague|friend|family|mentor|client|partner|report|vendor|other",
      "context": "Brief description of how they were mentioned",
      "confidence": 0.0-1.0
    }
  ],
  "tasks": [
    {
      "title": "Action item title (imperative verb)",
      "description": "Optional details",
      "due_date": "YYYY-MM-DD or null if not mentioned",
      "priority": "critical|high|medium|low",
      "context_tags": ["tag1", "tag2"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "What the project is about",
      "status": "active|planning|on_hold|completed"
    }
  ],
  "goals": [
    {
      "title": "Goal statement",
      "timeframe": "this week|this month|this quarter|this year|someday|null"
    }
  ],
  "parking_lot": [
    {
      "raw_input": "Original text snippet",
      "cleaned_text": "Cleaned/normalized version",
      "capture_mode": "project|brainstorm|expand|passive"
    }
  ],
  "summary": "One sentence summary of what was captured"
}

Guidelines:
- **People**: Extract named individuals. Infer relationship type from context (e.g., "my boss Sarah" = colleague/report relationship)
- **Tasks**: Look for action items, todos, things to do. Convert to imperative form ("Call Mike" not "Need to call Mike"). Infer priority from urgency signals.
- **Projects**: Ongoing initiatives, products, or work streams. Not one-off tasks.
- **Goals**: Objectives, targets, aspirations. Different from tasks - these are outcomes not actions.
- **Parking Lot**: Ideas, thoughts, or topics to think about later. Things that don't fit other categories but shouldn't be lost.
  - capture_mode: "project" for potential projects, "brainstorm" for ideas, "expand" for topics to explore, "passive" for interesting observations

Be generous with extraction - better to capture something uncertain than miss it. Use confidence scores to indicate certainty.

If a date like "tomorrow", "next week", or "Friday" is mentioned, convert it relative to today's date.`;

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { brain_dump, session_id, user_id, commandments } = body;

    // Validate required fields
    if (!brain_dump || !session_id || !user_id) {
      return NextResponse.json(
        { error: 'brain_dump, session_id, and user_id are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (brain_dump.trim().length < 10) {
      return NextResponse.json(
        { error: 'Brain dump is too short. Please provide more detail.' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[tools-testing/extract] Extracting entities for session ${session_id}`);

    // Build context from commandments if available
    let personaContext = '';
    if (commandments?.WORK_STYLE) {
      personaContext += `\n\nUser's work style context: ${commandments.WORK_STYLE}`;
    }

    // Get today's date for relative date conversion
    const today = new Date();
    const dateContext = `Today is ${today.toISOString().split('T')[0]} (${today.toLocaleDateString('en-US', { weekday: 'long' })}).`;

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${dateContext}${personaContext}

Brain dump to analyze:
---
${brain_dump}
---

Extract all entities and return JSON:`,
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return NextResponse.json(
        { error: 'No response from extraction model' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON from the response (in case there's any wrapper text)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[tools-testing/extract] JSON parse error:', parseError);
      console.error('[tools-testing/extract] Raw response:', content.text.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse extraction response' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Validate and normalize the response
    const result = {
      people: Array.isArray(parsed.people) ? parsed.people : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      parking_lot: Array.isArray(parsed.parking_lot) ? parsed.parking_lot : [],
      summary: parsed.summary || 'Entities extracted from brain dump.',
    };

    // Log counts
    console.log(`[tools-testing/extract] Extracted: ${result.people.length} people, ${result.tasks.length} tasks, ${result.projects.length} projects, ${result.goals.length} goals, ${result.parking_lot.length} parking lot items`);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('[tools-testing/extract] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
