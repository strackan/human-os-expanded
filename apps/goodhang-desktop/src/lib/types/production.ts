/**
 * Production Mode Types
 *
 * Types for the Founder OS production chat interface.
 */

// =============================================================================
// MODES
// =============================================================================

export type ProductionMode =
  | 'default'
  | 'journal'
  | 'brainstorm'
  | 'checkin'
  | 'post'
  | 'search'
  | 'crisis';

// =============================================================================
// SESSION STATE
// =============================================================================

export interface ProductionSessionState {
  sessionId: string;
  userId: string;
  entitySlug: string;
  mode: ProductionMode;
  activeExpert: string | null;
}

// =============================================================================
// DO() GATE RESULT
// =============================================================================

export interface DoGateResult {
  matched: boolean;
  aliasPattern: string | null;
  confidence: number;
  summary: string;
  resolvedEntities: string[];
  clarification: ClarificationOption[] | null;
}

export interface ClarificationOption {
  label: string;
  entitySlug: string;
  entityType: string;
}

// =============================================================================
// CHAT REQUEST / RESPONSE METADATA
// =============================================================================

export interface ProductionChatParams {
  entity_slug: string;
  mode: ProductionMode;
  session_id: string;
}

export interface ProductionMetadata {
  doGateResult?: DoGateResult;
  mode?: ProductionMode;
  entities?: string[];
  modeSwitch?: {
    from: ProductionMode;
    to: ProductionMode;
    reason: string;
  };
}
