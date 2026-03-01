/**
 * API client for ARI backend
 */

const API_BASE = '/api/v1'

export interface Entity {
  id: string
  name: string
  type: 'person' | 'company' | 'product'
  category: string
  aliases: string[]
  metadata: Record<string, unknown>
  created_at: string
}

export interface ARIScore {
  id: string
  entity_id: string
  entity_name: string
  overall_score: number
  provider_scores: Record<string, number>
  mentions_count: number
  total_prompts: number
  mention_rate: number
  sample_responses: SampleResponse[]
  calculated_at: string
}

export interface SampleResponse {
  provider: string
  prompt: string
  response: string
  position: number
  recommendation_type?: string
}

export interface ComparisonResult {
  entity_a: ARIScore
  entity_b: ARIScore
  delta: number
  provider_deltas: Record<string, number>
  winner: string
  summary: string
}

export interface CalculationJob {
  job_id: string
  entity_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  message?: string
}

export interface PromptResponse {
  prompt_id: string
  prompt_text: string
  intent: string
  provider: string
  model_version: string | null
  raw_response: string
  latency_ms: number | null
  tokens_used: number | null
  entity_mentioned: boolean
  entity_position: number | null
  recommendation_type: string
  all_mentions: Array<{
    name: string
    position: number | null
    type: string
    sentiment: string
  }>
  error: string | null
}

export interface ResponsesSummary {
  entity_id: string
  entity_name: string
  total_responses: number
  total_mentioned: number
  overall_mention_rate: number
  by_intent: Record<string, {
    total: number
    mentioned: number
    mention_rate: number
    providers: Record<string, {
      total: number
      mentioned: number
      mention_rate: number
    }>
  }>
}

export interface EntityTestResponse {
  model: string
  response: string
  mentioned: boolean
  position: number | null
  followup?: string
}

export interface EntityTestQuestion {
  question: string
  responses: Record<string, EntityTestResponse>
}

export interface EntityTestResult {
  entity: string
  entity_type: 'company' | 'person'
  list_size: number
  ari_score: number
  mention_rate: number
  mentions: number
  total_questions: number
  avg_position_score: number
  providers: string[]
  results: EntityTestQuestion[]
}

export interface EntityTestProgress {
  type: 'start' | 'question_start' | 'progress' | 'provider_complete' | 'followup_start' | 'question_complete'
  // For 'start'
  total_questions?: number
  total_providers?: number
  total_steps?: number
  entity?: string
  // For 'question_start'
  question_index?: number
  question?: string
  // For 'progress'
  step?: number
  total?: number
  provider?: string
  message?: string
  // For 'provider_complete'
  mentioned?: boolean
  position?: number | null
  // For 'followup_start'
  count?: number
}

export interface AnalysisRecommendation {
  priority: 'High' | 'Medium' | 'Low'
  action: string
  rationale: string
}

export interface AnalysisResult {
  entity: string
  entity_type: string
  ari_score: number
  model_used: string
  analysis: {
    executive_summary: string
    score_interpretation: {
      rating: string
      context: string
    }
    strengths: string[]
    weaknesses: string[]
    provider_insights: {
      best_performer: string
      worst_performer: string
      patterns: string
    }
    recommendations: AnalysisRecommendation[]
    competitive_positioning: string
    next_steps: string
  }
  error?: string
  analysis_raw?: string
  parse_error?: string
}

class APIClient {
  private baseUrl: string

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Entities
  async getEntities(type?: string): Promise<Entity[]> {
    const params = type ? `?entity_type=${type}` : ''
    return this.fetch<Entity[]>(`/entities/${params}`)
  }

  async getEntity(id: string): Promise<Entity> {
    return this.fetch<Entity>(`/entities/${id}`)
  }

  async getEntityByName(name: string): Promise<Entity> {
    return this.fetch<Entity>(`/entities/by-name/${encodeURIComponent(name)}`)
  }

