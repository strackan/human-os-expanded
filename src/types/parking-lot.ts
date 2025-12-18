/**
 * Parking Lot Types
 * Intelligent multi-modal idea capture system with LLM enhancement
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CaptureMode = 'project' | 'expand' | 'brainstorm' | 'passive';

export type ParkingLotStatus = 'active' | 'expanded' | 'brainstorming' | 'converted' | 'archived';

export type ParkingLotSource = 'manual' | 'voice' | 'chat_snippet' | 'email_snippet' | 'api';

// Magic keywords that trigger different modes
export const MAGIC_KEYWORDS = {
  project: ['project eyes', 'workflow', 'turn this idea into', 'renubu', 'create workflow'],
  expand: ['expand', 'flesh out', 'elaborate', 'add details'],
  brainstorm: ['brainstorm', 'think through', 'explore this'],
  passive: [] // Default: no keywords = passive storage
} as const;

// ============================================================================
// TRIGGER TYPES (Shared with Workflow System)
// ============================================================================

export type TriggerType = 'date' | 'event';

export type EventType =
  | 'risk_score_threshold'
  | 'opportunity_score_threshold'
  | 'days_to_renewal'
  | 'workflow_milestone'
  | 'lighter_day'
  | 'calendar_event'
  | 'crm_activity'
  | 'usage_spike'
  | 'health_score_drop'
  | 'context_match';

export interface DateTriggerConfig {
  date?: string;                     // ISO date string
  daysFromNow?: number;              // Relative days
  timezone?: string;

  // Brainstorm-specific: Smart timing
  preferLighterDay?: boolean;        // Wait for low workflow load
  urgencyIncrease?: number;          // Escalation rate (0.0-1.0)
}

export interface EventTriggerConfig {
  event: EventType;

  // Customer condition triggers
  customer?: string;                 // Customer ID or name
  threshold?: number;                // Score threshold
  operator?: '>' | '<' | '>=' | '<=';

  // Workflow milestone triggers
  workflow_type?: string;            // e.g., 'upgrade', 'renewal'
  milestone?: 'started' | 'completed' | 'blocked';

  // Context triggers
  context?: string;                  // What context should match
}

export interface WakeTrigger {
  id: string;
  type: TriggerType;
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
  firedAt?: string;
}

// ============================================================================
// READINESS SCORING
// ============================================================================

export interface ReadinessFactors {
  informationCompleteness: number;   // 0-100: Do we have enough detail?
  urgency: number;                   // 0-100: Is this time-sensitive?
  potentialImpact: number;           // 0-100: How valuable is this?
  effortEstimate: number;            // 0-100: How hard to execute? (lower = easier)
}

// ============================================================================
// EXTRACTED ENTITIES
// ============================================================================

export interface ExtractedEntities {
  customers?: string[];              // Customer names or IDs
  contacts?: string[];               // People mentioned
  workflows?: string[];              // Workflow types or IDs
  dates?: string[];                  // Date references
  topics?: string[];                 // Key topics/themes
  actions?: string[];                // Action verbs (e.g., "call", "send", "review")
}

// ============================================================================
// WORKFLOW MAPPING
// ============================================================================

export interface PotentialWorkflow {
  workflow_config_id: string;        // Workflow template ID
  confidence: number;                // 0-1: How confident is mapping?
  requiredData: string[];            // What data is missing to convert?
  estimatedEffort: string;           // e.g., "30 min", "2 hours"
}

// ============================================================================
// BRAINSTORM MODE
// ============================================================================

export interface BrainstormQuestion {
  id: string;
  question: string;
  category: 'problem' | 'solution' | 'market' | 'execution' | 'other';
  order: number;
}

export interface BrainstormAnswer {
  question_id: string;
  answer: string;
  answeredAt: string;
}

// ============================================================================
// EXPANSION
// ============================================================================

export interface ExpandedAnalysis {
  background: string;                // Context and current state
  opportunities: string[];           // Potential upsides
  risks: string[];                   // Potential downsides
  actionPlan: ActionStep[];          // Sequenced steps
  objectives: string[];              // Clear goals
  generatedAt: string;
}

export interface ActionStep {
  step: string;
  estimatedTime: string;             // e.g., "15 min"
  priority: 'high' | 'medium' | 'low';
  order: number;
}

export interface Artifact {
  type: 'proposal' | 'plan' | 'analysis' | 'document';
  format: 'markdown' | 'pdf';
  content: string;
  title: string;
  generatedAt: string;
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

export interface ConvertedTo {
  type: 'workflow' | 'task' | 'reminder';
  id: string;
  convertedAt: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface ParkingLotCategory {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;               // Hex color (e.g., '#3B82F6')
  icon: string | null;                // Emoji or icon name
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ParkingLotItem {
  id: string;
  user_id: string;

  // Content
  raw_input: string;
  cleaned_text: string;

  // Mode
  capture_mode: CaptureMode;

  // Intelligence
  extracted_entities: ExtractedEntities;
  suggested_categories: string[];
  user_categories: string[];

  // Readiness
  readiness_score: number;            // 0-100
  readiness_factors: ReadinessFactors;

  // Workflow mapping
  potential_workflows: PotentialWorkflow[];

  // Wake triggers
  wake_triggers: WakeTrigger[];
  last_evaluated_at: string | null;
  trigger_fired_at: string | null;
  fired_trigger_type: string | null;

  // Brainstorm
  brainstorm_questions: BrainstormQuestion[] | null;
  brainstorm_answers: BrainstormAnswer[] | null;
  brainstorm_completed_at: string | null;
  brainstorm_prefer_lighter_day: boolean;
  brainstorm_urgency: number;         // 0.0-1.0

  // Expansion
  expanded_analysis: ExpandedAnalysis | null;
  expanded_at: string | null;
  artifact_generated: boolean;
  artifact_data: Artifact | null;

  // Relationships
  related_ideas: string[];
  related_workflows: string[];
  related_customers: string[];

  // Status
  source: ParkingLotSource;
  status: ParkingLotStatus;
  converted_to: ConvertedTo | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateParkingLotItemRequest {
  raw_input: string;
  source?: ParkingLotSource;
  // Optional: Pre-set values (otherwise LLM will detect)
  capture_mode?: CaptureMode;
  user_categories?: string[];
  wake_triggers?: WakeTrigger[];
}

export interface CreateParkingLotItemResponse {
  success: boolean;
  item?: ParkingLotItem;
  error?: string;
}

export interface ListParkingLotItemsRequest {
  mode?: CaptureMode;
  categories?: string[];
  status?: ParkingLotStatus;
  minReadiness?: number;
  sortBy?: 'readiness' | 'created' | 'updated';
  limit?: number;
  offset?: number;
}

export interface ListParkingLotItemsResponse {
  success: boolean;
  items?: ParkingLotItem[];
  total?: number;
  error?: string;
}

export interface UpdateParkingLotItemRequest {
  cleaned_text?: string;
  user_categories?: string[];
  wake_triggers?: WakeTrigger[];
  status?: ParkingLotStatus;
  readiness_score?: number;
}

export interface ExpandParkingLotItemRequest {
  item_id: string;
  context?: {
    customer_data?: Record<string, any>;
    workflow_data?: Record<string, any>;
  };
}

export interface ExpandParkingLotItemResponse {
  success: boolean;
  expansion?: ExpandedAnalysis;
  artifact?: Artifact;
  error?: string;
}

export interface BrainstormSessionRequest {
  item_id: string;
  answers: BrainstormAnswer[];
}

export interface BrainstormSessionResponse {
  success: boolean;
  expansion?: ExpandedAnalysis;
  nextAction?: 'convert_to_workflow' | 'expand_further' | 'store_passive';
  error?: string;
}

export interface ConvertToWorkflowRequest {
  item_id: string;
  workflow_config_id: string;
  pre_fill_data?: Record<string, any>;
}

export interface ConvertToWorkflowResponse {
  success: boolean;
  workflow_id?: string;
  error?: string;
}

// ============================================================================
// LLM SERVICE TYPES
// ============================================================================

export interface LLMParseResult {
  mode: CaptureMode;
  cleanedText: string;
  extractedEntities: ExtractedEntities;
  suggestedCategories: string[];
  readinessScore: number;
  readinessFactors: ReadinessFactors;
  potentialWorkflows: PotentialWorkflow[];
  wakeTriggers?: WakeTrigger[];       // Auto-generated from mode
  brainstormQuestions?: BrainstormQuestion[];  // If mode=brainstorm
  expandedAnalysis?: ExpandedAnalysis;         // If mode=expand
}

export interface LLMExpansionRequest {
  idea: ParkingLotItem;
  context?: {
    customerData?: Record<string, any>;
    workflowData?: Record<string, any>;
    recentInteractions?: Record<string, any>;
  };
}

export interface LLMBrainstormRequest {
  topic: string;
  category?: string;
}

// ============================================================================
// EVENT DETECTION TYPES
// ============================================================================

export interface EventDetectionResult {
  shouldWake: boolean;
  reason?: string;
  triggeredBy?: WakeTrigger;
  metadata?: Record<string, any>;
}

export interface LighterDayMetrics {
  activeWorkflowCount: number;
  todayMeetingCount: number;
  snoozedItemsCount: number;
  capacityScore: number;             // 0-100: Higher = more capacity
  isLighterDay: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ParkingLotFilters {
  mode?: CaptureMode[];
  categories?: string[];
  status?: ParkingLotStatus[];
  minReadiness?: number;
  maxReadiness?: number;
  hasWakeTriggers?: boolean;
}

export interface ParkingLotSort {
  field: 'readiness_score' | 'created_at' | 'updated_at' | 'cleaned_text';
  direction: 'asc' | 'desc';
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const MODE_LABELS: Record<CaptureMode, string> = {
  project: 'Project / Workflow',
  expand: 'Expand & Document',
  brainstorm: 'Brainstorm Session',
  passive: 'Stored Idea'
};

export const MODE_ICONS: Record<CaptureMode, string> = {
  project: '🚀',
  expand: '📝',
  brainstorm: '💭',
  passive: '📦'
};

export const MODE_COLORS: Record<CaptureMode, string> = {
  project: '#10B981',  // green
  expand: '#3B82F6',   // blue
  brainstorm: '#8B5CF6', // purple
  passive: '#6B7280'   // gray
};

export const STATUS_LABELS: Record<ParkingLotStatus, string> = {
  active: 'Active',
  expanded: 'Expanded',
  brainstorming: 'In Brainstorm',
  converted: 'Converted',
  archived: 'Archived'
};

// ============================================================================
// HUMAN-OS ENRICHMENT TYPES (0.2.0)
// ============================================================================

/**
 * External enrichment data from Human-OS
 */
