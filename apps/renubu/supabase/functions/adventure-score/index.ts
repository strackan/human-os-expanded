// Adventure Score — evaluates a ghost conversation session
// Uses Claude to score discovery, action choice, and efficiency.
// Returns enriched response with verdicts, achievements, outcome deltas.
// Also handles saving sessions to the database.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Handle session save
    if (body.save && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await supabase.from("adventure_sessions").insert({
        visitor_id: body.visitor_id || null,
        scenario_id: body.scenario_id,
        transcript: body.transcript,
        facts_discovered: body.facts_discovered,
        action_chosen: body.action_chosen,
        score_discovery: body.score_discovery,
        score_action: body.score_action,
        score_efficiency: body.score_efficiency,
        score_total: body.score_total,
        verdict: body.verdict || null,
        outcome_delta: body.outcome_delta || null,
        bonuses: body.bonuses || null,
        baseline_score: 50,
      });
      if (error) console.error("Save session error:", error);

      // Mark visitor as played
      if (body.visitor_id) {
        await supabase
          .from("adventure_visitors")
          .update({ played: true })
          .eq("id", body.visitor_id);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Score the session
    const { scenario_id, transcript, facts_discovered, action_chosen, scoring_context } = body;

    if (!scenario_id || !transcript || !action_chosen) {
      return new Response(
        JSON.stringify({ error: "scenario_id, transcript, and action_chosen are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userQuestions = transcript.filter((m: { role: string }) => m.role === "user");
    const questionCount = userQuestions.length;
    const factCount = (facts_discovered || []).length;

    // Build scoring prompt for Claude
    const scoringSystemPrompt = `You are an expert customer success scoring engine. You evaluate ghost customer interview sessions using a BASELINE-DELTA model.

Each scenario has a baseline outcome (score = 50) representing what actually happened. The player's score reflects whether they improved or worsened reality.

You will receive:
1. The scenario context, baseline outcome, and scoring rubric
2. The full conversation transcript
3. Which facts the player discovered
4. What action the player chose

Score the session across three dimensions:

## Discovery Score (0-40 pts)
Based on which facts were discovered and their tier values:
- Tier 1 (Surface): 2 pts each
- Tier 2 (Signal): 4-5 pts each
- Tier 3 (Deep): 6-8 pts each
- Tier 4 (Personal): 3 pts each
- Facts tagged as "outcome_changing" are worth MORE — they shift the result away from baseline
- Expansion signals are worth MORE than risk signals
Cap at 40.

## Action Score (0-40 pts)
Scored as DELTA FROM BASELINE:
- Action that significantly improves on reality: 25-40
- Action that somewhat improves on reality: 15-24
- Action that matches reality (what most people would do): 8-14
- Action that's worse than reality: 0-7
- An action only scores high if the player has the context to back it up

## Efficiency Score (0-20 pts)
- Found expansion signal in ≤5 questions: +8 pts
- High reveal rate (facts per question): +7 pts
- Built rapport before probing (didn't interrogate): +5 pts

## Achievement Detection
Check for these achievements and include any that apply:
- "the_pivot": First 3 questions got only tier 1 reveals, then shifted to tier 2+ probing
- "first_instinct": Found a tier 2+ signal in first 3 questions
- "the_silence": Triggered a tier 3 reveal
- "against_the_grain": Chose an unconventional but high-scoring action (see rubric)
- "called_it": Asked directly about the core issue (the main problem driving the scenario)

## Verdict Selection
Based on the total score, select the appropriate verdict tier:
- 70+: "high" verdict
- 40-69: "mid" verdict
- <40: "low" verdict

## Sentiment Assessment
Based on the conversation flow, assess:
- What emotional state the character started in
- What emotional state they ended in

Respond with ONLY valid JSON, no markdown:
{
  "score_discovery": <number>,
  "score_action": <number>,
  "score_efficiency": <number>,
  "score_total": <number>,
  "verdict_tier": "<high|mid|low>",
  "achievements": ["<achievement_id>", ...],
  "missed_facts": ["<fact description 1>", "<fact description 2>", ...],
  "sentiment_shift": { "start": "<emotional_state>", "end": "<emotional_state>" },
  "reasoning": "<brief explanation of scoring>"
}`;

    const scoringUserPrompt = `## SCENARIO CONTEXT & RUBRIC
${scoring_context || "No specific rubric provided."}

## FACTS DISCOVERED
${facts_discovered && facts_discovered.length > 0 ? facts_discovered.join(", ") : "None"}

## ACTION CHOSEN
${action_chosen}

## CONVERSATION TRANSCRIPT
${transcript.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

## STATS
- Questions asked: ${questionCount}
- Facts discovered: ${factCount}

Score this session now. Return ONLY JSON.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0.3,
        system: scoringSystemPrompt,
        messages: [{ role: "user", content: scoringUserPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic scoring error:", anthropicResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Scoring API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await anthropicResponse.json();
    const responseText = result.content?.[0]?.text || "{}";

    // Parse the JSON response from Claude
    let scores;
    try {
      scores = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scores = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse scoring response");
      }
    }

    // Ensure total is correct
    scores.score_total = (scores.score_discovery || 0) + (scores.score_action || 0) + (scores.score_efficiency || 0);

    // Ensure arrays exist
    scores.achievements = scores.achievements || [];
    scores.missed_facts = scores.missed_facts || [];
    scores.sentiment_shift = scores.sentiment_shift || { start: "guarded", end: "guarded" };
    scores.verdict_tier = scores.verdict_tier || (scores.score_total >= 70 ? "high" : scores.score_total >= 40 ? "mid" : "low");

    return new Response(JSON.stringify(scores), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Score error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
