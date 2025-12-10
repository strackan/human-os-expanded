/**
 * Voice Pack Types
 *
 * Type definitions for voice pack configurations.
 */

/**
 * Voice pack configuration
 */
export interface VoicePack {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;

  // Core voice settings
  voice: VoiceConfig;

  // Templates available in this pack
  templates: Template[];

  // Blends for combining styles
  blends: Blend[];

  // Current state (mutable)
  currentState?: CurrentState;
}

/**
 * Core voice configuration
 */
export interface VoiceConfig {
  // Writing style parameters
  style: {
    tone: string[];
    formality: 'casual' | 'conversational' | 'professional' | 'formal';
    humor: 'none' | 'subtle' | 'moderate' | 'frequent';
    directness: 'indirect' | 'balanced' | 'direct' | 'blunt';
  };

  // Language patterns
  patterns: {
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    paragraphLength: 'short' | 'medium' | 'long';
    transitions: string[];
    openers: string[];
    closers: string[];
  };

  // Signature elements
  signatures: {
    phrases: string[];
    metaphors: string[];
    references: string[];
    avoidPhrases: string[];
  };

  // Context awareness
  contextRules: ContextRule[];
}

/**
 * Context-aware style rule
 */
export interface ContextRule {
  context: string;
  adjustments: Partial<VoiceConfig['style']>;
}

/**
 * Content template
 */
export interface Template {
  slug: string;
  name: string;
  description: string;
  category: 'social' | 'email' | 'blog' | 'speech' | 'conversation' | 'other';

  // Template structure
  structure: TemplateSection[];

  // Default parameters
  defaults: Record<string, unknown>;

  // Example outputs
  examples?: string[];
}

/**
 * Template section
 */
export interface TemplateSection {
  name: string;
  type: 'hook' | 'body' | 'cta' | 'signature' | 'custom';
  required: boolean;
  guidelines: string;
  wordCount?: { min: number; max: number };
}

/**
 * Blend configuration for mixing styles
 */
export interface Blend {
  slug: string;
  name: string;
  description: string;

  // Components and their weights
  components: BlendComponent[];

  // Use cases
  useCases: string[];
}

/**
 * Blend component
 */
export interface BlendComponent {
  source: string;
  weight: number;
  aspects: ('tone' | 'structure' | 'vocabulary' | 'pacing')[];
}

/**
 * Current state (mutable context)
 */
export interface CurrentState {
  // Recent topics and themes
  recentTopics: string[];

  // Current mood/energy level
  mood: 'high-energy' | 'reflective' | 'focused' | 'casual';

  // Active campaigns/projects
  activeProjects: string[];

  // Audience context
  primaryAudience: string;

  // Temporal context
  season?: string;
  timeOfYear?: string;

  // Recent posts (for continuity)
  recentPosts: RecentPost[];
}

/**
 * Recent post reference
 */
export interface RecentPost {
  date: string;
  platform: string;
  topic: string;
  performance?: {
    engagement: 'low' | 'medium' | 'high';
    sentiment: 'negative' | 'neutral' | 'positive';
  };
}

/**
 * Generation request
 */
export interface GenerateRequest {
  template: string;
  blend?: string;
  context?: Record<string, unknown>;
  parameters?: {
    length?: 'short' | 'medium' | 'long';
    tone?: string;
    audience?: string;
    platform?: string;
  };
}

/**
 * Generation result
 */
export interface GenerateResult {
  content: string;
  metadata: {
    template: string;
    blend?: string;
    wordCount: number;
    readingTime: number;
    voiceMatchScore?: number;
  };
  suggestions?: string[];
}

/**
 * Analysis request
 */
export interface AnalyzeRequest {
  text: string;
  compareToVoice?: boolean;
}

/**
 * Analysis result
 */
export interface AnalyzeResult {
  metrics: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readingLevel: string;
  };
  style: {
    tone: string[];
    formality: string;
    directness: string;
  };
  voiceMatch?: {
    score: number;
    alignedAspects: string[];
    divergentAspects: string[];
    suggestions: string[];
  };
}
