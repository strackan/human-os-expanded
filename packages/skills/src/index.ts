/**
 * Human OS Skills Package
 *
 * PowerPak skills engine: SKILL.md parsing, indexing, and search.
 * Implements the "expertise as a service" pattern.
 *
 * @packageDocumentation
 */

// Types
export type {
  SkillFrontmatter,
  ToolParameter,
  SkillTool,
  ProgramStep,
  SkillProgram,
  SkillFile,
  SkillSearchResult,
  SkillSearchOptions,
  SkillsConfig,
  CreateSkillFileInput,
  ParsedSkillFile,
} from './types.js'

export {
  SkillFrontmatterSchema,
  SkillToolSchema,
  SkillProgramSchema,
  SkillFileSchema,
} from './types.js'

// Parser
export {
  parseSkillFile,
  parseFrontmatter,
  parseTools,
  parsePrograms,
} from './parser.js'
