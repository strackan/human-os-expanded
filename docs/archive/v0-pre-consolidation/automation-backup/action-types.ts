/**
 * Action Type Definitions
 *
 * Defines the types of actions CSMs can take from recommendations,
 * including automation requirements, artifact dependencies, and task creation.
 */

export type ActionId =
  | 'send_email'
  | 'schedule_meeting'
  | 'review_data'
  | 'update_crm'
  | 'get_transcript'
  | 'create_workflow'
  | 'skip'
  | 'snooze';

export type TaskOwner = 'AI' | 'CSM';

export type ArtifactType =
  | 'email'
  | 'meeting_agenda'
  | 'data_deep_dive'
  | 'crm_update'
  | 'transcript_request'
  | 'report'
  | null;

/**
 * Action Type Definition
 * Specifies how each action should behave
 */
export interface ActionTypeDefinition {
  id: ActionId;
  label: string; // Default button label
  icon?: string; // Optional icon for UI

  // Automation
  automation: string | null; // Integration service to call (null = no automation)
  requiresArtifact: ArtifactType; // What artifact must be generated first

  // Task creation
  createsTask: boolean; // Does this action create a trackable task?
  taskOwner?: TaskOwner; // Who owns the task (AI or CSM)

  // Completion
  completesRecommendation: boolean; // Does this action mark the recommendation as done?

  // Special config
  config?: Record<string, any>; // Action-specific configuration
}

/**
 * Action Type Registry
 * Defines all available actions
 */
export const ActionTypeRegistry: Record<ActionId, ActionTypeDefinition> = {
  /**
   * SEND EMAIL
   * Flow: AI drafts → CSM reviews → CSM edits (optional) → CSM confirms → System sends
   */
  send_email: {
    id: 'send_email',
    label: 'Send Email',
    icon: '📧',
    automation: 'email-sender', // Integration service
    requiresArtifact: 'email',
    createsTask: true,
    taskOwner: 'AI', // AI creates draft, then hands to CSM for approval
    completesRecommendation: true, // Once sent, recommendation is complete
    config: {
      draftFlow: true, // Always draft first, never auto-send
      editableInUI: true, // CSM can edit within interface
      requiresConfirmation: true, // CSM must explicitly confirm send
      sendableTypes: ['email'], // Focus: emails only (PDFs as attachments possible future)
      supportedAttachments: ['pdf'] // Future: attach generated reports/quotes as PDFs
    }
  },

  /**
   * SCHEDULE MEETING
   * Creates meeting invite with agenda
   */
  schedule_meeting: {
    id: 'schedule_meeting',
    label: 'Schedule Meeting',
    icon: '📅',
    automation: 'calendar-scheduler',
    requiresArtifact: 'meeting_agenda',
    createsTask: true,
    taskOwner: 'CSM', // CSM owns scheduling
    completesRecommendation: true,
    config: {
      generateAgenda: true, // AI generates meeting agenda
      suggestTimes: true // AI suggests meeting times based on context
    }
  },

  /**
   * REVIEW DATA
   * Shows additional data/analysis, no automation
   */
  review_data: {
    id: 'review_data',
    label: 'Review Data',
    icon: '📊',
    automation: null, // Just shows artifact, no external action
    requiresArtifact: 'data_deep_dive',
    createsTask: false, // Informational only
    taskOwner: undefined,
    completesRecommendation: false, // Doesn't close the recommendation
    config: {
      artifactType: 'interactive_report' // Can drill down into data
    }
  },

  /**
   * UPDATE CRM
   * Log activity/notes to CRM (Salesforce)
   * Flow: AI drafts update → CSM reviews → CSM confirms → System logs to CRM
   */
  update_crm: {
    id: 'update_crm',
    label: 'Update CRM',
    icon: '💼',
    automation: 'crm-updater', // Integration service (Salesforce)
    requiresArtifact: 'crm_update',
    createsTask: true,
    taskOwner: 'AI', // AI drafts update, CSM approves
    completesRecommendation: true,
    config: {
      draftFlow: true, // AI drafts, CSM approves
      editableInUI: true, // CSM can edit before confirming
      requiresConfirmation: true, // CSM must approve
      updateTypes: ['activity', 'note', 'task', 'opportunity_field'], // What can be updated
      systems: ['salesforce'] // Future: other CRMs
    }
  },

  /**
   * GET TRANSCRIPT
   * Request transcript from recent call/meeting
   * Flow: AI identifies relevant meeting → CSM confirms → System fetches transcript
   */
  get_transcript: {
    id: 'get_transcript',
    label: 'Get Transcript',
    icon: '📝',
    automation: 'transcript-fetcher', // Integration service (Gong, Chorus, etc.)
    requiresArtifact: 'transcript_request',
    createsTask: true,
    taskOwner: 'AI', // AI identifies meeting, fetches transcript
    completesRecommendation: false, // Getting transcript doesn't complete recommendation
    config: {
      sources: ['gong', 'chorus', 'zoom', 'teams'], // Possible transcript sources
      autoAnalyze: true, // AI analyzes transcript after fetching
      outputArtifact: 'transcript_analysis' // Create analysis artifact
    }
  },

  /**
   * CREATE WORKFLOW
   * Spawns a new workflow (e.g., pricing review workflow)
   */
  create_workflow: {
    id: 'create_workflow',
    label: 'Create Workflow',
    icon: '🔄',
    automation: 'workflow-spawner',
    requiresArtifact: null, // No artifact needed
    createsTask: true,
    taskOwner: 'AI', // AI creates workflow, CSM accepts it
    completesRecommendation: true,
    config: {
      workflowTypes: ['pricing-review', 'at-risk', 'expansion'] // Valid spawnable workflows
    }
  },

  /**
   * SKIP
   * Dismiss this recommendation (mark as skipped)
   */
  skip: {
    id: 'skip',
    label: 'Skip',
    icon: '⏭️',
    automation: null,
    requiresArtifact: null,
    createsTask: false,
    taskOwner: undefined,
    completesRecommendation: true, // Marks as skipped, won't resurface immediately
    config: {
      resurfaceAt: 'next_workflow', // Will resurface at next workflow if still valid
      requiresReason: false // Optional: ask CSM why they're skipping
    }
  },

  /**
   * SNOOZE
   * Defer this recommendation for 1 week
   */
  snooze: {
    id: 'snooze',
    label: 'Snooze',
    icon: '💤',
    automation: 'task-scheduler',
    requiresArtifact: null,
    createsTask: true,
    taskOwner: 'CSM', // CSM owns the snoozed task
    completesRecommendation: false, // Keeps recommendation open
    config: {
      snoozeDuration: 7, // Always 1 week
      dailyReevaluation: true // Check daily if should resurface vs. snooze again
    }
  }
};