  async createEntity(entity: Omit<Entity, 'id' | 'created_at'>): Promise<Entity> {
    return this.fetch<Entity>('/entities', {
      method: 'POST',
      body: JSON.stringify(entity),
    })
  }

  // Scores
  async getScore(entityId: string): Promise<ARIScore> {
    return this.fetch<ARIScore>(`/scores/${entityId}`)
  }

  async calculateScore(entityId: string): Promise<CalculationJob> {
    return this.fetch<CalculationJob>(`/scores/calculate/${entityId}`, {
      method: 'POST',
    })
  }

  async getCalculationStatus(jobId: string): Promise<CalculationJob> {
    return this.fetch<CalculationJob>(`/scores/calculate/${jobId}/status`)
  }

  async compareEntities(entityAId: string, entityBId: string): Promise<ComparisonResult> {
    return this.fetch<ComparisonResult>(
      `/scores/compare?entity_a_id=${entityAId}&entity_b_id=${entityBId}`
    )
  }

  async getScoreHistory(entityId: string, limit = 10): Promise<ARIScore[]> {
    return this.fetch<ARIScore[]>(`/scores/${entityId}/history?limit=${limit}`)
  }

  // Responses
  async getAllResponses(
    entityId: string,
    intent?: string,
    mentionedOnly?: boolean
  ): Promise<PromptResponse[]> {
    const params = new URLSearchParams()
    if (intent) params.append('intent', intent)
    if (mentionedOnly) params.append('mentioned_only', 'true')
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.fetch<PromptResponse[]>(`/scores/${entityId}/responses${query}`)
  }

  async getResponsesSummary(entityId: string): Promise<ResponsesSummary> {
    return this.fetch<ResponsesSummary>(`/scores/${entityId}/responses/summary`)
  }

  // Prompts
  async getPromptTemplates(entityType?: string): Promise<unknown[]> {
    const params = entityType ? `?entity_type=${entityType}` : ''
    return this.fetch<unknown[]>(`/prompts/templates${params}`)
  }

  async getSampleResponses(entityId: string, limit = 3): Promise<SampleResponse[]> {
    return this.fetch<SampleResponse[]>(`/prompts/responses/${entityId}/samples?limit=${limit}`)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; providers: string[]; supabase: boolean }> {
    return this.fetch<{ status: string; providers: string[]; supabase: boolean }>('/../../health')
  }

  // Entity Test - run question battery for a specific entity
  async getEntityTest(entityName: string, listSize: number = 1): Promise<EntityTestResult> {
    return this.fetch<EntityTestResult>(`/entity-test/${encodeURIComponent(entityName)}?list_size=${listSize}`)
  }

  // Analyze test results with Claude Sonnet
  async analyzeResults(results: EntityTestResult): Promise<AnalysisResult> {
    return this.fetch<AnalysisResult>('/analyze-results', {
      method: 'POST',
      body: JSON.stringify(results),
    })
  }

  // Entity Test with streaming progress - returns EventSource for SSE
  getEntityTestStream(
    entityName: string,
    listSize: number = 1,
    onProgress: (data: EntityTestProgress) => void,
    onComplete: (result: EntityTestResult) => void,
    onError: (error: Error) => void
  ): () => void {
    // EventSource doesn't work with Vite proxy, so use direct backend URL
    const backendUrl = 'http://localhost:4250/api/v1'
    const url = `${backendUrl}/entity-test-stream/${encodeURIComponent(entityName)}?list_size=${listSize}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'complete') {
          onComplete(data as EntityTestResult)
          eventSource.close()
        } else {
          onProgress(data as EntityTestProgress)
        }
      } catch (e) {
        onError(new Error('Failed to parse SSE data'))
      }
    }

    eventSource.onerror = () => {
      onError(new Error('SSE connection error'))
      eventSource.close()
    }

    // Return cleanup function
    return () => eventSource.close()
  }
}

export const apiClient = new APIClient()
export default apiClient
