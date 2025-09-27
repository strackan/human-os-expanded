import { DynamicChatFlow, DynamicChatBranch, DynamicChatButton } from '../config/WorkflowConfig';
import { substituteVariablesWithMappings, VariableContext } from './variableSubstitution';
import { resolveSubflow, isSubflowReference, SubflowReference } from '../config/subflows';

export interface ConversationState {
  currentBranch: string | null;
  history: Array<{
    branch: string;
    userInput: string;
    timestamp: Date;
  }>;
  artifacts: Set<string>;
}

export interface ConversationAction {
  type: 'launch-artifact' | 'showArtifact' | 'removeArtifact' | 'show-buttons' | 'hide-buttons' | 'clear-chat' | 'nextChat' | 'exitTaskMode' | 'nextCustomer' | 'resetChat' | 'resetToInitialState' | 'showFinalSlide';
  payload?: any;
}

export interface ConversationResponse {
  text: string;
  buttons?: DynamicChatButton[];
  actions?: ConversationAction[];
  nextBranch?: string;
  delay?: number; // Delay in seconds before showing the response
  predelay?: number; // Delay in seconds before this branch can be triggered
}

export class ConversationEngine {
  private flow: DynamicChatFlow;
  private state: ConversationState;
  private onAction?: (action: ConversationAction) => void;
  private variableContext: VariableContext;

  constructor(flow: DynamicChatFlow, onAction?: (action: ConversationAction) => void, variableContext?: VariableContext) {
    this.flow = this.resolveSubflowsInFlow(flow);
    this.onAction = onAction;
    this.variableContext = variableContext || {};
    this.state = {
      currentBranch: null,
      history: [],
      artifacts: new Set()
    };
  }

  private resolveSubflowsInFlow(flow: DynamicChatFlow): DynamicChatFlow {
    const resolvedFlow = { ...flow };
    const resolvedBranches: { [key: string]: DynamicChatBranch } = {};

    // Process each branch and resolve subflow references
    for (const [branchName, branchValue] of Object.entries(flow.branches)) {
      if (isSubflowReference(branchValue)) {
        // Resolve the subflow reference
        const subflowResult = resolveSubflow(branchValue as SubflowReference);
        if (subflowResult) {
          // Replace the subflow reference with the actual branch
          resolvedBranches[branchName] = subflowResult.branch;

          // Add any additional branches that the subflow needs
          Object.assign(resolvedBranches, subflowResult.additionalBranches);
        } else {
          console.error(`Failed to resolve subflow: ${(branchValue as SubflowReference).subflow}`);
          // Fallback to a default error branch
          resolvedBranches[branchName] = {
            response: "I'm sorry, there was an error processing your request. Please try again.",
            buttons: [{ label: 'Ok', value: 'ok' }]
          };
        }
      } else {
        // Keep the branch as-is
        resolvedBranches[branchName] = branchValue as DynamicChatBranch;
      }
    }

    resolvedFlow.branches = resolvedBranches;
    return resolvedFlow;
  }

  getInitialMessage(): ConversationResponse | null {
    if (this.flow.startsWith === 'user') {
      return null;
    }

    if (this.flow.initialMessage) {
      return {
        text: substituteVariablesWithMappings(this.flow.initialMessage.text, this.variableContext),
        buttons: this.flow.initialMessage.buttons?.map(button => ({
          ...button,
          label: substituteVariablesWithMappings(button.label, this.variableContext)
        }))
      };
    }

    return null;
  }

  private getCurrentDefaultMessage(currentBranch?: DynamicChatBranch): string {
    if (currentBranch?.defaultMessage) {
      return substituteVariablesWithMappings(currentBranch.defaultMessage, this.variableContext);
    }

    const defaultMessage = this.flow.defaultMessage || "I'm sorry, I didn't understand that. Could you try again?";
    return substituteVariablesWithMappings(defaultMessage, this.variableContext);
  }

