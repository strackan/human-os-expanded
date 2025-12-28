/**
 * Human OS Skills Package - SKILL.md Parser
 *
 * Parses SKILL.md files with YAML frontmatter, tool definitions, and programs.
 * Follows the PowerPak SKILL.md format.
 */

import type {
  SkillFrontmatter,
  SkillTool,
  SkillProgram,
  ProgramStep,
  ToolParameter,
  ParsedSkillFile,
} from './types.js'

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse a complete SKILL.md file
 */
export function parseSkillFile(content: string): ParsedSkillFile {
  const { frontmatter, body } = parseFrontmatter(content)
  const tools = parseTools(body)
  const programs = parsePrograms(body)

  return {
    frontmatter,
    content: body,
    tools,
    programs,
  }
}

// =============================================================================
// FRONTMATTER PARSING
// =============================================================================

/**
 * Parse YAML frontmatter from SKILL.md
 */
export function parseFrontmatter(content: string): {
  frontmatter: SkillFrontmatter
  body: string
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    throw new Error('No frontmatter found in SKILL.md file')
  }

  const yamlContent = match[1] || ''
  const body = match[2] || ''
  const parsed = parseYaml(yamlContent)

  // Validate required fields
  const name = String(parsed.name || '')
  if (!name) {
    throw new Error('SKILL.md frontmatter missing required field: name')
  }

  let slug = String(parsed.slug || '')
  if (!slug) {
    // Auto-generate slug from name if not provided
    slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const tier = String(parsed.tier || 'free')
  const validTiers = ['free', 'pro', 'enterprise'] as const
  const validatedTier = validTiers.includes(tier as typeof validTiers[number])
    ? (tier as 'free' | 'pro' | 'enterprise')
    : 'free'

  return {
    frontmatter: {
      name,
      slug,
      version: String(parsed.version || '1.0.0'),
      tier: validatedTier,
      author: parsed.author ? String(parsed.author) : undefined,
      tags: parseArrayValue(parsed.tags),
      description: parsed.description ? String(parsed.description) : undefined,
      requires: parseArrayValue(parsed.requires),
    },
    body: body.trim(),
  }
}

// =============================================================================
// TOOL PARSING
// =============================================================================

/**
 * Parse tool definitions from SKILL.md body
 *
 * Tools are defined in a ## Tools section with the format:
 * ### tool_name
 * Description text
 *
 * **Parameters:**
 * - `param_name` (type, required): Description
 *
 * **Returns:** Description
 */
export function parseTools(body: string): SkillTool[] {
  const tools: SkillTool[] = []

  // Find the Tools section
  const toolsSection = extractSection(body, 'Tools')
  if (!toolsSection) return tools

  // Parse each tool (### heading)
  const toolRegex = /### (\w+)\n([\s\S]*?)(?=###|$)/g

  for (const match of toolsSection.matchAll(toolRegex)) {
    const name = (match[1] || '').trim()
    const content = (match[2] || '').trim()

    // Extract description (first non-empty lines before **Parameters**)
    const descMatch = content.match(/^([\s\S]*?)(?=\*\*Parameters|$)/)
    const description = descMatch ? (descMatch[1] || '').trim() : ''

    // Extract parameters
    const parameters = parseParameters(content)

    // Extract returns
    const returnsMatch = content.match(/\*\*Returns:\*\*\s*(.+)$/m)
    const returns = returnsMatch ? (returnsMatch[1] || '').trim() : undefined

    // Extract examples
    const examples = parseExamples(content)

    tools.push({
      name,
      description,
      parameters,
      returns,
      examples: examples.length > 0 ? examples : undefined,
    })
  }

  return tools
}

/**
 * Parse parameters from tool content
 */
function parseParameters(content: string): ToolParameter[] {
  const params: ToolParameter[] = []

  // Find parameters section
  const paramsMatch = content.match(/\*\*Parameters:\*\*\n([\s\S]*?)(?=\*\*Returns|\*\*Example|$)/)
  if (!paramsMatch) return params

  // Parse each parameter line: - `name` (type, required): description
  const paramRegex = /- `(\w+)`\s*\(([^)]+)\)(?::\s*(.+))?/g

  for (const match of (paramsMatch[1] || '').matchAll(paramRegex)) {
    const name = match[1] || ''
    const typeInfo = (match[2] || '').split(',').map(s => s.trim())
    const description = match[3]?.trim()

    const type = parseType(typeInfo[0] || 'string')
    const required = typeInfo.some(t => t.toLowerCase() === 'required')

    params.push({
      name,
      type,
      description,
      required,
    })
  }

  return params
}

/**
 * Parse type string to ToolParameter type
 */
function parseType(typeStr: string): ToolParameter['type'] {
  const normalized = typeStr.toLowerCase().trim()
  switch (normalized) {
    case 'string':
    case 'str':
      return 'string'
    case 'number':
    case 'int':
    case 'integer':
    case 'float':
      return 'number'
    case 'boolean':
    case 'bool':
      return 'boolean'
    case 'array':
    case 'list':
      return 'array'
    case 'object':
    case 'dict':
    case 'json':
      return 'object'
    default:
      return 'string'
  }
}

