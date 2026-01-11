/**
 * Voice Engine Types
 *
 * Types for the voice scoring and generation engine.
 * Adapted from PowerPak justin-voice-server.
 */

// =============================================================================
// VOICE ANALYSIS
// =============================================================================

/**
 * Result of voice analysis/scoring
 */
export interface VoiceAnalysisResult {
  overallScore: number  // 0-100
  strengths: string[]
  improvements: string[]
  suggestions: VoiceSuggestion[]
}

export interface VoiceSuggestion {
  issue: string
  suggestion: string
  example?: string
}

// =============================================================================
// WRITING RULES
// =============================================================================

export type RuleCategory = 'always' | 'never' | 'formatting' | 'voice' | 'vulnerability'

export interface WritingRule {
  category: RuleCategory
  rule: string
  explanation?: string
  examples?: string[]
}

// =============================================================================
// TEMPLATES (O/M/E/F Structure)
// =============================================================================

export type TemplateCategory = 'opening' | 'middle' | 'ending' | 'flavor' | 'transition'

export interface Template {
  id: string           // e.g., 'o1', 'm3', 'e2', 'f7'
  name: string         // e.g., 'VULNERABILITY', 'STORY ARC'
  category: TemplateCategory
  description: string
  example?: string
  useFor?: string
  energyMatch?: string
  pairsWith?: string[]
}

// =============================================================================
// BLEND RECIPES
// =============================================================================

export interface BlendRecipe {
  name: string          // e.g., 'THE AUTHENTIC FOUNDER'
  components: {
    opening: string     // Template ID
    middle: string[]    // Template IDs (can use 1-2)
    ending: string      // Template ID
  }
  whenToUse: string
  typicalPerformance?: string  // e.g., 'High comments (50-100), moderate shares (10-20)'
  energyMatch: string
  exampleTopics?: string
  whyItWorks?: string
}

// =============================================================================
// CONTENT GENERATION
// =============================================================================

export interface ContentGenerationRequest {
  /** Use a specific blend recipe by name */
  blendName?: string

  /** Or specify individual template IDs */
  templateIds?: {
    beginning?: string
    middle?: string
    ending?: string
  }

  /** Topic for content */
  topic?: string

  /** Additional context */
  context?: string
}

export interface ContentGenerationResponse {
  content: string
  templatesUsed: {
    beginning: string
    middle: string
    ending: string
  }
  voiceScore: number
}

// =============================================================================
// ENGINE CONFIG
// =============================================================================

export interface VoiceEngineConfig {
  /** Path to templates JSON */
  templatesPath?: string

  /** Path to blends JSON */
  blendsPath?: string

  /** Path to rules JSON */
  rulesPath?: string
}
