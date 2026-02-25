// Adventure Ghost Chat — Claude streaming proxy
// Receives a scenario system prompt + conversation messages,
// streams Claude's response back to the client.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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
    const { system_prompt, messages, visitor_profile } = await req.json();

    if (!system_prompt || !messages) {
      return new Response(
        JSON.stringify({ error: "system_prompt and messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assemble system prompt with optional visitor context
    let fullSystemPrompt = system_prompt;
    if (visitor_profile) {
      fullSystemPrompt += `\n\n# VISITOR CONTEXT\nYou are speaking with ${visitor_profile.name || "someone"}`;
      if (visitor_profile.company) fullSystemPrompt += ` from ${visitor_profile.company}`;
      if (visitor_profile.role) fullSystemPrompt += ` (${visitor_profile.role})`;
      fullSystemPrompt += ".";
      if (visitor_profile.context) fullSystemPrompt += ` ${visitor_profile.context}`;
    }

    // Call Claude API with streaming
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        temperature: 0.8,
        system: fullSystemPrompt,
        messages: messages,
        stream: true,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Claude API error", status: anthropicResponse.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform the SSE stream: extract text deltas and forward as plain text
    const reader = anthropicResponse.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);

                // Extract text from content_block_delta events
                if (event.type === "content_block_delta" && event.delta?.text) {
                  controller.enqueue(encoder.encode(event.delta.text));
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          console.error("Stream processing error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Ghost chat error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