  private findMatchingTrigger(userInput: string): string | null {
    if (!this.flow.userTriggers) return null;

    for (const [pattern, branchName] of Object.entries(this.flow.userTriggers)) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(userInput)) {
          return branchName;
        }
      } catch (e) {
        console.warn(`Invalid regex pattern: ${pattern}`, e);
      }
    }

    return null;
  }

  private processActions(branch: DynamicChatBranch): ConversationAction[] {
    const actions: ConversationAction[] = [];

    if (branch.actions) {
      for (const action of branch.actions) {
        if (action === 'launch-artifact' && branch.artifactId) {
          actions.push({
            type: 'launch-artifact',
            payload: { artifactId: branch.artifactId }
          });
          this.state.artifacts.add(branch.artifactId);
        } else if (action === 'showArtifact') {
          actions.push({
            type: 'showArtifact',
            payload: { artifactId: branch.artifactId }
          });
          // Also add the artifact if specified
          if (branch.artifactId) {
            this.state.artifacts.add(branch.artifactId);
          }
        } else if (action === 'removeArtifact') {
          actions.push({
            type: 'removeArtifact',
            payload: { artifactId: branch.artifactId }
          });
          // Remove the artifact if specified
          if (branch.artifactId) {
            this.state.artifacts.delete(branch.artifactId);
          }
        } else {
          actions.push({ type: action });
        }
      }
    }

    return actions;
  }

  processUserInput(userInput: string): ConversationResponse {
    const currentBranchData = this.state.currentBranch
      ? this.flow.branches[this.state.currentBranch]
      : null;

    let nextBranchName: string | null = null;
    let isExactMatch = false;

    if (currentBranchData?.nextBranches) {
      nextBranchName = currentBranchData.nextBranches[userInput] || null;
      isExactMatch = !!nextBranchName;

      if (!isExactMatch && currentBranchData.buttons) {
        const matchedButton = currentBranchData.buttons.find(
          btn => btn.label.toLowerCase() === userInput.toLowerCase() ||
                 btn.value.toLowerCase() === userInput.toLowerCase()
        );
        if (matchedButton) {
          nextBranchName = currentBranchData.nextBranches[matchedButton.value] ||
                          currentBranchData.nextBranches[matchedButton.label];
          isExactMatch = !!nextBranchName;
        }
      }
    }

    // Handle initial message nextBranches when no current branch
    if (!isExactMatch && !this.state.currentBranch && this.flow.initialMessage?.nextBranches) {
      nextBranchName = this.flow.initialMessage.nextBranches[userInput] || null;
      isExactMatch = !!nextBranchName;

      if (!isExactMatch && this.flow.initialMessage.buttons) {
        const matchedButton = this.flow.initialMessage.buttons.find(
          btn => btn.label.toLowerCase() === userInput.toLowerCase() ||
                 btn.value.toLowerCase() === userInput.toLowerCase()
        );
        if (matchedButton) {
          nextBranchName = this.flow.initialMessage.nextBranches[matchedButton.value] ||
                          this.flow.initialMessage.nextBranches[matchedButton.label];
          isExactMatch = !!nextBranchName;
        }
      }
    }

    if (!isExactMatch && !this.state.currentBranch) {
      nextBranchName = this.findMatchingTrigger(userInput);
    }

    if (nextBranchName && this.flow.branches[nextBranchName]) {
      const nextBranch = this.flow.branches[nextBranchName];

      this.state.history.push({
        branch: nextBranchName,
        userInput,
        timestamp: new Date()
      });
      this.state.currentBranch = nextBranchName;

      const actions = this.processActions(nextBranch);

      // Only process actions immediately if there's no delay
      if (this.onAction && actions.length > 0 && !nextBranch.delay) {
        actions.forEach(action => this.onAction!(action));
      }

      return {
        text: substituteVariablesWithMappings(nextBranch.response, this.variableContext),
        buttons: nextBranch.buttons?.map(button => ({
          ...button,
          label: substituteVariablesWithMappings(button.label, this.variableContext)
        })),
        actions,
        nextBranch: nextBranchName,
        delay: nextBranch.delay,
        predelay: nextBranch.predelay
      };
    }

    const defaultMessage = this.getCurrentDefaultMessage(currentBranchData || undefined);

    return {
      text: defaultMessage,
      buttons: currentBranchData?.buttons?.map(button => ({
        ...button,
        label: substituteVariablesWithMappings(button.label, this.variableContext)
      }))
    };
  }

  reset(): void {
    this.state = {
      currentBranch: null,
      history: [],
      artifacts: new Set()
    };
  }

  getState(): ConversationState {
    return { ...this.state };
  }

  isWaitingForUser(): boolean {
    return this.flow.startsWith === 'user' && this.state.currentBranch === null;
  }

  updateVariableContext(context: VariableContext): void {
    this.variableContext = { ...this.variableContext, ...context };
  }

  getVariableContext(): VariableContext {
    return { ...this.variableContext };
  }

  resetChat(): void {
    this.reset();
    // Reset to initial state and get the initial message
    const initialMessage = this.getInitialMessage();
    if (initialMessage) {
      // This will be handled by the ChatInterface when it processes the resetChat action
    }
  }
}