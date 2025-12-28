/**
 * Human OS VoiceOS - Commandment Parser
 *
 * Parses voice profile commandment files (markdown with YAML frontmatter).
 * Supports the "10 Commandments" file format from Voice-OS synthesis.
 */

import type {
  CommandmentFrontmatter,
  ParsedCommandmentFile,
  VoicePatterns,
  VoicePattern,
  VoiceAntiPattern,
  SignaturePhrase,
} from './types.js'

// =============================================================================
// FRONTMATTER PARSING
// =============================================================================

/**
 * Parse YAML frontmatter from a commandment file
 */
export function parseFrontmatter(content: string): {
  frontmatter: CommandmentFrontmatter
  body: string
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    throw new Error('No frontmatter found in commandment file')
  }

  const yamlContent = match[1] || ''
  const bodyContent = match[2] || ''

  // Parse YAML (simple key: value pairs)
  const frontmatter: Record<string, string> = {}
  const lines = yamlContent.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      frontmatter[key] = value
    }
  }

  return {
    frontmatter: {
      title: frontmatter.title || '',
      entity: frontmatter.entity || '',
      version: frontmatter.version || '1.0',
      created: frontmatter.created || new Date().toISOString().slice(0, 10),
      revised: frontmatter.revised,
    },
    body: bodyContent.trim(),
  }
}

/**
 * Parse a complete commandment file
 */
export function parseCommandmentFile(content: string): ParsedCommandmentFile {
  const { frontmatter, body } = parseFrontmatter(content)
  return {
    frontmatter,
    content: body,
  }
}

// =============================================================================
// VOICE.md PARSING
// =============================================================================

/**
 * Parse the VOICE.md commandment into structured patterns
 */
export function parseVoiceCommandment(content: string): VoicePatterns {
  const sections = splitIntoSections(content)

  return {
    always: parseAlwaysPatterns(sections['Always'] || sections['## Always'] || ''),
    never: parseNeverPatterns(sections['Never'] || sections['## Never'] || ''),
    signaturePhrases: parseSignaturePhrases(
      sections['Signature Phrases'] || sections['## Signature Phrases'] || ''
    ),
    vocabularyFingerprint: parseVocabulary(
      sections['Vocabulary Fingerprint'] || sections['## Vocabulary Fingerprint'] || ''
    ),
    rhythm: parseRhythm(sections['Rhythm'] || sections['## Rhythm'] || ''),
    punctuation: parsePunctuation(sections['Punctuation'] || sections['## Punctuation'] || ''),
    tensions: parseTensions(
      sections['Tensions (Generation Guidance)'] ||
      sections['## Tensions (Generation Guidance)'] || ''
    ),
  }
}

/**
 * Split markdown content into named sections
 */
function splitIntoSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const sectionRegex = /^## (.+)$/gm
  const matches = [...content.matchAll(sectionRegex)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    if (!match || match.index === undefined) continue
    const sectionName = (match[1] || '').trim()
    const startIndex = match.index + match[0].length
    const nextMatch = matches[i + 1]
    const endIndex = nextMatch?.index ?? content.length
    sections[sectionName] = content.slice(startIndex, endIndex).trim()
  }

  return sections
}

/**
 * Parse "Always" voice patterns
 */
function parseAlwaysPatterns(section: string): VoicePattern[] {
  const patterns: VoicePattern[] = []
  const patternRegex = /### \d+\. (.+)\n([\s\S]*?)(?=### \d+\.|$)/g

  for (const match of section.matchAll(patternRegex)) {
    const name = (match[1] || '').trim()
    const body = (match[2] || '').trim()

    // Extract examples (lines starting with >)
    const examples = [...body.matchAll(/^> (.+)$/gm)].map(m => (m[1] || '').trim())

    // Extract frequency (lines starting with --)
    const frequencyMatch = body.match(/-- Frequency: (.+)$/)
    const frequency = frequencyMatch?.[1]?.trim() || ''

    // Description is the first line that's not an example or frequency
    const descLines = body.split('\n').filter(l =>
      !l.startsWith('>') && !l.startsWith('--') && l.trim().length > 0
    )
    const description = descLines[0] || ''

    patterns.push({ name, description, examples, frequency })
  }

  return patterns
}

/**
 * Parse "Never" anti-patterns
 */
function parseNeverPatterns(section: string): VoiceAntiPattern[] {
  const patterns: VoiceAntiPattern[] = []
  const patternRegex = /### \d+\. (.+)\n([\s\S]*?)(?=### \d+\.|$)/g

  for (const match of section.matchAll(patternRegex)) {
    const name = (match[1] || '').trim()
    const body = (match[2] || '').trim()

    // Extract wrong/right examples
    const wrongMatch = body.match(/> Wrong: (.+)$/)
    const rightMatch = body.match(/> Right: (.+)$/)

    // Description is the first line
    const description = body.split('\n')[0]?.trim() || ''

    patterns.push({
      name,
      description,
      wrongExample: wrongMatch?.[1]?.trim(),
      rightExample: rightMatch?.[1]?.trim(),
    })
  }

  return patterns
}

/**
 * Parse signature phrases
 */
