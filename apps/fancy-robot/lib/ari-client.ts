/**
 * API client for ARI backend (trimmed — dashboard-only methods)
 * Backend is proxied via next.config.ts: /api/v1/* → localhost:4250
 */

const API_BASE = "/api/v1";

export interface Entity {
  id: string;
  name: string;
  type: "person" | "company" | "product";
  category: string;
  aliases: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ARIScore {
  id: string;
  entity_id: string;
  entity_name: string;
  overall_score: number;
  provider_scores: Record<string, number>;
  mentions_count: number;
  total_prompts: number;
  mention_rate: number;
  sample_responses: SampleResponse[];
  calculated_at: string;
}

export interface SampleResponse {
  provider: string;
  prompt: string;
  response: string;
  position: number;
  recommendation_type?: string;
}

export interface ComparisonResult {
  entity_a: ARIScore;
  entity_b: ARIScore;
  delta: number;
  provider_deltas: Record<string, number>;
  winner: string;
  summary: string;
}

export interface ScoreHistoryEntry {
  id: string;
  domain: string;
  overall_score: number;
  mention_rate: number;
  provider_scores: Record<string, number>;
  scored_at: string;
}

export interface CalculationJob {
  job_id: string;
  entity_id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  message?: string;
}

class ARIClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getEntities(type?: string): Promise<Entity[]> {
    const params = type ? `?entity_type=${type}` : "";
    return this.fetch<Entity[]>(`/entities/${params}`);
  }

  async getEntity(id: string): Promise<Entity> {
    return this.fetch<Entity>(`/entities/${id}`);
  }

  async getEntityByName(name: string): Promise<Entity> {
    return this.fetch<Entity>(
      `/entities/by-name/${encodeURIComponent(name)}`,
    );
  }

  async getScore(entityId: string): Promise<ARIScore> {
    return this.fetch<ARIScore>(`/scores/${entityId}`);
  }

  async calculateScore(entityId: string, userId?: string): Promise<CalculationJob> {
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    return this.fetch<CalculationJob>(`/scores/calculate/${entityId}${params}`, {
      method: "POST",
    });
  }

  async getCalculationStatus(jobId: string): Promise<CalculationJob> {
    return this.fetch<CalculationJob>(`/scores/calculate/${jobId}/status`);
  }

  async compareEntities(
    entityAId: string,
    entityBId: string,
  ): Promise<ComparisonResult> {
    return this.fetch<ComparisonResult>(
      `/scores/compare?entity_a_id=${entityAId}&entity_b_id=${entityBId}`,
    );
  }

  async getScoreHistory(domain?: string, limit = 20): Promise<ScoreHistoryEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (domain) params.set("domain", domain);
    const res = await fetch(`/api/score-history?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async healthCheck(): Promise<{
    status: string;
    providers: string[];
    supabase: boolean;
  }> {
    return this.fetch<{
      status: string;
      providers: string[];
      supabase: boolean;
    }>("/../../health");
  }
}

export const ariClient = new ARIClient();
export default ariClient;
