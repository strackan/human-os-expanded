/**
 * Workflow State Persistence Types
 *
 * Defines the structure of persisted workflow state for save/resume functionality.
 */

import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

/**
 * Complete workflow state snapshot for persistence
 */
export interface WorkflowStateSnapshot {
  // Schema version for future migrations
  version: number;

  // Navigation state
  currentSlideIndex: number;
  completedSlides: number[];
  skippedSlides: number[];

  // User-entered data from artifacts
  workflowData: Record<string, any>;

  // Per-slide state (form values, selections)
  slideStates: Record<number, Record<string, any>>;

  // Chat conversation history (serializable subset)
  chatMessages: SerializableChatMessage[];

  // Current branch for chat routing
  currentBranch: string | null;

  // Timestamps
  savedAt: string;
  updatedAt: string;
}

/**
 * Serializable version of ChatMessage (no functions, no components)
 */
export interface SerializableChatMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user' | 'system';
  timestamp: string;
  slideId?: string;
  isHistorical?: boolean;
  isSlideSeparator?: boolean;
  isDivider?: boolean;
  componentValue?: any;
  // Note: buttons and component are NOT persisted - derived from config on restore
}

/**
 * Database row structure for workflow_state_snapshots
 */
export interface WorkflowStateSnapshotRow {
  id: string;
  execution_id: string;
  user_id: string;
  current_slide_index: number;
  completed_slides: number[];
  skipped_slides: number[];
  slide_states: Record<number, Record<string, any>>;
  workflow_data: Record<string, any>;
  chat_messages: SerializableChatMessage[];
  current_branch: string | null;
  is_latest: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Audit log entry
 */
export interface WorkflowStateAuditEntry {
  id?: string;
  execution_id: string;
  user_id: string;
  action_type: WorkflowAuditAction;
  slide_index?: number;
  previous_state?: Partial<WorkflowStateSnapshot>;
  new_state?: Partial<WorkflowStateSnapshot>;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Audit action types
 */
export type WorkflowAuditAction =
  | 'workflow_started'
  | 'workflow_resumed'
  | 'workflow_completed'
  | 'workflow_abandoned'
  | 'slide_navigated'
  | 'data_saved'
  | 'chat_message_sent'
  | 'branch_selected';

/**
 * LLM cache entry
 */
export interface LLMCacheEntry {
  id?: string;
  cache_key: string;
  prompt_hash: string;
  customer_id?: string;
  workflow_type?: string;
  slide_id?: string;
  response_content: string;
  response_metadata?: Record<string, any>;
  hit_count: number;
  expires_at: string;
  created_at?: string;
}

/**
 * Sync status for local-first operations
 */
export type SyncStatus = 'synced' | 'pending' | 'error';

/**
 * IndexedDB state snapshot with sync metadata
 */
export interface LocalStateSnapshot extends WorkflowStateSnapshot {
  executionId: string;
  syncStatus: SyncStatus;
  lastSyncAt?: string;
  localVersion: number;
  serverVersion?: number;
}

/**
 * Sync operation for queue
 */
export interface SyncOperation {
  id?: number;
  operation: 'save' | 'delete';
  executionId: string;
  payload: WorkflowStateSnapshot;
  priority: number;
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

/**
 * Transform ChatMessage to serializable format
 */
export function toSerializableMessage(msg: ChatMessage): SerializableChatMessage {
  return {
    id: msg.id,
    text: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    slideId: msg.slideId,
    isHistorical: msg.isHistorical,
    isSlideSeparator: msg.isSlideSeparator,
    isDivider: msg.isDivider,
    componentValue: msg.componentValue,
  };
}

/**
 * Transform serializable message back to ChatMessage
 */
export function fromSerializableMessage(msg: SerializableChatMessage): ChatMessage {
  return {
    ...msg,
    timestamp: new Date(msg.timestamp),
    // Note: buttons and component will be re-derived from slide config
  };
}

// ============================================
// v0.1.12: Account Review Phase Approval Types
// ============================================

/**
 * Tab/Phase status for approval workflow
 */
export type PhaseStatus = 'pending' | 'current' | 'approved';

/**
 * Individual phase approval data
 */
export interface PhaseApproval {
  phaseId: string;
  status: PhaseStatus;
  llmAnalysis?: string;
  userComments?: string;
  approvedAt?: string;
}

/**
 * Account review phase identifiers
 */
export const ACCOUNT_REVIEW_PHASE_IDS = [
  'usage',
  'contract',
  'contacts',
  'expansion',
  'risk',
] as const;

export type AccountReviewPhaseId = (typeof ACCOUNT_REVIEW_PHASE_IDS)[number];

/**
 * Complete account review state for persistence
 */
export interface AccountReviewStateSnapshot {
  /** Customer ID for the review */
  customerId: string;
  /** Customer name for display */
  customerName: string;
  /** Phase approvals with LLM analysis and user comments */
  phaseApprovals: PhaseApproval[];
  /** Current active phase */
  currentPhase: AccountReviewPhaseId;
  /** Whether all phases are approved */
  allPhasesApproved: boolean;
  /** Synthesis result (populated after all phases approved) */
  synthesisResult?: AccountReviewSynthesisResult;
  /** Timestamp when review was started */
  startedAt: string;
  /** Timestamp when review was completed */
  completedAt?: string;
}

/**
 * Result of strategy synthesis after all phases approved
 */
export interface AccountReviewSynthesisResult {
  /** Engagement strategy summary */
  strategySummary: string;
  /** Meeting deck slides in PresentationArtifact format */
  deckSlides: any[];
  /** Renewal email draft */
  emailDraft: string;
  /** Meeting agenda */
  meetingAgenda: string;
  /** Raw LLM response */
  rawResponse: string;
  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Extended workflow state snapshot with account review state
 */
export interface WorkflowStateSnapshotWithAccountReview extends WorkflowStateSnapshot {
  accountReviewState?: AccountReviewStateSnapshot;
}