export interface HumanOSEnrichment {
  company?: {
    name: string;
    industry?: string;
    recentFunding?: {
      amount: number;
      round: string;
      date: string;
    };
    news?: Array<{
      headline: string;
      date: string;
    }>;
  };
  contacts?: Array<{
    name: string;
    headline?: string;
    recentPosts?: Array<{
      content: string;
      date: string;
    }>;
  }>;
  triangulation?: {
    insights: string[];
    summary: string;
  };
}

/**
 * Progress callback for long-running operations
 */
export type ExpansionProgressCallback = (
  stage: 'enriching' | 'analyzing' | 'generating' | 'complete',
  progress: number, // 0-100
  message?: string
) => void;

/**
 * Request for Human-OS enhanced expansion
 */
export interface HumanOSExpansionRequest {
  idea: ParkingLotItem;
  context?: {
    customerData?: Record<string, unknown>;
    workflowData?: Record<string, unknown>;
    recentInteractions?: Record<string, unknown>;
  };
  onProgress?: ExpansionProgressCallback;
}

/**
 * Result from Human-OS enhanced expansion
 */
export interface HumanOSExpansionResult {
  expansion: ExpandedAnalysis;
  artifact: Artifact;
  humanOSEnrichment?: HumanOSEnrichment;
  enrichedAt?: string;
}
