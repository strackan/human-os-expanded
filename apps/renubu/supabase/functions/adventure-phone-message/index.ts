// Adventure Phone Message — posts a visitor's message to founder_os.messages
// on the human-os core Supabase instance (cross-instance write)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Cross-instance: writes to the human-os core Supabase, not the renubu instance
const HUMANOS_SUPABASE_URL = Deno.env.get("HUMANOS_SUPABASE_URL");
const HUMANOS_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("HUMANOS_SUPABASE_SERVICE_ROLE_KEY");

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
    const { visitor_id, visitor_name, message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!HUMANOS_SUPABASE_URL || !HUMANOS_SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing HUMANOS_SUPABASE_URL or HUMANOS_SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(HUMANOS_SUPABASE_URL, HUMANOS_SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase
      .schema("founder_os")
      .from("messages")
      .insert({
        from_forest: "adventure:visitor",
        from_name: visitor_name || "Adventure Player",
        to_forest: "founder:justin",
        to_name: "Justin Strackany",
        subject: "Phone message from Adventure",
        content: message,
        metadata: {
          visitor_id: visitor_id || null,
          source: "adventure-phone",
        },
      });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Phone message error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
