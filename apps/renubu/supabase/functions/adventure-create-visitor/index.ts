// Adventure Create Visitor — generates personalized URL slugs
// Called by Justin (via CLI or admin) to create visitor profiles

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Interest-to-noun mappings — natural phrases, not random combinations
const INTEREST_NOUNS: Record<string, string[]> = {
  chess: ["gambit", "knight", "rook", "sicilian", "endgame", "castling"],
  strategy: ["flanking", "vanguard", "apex", "meridian"],
  sailing: ["true-wind", "port-tack", "windward", "starboard", "halyard"],
  data: ["signal", "vertex", "pipeline", "schema"],
  running: ["negative-split", "tempo", "fartlek", "cadence"],
  music: ["downbeat", "bridge", "crescendo", "refrain"],
  cooking: ["mise-en-place", "reduction", "umami", "sear"],
  climbing: ["crux", "dyno", "send", "redpoint"],
  golf: ["draw-shot", "links", "birdie", "fairway"],
  coffee: ["pour-over", "bloom", "extraction", "origin"],
  reading: ["marginalia", "folio", "colophon", "broadside"],
  fishing: ["tight-line", "hatch", "eddy", "riffle"],
  cycling: ["peloton", "breakaway", "cadence", "drafting"],
  photography: ["aperture", "golden-hour", "bokeh", "exposure"],
  hiking: ["ridgeline", "switchback", "cairn", "treeline"],
  writing: ["first-draft", "revision", "throughline", "arc"],
  baseball: ["changeup", "southpaw", "squeeze", "cleanup"],
  basketball: ["crossover", "triple-threat", "fast-break", "fadeaway"],
  tennis: ["drop-shot", "approach", "topspin", "ace"],
  woodworking: ["dovetail", "mortise", "grain", "kerf"],
  gardening: ["propagation", "hardening", "taproot", "deadhead"],
  meditation: ["still-point", "centering", "breath", "presence"],
  yoga: ["vinyasa", "savasana", "drishti", "bandha"],
  surfing: ["lineup", "duck-dive", "glassy", "offshore"],
};

// Curated adjectives that pair well
const ADJECTIVES = [
  "bold", "swift", "quiet", "true", "deep", "clear", "steady",
  "keen", "bright", "sharp", "warm", "still", "open", "long",
];

function generateSlug(interests: string[]): string {
  // Try to find a natural noun from interests
  let nouns: string[] = [];
  for (const interest of interests) {
    const key = interest.toLowerCase().trim();
    if (INTEREST_NOUNS[key]) {
      nouns = nouns.concat(INTEREST_NOUNS[key]);
    }
  }

  if (nouns.length > 0) {
    // Pick a random noun from matched interests
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    // Some nouns are already multi-word (like "true-wind"), use as-is
    if (noun.includes("-")) return noun;
    // Otherwise pair with an adjective
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    return `${adj}-${noun}`;
  }

  // Fallback: generate from adjective + generic noun
  const fallbackNouns = ["compass", "signal", "beacon", "summit", "current", "threshold"];
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = fallbackNouns[Math.floor(Math.random() * fallbackNouns.length)];
  return `${adj}-${noun}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, company, role, interests, context } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate slug, retry on collision
    let slug = generateSlug(interests || []);
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from("adventure_visitors")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) break;

      // Collision — regenerate
      slug = generateSlug(interests || []);
      attempts++;
    }

    if (attempts >= 10) {
      // Ultimate fallback: append random chars
      slug += `-${Math.random().toString(36).slice(2, 5)}`;
    }

    // Generate a replay code
    const replayCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("adventure_visitors")
      .insert({
        slug,
        name,
        company: company || null,
        role: role || null,
        interests: interests || [],
        context: context || null,
        replay_code: replayCode,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create visitor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        slug: data.slug,
        replay_code: replayCode,
        url: `https://gtm.consulting/adventure/${data.slug}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create visitor error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
