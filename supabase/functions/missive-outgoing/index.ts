// supabase/functions/missive-outgoing/index.ts
// Receives Missive webhook when Justin replies → inserts into FOS messages

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("MISSIVE_WEBHOOK_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifySignature(body: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computed === signature;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Hook-Signature",
      },
    });
  }

  const ok = (data: any) =>
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Hook-Signature") || "";

    if (WEBHOOK_SECRET && signature) {
      const valid = await verifySignature(rawBody, signature);
      if (!valid) return ok({ error: "invalid signature" });
    }

    const payload = JSON.parse(rawBody);
    const message = payload?.message || payload?.messages?.[0] || payload;
    const body = message?.body || message?.preview || "";

    if (!body) return ok({ skipped: "no body" });

    // Resolve recipient
    let recipientForest = "";
    let recipientName = "";

    const toFields = message?.to_fields || [];
    for (const to of toFields) {
      if (to.id && to.id !== "founder-os" && to.id !== "justin") {
        recipientForest = to.id;
        recipientName = to.name || to.username || to.id;
        break;
      }
    }

    if (!recipientForest) {
      const fromField = message?.from_field;
      if (fromField?.id && fromField.id !== "founder-os" && fromField.id !== "justin") {
        recipientForest = fromField.id;
        recipientName = fromField.name || fromField.id;
      }
    }

    if (!recipientForest && message?.conversation) {
      const { data: contact } = await supabase
        .from("missive_contact_map")
        .select("entity_forest, entity_name")
        .eq("missive_conversation_id", message.conversation)
        .single();

      if (contact) {
        recipientForest = contact.entity_forest;
        recipientName = contact.entity_name || contact.entity_forest;
      }
    }

    if (!recipientForest) {
      return ok({ skipped: "could not resolve recipient" });
    }

    const cleanBody = body.replace(/\n*— via Founder OS.*$/s, "").trim();

    const { data: inserted, error: insertErr } = await supabase
      .from("messages")
      .insert({
        from_forest: "justin",
        from_name: "Justin Strackany",
        to_forest: recipientForest,
        to_name: recipientName,
        content: cleanBody,
        status: "pending",
        metadata: {
          source: "missive",
          missive_conversation_id: message?.conversation || null,
          missive_message_id: message?.id || null,
        },
      })
      .select()
      .single();

    if (insertErr) return ok({ error: insertErr.message });

    await supabase.from("missive_bridge").insert({
      fos_message_id: inserted.id,
      missive_conversation_id: message?.conversation || null,
      missive_message_id: message?.id || null,
      sender_forest: "justin",
      sender_name: "Justin Strackany",
      direction: "outbound",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return ok({ success: true, message_id: inserted.id, to: recipientForest });
  } catch (err) {
    return ok({ error: err.message });
  }
});