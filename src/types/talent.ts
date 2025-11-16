/**
 * Type definitions for Talent Orchestration System (Release 1.5 & 1.6)
 * AI-powered interview system with longitudinal intelligence
 */

// ============================================================================
// CANDIDATE TYPES (Release 1.5)
// ============================================================================

export type CandidateArchetype =
  | 'Technical Builder'
  | 'GTM Operator'
  | 'Creative Strategist'
  | 'Execution Machine'
  | 'Generalist Orchestrator'
  | 'Domain Expert';

export type CandidateTier = 'top_1' | 'benched' | 'passed';

export type CandidateStatus = 'pending' | 'interviewed' | 'contacted' | 'hired' | 'passed';

export interface CandidateDimensions {
  iq: number; // 0-100
  personality: number;
  motivation: number;
  work_history: number;
  passions: number;
  culture_fit: number;
  technical: number;
  ai_readiness: number; // NEW for Release 0.1.7 CS Assessment
  gtm: number;
  eq: number;
  empathy: number;
  self_awareness: number;
}

export interface CandidateFlags {
  red_flags: string[];
  green_flags: string[];
}

export interface InterviewMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export interface CandidateAnalysis {
  dimensions: CandidateDimensions;
  archetype: CandidateArchetype;
  archetype_confidence: 'high' | 'medium' | 'low';
  flags: CandidateFlags;
  overall_score: number;
  tier: CandidateTier;
  recommendation: string;
  best_fit_roles?: string[];
  analyzed_at: string;
}

export interface Candidate {
  id: string;
  user_id: string;

  // Basic Info
  name: string;
  email: string;
  linkedin_url?: string;
  referral_source?: string;

  // Interview Data
  interview_transcript?: InterviewMessage[];
  analysis?: CandidateAnalysis;

  // Classification
  archetype?: CandidateArchetype;
  overall_score?: number;
  dimensions?: CandidateDimensions;

  // Routing
  tier?: CandidateTier;
  flags?: CandidateFlags;

  // Status
  status: CandidateStatus;

  // Longitudinal Intelligence (Release 1.6)
  intelligence_file?: IntelligenceFile;
  last_check_in?: string;
  check_in_count?: number;
  relationship_strength?: RelationshipStrength;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TALENT BENCH TYPES (Release 1.5)
// ============================================================================

export interface TalentBench {
  id: string;
  candidate_id: string;
  archetype_primary: CandidateArchetype;
  archetype_confidence: 'high' | 'medium' | 'low';
  best_fit_roles: string[];
  benched_at: string;
  created_at: string;
}

// ============================================================================
// INTERVIEW SESSION TYPES (Release 1.6)
// ============================================================================

export type SessionType = 'initial' | 'check_in' | 'deep_dive';
export type SessionSentiment = 'excited' | 'exploring' | 'frustrated' | 'content';

export interface SessionUpdates {
  career_changes?: string[];
  skill_additions?: string[];
  motivation_shifts?: string[];
  life_updates?: string[];
}

export interface InterviewSession {
  id: string;
  candidate_id: string;
  session_type: SessionType;
  transcript?: InterviewMessage[];
  analysis?: CandidateAnalysis;
  updates?: SessionUpdates;
  session_date: string;
  duration_minutes?: number;
  questions_asked?: number;
  key_insights?: string[];
  sentiment?: SessionSentiment;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INTELLIGENCE FILE TYPES (Release 1.6)
// ============================================================================

export type RelationshipStrength = 'cold' | 'warm' | 'hot';

export interface CareerEntry {
  role: string;
  company: string;
  timeframe: string;
  learned_from_session: string;
}

export interface SkillEvolution {
  skill: string;
  added_date: string;
  proficiency: 'learning' | 'competent' | 'expert';
}

export interface Project {
  name: string;
  url?: string;
  description: string;
  status: 'active' | 'completed' | 'abandoned';
  learned_from_session: string;
}

export interface LifeContext {
  location?: string;
  family?: string[]; // e.g., ["Lucy (7)", "Marcus (4)"]
  hobbies?: string[];
  last_updated: string;
}

export interface CurrentMotivation {
  seeking: string; // e.g., "founding role", "consulting", "exploring"
  ideal_role: string;
  deal_breakers: string[];
  must_haves: string[];
  updated: string;
}

export interface SessionSummary {
  session_id: string;
  date: string;
  type: SessionType;
  key_updates: string[];
  sentiment: SessionSentiment;
}

export interface IntelligenceFile {
  // Identity
  name: string;
  email: string;
  linkedin_url?: string;

  // Professional Profile (evolving)
  current_role: string;
  company: string;
  career_trajectory: CareerEntry[];

  // Skills & Expertise (evolving)
  technical_skills: string[];
  domain_expertise: string[];
  skill_evolution: SkillEvolution[];

  // Projects & Artifacts (accumulating)
  projects: Project[];

  // Personal Context (for relationship building)
  life_context: LifeContext;

  // Motivations & Goals (evolving)
  current_motivation: CurrentMotivation;

  // Relationship Metadata
  first_contact: string;
  last_contact: string;
  total_sessions: number;
  relationship_strength: RelationshipStrength;

  // Session Timeline
  session_timeline: SessionSummary[];

  // AI's Understanding
  archetype: CandidateArchetype;
  archetype_confidence: 'high' | 'medium' | 'low';
  strengths: string[];
  growth_areas: string[];
  best_fit_at_renubu: string[];
}

// ============================================================================
// SERVICE OPERATION TYPES
// ============================================================================

export interface CreateCandidateParams {
  name: string;
  email: string;
  linkedin_url?: string;
  referral_source?: string;
}

export interface UpdateCandidateAnalysisParams {
  interview_transcript: InterviewMessage[];
  analysis: CandidateAnalysis;
  archetype: CandidateArchetype;
  overall_score: number;
  dimensions: CandidateDimensions;
  tier: CandidateTier;
  flags: CandidateFlags;
  status: CandidateStatus;
}

export interface AddToBenchParams {
  candidate_id: string;
  archetype_primary: CandidateArchetype;
  archetype_confidence: 'high' | 'medium' | 'low';
  best_fit_roles: string[];
}

export interface CreateSessionParams {
  candidate_id: string;
  session_type: SessionType;
  transcript: InterviewMessage[];
  duration_minutes?: number;
  questions_asked?: number;
  key_insights?: string[];
  sentiment?: SessionSentiment;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface CandidateFilters {
  tier?: CandidateTier | CandidateTier[];
  archetype?: CandidateArchetype | CandidateArchetype[];
  status?: CandidateStatus | CandidateStatus[];
  min_score?: number;
  max_score?: number;
  relationship_strength?: RelationshipStrength | RelationshipStrength[];
}

export interface TalentBenchFilters {
  archetype_primary?: CandidateArchetype | CandidateArchetype[];
  archetype_confidence?: 'high' | 'medium' | 'low';
}

export interface SessionFilters {
  candidate_id?: string;
  session_type?: SessionType | SessionType[];
  sentiment?: SessionSentiment | SessionSentiment[];
  date_from?: string;
  date_to?: string;
}
