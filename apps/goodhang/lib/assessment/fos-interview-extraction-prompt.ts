/**
 * FOS Interview Registry Extraction Prompt
 *
 * Extracts structured registry items (stories, anecdotes, events, people, parking_lot)
 * from FOS Interview answers (a1-c5). No CORRECTIONS extraction since FOS Interview
 * has no prior assumptions to correct.
 *
 * Designed to run with Claude Haiku in parallel with the main synthesis call.
 */

import type { ExtractedRegistryData } from './extraction-prompt';

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

export const FOS_INTERVIEW_EXTRACTION_SYSTEM = `You are extracting structured personality data from FOS Interview answers.

The FOS Interview is a structured 12-question interview (a1-c5) that asks about identity, stories, relationships, and work patterns. Your job is to extract discrete registry items from these answers.

## Registry Categories

### 1. STORIES (Highest Priority)
Extended narratives with emotional arcs. Questions a1-a4 are specifically designed to elicit stories.
- Must have a clear title, summary, emotional tone
- Must include a core quote (their actual words)
- Usually 3+ sentences with personal investment

### 2. ANECDOTES
Brief examples or proof points — shorter than stories.
- One or two sentences illustrating a point
- Questions b2, c1, c2 often produce these

### 3. EVENTS
Key life moments with dates or timeframes.
- Turning points, transitions, specific incidents
- Questions a1, a3, a4, c1 often mention these

### 4. PEOPLE
Important relationships mentioned in answers.
- Named individuals or relationship references
- Questions a1-a4, b3, c4 often mention people
- Note relationship type and context

### 5. PARKING_LOT
Topics mentioned but not fully explored — ideas the AI should follow up on later.
- Question c5 (ideal AI) is a rich source
- Anything that hints at deeper exploration needed

## CRITICAL RULES
- EVERY field must have actual content — NO empty strings, NO "N/A", NO placeholders
- If you cannot fill all required fields for an item, DO NOT include it
- Quality over quantity: 3 complete items beats 8 incomplete ones
- Do NOT extract CORRECTIONS — FOS Interview has no prior assumptions to correct
- Use the question context to understand what the person is describing

## Output Format
Return valid JSON (no markdown code blocks):

{
  "stories": [
    {
      "id": "S01",
      "title": "Short descriptive title",
      "summary": "2-3 sentence summary of the story",
      "core_quote": "Their actual words from the answer",
      "emotional_tone": "e.g., reflective, intense, warm",
      "tags": ["relevant", "topic", "tags"],
      "used_in": ["THEMES.md", "CRISIS_PROTOCOLS.md"],
      "confidence": "high",
      "source_question": "a1"
    }
  ],
  "anecdotes": [
    {
      "id": "A01",
      "summary": "Brief description of the anecdote",
      "quote": "Their words if available",
      "illustrates": "What point this proves",
      "tags": ["tags"],
      "used_in": ["WORK_STYLE.md"],
      "confidence": "high",
      "source_question": "c1"
    }
  ],
  "events": [
    {
      "id": "EV01",
      "date_range": "approximate timeframe",
      "summary": "What happened",
      "impact": "How it affected them",
      "tags": ["tags"],
      "used_in": ["THEMES.md"],
      "confidence": "high",
      "source_question": "a1"
    }
  ],
  "people": [
    {
      "id": "P01",
      "name": "Person's name or identifier",
      "relationship": "How they relate to the subject",
      "context": "Why they matter in this context",
      "can_reference": true,
      "tags": ["mentor", "family"]
    }
  ],
  "parking_lot": [
    {
      "id": "PL01",
      "topic": "Topic name",
      "priority": "high",
      "context": "Why this is worth exploring",
      "follow_up_questions": ["Suggested follow-up questions"]
    }
  ]
}`;

// =============================================================================
// USER PROMPT BUILDER
// =============================================================================

/** Question labels for context in the extraction prompt */
const QUESTION_CONTEXT: Record<string, string> = {
  a1: 'Turning point moment — expect STORY, EVENT, PEOPLE',
  a2: 'Happiest memory — expect STORY, EVENT, PEOPLE',
  a3: 'Difficult time that shaped them — expect STORY, EVENT, PEOPLE',
  a4: 'Bad situation → good outcome — expect STORY, EVENT, PEOPLE',
  b1: 'Core identity — themes, no specific registry items expected',
  b2: 'Simple thing that matters — expect ANECDOTE',
  b3: 'What they need from relationships — expect PEOPLE',
  c1: 'Peak vs worst performance — expect EVENTS, ANECDOTES',
  c2: 'How they recover from struggle — expect ANECDOTES',
  c3: 'Feedback preferences — no specific registry items expected',
  c4: 'How they build rapport — expect PEOPLE',
  c5: 'Ideal AI assistant — expect PARKING_LOT items',
};

