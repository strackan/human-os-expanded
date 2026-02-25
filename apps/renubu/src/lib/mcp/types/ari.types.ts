/**
 * ARI (AI Recommendability Index) MCP Type Definitions
 *
 * TypeScript interfaces mirroring ARI's Python models.
 * Used by the ARIClient to communicate with the ARI FastAPI backend.
 */

// ============================================================================
// ARI ENTITY TYPES
// ============================================================================

export interface ARIEntity {
  id?: string;
  name: string;
  type: 'company' | 'person';
  category?: string;
  aliases?: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// ARI SCORE TYPES
// ============================================================================

export interface ARIProviderScore {
  provider: string;
  model?: string;
  mentioned: boolean;
  position: number | null;
  score: number;
}

export interface ARIScore {
  entity: string;
  entity_type: string;
  list_size?: number;
  ari_score: number;
  mention_rate: number;
  mentions: number;
  total_questions: number;
  avg_position_score: number;
  providers: string[];
  results: ARIQuestionResult[];
}

export interface ARIQuestionResult {
  question: string;
  responses: Record<string, ARIProviderResponse>;
}

export interface ARIProviderResponse {
  model: string | null;
  response: string;
  mentioned: boolean;
  position: number | null;
  followup?: string;
}

// ============================================================================
// ARI COMPARISON TYPES
// ============================================================================

export interface ARIComparisonResult {
  entity_a: {
    name: string;
    score: number;
  };
  entity_b: {
    name: string;
    score: number;
  };
  delta: number;
  winner: string;
  summary: string;
}

// ============================================================================
// ARI ANALYSIS TYPES
// ============================================================================

export interface ARIAnalysis {
  entity: string;
  entity_type: string;
  ari_score: number;
  analysis: {
    executive_summary: string;
    score_interpretation: {
      rating: string;
      context: string;
    };
    strengths: string[];
    weaknesses: string[];
    provider_insights: {
      best_performer: string;
      worst_performer: string;
      patterns: string;
    };
    recommendations: Array<{
      priority: 'High' | 'Medium' | 'Low';
      action: string;
      rationale: string;
    }>;
    competitive_positioning: string;
    next_steps: string;
  };
  model_used: string;
}

// ============================================================================
// RENUBU-SIDE PERSISTED TYPES
// ============================================================================

export interface ARIScoreSnapshot {
  id: string;
  company_id: string;
  customer_id: string | null;
  ari_entity_name: string;
  entity_type: string;
  category: string;
  overall_score: number;
  mention_rate: number;
  mentions_count: number;
  total_prompts: number;
  avg_position_score: number;
  provider_scores: Record<string, ARIProviderScore>;
  sample_responses: ARIQuestionResult[];
  previous_score: number | null;
  score_delta: number | null;
  scan_triggered_by: 'manual' | 'cron' | 'workflow';
  scan_completed_at: string;
  created_at: string;
}

export interface ARIEntityMapping {
  id: string;
  company_id: string;
  customer_id: string;
  entity_name: string;
  entity_type: string;
  category: string;
  competitors: Array<{ name: string; entity_type: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MCP TOOL PARAMETER TYPES
// ============================================================================

export interface RunARIScanParams {
  entity_name: string;
  entity_type?: 'company' | 'person' | 'auto';
  list_size?: number;
}

export interface GetARIEntityParams {
  name: string;
}

export interface ListARIEntitiesParams {
  limit?: number;
  offset?: number;
}

export interface CreateARIEntityParams {
  name: string;
  type: 'company' | 'person';
  category?: string;
  aliases?: string[];
}

export interface CompareARIParams {
  entity_a: string;
  entity_b: string;
}

export interface AnalyzeARIParams {
  results: ARIScore;
}
