// supabase/functions/missive-bridge/index.ts
// Polls pending bridge entries and pushes FOS messages into Missive

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MISSIVE_API_TOKEN = Deno.env.get("MISSIVE_API_TOKEN")!;
const MISSIVE_CHANNEL_ACCOUNT_ID = Deno.env.get("MISSIVE_CHANNEL_ACCOUNT_ID")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendToMissive(
  body: string,
  fromName: string,
  fromForest: string,
  existingConversationId?: string
) {
  const payload: any = {
    messages: {
      account: MISSIVE_CHANNEL_ACCOUNT_ID,
      from_field: {
        id: fromForest,
        username: `@${fromForest}`,
        name: fromName,
      },
      to_fields: [{
        id: "founder-os",
        username: "justin@founder-os",
        name: "Justin (Founder OS)",
      }],
      body,
    },
  };

  if (existingConversationId) {
    payload.messages.conversation = existingConversationId;
  }

  const response = await fetch("https://public.missiveapp.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISSIVE_API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    return { error: `Missive ${response.status}: ${err}` };
  }

  let result: any = {};
  try { result = await response.json(); } catch {}

  return {
    conversationId: result?.messages?.conversation || existingConversationId,
    messageId: result?.messages?.id,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    // Fetch pending bridge entries
    const { data: pending, error: fetchErr } = await supabase
      .from("missive_bridge")
      .select("*")
      .eq("status", "pending")
      .eq("direction", "inbound")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchErr || !pending?.length) {
      return new Response(JSON.stringify({ processed: 0, pending: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const bridge of pending) {
      // Fetch the actual FOS message
      const { data: msg, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .eq("id", bridge.fos_message_id)
        .single();

      if (msgErr || !msg) {
        await supabase.rpc("missive_mark_failed", {
          p_bridge_id: bridge.id,
          p_error: `Message not found: ${msgErr?.message || "null"}`,
        });
        errors++;
        continue;
      }

      // Check for existing Missive conversation with this sender
      const { data: contactMap } = await supabase
        .from("missive_contact_map")
        .select("missive_conversation_id")
        .eq("entity_forest", bridge.sender_forest)
        .single();

      // Format and send
      const timestamp = new Date(msg.created_at).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });

      const messageBody = msg.subject 
        ? `**${msg.subject}**\n\n${msg.content}\n\n— via Founder OS · ${timestamp}`
        : `${msg.content}\n\n— via Founder OS · ${timestamp}`;

      const result = await sendToMissive(
        messageBody,
        bridge.sender_name || msg.from_name,
        bridge.sender_forest,
        contactMap?.missive_conversation_id
      );

      if (result.error) {
        await supabase.rpc("missive_mark_failed", {
          p_bridge_id: bridge.id,
          p_error: result.error,
        });
        errors++;
      } else {
        await supabase.rpc("missive_mark_sent", {
          p_bridge_id: bridge.id,
          p_missive_conversation_id: result.conversationId || "",
          p_missive_message_id: result.messageId || "",
        });
        processed++;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    return new Response(JSON.stringify({ processed, errors, total: pending.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});