export function getFosInterviewExtractionPrompt(
  answers: Record<string, string>,
  questionEAnswers?: Record<string, string>,
  entityName?: string
): string {
  const name = entityName || 'this person';

  let prompt = `Extract structured personality data for ${name} from these FOS Interview answers.

## FOS INTERVIEW ANSWERS

`;

  // Add each answer with its question context
  for (const [questionId, answer] of Object.entries(answers)) {
    const context = QUESTION_CONTEXT[questionId] || '';
    prompt += `### Question ${questionId}${context ? ` (${context})` : ''}
${answer}

`;
  }

  // Add Question E answers if available (supplementary context)
  if (questionEAnswers && Object.keys(questionEAnswers).length > 0) {
    prompt += `## SUPPLEMENTARY: Question E Answers (additional context)

`;
    for (const [questionId, answer] of Object.entries(questionEAnswers)) {
      prompt += `### ${questionId}
${answer}

`;
    }
  }

  prompt += `---

## EXTRACTION PRIORITIES

### 1. STORIES from a1-a4 (Highest Priority)
These questions explicitly ask for stories. Extract each distinct narrative as a separate story.
Look for: emotional arcs, specific details, lessons learned, transformative moments.

### 2. PEOPLE mentioned across all answers
Names, relationships, roles in stories. Pay attention to a1-a4 (story questions) and b3 (relationships), c4 (rapport).

### 3. EVENTS with timeframes
Turning points, specific incidents, career transitions. Pay attention to a1, a3, a4, c1.

### 4. ANECDOTES from b2, c1, c2
Brief examples and proof points, shorter than full stories.

### 5. PARKING_LOT from c5 and other unexplored threads
Ideas about ideal AI support, topics hinted at but not explored.

Return valid JSON matching the schema described in the system prompt.`;

  return prompt;
}

// =============================================================================
// RESPONSE PARSER
// =============================================================================

/**
 * Parse the Claude Haiku extraction response into ExtractedRegistryData.
 * Gracefully handles malformed responses by returning empty arrays.
 */
export function parseFosInterviewExtraction(
  response: { content: Array<{ type: string; text?: string }> } | string
): ExtractedRegistryData {
  try {
    const text = typeof response === 'string'
      ? response
      : response.content[0]?.type === 'text'
        ? response.content[0].text || ''
        : '';

    if (!text) {
      console.warn('[fos-extraction] Empty response from extraction');
      return emptyRegistryData();
    }

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let cleaned = text.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    // Validate and filter items
    return {
      stories: (parsed.stories || []).filter(isValidStory),
      anecdotes: (parsed.anecdotes || []).filter(isValidAnecdote),
      events: (parsed.events || []).filter(isValidEvent),
      people: (parsed.people || []).filter(isValidPerson),
      corrections: [], // FOS Interview does not produce corrections
      parking_lot: parsed.parking_lot || [],
    };
  } catch (e) {
    console.error('[fos-extraction] Failed to parse extraction response:', e);
    return emptyRegistryData();
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function isValidStory(s: { title?: string; summary?: string }): boolean {
  return !!(s.title && s.title !== 'N/A' && s.summary && s.summary.length > 20);
}

function isValidAnecdote(a: { summary?: string }): boolean {
  return !!(a.summary && a.summary !== 'N/A' && a.summary.length > 10);
}

function isValidEvent(e: { summary?: string }): boolean {
  return !!(e.summary && e.summary !== 'N/A' && e.summary.length > 10);
}

function isValidPerson(p: { name?: string; relationship?: string }): boolean {
  return !!(p.name && p.name !== 'N/A' && p.relationship && p.relationship !== 'N/A');
}

function emptyRegistryData(): ExtractedRegistryData {
  return {
    stories: [],
    anecdotes: [],
    events: [],
    people: [],
    corrections: [],
    parking_lot: [],
  };
}
