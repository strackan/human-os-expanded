/**
 * Unified Interview Attributes Taxonomy
 *
 * Master list of all attributes across:
 * - Good Hang (CS assessment)
 * - Sculptor (identity discovery)
 * - Renubu (relationship context)
 *
 * Attributes can be grouped into AttributeSets for different interview types.
 */

// =============================================================================
// ATTRIBUTE DEFINITIONS
// =============================================================================

/**
 * Attribute categories
 */
export type AttributeCategory =
  | 'cognitive'       // IQ, problem-solving, technical thinking
  | 'emotional'       // EQ, empathy, self-awareness
  | 'professional'    // Work history, skills, GTM
  | 'identity'        // Core values, energy patterns, work style
  | 'personality'     // MBTI, Enneagram, traits
  | 'relationship'    // How they relate to others
  | 'motivation'      // Drive, passions, purpose
  | 'cultural';       // Fit, values alignment

/**
 * How the attribute is typically captured
 */
export type CaptureMethod =
  | 'direct_question'    // Asked explicitly
  | 'observation'        // Inferred from behavior/responses
  | 'story_extraction'   // Pulled from stories they tell
  | 'pattern_detection'  // Detected across multiple responses
  | 'self_report';       // They explicitly state it

/**
 * Single attribute definition
 */
export interface Attribute {
  id: string;
  name: string;
  description: string;
  category: AttributeCategory;
  captureMethod: CaptureMethod[];
  signalKeywords: string[];           // Keywords that indicate this attribute
  antiSignalKeywords: string[];       // Keywords that indicate absence/opposite
  scoringRange?: [number, number];    // If scored (e.g., 0-100)
  exampleQuestions?: string[];        // Questions that can elicit this
  source: ('goodhang' | 'sculptor' | 'renubu')[];
}

// =============================================================================
// MASTER ATTRIBUTE LIST
// =============================================================================

