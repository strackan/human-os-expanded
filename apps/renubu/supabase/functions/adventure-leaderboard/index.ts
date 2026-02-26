// Adventure Leaderboard — returns top 25 players by aggregate score
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Aggregate scores per visitor across all scenario sessions
    const { data, error } = await supabase.rpc("adventure_leaderboard");

    if (error) {
      // Fallback: direct query if RPC doesn't exist
      const { data: sessions, error: sessErr } = await supabase
        .from("adventure_sessions")
        .select(
          "visitor_id, score_total, scenario_id, completed_at, adventure_visitors(name, company)"
        )
        .not("visitor_id", "is", null)
        .not("score_total", "is", null)
        .order("completed_at", { ascending: false });

      if (sessErr || !sessions) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Aggregate in JS
      const byVisitor: Record<
        string,
        {
          name: string;
          company: string;
          total_score: number;
          scenarios_played: number;
          last_played: string;
        }
      > = {};

      for (const s of sessions) {
        const vid = s.visitor_id;
        if (!vid) continue;
        if (!byVisitor[vid]) {
          const visitor = s.adventure_visitors as any;
          byVisitor[vid] = {
            name: visitor?.name || "Anonymous",
            company: visitor?.company || "",
            total_score: 0,
            scenarios_played: 0,
            last_played: s.completed_at || "",
          };
        }
        byVisitor[vid].total_score += s.score_total || 0;
        byVisitor[vid].scenarios_played += 1;
        if (
          s.completed_at &&
          s.completed_at > byVisitor[vid].last_played
        ) {
          byVisitor[vid].last_played = s.completed_at;
        }
      }

      const leaderboard = Object.values(byVisitor)
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 25);

      return new Response(JSON.stringify(leaderboard), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