function parseSignaturePhrases(section: string): {
  timeless: SignaturePhrase[]
  currentEra: SignaturePhrase[]
  emphaticDismissals: SignaturePhrase[]
} {
  const result = {
    timeless: [] as SignaturePhrase[],
    currentEra: [] as SignaturePhrase[],
    emphaticDismissals: [] as SignaturePhrase[],
  }

  // Parse table rows
  const tableRowRegex = /\| ["']?([^"|]+)["']? \| ([^|]+) \| ([^|]+) \|/g

  const timelessSection = section.match(/### Timeless[\s\S]*?(?=###|$)/)?.[0] || ''
  const currentSection = section.match(/### Current Era[\s\S]*?(?=###|$)/)?.[0] || ''
  const dismissalsSection = section.match(/### Emphatic Dismissals[\s\S]*?(?=###|$)/)?.[0] || ''

  for (const match of timelessSection.matchAll(tableRowRegex)) {
    result.timeless.push({
      phrase: (match[1] || '').trim(),
      frequency: (match[2] || '').trim(),
      context: (match[3] || '').trim(),
    })
  }

  for (const match of currentSection.matchAll(tableRowRegex)) {
    result.currentEra.push({
      phrase: (match[1] || '').trim(),
      frequency: (match[2] || '').trim(),
      context: (match[3] || '').trim(),
    })
  }

  for (const match of dismissalsSection.matchAll(tableRowRegex)) {
    result.emphaticDismissals.push({
      phrase: (match[1] || '').trim(),
      context: (match[2] || '').trim(),
    })
  }

  return result
}

/**
 * Parse vocabulary fingerprint
 */
function parseVocabulary(section: string): VoicePatterns['vocabularyFingerprint'] {
  return {
    industryJargon: extractBulletList(section, 'Industry Jargon'),
    registerShifts: {
      high: extractInlineList(section, 'High vocabulary'),
      low: extractInlineList(section, 'Low vocabulary'),
      pattern: extractAfterColon(section, 'Pattern') || '',
    },
    overusedWords: extractBulletList(section, 'Overused Words'),
    structuralPatterns: extractBulletList(section, 'Structural Patterns'),
    popCultureRefs: extractBulletList(section, 'Pop Culture References'),
  }
}

/**
 * Parse rhythm patterns
 */
function parseRhythm(section: string): VoicePatterns['rhythm'] {
  return {
    sentenceLengthPattern: extractAfterHeader(section, 'Sentence Length Pattern') || '',
    paragraphStructure: {
      linkedin: extractAfterBold(section, 'LinkedIn') || '',
      newsletters: extractAfterBold(section, 'Newsletters') || '',
      podcasts: extractAfterBold(section, 'Podcasts') || '',
    },
    buildToMicDrop: extractAfterHeader(section, 'Build to Mic Drop') || '',
    alternatingModes: extractBulletList(section, 'Alternating Modes'),
  }
}

/**
 * Parse punctuation patterns
 */
function parsePunctuation(section: string): VoicePatterns['punctuation'] {
  const result: VoicePatterns['punctuation'] = {}
  const subsections = section.match(/### .+[\s\S]*?(?=###|$)/g) || []

  for (const subsection of subsections) {
    const nameMatch = subsection.match(/### (.+)/)
    if (!nameMatch) continue

    const name = (nameMatch[1] || '').trim()
    const description = extractFirstLine(subsection.slice(nameMatch[0].length))
    const frequencyMatch = subsection.match(/-- Frequency: (.+)$/)
    const examples = [...subsection.matchAll(/^> (.+)$/gm)].map(m => (m[1] || '').trim())

    result[name] = {
      description,
      frequency: frequencyMatch?.[1]?.trim() || '',
      examples,
    }
  }

  return result
}

/**
 * Parse generation tensions
 */
function parseTensions(section: string): VoicePatterns['tensions'] {
  const tensions: VoicePatterns['tensions'] = []
  const subsections = section.match(/### .+[\s\S]*?(?=###|$)/g) || []

  for (const subsection of subsections) {
    const nameMatch = subsection.match(/### (.+)/)
    if (!nameMatch) continue

    const name = (nameMatch[1] || '').trim()
    const body = subsection.slice(nameMatch[0].length).trim()

    // Extract description and rule
    const lines = body.split('\n').filter(l => l.trim().length > 0)
    const description = lines[0] || ''
    const ruleMatch = body.match(/\*\*Rule:\*\* (.+)/)
    const rule = ruleMatch?.[1]?.trim() || ''

    tensions.push({ name, description, rule })
  }

  return tensions
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractBulletList(content: string, afterHeader: string): string[] {
  const headerRegex = new RegExp(`### ${afterHeader}[\\s\\S]*?(?=###|$)`)
  const section = content.match(headerRegex)?.[0] || ''
  return [...section.matchAll(/^- (.+)$/gm)].map(m => (m[1] || '').trim())
}

function extractInlineList(content: string, prefix: string): string[] {
  const lineMatch = content.match(new RegExp(`\\*\\*${prefix}:\\*\\* (.+)$`, 'm'))
  if (!lineMatch) return []
  return (lineMatch[1] || '').split(/,\s*/).map(s => s.replace(/[""]/g, '').trim())
}

function extractAfterColon(content: string, prefix: string): string | null {
  const match = content.match(new RegExp(`\\*\\*${prefix}:\\*\\* (.+)$`, 'm'))
  return match ? (match[1] ?? '').trim() : null
}

function extractAfterHeader(content: string, header: string): string | null {
  const headerRegex = new RegExp(`### ${header}\\n(.+)`, 'm')
  const match = content.match(headerRegex)
  return match ? (match[1] ?? '').trim() : null
}

function extractAfterBold(content: string, label: string): string | null {
  const regex = new RegExp(`\\*\\*${label}:\\*\\* (.+)$`, 'm')
  const match = content.match(regex)
  return match ? (match[1] ?? '').trim() : null
}

function extractFirstLine(content: string): string {
  const lines = content.trim().split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0 && !trimmed.startsWith('#')) {
      return trimmed
    }
  }
  return ''
}
