/**
 * Workflow Configuration Types
 *
 * Defines the structure for workflow configs.
 * These types match the unified schema from API-CONTRACT.md
 * and support both backend execution and UI presentation.
 */

/**
 * Button definition
 */
export interface WorkflowButton {
  label: string;
  value: string;
}

/**
 * Chat branch definition
 */
export interface ChatBranch {
  response: string;
  actions?: string[];
  artifactId?: string;
  buttons?: WorkflowButton[];
  nextBranches?: { [key: string]: string };
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  initialMessage: {
    text: string;
    buttons: WorkflowButton[];
  };
  branches: {
    [key: string]: ChatBranch;
  };
}

/**
 * Artifact definition
 */
export interface ArtifactConfig {
  id: string;
  title: string;
  type: 'contract' | 'email' | 'checklist' | 'metrics' | 'report';
  visible: boolean;
  data: any;
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  // Backend properties
  id: string;
  title: string;
  type?: 'data_analysis' | 'planning' | 'action' | 'review';
  dataRequired?: string[];
  executor?: string;

  // UI properties
  chat: ChatConfig;
  artifacts: ArtifactConfig[];
}

/**
 * Complete workflow configuration
 */
export interface WorkflowConfig {
  // Backend metadata
  id: string;
  name: string;
  version: string;
  type: 'renewal' | 'strategic' | 'opportunity' | 'risk';
  stage?: string;
  baseScore: number;
  urgencyScore?: number;

  // Workflow steps
  steps: WorkflowStep[];
}