/**
 * Email Draft Flow State Machine
 * Tracks the state of email drafting process
 */
export type EmailDraftState =
  | 'generating' // AI is drafting
  | 'ready_for_review' // Draft ready, CSM reviewing
  | 'editing' // CSM is editing
  | 'ready_to_send' // CSM confirmed, ready to send
  | 'sent' // Email sent
  | 'failed'; // Send failed

export interface EmailDraftFlow {
  state: EmailDraftState;
  draftContent: {
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    attachments?: Attachment[];
  };
  editHistory?: EmailEdit[]; // Track CSM edits
  sentAt?: Date;
  error?: string;
}

export interface Attachment {
  type: 'quote' | 'document' | 'report';
  filename: string;
  content: string | Buffer;
}

export interface EmailEdit {
  timestamp: Date;
  field: 'to' | 'cc' | 'subject' | 'body';
  previousValue: string;
  newValue: string;
}

/**
 * Task Definition
 * Represents a trackable task created by an action
 */
export interface Task {
  id: string;
  workflowId: string;
  recommendationId: string;
  customerId: string;

  // Task details
  type: 'AI_TASK' | 'CSM_TASK';
  owner: TaskOwner;
  action: ActionId;
  description: string;

  // State
  status: 'pending' | 'in_progress' | 'completed' | 'snoozed' | 'skipped';
  snoozedUntil?: Date;

  // Tracking
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Email-specific state (if action is send_email)
  emailDraftFlow?: EmailDraftFlow;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Snooze Evaluation Result
 * Returned by daily snooze evaluation logic
 */
export interface SnoozeEvaluationResult {
  taskId: string;
  shouldSurface: boolean; // Should this task appear in today's queue?
  reason: string; // Why surfacing or why staying snoozed
  resnoozedUntil?: Date; // If staying snoozed, new date
}

/**
 * Helper: Get action definition
 */
export function getActionDefinition(actionId: ActionId): ActionTypeDefinition {
  return ActionTypeRegistry[actionId];
}

/**
 * Helper: Does this action require CSM confirmation?
 */
export function requiresConfirmation(actionId: ActionId): boolean {
  const action = ActionTypeRegistry[actionId];
  return action.config?.requiresConfirmation === true;
}

/**
 * Helper: Get snooze duration (always 1 week)
 */
export function getSnoozeDuration(): number {
  return ActionTypeRegistry.snooze.config?.snoozeDuration || 7;
}

/**
 * Helper: Create task from action
 */
export function createTaskFromAction(
  actionId: ActionId,
  workflowId: string,
  recommendationId: string,
  customerId: string,
  description: string
): Task {
  const action = ActionTypeRegistry[actionId];

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workflowId,
    recommendationId,
    customerId,
    type: action.taskOwner === 'AI' ? 'AI_TASK' : 'CSM_TASK',
    owner: action.taskOwner || 'CSM',
    action: actionId,
    description,
    status: 'pending',
    createdAt: new Date(),
    metadata: {}
  };
}
