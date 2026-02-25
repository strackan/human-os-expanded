/**
 * Synthesis Prompt
 *
 * After onboarding completes, this prompt distills the conversation transcript
 * into structured identity profile fields for human_os.identity_profiles.
 *
 * Modeled after founder-os synthesis-prompt.ts, adapted for CSM-specific signals.
 */

export function getSynthesisPrompt(): string {
  return `You are an expert personality analyst. Given a conversation transcript between an onboarding companion ("The Sculptor") and a new CSM user, extract structured insights about the user.

## Your Task
Analyze the transcript and extract identity profile fields. Base conclusions ONLY on evidence from the conversation. Mark confidence levels.

## Output Format
Return a JSON object with these fields:

{
  "communication_style": "How they communicate — tone, formality, humor, brevity/verbosity. 1-2 sentences. [SOLID/INFERRED]",
  "work_style": "How they approach work — priorities, decision style, pace. 1-2 sentences. [SOLID/INFERRED/GAP]",
  "energy_patterns": "What energizes and drains them. 1-2 sentences. [SOLID/INFERRED/GAP]",
  "core_values": ["value1", "value2", "value3"],
  "interest_vectors": ["interest1", "interest2"],
  "relationship_orientation": "How they relate to others — depth vs breadth, formality. 1-2 sentences. [SOLID/INFERRED/GAP]",
  "cognitive_profile": "Thinking patterns, decision-making style. 1-2 sentences. [INFERRED/GAP]"
}

## Confidence Markers
- **[SOLID]** — Directly evidenced by what the user said or how they said it
- **[INFERRED]** — Reasonable inference from limited evidence
- **[GAP]** — Not enough data; use this marker and leave the field as a best guess or "Unknown — needs more interaction"

## Analysis Guidelines

### Communication Style (from HOW they wrote)
- Short answers → concise communicator
- Humor/jokes → humor-forward
- Formal language → professional tone
- Emojis/casual → relaxed/informal
- Detailed responses → thorough, reflective

### Work Style (from WHAT they prioritize)
- If they mention data/metrics → analytical
- If they mention people/relationships → relationship-first
- If they mention speed/results → action-oriented
- If they chose option A (riskiest renewals) → data-driven
- If they chose option B (meeting prep) → relationship-focused
- If they chose option C (walkthrough) → process-oriented
- If they chose option D (explore) → independent/self-directed

### Core Values (extract 2-4 max)
Look for what they emphasize, defend, or get excited about. Common CSM values:
- Customer advocacy, empathy, thoroughness, efficiency, growth, authenticity

### Interest Vectors
Topics they gravitated toward or showed genuine energy for.

## Rules
1. Return ONLY the JSON object. No markdown fences, no explanation.
2. Every field must include a confidence marker in brackets.
3. Prefer [GAP] over wild speculation. The system will naturally fill gaps over time.
4. Quote their actual words where possible as evidence within the field text.
5. core_values and interest_vectors arrays should contain 2-4 items max.
6. Keep all text descriptions to 1-3 sentences. Be concise.`;
}

/**
 * Build the full synthesis input for Claude.
 */
export function buildSynthesisInput(
  transcript: Array<{ role: string; content: string }>,
  sessionMetadata: {
    opener_used?: string | null;
    option_selected?: string | null;
    opener_depth?: number;
  }
): string {
  const transcriptText = transcript
    .map((entry) => `${entry.role === 'assistant' ? 'Sculptor' : 'User'}: ${entry.content}`)
    .join('\n\n');

  const meta = [];
  if (sessionMetadata.opener_used) {
    meta.push(`Ice-breaker used: "${sessionMetadata.opener_used}"`);
  }
  if (sessionMetadata.option_selected) {
    meta.push(`Value-delivery option selected: ${sessionMetadata.option_selected}`);
  }
  if (sessionMetadata.opener_depth) {
    meta.push(`Follow-up depth: ${sessionMetadata.opener_depth} exchanges`);
  }

  return `## Session Metadata
${meta.length > 0 ? meta.join('\n') : 'No metadata available'}

## Conversation Transcript
${transcriptText}`;
}