/**
 * Parse examples from tool content
 */
function parseExamples(content: string): string[] {
  const examples: string[] = []

  // Find examples section
  const examplesMatch = content.match(/\*\*Examples?:\*\*\n([\s\S]*?)(?=###|$)/)
  if (!examplesMatch) return examples

  // Extract code blocks
  const codeBlockRegex = /```[\s\S]*?```/g
  for (const match of (examplesMatch[1] || '').matchAll(codeBlockRegex)) {
    examples.push(match[0])
  }

  return examples
}

// =============================================================================
// PROGRAM PARSING
// =============================================================================

/**
 * Parse program definitions from SKILL.md body
 *
 * Programs are defined in a ## Programs section with the format:
 * ### program_name
 * Description text
 *
 * **Steps:**
 * 1. step_name: tool_name(params)
 * 2. step_name: tool_name(params) -> output_var
 */
export function parsePrograms(body: string): SkillProgram[] {
  const programs: SkillProgram[] = []

  // Find the Programs section
  const programsSection = extractSection(body, 'Programs')
  if (!programsSection) return programs

  // Parse each program (### heading)
  const programRegex = /### (\w+)\n([\s\S]*?)(?=###|$)/g

  for (const match of programsSection.matchAll(programRegex)) {
    const name = (match[1] || '').trim()
    const content = (match[2] || '').trim()

    // Extract description (first non-empty lines before **Steps**)
    const descMatch = content.match(/^([\s\S]*?)(?=\*\*Steps|$)/)
    const description = descMatch ? (descMatch[1] || '').trim() : ''

    // Extract steps
    const steps = parseSteps(content)

    // Extract input parameters
    const inputMatch = content.match(/\*\*Input:\*\*\n([\s\S]*?)(?=\*\*Steps|$)/)
    const input = inputMatch ? parseParameters(inputMatch[0]) : undefined

    // Extract output
    const outputMatch = content.match(/\*\*Output:\*\*\s*(.+)$/m)
    const output = outputMatch ? (outputMatch[1] || '').trim() : undefined

    programs.push({
      name,
      description,
      steps,
      input: input && input.length > 0 ? input : undefined,
      output,
    })
  }

  return programs
}

/**
 * Parse steps from program content
 */
function parseSteps(content: string): ProgramStep[] {
  const steps: ProgramStep[] = []

  // Find steps section
  const stepsMatch = content.match(/\*\*Steps:\*\*\n([\s\S]*?)(?=\*\*Output|$)/)
  if (!stepsMatch) return steps

  // Parse each step: N. step_name: tool_name(params) -> output
  const stepRegex = /\d+\.\s*(\w+):\s*(\w+)\(([^)]*)\)(?:\s*->\s*(\w+))?/g

  for (const match of (stepsMatch[1] || '').matchAll(stepRegex)) {
    const stepName = match[1] || ''
    const tool = match[2] || ''
    const paramsStr = match[3] || ''
    const output = match[4]

    // Parse params
    const params: Record<string, unknown> = {}
    if (paramsStr) {
      // Simple key=value or key parsing
      const paramPairs = paramsStr.split(',').map(s => s.trim())
      for (const pair of paramPairs) {
        if (pair.includes('=')) {
          const parts = pair.split('=').map(s => s.trim())
          const key = parts[0] || ''
          const value = parts[1] || ''
          params[key] = parseParamValue(value)
        } else if (pair.startsWith('{') && pair.endsWith('}')) {
          // Variable reference like {previous_output}
          params['input'] = pair
        }
      }
    }

    steps.push({
      name: stepName,
      tool,
      params: Object.keys(params).length > 0 ? params : undefined,
      output,
    })
  }

  return steps
}

/**
 * Parse a parameter value (handle strings, numbers, booleans, variables)
 */
function parseParamValue(value: string): unknown {
  // Variable reference
  if (value.startsWith('{') && value.endsWith('}')) {
    return value
  }
  // Quoted string
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  // Number
  if (/^-?\d+\.?\d*$/.test(value)) {
    return parseFloat(value)
  }
  // Boolean
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  return value
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract a section by heading name
 */
function extractSection(body: string, sectionName: string): string | null {
  const regex = new RegExp(`## ${sectionName}\\n([\\s\\S]*?)(?=## |$)`, 'i')
  const match = body.match(regex)
  return match ? (match[1] || '').trim() : null
}

/**
 * Simple YAML parser for frontmatter
 */
function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = yaml.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Handle array notation [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''))
      } else {
        result[key] = value
      }
    }
  }

  return result
}

/**
 * Parse array value from YAML (string or actual array)
 */
function parseArrayValue(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''))
    }
    return [value]
  }
  return []
}
