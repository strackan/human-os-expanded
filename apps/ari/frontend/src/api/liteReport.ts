/**
 * API client for the lite report (AI Visibility Snapshot) endpoints.
 * Uses POST-based SSE via fetch + ReadableStream (EventSource doesn't support POST).
 */

const API_BASE = '/api/v1'

// --- Data models ---

export interface CompetitorInfo {
  name: string
  domain: string
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

export interface CompetitorScore {
  name: string
  mention_count: number
  mention_rate: number
  avg_position: number | null
  source?: string       // "known" | "discovered"
  ari_score?: number    // position-weighted score (0-100)
}

export interface PersonaBreakdown {
  persona: string
  mention_count: number
  total_prompts: number
  mention_rate: number
  avg_position: number | null
  top_competitor: string
}

export interface TopicBreakdown {
  topic: string
  mention_count: number
  total_prompts: number
  mention_rate: number
  avg_position: number | null
}

export interface ArticleTeaser {
  title: string
  rationale: string
  target_gap: string
}

// --- SSE event types ---

export interface DomainValidation {
  domain: string
  title: string
  meta_description: string
  url: string
}

export interface PromptStart {
  type: 'prompt_start'
  current: number
  total: number
  persona: string
  topic: string
  prompt_text: string
  style: string
}

export interface PromptResult {
  type: 'prompt_result'
  current: number
  total: number
  persona: string
  topic: string
  mentioned: boolean
  position: number | null
  error?: boolean
}

export type LiteReportEvent =
  | { type: 'status'; status: string; message: string }
  | { type: 'cache_hit'; message: string }
  | { type: 'domain_validated'; data: DomainValidation }
  | { type: 'discovery_complete'; data: DiscoveryResult }
  | PromptStart
  | PromptResult
  | { type: 'analysis_complete'; data: { overall_score: number; mention_rate: number; total_prompts: number; mentions_count: number } }
  | { type: 'synthesis_complete'; data: SynthesisData }
  | { type: 'pdf_ready'; job_id: string; status: string }
  | { type: 'error'; status: string; message: string }

export interface SynthesisData {
  report_title: string
  core_finding: string
  core_finding_detail: string
  executive_summary: string
  key_findings: string[]
  strategic_recommendations: string[]
  opportunities: string[]
  article_teasers: ArticleTeaser[]
  headline_stat: string
  overall_score: number
  mention_rate: number
  competitor_scores: CompetitorScore[]
  persona_breakdown: PersonaBreakdown[]
  topic_breakdown: TopicBreakdown[]
}

// --- API functions ---

/**
 * Start the full lite analysis pipeline via POST-based SSE.
 * Returns a cleanup function to abort the request.
 */
export function startLiteAnalysis(
  domain: string,
  onEvent: (event: LiteReportEvent) => void,
  onError: (error: Error) => void,
  discoveryOverride?: DiscoveryResult,
): () => void {
  const controller = new AbortController()

  const body: Record<string, unknown> = { domain }
  if (discoveryOverride) {
    body.discovery_override = discoveryOverride
  }

  fetch(`${API_BASE}/lite-report/analyze`, {
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
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onEvent(data as LiteReportEvent)
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
 * Run just the discovery phase.
 */
export async function discoverOnly(domain: string): Promise<DiscoveryResult> {
  const response = await fetch(`${API_BASE}/lite-report/discover-only`, {
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
 * Get the download URL for a generated PDF.
 */
export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/lite-report/download/${jobId}`
}
