import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const domain = searchParams.get("domain");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

  let query = supabase
    .schema("fancyrobot" as "public")
    .from("score_history")
    .select("id, domain, overall_score, mention_rate, provider_scores, scored_at")
    .eq("user_id", user.id)
    .order("scored_at", { ascending: false })
    .limit(limit);

  if (domain) {
    query = query.eq("domain", domain);
  }

  const { data, error } = await query;

  if (error) {
    console.error("score-history query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
