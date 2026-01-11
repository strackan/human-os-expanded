/**
 * Human OS VoiceOS Package
 *
 * Voice profile synthesis and content generation based on the
 * "10 Commandments" architecture from Voice-OS.
 *
 * @packageDocumentation
 */

// Types
export type {
  CommandmentType,
  CommandmentFrontmatter,
  Commandment,
  VoiceProfile,
  VoicePattern,
  VoiceAntiPattern,
  SignaturePhrase,
  VoicePatterns,
  GenerationContext,
  GenerationResult,
  VoiceConfig,
  CreateVoiceProfileInput,
  UpsertCommandmentInput,
  ParsedCommandmentFile,
} from './types.js'

export { CommandmentTypes, CommandmentTypeSchema, VoiceProfileSchema, CommandmentSchema } from './types.js'

// Parser
export {
  parseFrontmatter,
  parseCommandmentFile,
  parseVoiceCommandment,
} from './parser.js'

// Profile Manager
export { VoiceProfileManager } from './profile.js'

// Voice Engine (from PowerPak migration)
export { VoiceEngine, RuleEnforcer } from './engine/index.js'
export type {
  VoiceAnalysisResult,
  VoiceSuggestion,
  WritingRule,
  RuleCategory,
  Template,
  TemplateCategory,
  BlendRecipe,
  ContentGenerationRequest,
  ContentGenerationResponse,
  VoiceEngineConfig,
} from './engine/types.js'
