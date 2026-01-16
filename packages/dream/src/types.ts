/**
 * Dream Package Types
 *
 * Types for the dream() end-of-day processing system.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface DreamConfig {
  userId: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey?: string;

  /** Stale threshold in hours (default: 18) */
  staleThresholdHours?: number;

  /** Enable verbose logging */
  debug?: boolean;

  /** Enable MCP provider sync (Phase 0) */
  enableMCPSync?: boolean;

  /** Maximum items to process per MCP provider */
  mcpMaxItemsPerProvider?: number;

  /** Skip MCP providers with recent extractions (hours) */
  mcpSkipIfExtractedWithin?: number;
}

// =============================================================================
// TRANSCRIPT TYPES
// =============================================================================

export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface DayTranscript {
  date: string;
  messages: TranscriptMessage[];
  sessionIds?: string[];
  totalTokens?: number;
}

// =============================================================================
// PARSER OUTPUT TYPES
// =============================================================================

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'company' | 'project' | 'unknown';
  context: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  resolved?: boolean;
  entityId?: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  context: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: string;
  isExplicit: boolean; // "I need to..." vs inferred
}

export interface ExtractedCommitment {
  statement: string;
  context: string;
  strength: 'strong' | 'normal' | 'weak';
  /** If user said "no matter what", "I promise", etc. */
  isBinding: boolean;
}

export interface QuestionAnswer {
  questionId: string; // A1, B2, G15, etc.
  answer: string;
  quality: 'full' | 'partial';
  context: string;
  confidence: number; // 0-1
}

export interface EmotionalMarker {
  emotion: string;
  intensity: number; // 1-10
  context: string;
  timestamp?: string;
}

export interface GlossaryCandidate {
  term: string;
  definition?: string;
  context: string;
  termType: 'person' | 'acronym' | 'project' | 'slang' | 'shorthand';
}

export interface ParserOutput {
  date: string;
  entities: ExtractedEntity[];
  tasks: ExtractedTask[];
  commitments: ExtractedCommitment[];
  questionAnswers: QuestionAnswer[];
  emotionalMarkers: EmotionalMarker[];
  glossaryCandidates: GlossaryCandidate[];
  summary: string;
  themes: string[];
}

// =============================================================================
// REFLECTOR OUTPUT TYPES
// =============================================================================

export interface PatternObservation {
  type: 'avoidance' | 'recurring' | 'escalating' | 'improvement' | 'anomaly';
  description: string;
  evidence: string[];
  daysSeen: number;
  actionSuggestion?: string;
}

export interface PersonaCalibration {
  signal: string;
  value: string;
  source: string; // Question ID or inferred
  confidence: number;
}

/**
 * PersonaFingerprint - 8-dimension personality scoring
 *
 * These dimensions are used to configure NPC behavior to match
 * the user's communication style. The NPC becomes a reflection
 * of the user's own personality.
 */
export interface PersonaFingerprint {
  /** Makes fun of themselves first (0 = never, 10 = frequently) */
  self_deprecation: number;
  /** How blunt vs diplomatic (0 = very diplomatic, 10 = very direct) */
  directness: number;
  /** Emotional temperature (0 = cold/distant, 10 = very warm) */
  warmth: number;
  /** Leads with intelligence (0 = never, 10 = frequently) */
  intellectual_signaling: number;
  /** Can be genuine without awkwardness (0 = uncomfortable, 10 = very comfortable) */
  comfort_with_sincerity: number;
  /** Comfort with weird/playful tangents (0 = dislikes, 10 = embraces) */
  absurdism_tolerance: number;
  /** Are they meta about the interaction (0 = not at all, 10 = very meta) */
  format_awareness: number;
  /** Uses own weakness to connect (0 = never, 10 = frequently) */
  vulnerability_as_tool: number;
}