export const ATTRIBUTES: Record<string, Attribute> = {
  // ---------------------------------------------------------------------------
  // COGNITIVE ATTRIBUTES (from Good Hang)
  // ---------------------------------------------------------------------------
  iq: {
    id: 'iq',
    name: 'Cognitive Ability',
    description: 'Problem-solving, critical thinking, analytical ability, learning speed',
    category: 'cognitive',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['analyzed', 'figured out', 'broke down', 'systematic', 'pattern', 'edge case', 'root cause'],
    antiSignalKeywords: ['confused', 'didn\'t understand', 'someone else solved'],
    scoringRange: [0, 100],
    exampleQuestions: ['Walk me through a complex problem you solved.'],
    source: ['goodhang'],
  },

  technical: {
    id: 'technical',
    name: 'Technical Skills',
    description: 'Technical knowledge, tool proficiency, troubleshooting ability',
    category: 'cognitive',
    captureMethod: ['direct_question', 'story_extraction'],
    signalKeywords: ['built', 'architected', 'debugged', 'integrated', 'automated', 'API', 'database', 'code'],
    antiSignalKeywords: ['not technical', 'someone else handles that'],
    scoringRange: [0, 100],
    exampleQuestions: ['Tell me about something technical you built or fixed.'],
    source: ['goodhang'],
  },

  ai_readiness: {
    id: 'ai_readiness',
    name: 'AI Readiness',
    description: 'AI tool competency, prompt engineering, practical application',
    category: 'cognitive',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['prompt', 'GPT', 'Claude', 'LLM', 'AI tool', 'automated with AI'],
    antiSignalKeywords: ['don\'t use AI', 'skeptical of AI'],
    scoringRange: [0, 100],
    exampleQuestions: ['How do you use AI in your work? Give me a specific example.'],
    source: ['goodhang'],
  },

  organization: {
    id: 'organization',
    name: 'Organization',
    description: 'Systems thinking, structured approach, priority management',
    category: 'cognitive',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['organized', 'system', 'framework', 'prioritized', 'tracked', 'process'],
    antiSignalKeywords: ['chaotic', 'disorganized', 'forgot', 'lost track'],
    scoringRange: [0, 100],
    exampleQuestions: ['How do you stay organized when managing multiple priorities?'],
    source: ['goodhang'],
  },

  // ---------------------------------------------------------------------------
  // EMOTIONAL ATTRIBUTES (from Good Hang)
  // ---------------------------------------------------------------------------
  eq: {
    id: 'eq',
    name: 'Emotional Intelligence',
    description: 'Awareness of own and others\' emotions, navigating difficult situations',
    category: 'emotional',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['noticed', 'felt', 'sensed', 'read the room', 'defused', 'navigated'],
    antiSignalKeywords: ['didn\'t realize', 'was surprised when', 'didn\'t notice'],
    scoringRange: [0, 100],
    exampleQuestions: ['Tell me about a difficult conversation you navigated.'],
    source: ['goodhang'],
  },

  empathy: {
    id: 'empathy',
    name: 'Empathy',
    description: 'Understanding others\' perspectives, customer focus, addressing root causes',
    category: 'emotional',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['understood their', 'put myself in', 'they were feeling', 'their perspective'],
    antiSignalKeywords: ['didn\'t care', 'not my problem', 'they should have'],
    scoringRange: [0, 100],
    exampleQuestions: ['Tell me about a time you really understood what someone needed.'],
    source: ['goodhang'],
  },

  self_awareness: {
    id: 'self_awareness',
    name: 'Self-Awareness',
    description: 'Understanding own strengths/weaknesses, growth mindset, feedback receptiveness',
    category: 'emotional',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['I realized', 'my weakness', 'learned about myself', 'feedback showed me'],
    antiSignalKeywords: ['I\'m perfect', 'no weaknesses', 'wasn\'t my fault'],
    scoringRange: [0, 100],
    exampleQuestions: ['What\'s a piece of feedback that was hard to hear but ultimately valuable?'],
    source: ['goodhang', 'sculptor'],
  },

  executive_leadership: {
    id: 'executive_leadership',
    name: 'Executive Leadership',
    description: 'Leadership capability, strategic thinking, decision-making under ambiguity',
    category: 'emotional',
    captureMethod: ['story_extraction', 'observation'],
    signalKeywords: ['led', 'decided', 'took charge', 'vision', 'strategy', 'rallied'],
    antiSignalKeywords: ['waited for direction', 'wasn\'t my call'],
    scoringRange: [0, 100],
    exampleQuestions: ['Tell me about a time you led through ambiguity.'],
    source: ['goodhang'],
  },

  // ---------------------------------------------------------------------------
  // PROFESSIONAL ATTRIBUTES (from Good Hang)
  // ---------------------------------------------------------------------------
  gtm: {
    id: 'gtm',
    name: 'Go-to-Market Acumen',
    description: 'Sales/marketing/CS understanding, business acumen, revenue focus',
    category: 'professional',
    captureMethod: ['story_extraction', 'direct_question'],
    signalKeywords: ['revenue', 'expansion', 'upsell', 'pipeline', 'customer success', 'retention'],
    antiSignalKeywords: ['not my area', 'don\'t think about revenue'],
    scoringRange: [0, 100],
    exampleQuestions: ['How do you think about the business impact of your work?'],
    source: ['goodhang'],
  },

  work_history: {
    id: 'work_history',
    name: 'Work History',
    description: 'Experience quality, career trajectory, relevant background',
    category: 'professional',
    captureMethod: ['direct_question', 'story_extraction'],
    signalKeywords: ['promoted', 'grew', 'built team', 'scope increased', 'led'],
    antiSignalKeywords: ['stayed same', 'lateral', 'stepped back'],
    scoringRange: [0, 100],
    exampleQuestions: ['Walk me through your career progression.'],
    source: ['goodhang'],
  },

  // ---------------------------------------------------------------------------
  // PERSONALITY ATTRIBUTES (from Good Hang)
  // ---------------------------------------------------------------------------
  personality: {
    id: 'personality',
    name: 'Personality & Presence',
    description: 'Communication style, adaptability, rapport building, authenticity',
    category: 'personality',
    captureMethod: ['observation', 'pattern_detection'],
    signalKeywords: ['authentic', 'genuine', 'connected', 'adapted', 'flexible'],
    antiSignalKeywords: ['robotic', 'scripted', 'stiff'],
    scoringRange: [0, 100],
    source: ['goodhang'],
  },

  mbti: {
    id: 'mbti',
    name: 'MBTI Type',
    description: 'Myers-Briggs personality type (E/I, S/N, T/F, J/P)',
    category: 'personality',
    captureMethod: ['pattern_detection', 'direct_question'],
    signalKeywords: [],  // Detected via patterns
    antiSignalKeywords: [],
    exampleQuestions: [
      'Do you recharge by being with people or by having alone time?',
      'Do you prefer concrete details or big-picture concepts?',
      'When making decisions, do you lead with logic or people impact?',
      'Do you prefer structured plans or staying flexible?',
    ],
    source: ['goodhang'],
  },

  enneagram: {
    id: 'enneagram',
    name: 'Enneagram Type',
    description: 'Enneagram personality type (1-9)',
    category: 'personality',
    captureMethod: ['pattern_detection', 'direct_question'],
    signalKeywords: [],  // Detected via patterns
    antiSignalKeywords: [],
    exampleQuestions: [
      'Under stress, do you tend to withdraw, get busy, or seek support?',
      'What\'s a belief you held strongly that you later changed your mind on?',
    ],
    source: ['goodhang'],
  },

  // ---------------------------------------------------------------------------
  // MOTIVATION ATTRIBUTES (from Good Hang & Sculptor)
  // ---------------------------------------------------------------------------
  motivation: {
    id: 'motivation',
    name: 'Motivation',
    description: 'Drive, purpose, intrinsic motivation, why they do what they do',
    category: 'motivation',
    captureMethod: ['direct_question', 'story_extraction'],
    signalKeywords: ['driven by', 'passionate about', 'can\'t stop thinking about', 'love'],
    antiSignalKeywords: ['just a job', 'paycheck', 'don\'t really care'],
    scoringRange: [0, 100],
    exampleQuestions: ['What gets you out of bed in the morning?'],
    source: ['goodhang', 'sculptor'],
  },

  passions: {
    id: 'passions',
    name: 'Passions',
    description: 'Authentic interests, curiosity, what energizes them',
    category: 'motivation',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['love', 'fascinated', 'obsessed with', 'can\'t stop', 'hobby'],
    antiSignalKeywords: ['not really', 'don\'t have any', 'work is work'],
    scoringRange: [0, 100],
    exampleQuestions: ['What do you nerd out about outside of work?'],
    source: ['goodhang', 'sculptor'],
  },

  // ---------------------------------------------------------------------------
  // CULTURAL ATTRIBUTES (from Good Hang)
  // ---------------------------------------------------------------------------
  culture_fit: {
    id: 'culture_fit',
    name: 'Culture Fit',
    description: 'Values alignment, work style fit, team compatibility',
    category: 'cultural',
    captureMethod: ['observation', 'direct_question'],
    signalKeywords: ['values', 'believe in', 'team', 'culture', 'environment'],
    antiSignalKeywords: ['don\'t fit', 'clash', 'wasn\'t for me'],
    scoringRange: [0, 100],
    exampleQuestions: ['Describe your ideal work environment.'],
    source: ['goodhang'],
  },

  // ---------------------------------------------------------------------------
  // IDENTITY ATTRIBUTES (from Sculptor)
  // ---------------------------------------------------------------------------
  core_values: {
    id: 'core_values',
    name: 'Core Values',
    description: '3-5 core values that drive decision-making',
    category: 'identity',
    captureMethod: ['direct_question', 'story_extraction'],
    signalKeywords: ['important to me', 'I believe', 'non-negotiable', 'always'],
    antiSignalKeywords: [],
    exampleQuestions: [
      'What are the values you live by?',
      'What would you never compromise on?',
    ],
    source: ['sculptor'],
  },

  energy_patterns: {
    id: 'energy_patterns',
    name: 'Energy Patterns',
    description: 'When/how energy flows (morning person, burst worker, etc.)',
    category: 'identity',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['morning', 'night owl', 'bursts', 'steady', 'variety', 'routine'],
    antiSignalKeywords: [],
    exampleQuestions: [
      'When do you do your best work?',
      'What drains you vs. energizes you?',
    ],
    source: ['sculptor'],
  },

  communication_style: {
    id: 'communication_style',
    name: 'Communication Style',
    description: 'How they communicate (direct, warm, uses humor, etc.)',
    category: 'identity',
    captureMethod: ['observation', 'self_report'],
    signalKeywords: ['direct', 'diplomatic', 'humor', 'formal', 'casual'],
    antiSignalKeywords: [],
    exampleQuestions: ['How would your close friends describe how you communicate?'],
    source: ['sculptor'],
  },

  interest_vectors: {
    id: 'interest_vectors',
    name: 'Interest Vectors',
    description: 'Core interest areas (tech, arts, systems thinking, etc.)',
    category: 'identity',
    captureMethod: ['direct_question', 'story_extraction'],
    signalKeywords: ['interested in', 'drawn to', 'always reading about'],
    antiSignalKeywords: [],
    exampleQuestions: ['What topics do you find yourself naturally drawn to?'],
    source: ['sculptor'],
  },

  relationship_orientation: {
    id: 'relationship_orientation',
    name: 'Relationship Orientation',
    description: 'How they relate to others (deep over wide, etc.)',
    category: 'relationship',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['deep', 'wide', 'few close', 'many acquaintances', 'introvert', 'extrovert'],
    antiSignalKeywords: [],
    exampleQuestions: ['Do you prefer a few deep relationships or many lighter ones?'],
    source: ['sculptor'],
  },

  work_style_identity: {
    id: 'work_style_identity',
    name: 'Work Style',
    description: 'How they work best (sprinter vs marathoner, deadlines, etc.)',
    category: 'identity',
    captureMethod: ['direct_question', 'observation'],
    signalKeywords: ['sprinter', 'marathoner', 'deadlines', 'pressure', 'steady', 'bursts'],
    antiSignalKeywords: [],
    exampleQuestions: ['How do you work best? Under pressure or with space?'],
    source: ['sculptor'],
  },

  cognitive_profile: {
    id: 'cognitive_profile',
    name: 'Cognitive Profile',
    description: 'Neurodivergent patterns if applicable (ADHD, PDA, etc.)',
    category: 'identity',
    captureMethod: ['direct_question', 'self_report'],
    signalKeywords: ['ADHD', 'neurodivergent', 'autism', 'dyslexia', 'PDA'],
    antiSignalKeywords: [],
    exampleQuestions: ['Are there any ways your brain works differently that you\'ve learned to work with?'],
    source: ['sculptor'],
  },

  // ---------------------------------------------------------------------------
  // RELATIONSHIP ATTRIBUTES (from Renubu)
  // ---------------------------------------------------------------------------
  trust_level: {
    id: 'trust_level',
    name: 'Trust Level',
    description: 'How much they trust/are trusted, trust-building patterns',
    category: 'relationship',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['trust', 'reliable', 'dependable', 'count on', 'track record'],
    antiSignalKeywords: ['let down', 'disappointed', 'didn\'t deliver'],
    source: ['renubu'],
  },

  negotiation_style: {
    id: 'negotiation_style',
    name: 'Negotiation Style',
    description: 'How they approach negotiations and difficult conversations',
    category: 'relationship',
    captureMethod: ['story_extraction', 'observation'],
    signalKeywords: ['negotiated', 'compromise', 'win-win', 'pushed back', 'stood firm'],
    antiSignalKeywords: ['caved', 'avoided'],
    source: ['renubu'],
  },

  decision_making_style: {
    id: 'decision_making_style',
    name: 'Decision Making Style',
    description: 'How they make decisions (fast/slow, data/gut, collaborative/solo)',
    category: 'cognitive',
    captureMethod: ['observation', 'story_extraction'],
    signalKeywords: ['decided', 'analyzed', 'gut feeling', 'consulted', 'took my time'],
    antiSignalKeywords: ['couldn\'t decide', 'paralyzed'],
    source: ['renubu'],
  },

  responsiveness: {
    id: 'responsiveness',
    name: 'Responsiveness',
    description: 'Response patterns, availability, follow-through',
    category: 'relationship',
    captureMethod: ['observation'],
    signalKeywords: ['quick to respond', 'always available', 'followed up', 'reliable'],
    antiSignalKeywords: ['hard to reach', 'never responds', 'drops the ball'],
    source: ['renubu'],
  },
};

