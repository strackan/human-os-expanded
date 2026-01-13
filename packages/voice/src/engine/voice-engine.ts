/**
 * VoiceEngine - Core content generation logic
 *
 * Responsibilities:
 * 1. Load templates and blend recipes
 * 2. Generate content using template combinations
 * 3. Apply blend recipes for specific contexts
 * 4. Integrate with RuleEnforcer for quality control
 *
 * Adapted from PowerPak justin-voice-server
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { RuleEnforcer } from './rule-enforcer.js'
import type {
  Template,
  BlendRecipe,
  ContentGenerationRequest,
  ContentGenerationResponse,
  VoiceAnalysisResult,
  VoiceEngineConfig,
} from './types.js'

export class VoiceEngine {
  private templates: Template[] = []
  private blends: BlendRecipe[] = []
  private ruleEnforcer: RuleEnforcer

  constructor(config?: VoiceEngineConfig) {
    // Load templates
    if (config?.templatesPath && fs.existsSync(config.templatesPath)) {
      const data = JSON.parse(fs.readFileSync(config.templatesPath, 'utf-8'))
      this.templates = data.templates || []
    }

    // Load blends
    if (config?.blendsPath && fs.existsSync(config.blendsPath)) {
      const data = JSON.parse(fs.readFileSync(config.blendsPath, 'utf-8'))
      this.blends = data.blends || []
    }

    // Initialize rule enforcer
    this.ruleEnforcer = new RuleEnforcer(config?.rulesPath)
  }

  /**
   * Load templates from JSON data (for runtime loading)
   */
  loadTemplates(templates: Template[]): void {
    this.templates = templates
  }

  /**
   * Load blends from JSON data (for runtime loading)
   */
  loadBlends(blends: BlendRecipe[]): void {
    this.blends = blends
  }

  /**
   * Generate content using template IDs or blend name
   */
  generateContent(request: ContentGenerationRequest): ContentGenerationResponse {
    let beginningId: string
    let middleId: string
    let endingId: string

    // If blend name is provided, use that blend recipe
    if (request.blendName) {
      const blend = this.getBlendByName(request.blendName)
      if (!blend) {
        throw new Error(`Blend recipe not found: ${request.blendName}`)
      }

      beginningId = blend.components.opening
      middleId = blend.components.middle[0] || 'm1'
      endingId = blend.components.ending
    } else if (request.templateIds) {
      // Use specified template IDs
      beginningId = request.templateIds.beginning || 'o1'
      middleId = request.templateIds.middle || 'm1'
      endingId = request.templateIds.ending || 'e1'
    } else {
      // Default to "Authentic Founder" blend
      beginningId = 'o1'
      middleId = 'm1'
      endingId = 'e2'
    }

    // Get templates
    const beginningTemplate = this.getTemplateById(beginningId)
    const middleTemplate = this.getTemplateById(middleId)
    const endingTemplate = this.getTemplateById(endingId)

    if (!beginningTemplate || !middleTemplate || !endingTemplate) {
      throw new Error('One or more templates not found')
    }

    // Generate content structure
    const content = this.buildContent(
      beginningTemplate,
      middleTemplate,
      endingTemplate,
      request.topic,
      request.context
    )

    // Apply formatting rules
    const correctedContent = this.ruleEnforcer.applyFormattingRules(content)

    // Analyze voice
    const analysis = this.ruleEnforcer.analyzeVoice(correctedContent)

    return {
      content: correctedContent,
      templatesUsed: {
        beginning: beginningId,
        middle: middleId,
        ending: endingId,
      },
      voiceScore: analysis.overallScore,
    }
  }

  /**
   * Build content structure from templates
   */
  private buildContent(
    beginning: Template,
    middle: Template,
    ending: Template,
    topic?: string,
    context?: string
  ): string {
    const parts: string[] = []

    // Beginning
    parts.push(`[${beginning.name}]`)
    if (beginning.example) {
      parts.push(beginning.example)
    }
    parts.push('')
    parts.push(beginning.description)
    if (topic) {
      parts.push(`\nTopic: ${topic}`)
    }
    parts.push('')

    // Add a parenthetical aside (signature move)
    parts.push('(Quick aside -- this is where the magic happens)')
    parts.push('')

    // Middle
    parts.push(`[${middle.name}]`)
    parts.push(middle.description)
    if (context) {
      parts.push(`\nContext: ${context}`)
    }
    parts.push('')

    // Transition
    parts.push("But here's the thing --")
    parts.push('')

    // Ending
    parts.push(`[${ending.name}]`)
    parts.push(ending.description)
    parts.push('')

    // Final question (engagement)
    parts.push('Does this resonate?')

    return parts.join('\n')
  }

  /**
   * Analyze text for voice similarity
   */
  analyzeVoice(text: string): VoiceAnalysisResult {
    return this.ruleEnforcer.analyzeVoice(text)
  }

  /**
   * Get suggestions to improve text
   */
  suggestImprovements(text: string): Array<{
    issue: string
    suggestion: string
    example?: string
  }> {
    return this.ruleEnforcer.suggestImprovements(text)
  }

  /**
   * Suggest a blend recipe based on context and mood
   */
  suggestBlend(context: string, mood?: string): BlendRecipe | null {
    const contextLower = context.toLowerCase()

    for (const blend of this.blends) {
      const whenToUseLower = blend.whenToUse.toLowerCase()
      const energyMatchLower = blend.energyMatch.toLowerCase()

      if (whenToUseLower.includes(contextLower)) {
        return blend
      }

      if (mood && energyMatchLower.includes(mood.toLowerCase())) {
        return blend
      }
    }

    // Fallback to "Authentic Founder" as default
    return this.blends.find(b => b.name === 'THE AUTHENTIC FOUNDER') || this.blends[0] || null
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): Template | undefined {
    return this.templates.find(t => t.id.toLowerCase() === id.toLowerCase())
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: Template['category']): Template[] {
    return this.templates.filter(t => t.category === category)
  }

  /**
   * Get blend by name
   */
  getBlendByName(name: string): BlendRecipe | undefined {
    return this.blends.find(b => b.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Get all blend recipes
   */
  getAllBlends(): BlendRecipe[] {
    return this.blends
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return this.templates
  }

  /**
   * Get writing rules
   */
  getWritingRules() {
    return this.ruleEnforcer.getRules()
  }
}
