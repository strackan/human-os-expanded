/**
 * Interview Conductor Types
 *
 * Types for the immersive interview experience that extracts signals
 * from natural conversation across scenes and characters.
 */

import type {
  InterviewDimension,
  DimensionScore,
  CompetencyProfile,
  TextEmotionAnalysis,
  CandidateArchetype,
  InterviewTier,
} from '../types/index.js';

// =============================================================================
// SCENE & CHARACTER
// =============================================================================

/**
 * The three interview scenes
 */
export type Scene = 'elevator' | 'reception' | 'office';

/**
 * Characters the candidate interacts with
 */
export type Character = 'operator' | 'receptionist' | 'interviewer';

/**
 * Configuration for a scene
 */
export interface SceneConfig {
  scene: Scene;
  character: Character;
  characterName: string;
  persona: string;              // Character voice/personality description
  purpose: string[];            // What signals this scene extracts
  openingLine: string;          // How character starts conversation
  followUpPrompts: string[];    // Natural follow-up questions
  transitionLine: string;       // How character ends the scene
  maxExchanges: number;         // Keep conversations tight
}

/**
 * A single exchange in the interview
 */
export interface TranscriptEntry {
  scene: Scene;
  character: Character;
  speaker: 'character' | 'candidate';
  text: string;
  timestamp: Date;
  exchangeNumber: number;
}

/**
 * What the conductor returns after each exchange
 */
export interface ScenePrompt {
  scene: Scene;
  character: Character;
  characterName: string;
  prompt: string;
  isTransition: boolean;        // Moving to next scene
  exchangeNumber: number;
  totalExchanges: number;
}

/**
 * Interview completion result
 */
export interface InterviewComplete {
  complete: true;
  transcript: TranscriptEntry[];
  result: AssessmentResult;
}

// =============================================================================
// ASSESSMENT RESULT (Core, rubric-agnostic)
// =============================================================================

/**
 * Core assessment result - raw dimensional scores that can be formatted
 * by any handler into different output formats (D&D, Professional, etc.)
 */
export interface AssessmentResult {
  candidateName: string;
  transcript: TranscriptEntry[];

  // Raw 11-dimension scores (0-10 scale)
  dimensions: Record<InterviewDimension, DimensionScore>;

  // Competency signals detected
  competencies: CompetencyProfile;

  // Emotional analysis
  emotions: TextEmotionAnalysis;

  // Archetype classification
  archetype: {
    primary: CandidateArchetype;
    secondary?: CandidateArchetype;
    confidence: number;
    allScores: Record<CandidateArchetype, number>;
  };

  // Raw tier
  tier: InterviewTier;
  overallScore: number;

  // Flags (always useful)
  greenFlags: string[];
  redFlags: string[];

  // Metadata
  completedAt: Date;
  durationMs: number;
}

// =============================================================================
// HANDLERS (Pluggable output formatters)
// =============================================================================

/**
 * Handler interface for formatting assessment results
 */
export interface AssessmentHandler<T> {
  name: string;
  description: string;
  format(result: AssessmentResult): T;
}

// =============================================================================
// D&D OUTPUT FORMAT
// =============================================================================

/**
 * D&D-style stat block
 */
export interface DnDStats {
  STR: number;  // GTM + Technical execution
  DEX: number;  // Adaptability + Culture Fit
  CON: number;  // Motivation + Work History (endurance)
  INT: number;  // IQ + Technical knowledge
  WIS: number;  // Self-Awareness + EQ
  CHA: number;  // Personality + Empathy
}

/**
 * D&D class mapping from archetypes
 */
export type DnDClass =
  | 'Artificer'      // Technical Builder
  | 'Bard'           // GTM Operator (charisma, persuasion)
  | 'Wizard'         // Creative Strategist (intelligence, planning)
  | 'Fighter'        // Execution Machine (discipline, consistency)
  | 'Ranger'         // Generalist Orchestrator (versatility)
  | 'Cleric';        // Domain Expert (specialized knowledge)

/**
 * D&D race mapping based on personality + archetype
 *
 * Race represents the candidate's core nature/approach:
 * - Gnome: Curious tinkerers, love learning and building
 * - Dwarf: Resilient craftspeople, deep expertise, steady
 * - Elf: Long-term thinkers, elegant solutions, refined
 * - Human: Adaptable, ambitious, versatile
 * - Half-Elf: Diplomatic, bridges gaps, charismatic
 * - Tiefling: Unconventional thinkers, unique perspective
 * - Halfling: Resourceful, optimistic, team-oriented
 * - Dragonborn: Bold leaders, commanding presence
 */
export type DnDRace =
  | 'Gnome'          // High curiosity, loves learning
  | 'Dwarf'          // Resilient, deep expertise, steady
  | 'Elf'            // Refined, strategic, long-term thinker
  | 'Human'          // Adaptable, ambitious, versatile
  | 'Half-Elf'       // Diplomatic, bridges gaps, charismatic
  | 'Tiefling'       // Unconventional, unique perspective
  | 'Halfling'       // Resourceful, optimistic, team player
  | 'Dragonborn';    // Bold leader, commanding presence

/**
 * D&D character sheet output
 */
export interface DnDSheet {
  name: string;
  race: DnDRace;
  class: DnDClass;
  level: number;              // 1-20 based on tier
  stats: DnDStats;
  proficiencies: string[];    // Top competencies
  traits: string[];           // Green flags
  flaws: string[];            // Red flags
  backstory: string;          // Summary from interview
}

// =============================================================================
// PROFESSIONAL OUTPUT FORMAT
// =============================================================================

/**
 * Traditional competency rating
 */
export type CompetencyRating =
  | 'Exceptional'      // 9-10
  | 'Exceeds'          // 7-8.9
  | 'Meets'            // 5-6.9
  | 'Developing'       // 3-4.9
  | 'Below';           // 0-2.9

/**
 * Hiring recommendation
 */
export type HiringRecommendation =
  | 'Strong Hire'
  | 'Hire'
  | 'No Hire'
  | 'Strong No Hire';

/**
 * Professional assessment output
 */
export interface ProfessionalAssessment {
  candidateName: string;
  assessmentDate: Date;
  overallRating: CompetencyRating;
  recommendation: HiringRecommendation;

  competencyLevels: Record<string, CompetencyRating>;

  strengths: string[];
  developmentAreas: string[];

  cultureAlignment: 'Strong' | 'Moderate' | 'Weak';
  rolefit: 'Excellent' | 'Good' | 'Fair' | 'Poor';

  summary: string;
  nextSteps: string[];
}

// =============================================================================
// ENGINE STATE
// =============================================================================

/**
 * Current state of an interview session
 */
export interface InterviewState {
  candidateName: string;
  currentScene: Scene;
  currentExchange: number;
  transcript: TranscriptEntry[];
  startedAt: Date;
  sceneStartedAt: Date;
}
