/**
 * Human-OS MCP Type Definitions
 *
 * Types for Human-OS external enrichment integration.
 * Provides contact/company enrichment, relationship context, and skills files.
 */

// ============================================================================
// ENRICHMENT TYPES
// ============================================================================

/**
 * Parameters for contact enrichment
 */
export interface EnrichContactParams {
  contact_name?: string;
  contact_email?: string;
  contact_linkedin_url?: string;
  company_name?: string;
}

/**
 * Parameters for company enrichment
 */
export interface EnrichCompanyParams {
  company_name?: string;
  company_domain?: string;
  company_linkedin_url?: string;
}

/**
 * LinkedIn post data
 */
export interface LinkedInPost {
  content: string;
  posted_at: string;
  engagement?: {
    likes: number;
    comments: number;
  };
}

/**
 * Contact data from GFT
 */
export interface ContactData {
  name: string;
  linkedin_url?: string;
  headline?: string;
  about?: string;
  company?: string;
  recent_posts?: LinkedInPost[];
}

/**
 * Contact enrichment result
 */
export interface ContactEnrichmentResult {
  found: boolean;
  contact?: ContactData;
}

/**
 * Funding round data
 */
export interface FundingRound {
  amount: number;
  date: string;
  round: string;
}

/**
 * Known contact at company
 */
export interface KnownContact {
  name: string;
  title: string;
}

/**
 * Company data from GFT
 */
export interface CompanyData {
  name: string;
  industry?: string;
  employee_count?: number;
  domain?: string;
  known_contacts?: KnownContact[];
  recent_funding?: FundingRound;
}

/**
 * Company enrichment result
 */
export interface CompanyEnrichmentResult {
  found: boolean;
  company?: CompanyData;
}

/**
 * Triangulation hints from combined data
 */
export interface TriangulationHints {
  shared_connections: string[];
  industry_context: string;
  relationship_signals: string[];
}

/**
 * Full enrichment result (contact + company + hints)
 */
export interface FullEnrichmentResult {
  contact: ContactEnrichmentResult;
  company: CompanyEnrichmentResult;
  triangulation_hints: TriangulationHints;
}

// ============================================================================
// RELATIONSHIP CONTEXT TYPES
// ============================================================================

/**
 * Sentiment values
 */
export type OpinionSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

/**
 * Confidence levels
 */
export type OpinionConfidence = 'low' | 'medium' | 'high';

/**
 * Opinion types
 */
export type OpinionType =
  | 'general'
  | 'work_style'
  | 'trust'
  | 'communication'
  | 'responsiveness'
  | 'technical_competence'
  | 'decision_making';

/**
 * Parameters for upserting an opinion
 */
export interface UpsertOpinionParams {
  contact_entity_id: string;
  layer: string;
  opinion_type: OpinionType;
  content: string;
  sentiment?: OpinionSentiment;
  confidence?: OpinionConfidence;
  evidence?: string[];
}

/**
 * Opinion record
 */
export interface Opinion {
  id: string;
  owner_id: string;
  contact_entity_id: string;
  gft_contact_id?: string;
  opinion_type: OpinionType;
  content: string;
  sentiment?: OpinionSentiment;
  confidence: OpinionConfidence;
  evidence?: string[];
  layer: string;
  source_system: string;
  created_at: string;
  updated_at: string;
}

/**
 * Opinion summary for quick display
 */
export interface OpinionSummary {
  has_opinions: boolean;
  opinion_types: OpinionType[];
  overall_sentiment?: OpinionSentiment;
  key_points: string[];
}

// ============================================================================
// SKILLS FILES TYPES
// ============================================================================

/**
 * Tool definition in skills file
 */
export interface SkillTool {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Program (multi-step workflow) in skills file
 */
export interface SkillProgram {
  name: string;
  description?: string;
  steps?: unknown[];
}

/**
 * Skills file metadata
 */
export interface SkillsFile {
  id: string;
  name: string;
  layer: string;
  source_system: string;
  frontmatter?: Record<string, unknown>;
  tools_count: number;
  programs_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Skills file with full content
 */
export interface SkillsFileDetail extends SkillsFile {
  content: string;
  tools: SkillTool[];
  programs: SkillProgram[];
}

/**
 * Skills file list result
 */
export interface SkillsFileListResult {
  files: SkillsFile[];
  total: number;
}

/**
 * Skills search result
 */
export interface SkillsSearchResult {
  results: Array<{
    file: SkillsFile;
    tool?: SkillTool;
    program?: SkillProgram;
  }>;
}

// ============================================================================
// STRING-TIE ENRICHMENT TYPES
// ============================================================================

/**
 * Result of enriching a string-tie reminder
 */
export interface StringTieEnrichmentResult {
  enriched: boolean;
  reason?: string;
  original_reminder?: string;
  contact_data?: ContactData;
  insight?: string;
}

// ============================================================================
// PARKING LOT EXPANSION TYPES
// ============================================================================

/**
 * Expanded analysis for parking lot item
 */
export interface ExpandedAnalysis {
  background?: string;
  opportunities?: string[];
  risks?: string[];
  action_plan?: string[];
  objectives?: string[];
}

/**
 * Result of parking lot expansion with Human-OS
 */
export interface ParkingLotExpansionResult {
  expansion: ExpandedAnalysis;
  enrichment_used: string[];
}

// ============================================================================
// EXTERNAL TRIGGER TYPES
// ============================================================================

/**
 * External event types from Human-OS
 */
export type ExternalEventType =
  | 'company_funding_event'
  | 'contact_job_change'
  | 'linkedin_activity_spike'
  | 'company_news_event'
  | 'relationship_opinion_added';

/**
 * Trigger check result
 */
export interface TriggerCheckResult {
  triggered: boolean;
  reason?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// PROGRESS CALLBACK
// ============================================================================

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (progress: number, message: string) => void;
