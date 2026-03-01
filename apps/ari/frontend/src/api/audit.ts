/**
 * API client for the full audit pipeline endpoints.
 * Uses POST-based SSE via fetch + ReadableStream (same pattern as liteReport.ts).
 */

const API_BASE = '/api/v1'

// --- Data models ---

export interface FounderProfile {
  name: string
  title: string
  background: string
  prior_companies: string[]
  ai_name_collision_risk: boolean
}

export interface ProductInfo {
  name: string
  category: string
  description: string
  differentiators: string[]
}

export interface CompetitorInfo {
  name: string
  domain: string
}

export interface BrandProfile {
  company_name: string
  domain: string
  industry: string
  description: string
  entity_type: string
  competitors: CompetitorInfo[]
  personas: string[]
  topics: string[]
  differentiators: string[]
  legal_entity: string
  aliases: string[]
  founded: string
  headquarters: string
  founders: FounderProfile[]
  products: ProductInfo[]
  distribution_channels: string[]
  awards: string[]
  press_mentions: string[]
  brand_voice: string
  use_cases: string[]
  occasions: string[]
  regions: string[]
  adjacent_categories: string[]
  category_leader: string
  category_maturity: string
  sibling_brands: string[]
}

export interface DimensionScore {
  dimension: string
  score: number
  mention_rate: number
  prompt_count: number
  avg_position: number | null
}

export interface ProviderScore {
  provider: string
  score: number
  mention_rate: number
  prompt_count: number
  avg_position: number | null
}

export interface ScoringData {
  overall_ari: number
  severity_band: string
  mention_frequency: number
  position_quality: number
  narrative_accuracy: number
  founder_retrieval: number
}

export interface AntiPattern {
  pattern_type: string
  display_name: string
  severity: string
  evidence: string
  recommendation: string
}

export interface GapAnalysis {
  gap_type: string
  description: string
  impact: number
  effort: number
  coverage: number
  priority_score: number
  recommendation: string
}

export interface AuditReport {
  executive_summary: string
  core_problem: string
  core_problem_name: string
  competitive_landscape: string
  dimension_analysis: string
  anti_patterns_section: string
  recommendations: string
  pitch_hook: string
  full_markdown: string
}

// --- SSE event types ---

export interface DomainValidation {
  domain: string
  title: string
  meta_description: string
  url: string
}

export interface DiscoveryResult {
  company_name: string
  domain: string
  industry: string
  entity_type: string
  description: string
  competitors: CompetitorInfo[]
  personas: string[]
  topics: string[]
  differentiators: string[]
}

export interface AuditPromptStart {
  type: 'prompt_start'
  current: number
  total: number
  provider: string
  dimension: string
  persona: string
  topic: string
  prompt_text: string
}

export interface AuditPromptResult {
  type: 'prompt_result'
  current: number
  total: number
  provider: string
  dimension: string
  persona: string
  topic: string
  mentioned: boolean
  position: number | null
}

export type AuditEvent =
  | { type: 'status'; status: string; message: string }
  | { type: 'domain_validated'; data: DomainValidation }
  | { type: 'discovery_complete'; data: DiscoveryResult }
  | { type: 'profile_complete'; data: BrandProfile }
  | { type: 'matrix_complete'; data: { total_prompts: number; dimensions: string[] } }
  | AuditPromptStart
  | AuditPromptResult
  | { type: 'analysis_complete'; data: { total_results: number; mentions: number } }
  | { type: 'scoring_complete'; data: ScoringData }
  | { type: 'anti_patterns_complete'; data: { anti_patterns: AntiPattern[]; gaps: GapAnalysis[] } }
  | { type: 'report_stage'; stage: string }
  | { type: 'report_complete'; data: AuditReport }
  | { type: 'pdf_ready'; job_id: string; status: string }
  | { type: 'error'; status: string; message: string }

// --- API functions ---

/**
 * Start the full audit pipeline via POST-based SSE.
 * Returns a cleanup function to abort the request.
 */
export function startAuditAnalysis(
  domain: string,
  onEvent: (event: AuditEvent) => void,
  onError: (error: Error) => void,
  options?: {
    brandProfileOverride?: Record<string, unknown>
    liteDiscovery?: DiscoveryResult
    forceRerun?: boolean
  },
): () => void {
  const controller = new AbortController()

  const body: Record<string, unknown> = { domain }
  if (options?.brandProfileOverride) body.brand_profile_override = options.brandProfileOverride
  if (options?.liteDiscovery) body.lite_discovery = options.liteDiscovery
  if (options?.forceRerun) body.force_rerun = true

  fetch(`${API_BASE}/audit/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onEvent(data as AuditEvent)
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err)
      }
    })

  return () => controller.abort()
}

/**
 * Run just the brand profiling phase.
 */
export async function profileOnly(domain: string): Promise<BrandProfile> {
  const response = await fetch(`${API_BASE}/audit/profile-only`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Get the download URL for a generated audit PDF.
 */
export function getAuditDownloadUrl(jobId: string): string {
  return `${API_BASE}/audit/download/${jobId}`
}
