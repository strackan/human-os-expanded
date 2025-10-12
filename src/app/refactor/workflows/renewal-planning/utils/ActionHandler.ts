/**
 * Action Handler Utility
 *
 * Executes actions defined in workflow configs.
 * Actions are strings like 'showArtifact', 'hideArtifact', 'nextStep', etc.
 *
 * This utility provides a centralized way to handle all workflow actions,
 * making it easy to add new action types without modifying the engine.
 *
 * Usage:
 * ```typescript
 * const actions = ['showArtifact', 'playSound'];
 * const context = { artifactId: 'contract', soundId: 'notification' };
 * const callbacks = {
 *   onShowArtifact: (id) => setVisibleArtifact(id),
 *   onPlaySound: (id) => audio.play(id)
 * };
 * executeActions(actions, context, callbacks);
 * ```
 */

/**
 * Action execution context
 */
export interface ActionContext {
  artifactId?: string;
  stepNumber?: number;
  data?: any;
  [key: string]: any;
}

/**
 * Action callbacks
 */
export interface ActionCallbacks {
  onShowArtifact?: (artifactId: string) => void;
  onHideArtifact?: (artifactId: string) => void;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
  onCompleteStep?: (data?: any) => void;
  onCustomAction?: (actionName: string, context: ActionContext) => void;
}

/**
 * Execute an array of actions
 * @param actions - Array of action strings
 * @param context - Context data for actions
 * @param callbacks - Callback functions for each action type
 */
export function executeActions(
  actions: string[] | undefined,
  context: ActionContext,
  callbacks: ActionCallbacks
): void {
  if (!actions || actions.length === 0) {
    return;
  }

  actions.forEach((action) => {
    executeAction(action, context, callbacks);
  });
}

/**
 * Execute a single action
 * @param action - Action string
 * @param context - Context data
 * @param callbacks - Callback functions
 */
export function executeAction(
  action: string,
  context: ActionContext,
  callbacks: ActionCallbacks
): void {
  switch (action) {
    case 'showArtifact':
      if (callbacks.onShowArtifact && context.artifactId) {
        callbacks.onShowArtifact(context.artifactId);
      }
      break;

    case 'hideArtifact':
      if (callbacks.onHideArtifact && context.artifactId) {
        callbacks.onHideArtifact(context.artifactId);
      }
      break;

    case 'nextStep':
      if (callbacks.onNextStep) {
        callbacks.onNextStep();
      }
      break;

    case 'previousStep':
      if (callbacks.onPreviousStep) {
        callbacks.onPreviousStep();
      }
      break;

    case 'completeStep':
      if (callbacks.onCompleteStep) {
        callbacks.onCompleteStep(context.data);
      }
      break;

    default:
      // Custom action - pass to handler if available
      if (callbacks.onCustomAction) {
        callbacks.onCustomAction(action, context);
      } else {
        console.warn(`Unknown action: ${action}`);
      }
  }
}
