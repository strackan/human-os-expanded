/**
 * RuleEnforcer - Voice scoring and rule application engine
 *
 * Core responsibilities:
 * 1. Apply formatting rules (em dash -> double hyphen)
 * 2. Check for voice markers (parentheticals, spacing, etc.)
 * 3. Score text for voice authenticity (0-100)
 * 4. Suggest improvements to match voice
 *
 * Adapted from PowerPak justin-voice-server
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { VoiceAnalysisResult, VoiceSuggestion, WritingRule, RuleCategory } from './types.js'

export class RuleEnforcer {
  private rules: WritingRule[] = []

  constructor(rulesPath?: string) {
    if (rulesPath && fs.existsSync(rulesPath)) {
      const data = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'))
      this.rules = data.rules || []
    }
  }

  /**
   * Apply formatting rules to text
   * Returns corrected text
   */
  applyFormattingRules(text: string): string {
    let corrected = text

    // Rule: Replace em dash with double hyphen
    corrected = corrected.replace(/\u2014/g, '--')

    // Rule: Ensure parentheticals have consistent spacing
    corrected = corrected.replace(/\(\s+/g, '(')
    corrected = corrected.replace(/\s+\)/g, ')')

    return corrected
  }

  /**
   * Analyze text for voice similarity
   * Returns score (0-100) and detailed feedback
   */
  analyzeVoice(text: string): VoiceAnalysisResult {
    const strengths: string[] = []
    const improvements: string[] = []
    const suggestions: VoiceSuggestion[] = []

    let score = 50 // Start at baseline

    // Check for parenthetical asides (signature move)
    const parentheticalCount = (text.match(/\([^)]+\)/g) || []).length
    if (parentheticalCount > 0) {
      strengths.push(`Uses parenthetical asides (${parentheticalCount} found)`)
      score += 10
    } else {
      improvements.push('No parenthetical asides found')
      suggestions.push({
        issue: 'Missing parenthetical asides',
        suggestion: 'Add conversational asides in parentheses',
        example: 'like this (you know what I mean?)',
      })
      score -= 10
    }

    // Check for em dash vs double hyphen
    const emDashCount = (text.match(/\u2014/g) || []).length
    if (emDashCount > 0) {
      improvements.push(`Found ${emDashCount} em dashes (AI tell)`)
      suggestions.push({
        issue: 'Using em dash instead of double hyphen (--)',
        suggestion: 'Replace all em dashes with double hyphens',
        example: 'Use -- not \u2014',
      })
      score -= 5
    } else {
      const doubleHyphenCount = (text.match(/--/g) || []).length
      if (doubleHyphenCount > 0) {
        strengths.push('Uses double hyphen correctly')
        score += 5
      }
    }

    // Check for profanity (strategic rhythm)
    const profanityPattern = /\b(fuck|shit|damn|hell)\b/gi
    const profanityCount = (text.match(profanityPattern) || []).length
    if (profanityCount > 0 && profanityCount <= 3) {
      strengths.push('Strategic profanity for rhythm')
      score += 5
    } else if (profanityCount > 3) {
      improvements.push('Too much profanity (loses impact)')
      score -= 5
    } else {
      suggestions.push({
        issue: 'No profanity detected',
        suggestion: 'Consider strategic profanity for rhythm and emphasis',
        example: '"And that\'s when shit got interesting"',
      })
    }

    // Check for paragraph spacing (visual rhythm)
    const paragraphs = text.split(/\n\n+/)
    const paragraphCount = paragraphs.filter(p => p.trim().length > 0).length

    if (paragraphCount > 3) {
      strengths.push('Good visual rhythm with paragraph spacing')
      score += 5
    } else if (paragraphCount === 1) {
      improvements.push('Wall of text - needs breathing room')
      suggestions.push({
        issue: 'Lack of paragraph breaks',
        suggestion: 'Add spacing for pacing - double space = pause',
        example: 'Break every ~100 words for relief',
      })
      score -= 10
    }

    // Check for short punchy sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const shortSentences = sentences.filter(s => s.split(' ').length <= 8).length
    const shortSentenceRatio = sentences.length > 0 ? shortSentences / sentences.length : 0

    if (shortSentenceRatio > 0.3) {
      strengths.push('Good mix of short punchy sentences')
      score += 10
    } else {
      improvements.push('Sentences too long - needs more punch')
      suggestions.push({
        issue: 'Lack of short sentences',
        suggestion: 'Add short, punchy sentences for rhythm',
        example: 'Short sentences. Create. Impact.',
      })
      score -= 5
    }

    // Check for vocabulary whiplash (high/low mix)
    const highRegisterWords = /\b(ontological|epistemological|phenomenological|existential|paradigm)\b/gi
    const lowRegisterWords = /\b(fucking|shit|dude|whatever|basically)\b/gi

    const hasHighRegister = highRegisterWords.test(text)
    const hasLowRegister = lowRegisterWords.test(text)

    if (hasHighRegister && hasLowRegister) {
      strengths.push('Vocabulary whiplash - high/low mix')
      score += 10
    } else if (hasHighRegister && !hasLowRegister) {
      improvements.push('Too formal - needs casual language')
      suggestions.push({
        issue: 'Only high-register vocabulary',
        suggestion: 'Mix in casual/colloquial language for contrast',
        example: '"The ontological implications are, frankly, fucking wild"',
      })
    } else if (hasLowRegister && !hasHighRegister) {
      improvements.push('Too casual - needs intellectual depth')
    }

    // Check for self-deprecation
    const selfDeprecatingPatterns = /\b(my therapist|embarrassing|failed|stupid|idiot|mess)\b/gi
    const hasSelfDeprecation = selfDeprecatingPatterns.test(text)

    if (hasSelfDeprecation) {
      strengths.push('Self-deprecating humor present')
      score += 5
    } else {
      suggestions.push({
        issue: 'Missing self-deprecation',
        suggestion: 'Add genuine self-deprecating humor',
        example: '"I was, as my therapist would say, \'catastrophizing\'"',
      })
    }

    // Check for specific embarrassing details
    const hasNumbers = /\b\d+\b/.test(text)
    const hasQuotes = /"[^"]+"/.test(text)

    if (hasNumbers && hasQuotes) {
      strengths.push('Specific details and dialogue')
      score += 5
    }

    // Check for vulnerability boundary violations
    const presentTenseWeakness = /\b(I'm (terrified|scared|afraid|worried) (right now|that))\b/gi
    if (presentTenseWeakness.test(text)) {
      improvements.push('Violates vulnerability boundary - too present-tense weak')
      suggestions.push({
        issue: 'Present-tense vulnerability',
        suggestion: 'Refer to the mess, don\'t be IN the mess',
        example: 'YES: "my daily panic attacks" | NO: "I\'m terrified right now"',
      })
      score -= 15
    }

    // Check for corporate jargon (red flag)
    const corporateJargon = /\b(synergy|leverage|actionable insights|thought leader|value-add|circle back|touch base)\b/gi
    const jargonCount = (text.match(corporateJargon) || []).length

    if (jargonCount > 0) {
      improvements.push(`Corporate jargon detected (${jargonCount} instances)`)
      suggestions.push({
        issue: 'Corporate speak detected',
        suggestion: 'Replace jargon with conversational language',
      })
      score -= 10
    }

    // Check for questions (engagement)
    const questionCount = (text.match(/\?/g) || []).length
    if (questionCount > 0) {
      strengths.push('Uses questions for engagement')
      score += 5
    }

    // Cap score at 0-100
    score = Math.max(0, Math.min(100, score))

    return {
      overallScore: score,
      strengths,
      improvements,
      suggestions,
    }
  }

  /**
   * Get specific suggestions to improve text
   */
  suggestImprovements(text: string): VoiceSuggestion[] {
    const analysis = this.analyzeVoice(text)
    return analysis.suggestions
  }

  /**
   * Get all writing rules
   */
  getRules(): WritingRule[] {
    return this.rules
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): WritingRule[] {
    return this.rules.filter(r => r.category === category)
  }
}