export const DEFAULT_PERSONA_FINGERPRINT: PersonaFingerprint = {
  self_deprecation: 5,
  directness: 5,
  warmth: 5,
  intellectual_signaling: 5,
  comfort_with_sincerity: 5,
  absurdism_tolerance: 5,
  format_awareness: 5,
  vulnerability_as_tool: 5,
};

export interface ProtocolAdjustment {
  protocol: string;
  adjustment: string;
  reason: string;
}

export interface ReflectorOutput {
  patterns: PatternObservation[];
  calibrations: PersonaCalibration[];
  protocolAdjustments: ProtocolAdjustment[];
  currentStateUpdate: string;
  moodTrend: 'improving' | 'stable' | 'declining' | 'volatile';
  /** 8-dimension persona fingerprint (scored 0-10 each) */
  personaFingerprint?: PersonaFingerprint;
  personaFingerprintReasoning?: Record<string, string>;
}

// =============================================================================
// PLANNER OUTPUT TYPES
// =============================================================================

export interface TaskCompletion {
  taskId: string;
  title: string;
  status: 'completed' | 'in_progress' | 'blocked' | 'dropped';
  notes?: string;
}

export interface DroppedBall {
  description: string;
  originalCommitment?: string;
  daysMissed: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface FollowUp {
  description: string;
  targetDate: string;
  relatedEntity?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TomorrowPriority {
  rank: number;
  description: string;
  reason: string;
  estimatedMinutes?: number;
}

export interface PlannerOutput {
  taskCompletions: TaskCompletion[];
  droppedBalls: DroppedBall[];
  followUps: FollowUp[];
  tomorrowPriorities: TomorrowPriority[];
  weeklyPlanStatus: {
    onTrack: boolean;
    percentComplete: number;
    blockers: string[];
  };
}

// =============================================================================
// TOUGH LOVE OUTPUT TYPES
// =============================================================================

export interface DeficiencyReport {
  area: string;
  expected: string;
  actual: string;
  gap: string;
  recommendation: string;
}

export interface ToughLoveOutput {
  overallAssessment: 'on_track' | 'minor_slip' | 'significant_gap' | 'crisis';
  deficiencies: DeficiencyReport[];
  bindingCommitmentsStatus: Array<{
    commitment: string;
    status: 'kept' | 'in_progress' | 'broken';
    notes?: string;
  }>;
  rawFeedback: string;
  actionRequired: boolean;
}

// =============================================================================
// DREAM RESULT
// =============================================================================

/** MCP Provider sync result */
export interface MCPProviderSyncResult {
  providerId: string;
  providerSlug: string;
  itemsProcessed: number;
  entitiesExtracted: number;
  errors: string[];
}

export interface DreamResult {
  date: string;
  startedAt: string;
  completedAt: string;

  /** Phase 0: MCP Provider sync results */
  mcpSync?: {
    providersProcessed: number;
    totalItemsProcessed: number;
    results: MCPProviderSyncResult[];
  };

  parser: ParserOutput;
  reflector: ReflectorOutput;
  planner: PlannerOutput;
  toughLove?: ToughLoveOutput;

  /** Database operations performed */
  operations: {
    journalEntriesCreated: number;
    entityMentionsCreated: number;
    leadsCreated: number;
    tasksCreated: number;
    glossaryEntriesCreated: number;
    questionAnswersRecorded: number;
    onboardingStateUpdated: boolean;
  };

  errors: string[];
}

// =============================================================================
// ONBOARDING STATE (matches DB schema)
// =============================================================================

export interface OnboardingState {
  userId: string;
  mode: 'tutorial' | 'development';
  questionsAnswered: Record<string, {
    answered: boolean;
    answeredAt?: string;
    quality?: 'full' | 'partial';
  }>;
  questionsAnsweredCount: number;
  communicationPrefsComplete: boolean;
  crisisPatternsComplete: boolean;
  milestonesCompleted: Record<string, string | null>;
  milestonesCount: number;
  daysOfInteraction: number;
  personaSignals: Record<string, string>;
  graduatedAt?: string;
  toughLoveEnabled: boolean;
}

// =============================================================================
// BASELINE QUESTIONS
// =============================================================================

export const BASELINE_QUESTIONS = {
  // Set A: Life Story
  A1: 'Describe a moment or experience that fundamentally changed who you are or how you see the world.',
  A2: 'Tell me about your single happiest memory.',
  A3: 'Tell me about a difficult time in your life and how you got through it.',
  A4: 'Tell me about something bad that happened to you that ultimately led to something good.',

  // Set B: Inner Self
  B1: 'Tell me about a time you failed someone you care about.',
  B2: "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?",
  B3: "What's a simple thing that matters a lot to you?",

  // Set C: Connection
  C1: 'What do you need from close relationships that you rarely ask for directly?',
  C2: "What's something you believe in intellectually but can't fully commit to in practice?",
  C3: "What's really keeping you from being happy?",

  // Set G: Personality Baseline
  G1: "When you're facing a big decision and feeling overwhelmed, what does that look like for you? What are the signs?",
  G2: "When you have too many options, what's your default response?",
  G3: 'Do you prefer someone to present options and let you decide, make a recommendation and let you override, or just make the call unless high-stakes?',
  G4: 'What kinds of decisions drain you the most? What kinds energize you?',
  G5: 'When are you at your best? Time of day, conditions, context?',
  G6: 'What drains you faster than people might expect?',
  G7: "How do you know when you're avoiding something? What does that look like?",
  G8: 'What does your "overwhelm spiral" look like? How does it start, and how does it usually resolve?',
  G9: 'Do you have any neurodivergent patterns (ADHD, etc.) that affect how you work? Or patterns you\'ve noticed even without a label?',
  G10: 'What kind of structure helps you? What kind of structure feels constraining?',
  G11: 'When you\'re working with someone, do you prefer direct recommendations, facilitated thinking, or just execution with minimal check-ins?',
  G12: 'What kind of input feels helpful vs. annoying?',
  G13: "How should someone push back on you if they think you're wrong?",
  G14: "When you're not feeling great (tired, pain day, stressed), how should that change how people interact with you?",
  G15: 'What does "stuck" look like for you? How do you know when you\'re there?',
  G16: "What helps you get unstuck? What's worked in the past?",
  G17: "What makes things worse when you're struggling? What should people NOT do?",
  G18: 'How does chronic pain affect your availability and focus? Is there a pattern?',
  G19: 'When you\'re in crisis mode, do you want space to figure it out, someone to help carry the load, or distraction and normality?',
  G20: 'How do you like to be helped? What does good support look like?',
  G21: 'How should priorities be presented to you?',
  G22: "What's your relationship with time? Are deadlines helpful pressure or unhelpful stress?",
  G23: 'What does "done enough" look like for you? Or do you struggle with that?',
  G24: 'Is there anything else about how you work that would be helpful to know?',
} as const;

export type QuestionId = keyof typeof BASELINE_QUESTIONS;

/** Questions required for graduation (communication prefs + crisis patterns) */
export const REQUIRED_QUESTIONS: QuestionId[] = [
  'G11', 'G12', 'G13', 'G14', // Communication preferences
  'G15', 'G16', 'G17', 'G18', 'G19', // Crisis patterns
];

/** Questions that map to persona calibration signals */
export const CALIBRATION_QUESTIONS: Record<QuestionId, string> = {
  G11: 'communication_style',
  G12: 'helpful_input',
  G13: 'push_back_style',
  G14: 'bad_day_adaptation',
  G15: 'stuck_indicators',
  G16: 'unstuck_methods',
  G17: 'crisis_dont_do',
  G18: 'pain_patterns',
  G19: 'crisis_mode_preference',
  G20: 'good_support',
  G21: 'priority_format',
  G22: 'deadline_relationship',
  G23: 'done_enough',
} as Partial<Record<QuestionId, string>>;
