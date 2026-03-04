/**
 * API client for the article generator pipeline endpoints.
 * Uses POST-based SSE via fetch + ReadableStream (EventSource doesn't support POST).
 */

const API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4250/api/v1"
    : "/api/v1";

// --- Data models ---

export interface SpokespersonInfo {
  name: string;
  title: string;
  company: string;
}

export interface ArticleGeneratorInput {
  client_name: string;
  domain: string;
  industry?: string;
  article_topic: string;
  key_claims: string[];
  spokesperson?: SpokespersonInfo;
  target_word_count?: number;
  customer_slug?: string;
}

// --- SSE event types ---

export type ArticleEvent =
  | { type: "status"; status: string; message: string }
  | { type: "gumshoe_complete"; data: Record<string, unknown> }
  | { type: "gumshoe_skipped" }
  | {
      type: "writer_complete";
      title: string;
      word_count: number;
      provider_used: string;
      latency_ms: number;
    }
  | {
      type: "editor_complete";
      word_count: number;
      total_changes: number;
      passes: EditorPass[];
      aio_scorecard: Record<string, unknown>;
    }
  | {
      type: "condenser_complete";
      word_count: number;
      source_word_count: number;
      compression_ratio: number;
    }
  | {
      type: "optimizer_complete";
      score_before: number;
      score_after: number;
      latency_ms: number;
    }
  | {
      type: "pipeline_complete";
      run_id: string;
      total_latency_ms: number;
    }
  | { type: "error"; status: string; message: string };

export interface EditorPass {
  pass_name: string;
  changes_made: string[];
  issues_found: string[];
}

export interface ArticleRun {
  id: string;
  customer_slug: string;
  domain: string;
  article_topic: string;
  status: string;
  input_data: Record<string, unknown>;
  writer_output: {
    article_markdown: string;
    title: string;
    word_count: number;
    provider_used: string;
    latency_ms: number;
  } | null;
  editor_output: {
    hardened_markdown: string;
    editors_log: {
      passes: EditorPass[];
      total_changes: number;
      aio_scorecard: Record<string, unknown>;
      summary: string;
    };
    word_count: number;
    provider_used: string;
    latency_ms: number;
  } | null;
  condenser_output: {
    condensed_markdown: string;
    title: string;
    word_count: number;
    source_word_count: number;
    compression_ratio: number;
    provider_used: string;
    latency_ms: number;
  } | null;
  optimizer_output: {
    article_html: string;
    structured_data_json: string;
    optimizers_log: Record<string, unknown>;
    score_before: number;
    score_after: number;
    latency_ms: number;
  } | null;
  cost_usd: number;
  created_at: string;
  completed_at: string | null;
}

// --- API functions ---

/**
 * Start the full article generation pipeline via POST-based SSE.
 * Returns a cleanup function to abort the request.
 */
export function startArticleGeneration(
  input: ArticleGeneratorInput,
  onEvent: (event: ArticleEvent) => void,
  onError: (error: Error) => void
): () => void {
  const controller = new AbortController();

  fetch(`${API_BASE}/articles/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data as ArticleEvent);
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err);
      }
    });

  return () => controller.abort();
}

/**
 * Fetch a completed article run by ID.
 */
export async function getArticleRun(runId: string): Promise<ArticleRun> {
  const res = await fetch(`${API_BASE}/articles/${runId}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
