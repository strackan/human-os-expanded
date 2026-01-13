/**
 * MCP Tool Call Capture
 *
 * Fire-and-forget logging of MCP tool calls for searchability
 * and cross-org intelligence. Per the plan: tool-level only for MCP.
 */

export interface ToolCallPayload {
  tool: string;
  params: Record<string, unknown>;
  result: string; // Summarized result
  latencyMs: number;
  userId?: string;
  timestamp: string;
}

/**
 * Log a tool call (fire-and-forget)
 */
export function logToolCall(payload: ToolCallPayload): void {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    return; // Skip if not configured
  }

  // Fire and forget - don't await
  captureToolCall(payload, supabaseUrl, supabaseKey).catch((err) => {
    console.error('[mcp/capture] Failed to log tool call:', err);
  });
}

/**
 * Async capture implementation
 */
async function captureToolCall(
  payload: ToolCallPayload,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/mcp_tool_calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      tool_name: payload.tool,
      params: payload.params,
      result_summary: payload.result.slice(0, 1000), // Truncate
      latency_ms: payload.latencyMs,
      user_id: payload.userId,
      created_at: payload.timestamp,
    }),
  });
}

/**
 * Summarize a result for logging (avoid storing full responses)
 */
export function summarizeResult(result: unknown): string {
  if (typeof result === 'string') {
    return result.slice(0, 500);
  }
  if (result && typeof result === 'object') {
    const json = JSON.stringify(result);
    if (json.length > 500) {
      return json.slice(0, 497) + '...';
    }
    return json;
  }
  return String(result);
}