// =============================================================================
// ATTRIBUTE SETS
// =============================================================================

/**
 * Definition of an attribute set
 */
export interface AttributeSet {
  id: string;
  name: string;
  description: string;
  attributes: string[];         // Attribute IDs
  requiredAttributes: string[]; // Must capture these
  optionalAttributes: string[]; // Nice to have
  interviewStyle: 'conversational' | 'structured' | 'scenario_based';
  estimatedDuration: string;    // e.g., "30-45 min"
}

export const ATTRIBUTE_SETS: Record<string, AttributeSet> = {
  // ---------------------------------------------------------------------------
  // GOOD HANG: Full CS Assessment
  // ---------------------------------------------------------------------------
  goodhang_full: {
    id: 'goodhang_full',
    name: 'Good Hang CS Assessment',
    description: 'Complete Customer Success professional assessment',
    attributes: [
      'iq', 'technical', 'ai_readiness', 'organization',
      'eq', 'empathy', 'self_awareness', 'executive_leadership',
      'gtm', 'work_history', 'personality', 'mbti', 'enneagram',
      'motivation', 'passions', 'culture_fit',
    ],
    requiredAttributes: [
      'iq', 'eq', 'empathy', 'self_awareness', 'gtm',
      'motivation', 'culture_fit',
    ],
    optionalAttributes: [
      'technical', 'ai_readiness', 'organization',
      'executive_leadership', 'work_history', 'mbti', 'enneagram',
    ],
    interviewStyle: 'conversational',
    estimatedDuration: '45-60 min',
  },

  // ---------------------------------------------------------------------------
  // SCULPTOR: Identity Discovery
  // ---------------------------------------------------------------------------
  sculptor_identity: {
    id: 'sculptor_identity',
    name: 'Sculptor Identity Pack',
    description: 'Foundational identity discovery conversation',
    attributes: [
      'core_values', 'energy_patterns', 'communication_style',
      'interest_vectors', 'relationship_orientation', 'work_style_identity',
      'cognitive_profile', 'passions', 'motivation',
    ],
    requiredAttributes: [
      'core_values', 'energy_patterns', 'communication_style',
      'work_style_identity',
    ],
    optionalAttributes: [
      'interest_vectors', 'relationship_orientation',
      'cognitive_profile', 'passions', 'motivation',
    ],
    interviewStyle: 'conversational',
    estimatedDuration: '30-45 min',
  },

  // ---------------------------------------------------------------------------
  // RENUBU: Relationship Context
  // ---------------------------------------------------------------------------
  renubu_relationship: {
    id: 'renubu_relationship',
    name: 'Relationship Context Assessment',
    description: 'Understanding how someone works and relates professionally',
    attributes: [
      'communication_style', 'work_style_identity', 'trust_level',
      'negotiation_style', 'decision_making_style', 'responsiveness',
    ],
    requiredAttributes: [
      'communication_style', 'work_style_identity', 'trust_level',
    ],
    optionalAttributes: [
      'negotiation_style', 'decision_making_style', 'responsiveness',
    ],
    interviewStyle: 'conversational',
    estimatedDuration: '20-30 min',
  },

  // ---------------------------------------------------------------------------
  // QUICK SCREEN: Fast Initial Assessment
  // ---------------------------------------------------------------------------
  quick_screen: {
    id: 'quick_screen',
    name: 'Quick Screen',
    description: 'Fast initial assessment to determine fit',
    attributes: [
      'motivation', 'personality', 'culture_fit', 'communication_style',
      'self_awareness',
    ],
    requiredAttributes: [
      'motivation', 'culture_fit',
    ],
    optionalAttributes: [
      'personality', 'communication_style', 'self_awareness',
    ],
    interviewStyle: 'conversational',
    estimatedDuration: '15-20 min',
  },

  // ---------------------------------------------------------------------------
  // TECHNICAL DEEP DIVE
  // ---------------------------------------------------------------------------
  technical_deep_dive: {
    id: 'technical_deep_dive',
    name: 'Technical Deep Dive',
    description: 'Technical skills and problem-solving assessment',
    attributes: [
      'iq', 'technical', 'ai_readiness', 'organization',
      'decision_making_style', 'self_awareness',
    ],
    requiredAttributes: [
      'iq', 'technical', 'decision_making_style',
    ],
    optionalAttributes: [
      'ai_readiness', 'organization', 'self_awareness',
    ],
    interviewStyle: 'scenario_based',
    estimatedDuration: '30-45 min',
  },

  // ---------------------------------------------------------------------------
  // LEADERSHIP ASSESSMENT
  // ---------------------------------------------------------------------------
  leadership: {
    id: 'leadership',
    name: 'Leadership Assessment',
    description: 'Leadership potential and executive presence',
    attributes: [
      'executive_leadership', 'eq', 'empathy', 'self_awareness',
      'decision_making_style', 'communication_style', 'motivation',
    ],
    requiredAttributes: [
      'executive_leadership', 'eq', 'decision_making_style',
    ],
    optionalAttributes: [
      'empathy', 'self_awareness', 'communication_style', 'motivation',
    ],
    interviewStyle: 'scenario_based',
    estimatedDuration: '30-40 min',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all attributes for an attribute set
 */
export function getAttributesForSet(setId: string): Attribute[] {
  const set = ATTRIBUTE_SETS[setId];
  if (!set) return [];
  return set.attributes.map(id => ATTRIBUTES[id]).filter(Boolean);
}

/**
 * Get required attributes for an attribute set
 */
export function getRequiredAttributesForSet(setId: string): Attribute[] {
  const set = ATTRIBUTE_SETS[setId];
  if (!set) return [];
  return set.requiredAttributes.map(id => ATTRIBUTES[id]).filter(Boolean);
}

/**
 * Check if all required attributes are captured
 */
export function checkRequiredAttributesCaptured(
  setId: string,
  capturedAttributes: string[]
): { complete: boolean; missing: string[] } {
  const set = ATTRIBUTE_SETS[setId];
  if (!set) return { complete: false, missing: [] };

  const missing = set.requiredAttributes.filter(id => !capturedAttributes.includes(id));
  return {
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Get capture progress for an attribute set
 */
export function getCaptureProgress(
  setId: string,
  capturedAttributes: string[]
): {
  total: number;
  captured: number;
  percentage: number;
  requiredComplete: boolean;
  missingRequired: string[];
  missingOptional: string[];
} {
  const set = ATTRIBUTE_SETS[setId];
  if (!set) {
    return {
      total: 0,
      captured: 0,
      percentage: 0,
      requiredComplete: false,
      missingRequired: [],
      missingOptional: [],
    };
  }

  const captured = set.attributes.filter(id => capturedAttributes.includes(id));
  const missingRequired = set.requiredAttributes.filter(id => !capturedAttributes.includes(id));
  const missingOptional = set.optionalAttributes.filter(id => !capturedAttributes.includes(id));

  return {
    total: set.attributes.length,
    captured: captured.length,
    percentage: Math.round((captured.length / set.attributes.length) * 100),
    requiredComplete: missingRequired.length === 0,
    missingRequired,
    missingOptional,
  };
}

/**
 * Get suggested questions for missing attributes
 */
export function getSuggestedQuestions(attributeIds: string[]): string[] {
  const questions: string[] = [];
  for (const id of attributeIds) {
    const attr = ATTRIBUTES[id];
    if (attr?.exampleQuestions) {
      questions.push(...attr.exampleQuestions);
    }
  }
  return questions;
}
