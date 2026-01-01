/**
 * Competency Lexicon
 *
 * Keyword-to-competency signal mapping for interview analysis.
 * Detects leadership, technical depth, communication skills, and other
 * professional competencies from transcript text.
 */

import type { CompetencySignal } from '../types/index.js';

export interface CompetencyLexiconEntry {
  signal: CompetencySignal;
  weight: number;      // 0-1, strength of the signal
  context?: string;    // Optional context hint
}

export type CompetencyLexicon = Record<string, CompetencyLexiconEntry>;

/**
 * The competency lexicon - keywords mapped to competency signals
 */
export const COMPETENCY_LEXICON: CompetencyLexicon = {
  // ===========================================================================
  // LEADERSHIP - Influence, ownership, delegation
  // ===========================================================================

  // Ownership language
  led: { signal: 'leadership', weight: 0.85 },
  lead: { signal: 'leadership', weight: 0.80 },
  leading: { signal: 'leadership', weight: 0.80 },
  leader: { signal: 'leadership', weight: 0.75 },
  leadership: { signal: 'leadership', weight: 0.90 },
  managed: { signal: 'leadership', weight: 0.80 },
  manage: { signal: 'leadership', weight: 0.75 },
  managing: { signal: 'leadership', weight: 0.75 },
  manager: { signal: 'leadership', weight: 0.70 },
  directed: { signal: 'leadership', weight: 0.85 },
  oversaw: { signal: 'leadership', weight: 0.85 },
  supervised: { signal: 'leadership', weight: 0.75 },
  coordinated: { signal: 'leadership', weight: 0.70 },
  orchestrated: { signal: 'leadership', weight: 0.80 },
  spearheaded: { signal: 'leadership', weight: 0.90 },
  championed: { signal: 'leadership', weight: 0.85 },
  initiated: { signal: 'leadership', weight: 0.75 },
  pioneered: { signal: 'leadership', weight: 0.85 },
  founded: { signal: 'leadership', weight: 0.80 },

  // Delegation
  delegated: { signal: 'leadership', weight: 0.80 },
  empowered: { signal: 'leadership', weight: 0.80 },
  assigned: { signal: 'leadership', weight: 0.60 },
  'built a team': { signal: 'leadership', weight: 0.90 },
  recruited: { signal: 'leadership', weight: 0.75 },
  hired: { signal: 'leadership', weight: 0.70 },
  mentored: { signal: 'leadership', weight: 0.80 },
  coached: { signal: 'leadership', weight: 0.80 },
  developed: { signal: 'leadership', weight: 0.65 },

  // Influence
  influenced: { signal: 'leadership', weight: 0.80 },
  persuaded: { signal: 'leadership', weight: 0.75 },
  convinced: { signal: 'leadership', weight: 0.75 },
  advocated: { signal: 'leadership', weight: 0.70 },
  'drove alignment': { signal: 'leadership', weight: 0.85 },
  stakeholders: { signal: 'leadership', weight: 0.60 },
  'executive buy-in': { signal: 'leadership', weight: 0.85 },
  'c-suite': { signal: 'leadership', weight: 0.70 },

  // ===========================================================================
  // TECHNICAL - Domain expertise, hard skills
  // ===========================================================================

  // Engineering terms
  architected: { signal: 'technical', weight: 0.90 },
  architecture: { signal: 'technical', weight: 0.80 },
  engineered: { signal: 'technical', weight: 0.85 },
  implemented: { signal: 'technical', weight: 0.75 },
  built: { signal: 'technical', weight: 0.70 },
  designed: { signal: 'technical', weight: 0.75 },
  coded: { signal: 'technical', weight: 0.80 },
  programmed: { signal: 'technical', weight: 0.80 },
  deployed: { signal: 'technical', weight: 0.75 },
  shipped: { signal: 'technical', weight: 0.70 },
  scaled: { signal: 'technical', weight: 0.80 },
  optimized: { signal: 'technical', weight: 0.75 },
  debugged: { signal: 'technical', weight: 0.75 },
  refactored: { signal: 'technical', weight: 0.80 },

  // Technical depth
  algorithm: { signal: 'technical', weight: 0.75 },
  algorithms: { signal: 'technical', weight: 0.75 },
  database: { signal: 'technical', weight: 0.70 },
  api: { signal: 'technical', weight: 0.70 },
  apis: { signal: 'technical', weight: 0.70 },
  infrastructure: { signal: 'technical', weight: 0.75 },
  microservices: { signal: 'technical', weight: 0.80 },
  'distributed systems': { signal: 'technical', weight: 0.85 },
  'machine learning': { signal: 'technical', weight: 0.85 },
  'deep learning': { signal: 'technical', weight: 0.85 },
  kubernetes: { signal: 'technical', weight: 0.75 },
  docker: { signal: 'technical', weight: 0.70 },
  aws: { signal: 'technical', weight: 0.70 },
  gcp: { signal: 'technical', weight: 0.70 },
  azure: { signal: 'technical', weight: 0.70 },
  'ci/cd': { signal: 'technical', weight: 0.75 },
  devops: { signal: 'technical', weight: 0.75 },

  // System thinking
  'system design': { signal: 'technical', weight: 0.85 },
  'trade-offs': { signal: 'technical', weight: 0.80 },
  tradeoffs: { signal: 'technical', weight: 0.80 },
  'technical debt': { signal: 'technical', weight: 0.75 },
  scalability: { signal: 'technical', weight: 0.80 },
  performance: { signal: 'technical', weight: 0.70 },
  latency: { signal: 'technical', weight: 0.75 },
  throughput: { signal: 'technical', weight: 0.75 },

  // ===========================================================================
  // COMMUNICATION - Clarity, structure, storytelling
  // ===========================================================================

  // Clear communication markers
  'let me explain': { signal: 'communication', weight: 0.70 },
  'to clarify': { signal: 'communication', weight: 0.70 },
  'in other words': { signal: 'communication', weight: 0.65 },
  'for example': { signal: 'communication', weight: 0.65 },
  'specifically': { signal: 'communication', weight: 0.60 },
  'essentially': { signal: 'communication', weight: 0.55 },

  // Structure markers
  'first': { signal: 'communication', weight: 0.50 },
  'second': { signal: 'communication', weight: 0.50 },
  'third': { signal: 'communication', weight: 0.50 },
  'finally': { signal: 'communication', weight: 0.55 },
  'in summary': { signal: 'communication', weight: 0.70 },
  'to summarize': { signal: 'communication', weight: 0.70 },
  'the key point': { signal: 'communication', weight: 0.70 },
  'the main takeaway': { signal: 'communication', weight: 0.75 },

  // Storytelling
  presented: { signal: 'communication', weight: 0.70 },
  communicated: { signal: 'communication', weight: 0.75 },
  articulated: { signal: 'communication', weight: 0.80 },
  explained: { signal: 'communication', weight: 0.65 },
  documented: { signal: 'communication', weight: 0.60 },
  wrote: { signal: 'communication', weight: 0.55 },
  pitched: { signal: 'communication', weight: 0.75 },

  // ===========================================================================
  // PROBLEM SOLVING - Analysis, frameworks, solutions
  // ===========================================================================

  // Analysis
  analyzed: { signal: 'problem_solving', weight: 0.80 },
  analysis: { signal: 'problem_solving', weight: 0.75 },
  diagnosed: { signal: 'problem_solving', weight: 0.80 },
  investigated: { signal: 'problem_solving', weight: 0.75 },
  identified: { signal: 'problem_solving', weight: 0.70 },
  discovered: { signal: 'problem_solving', weight: 0.70 },
  uncovered: { signal: 'problem_solving', weight: 0.75 },
  'root cause': { signal: 'problem_solving', weight: 0.85 },
  'root-cause': { signal: 'problem_solving', weight: 0.85 },

  // Frameworks
  framework: { signal: 'problem_solving', weight: 0.75 },
  approach: { signal: 'problem_solving', weight: 0.60 },
  methodology: { signal: 'problem_solving', weight: 0.75 },
  strategy: { signal: 'problem_solving', weight: 0.70 },
  systematic: { signal: 'problem_solving', weight: 0.75 },
  structured: { signal: 'problem_solving', weight: 0.70 },
  prioritized: { signal: 'problem_solving', weight: 0.75 },

  // Solutions
  solved: { signal: 'problem_solving', weight: 0.80 },
  solution: { signal: 'problem_solving', weight: 0.75 },
  resolved: { signal: 'problem_solving', weight: 0.80 },
  fixed: { signal: 'problem_solving', weight: 0.70 },
  addressed: { signal: 'problem_solving', weight: 0.65 },
  mitigated: { signal: 'problem_solving', weight: 0.75 },
  overcame: { signal: 'problem_solving', weight: 0.80 },
  'turned around': { signal: 'problem_solving', weight: 0.85 },

  // ===========================================================================
  // ACCOUNTABILITY - Ownership, responsibility language
  // ===========================================================================

  // First person ownership
  'i owned': { signal: 'accountability', weight: 0.90 },
  'i was responsible': { signal: 'accountability', weight: 0.85 },
  'my responsibility': { signal: 'accountability', weight: 0.85 },
  'i took ownership': { signal: 'accountability', weight: 0.95 },
  'accountable': { signal: 'accountability', weight: 0.85 },
  'accountability': { signal: 'accountability', weight: 0.85 },

  // Results ownership
  'i delivered': { signal: 'accountability', weight: 0.85 },
  'i achieved': { signal: 'accountability', weight: 0.85 },
  'i drove': { signal: 'accountability', weight: 0.80 },
  'i ensured': { signal: 'accountability', weight: 0.75 },
  'i made sure': { signal: 'accountability', weight: 0.75 },

  // Mistake ownership
  'i should have': { signal: 'accountability', weight: 0.70 },
  'my mistake': { signal: 'accountability', weight: 0.80 },
  'i learned': { signal: 'accountability', weight: 0.70 },
  'in hindsight': { signal: 'accountability', weight: 0.65 },
  'i could have done better': { signal: 'accountability', weight: 0.80 },

  // ===========================================================================
  // GROWTH MINDSET - Learning, adaptation, feedback
  // ===========================================================================

  // Learning
  learned: { signal: 'growth_mindset', weight: 0.75 },
  learning: { signal: 'growth_mindset', weight: 0.70 },
  grew: { signal: 'growth_mindset', weight: 0.75 },
  growth: { signal: 'growth_mindset', weight: 0.70 },
  improved: { signal: 'growth_mindset', weight: 0.70 },
  evolved: { signal: 'growth_mindset', weight: 0.75 },
  adapted: { signal: 'growth_mindset', weight: 0.80 },
  pivoted: { signal: 'growth_mindset', weight: 0.80 },

  // Feedback
  feedback: { signal: 'growth_mindset', weight: 0.75 },
  'constructive criticism': { signal: 'growth_mindset', weight: 0.85 },
  'open to feedback': { signal: 'growth_mindset', weight: 0.90 },
  iterated: { signal: 'growth_mindset', weight: 0.75 },
  refined: { signal: 'growth_mindset', weight: 0.70 },
  'continuous improvement': { signal: 'growth_mindset', weight: 0.85 },

  // Curiosity
  curious: { signal: 'growth_mindset', weight: 0.75 },
  curiosity: { signal: 'growth_mindset', weight: 0.75 },
  explored: { signal: 'growth_mindset', weight: 0.70 },
  experimented: { signal: 'growth_mindset', weight: 0.80 },
  'tried new': { signal: 'growth_mindset', weight: 0.75 },

  // ===========================================================================
  // COLLABORATION - Team language, we vs I
  // ===========================================================================

  // Team language
  'we built': { signal: 'collaboration', weight: 0.80 },
  'we delivered': { signal: 'collaboration', weight: 0.80 },
  'we achieved': { signal: 'collaboration', weight: 0.80 },
  'our team': { signal: 'collaboration', weight: 0.75 },
  'together': { signal: 'collaboration', weight: 0.70 },
  collaborated: { signal: 'collaboration', weight: 0.85 },
  collaboration: { signal: 'collaboration', weight: 0.85 },
  partnered: { signal: 'collaboration', weight: 0.80 },
  'cross-functional': { signal: 'collaboration', weight: 0.85 },
  'cross functional': { signal: 'collaboration', weight: 0.85 },

  // Supporting others
  helped: { signal: 'collaboration', weight: 0.65 },
  supported: { signal: 'collaboration', weight: 0.70 },
  enabled: { signal: 'collaboration', weight: 0.75 },
  facilitated: { signal: 'collaboration', weight: 0.75 },
  'brought together': { signal: 'collaboration', weight: 0.80 },
  aligned: { signal: 'collaboration', weight: 0.70 },

  // ===========================================================================
  // CONFIDENCE - Certainty markers
  // ===========================================================================

  // Strong confidence
  'i believe': { signal: 'confidence', weight: 0.70 },
  'i know': { signal: 'confidence', weight: 0.75 },
  'i am confident': { signal: 'confidence', weight: 0.85 },
  'i am certain': { signal: 'confidence', weight: 0.85 },
  definitely: { signal: 'confidence', weight: 0.70 },
  absolutely: { signal: 'confidence', weight: 0.75 },
  certainly: { signal: 'confidence', weight: 0.70 },
  clearly: { signal: 'confidence', weight: 0.65 },
  undoubtedly: { signal: 'confidence', weight: 0.80 },

  // Low confidence (negative weight - absence of confidence)
  'i think maybe': { signal: 'confidence', weight: -0.50 },
  'i guess': { signal: 'confidence', weight: -0.60 },
  'i suppose': { signal: 'confidence', weight: -0.50 },
  'kind of': { signal: 'confidence', weight: -0.40 },
  'sort of': { signal: 'confidence', weight: -0.40 },
  'not sure': { signal: 'confidence', weight: -0.60 },
  'probably': { signal: 'confidence', weight: -0.30 },

  // ===========================================================================
  // STRESS RESPONSE - Composure under pressure
  // ===========================================================================

  // Pressure handling
  deadline: { signal: 'stress_response', weight: 0.65 },
  deadlines: { signal: 'stress_response', weight: 0.65 },
  'under pressure': { signal: 'stress_response', weight: 0.75 },
  'high-pressure': { signal: 'stress_response', weight: 0.80 },
  'high stakes': { signal: 'stress_response', weight: 0.80 },
  urgent: { signal: 'stress_response', weight: 0.70 },
  crisis: { signal: 'stress_response', weight: 0.85 },
  crises: { signal: 'stress_response', weight: 0.85 },
  'stayed calm': { signal: 'stress_response', weight: 0.90 },
  'remained composed': { signal: 'stress_response', weight: 0.90 },
  'kept cool': { signal: 'stress_response', weight: 0.85 },

  // Adversity
  challenge: { signal: 'stress_response', weight: 0.60 },
  challenges: { signal: 'stress_response', weight: 0.60 },
  challenging: { signal: 'stress_response', weight: 0.65 },
  difficult: { signal: 'stress_response', weight: 0.60 },
  obstacle: { signal: 'stress_response', weight: 0.65 },
  obstacles: { signal: 'stress_response', weight: 0.65 },
  setback: { signal: 'stress_response', weight: 0.70 },
  setbacks: { signal: 'stress_response', weight: 0.70 },
  'bounced back': { signal: 'stress_response', weight: 0.85 },
  resilient: { signal: 'stress_response', weight: 0.85 },
  resilience: { signal: 'stress_response', weight: 0.85 },
};

/**
 * Get all keywords for a specific competency signal
 */
export function getKeywordsForSignal(signal: CompetencySignal): string[] {
  return Object.entries(COMPETENCY_LEXICON)
    .filter(([_, entry]) => entry.signal === signal)
    .map(([word]) => word);
}

/**
 * Get competency lexicon statistics
 */
export function getCompetencyLexiconStats(): {
  total: number;
  bySignal: Record<CompetencySignal, number>;
} {
  const bySignal: Record<CompetencySignal, number> = {
    leadership: 0,
    technical: 0,
    communication: 0,
    problem_solving: 0,
    accountability: 0,
    growth_mindset: 0,
    collaboration: 0,
    confidence: 0,
    stress_response: 0,
  };

  for (const entry of Object.values(COMPETENCY_LEXICON)) {
    bySignal[entry.signal]++;
  }

  return {
    total: Object.keys(COMPETENCY_LEXICON).length,
    bySignal,
  };
}
