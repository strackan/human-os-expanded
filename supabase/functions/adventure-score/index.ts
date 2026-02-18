// Adventure Score — evaluates a ghost conversation session
// Uses Claude to score discovery, action choice, and efficiency.
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
    const scoringSystemPrompt = `You are an expert customer success scoring engine. You evaluate ghost customer interview sessions.

You will receive:
1. The scenario context and scoring rubric
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
- Expansion signals are worth MORE than risk signals
Cap at 40.

## Action Score (0-40 pts)
Based on the action chosen AND what was discovered:
- An action only scores high if the player has the context to back it up
- The BEST action with full context: 35-40 pts
- A good action with partial context: 20-34 pts
- A generic/safe action: 8-19 pts
- A wrong/contradictory action: 0-7 pts

## Efficiency Score (0-20 pts)
- Found expansion signal in ≤5 questions: +8 pts
- High reveal rate (facts per question): +7 pts
- Built rapport before probing (didn't interrogate): +5 pts

Respond with ONLY valid JSON, no markdown:
{
  "score_discovery": <number>,
  "score_action": <number>,
  "score_efficiency": <number>,
  "score_total": <number>,
  "result_label": "<one sentence outcome>",
  "missed_facts": ["<fact description 1>", "<fact description 2>", ...],
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
        max_tokens: 800,
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
