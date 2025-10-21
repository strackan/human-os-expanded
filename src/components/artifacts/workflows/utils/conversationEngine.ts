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
  type: 'launch-artifact' | 'showArtifact' | 'removeArtifact' | 'nextChat' | 'exitTaskMode' | 'nextCustomer' | 'resetChat' | 'resetToInitialState' | 'showFinalSlide' | 'showMenu' | 'nextSlide' | 'completeStep' | 'enterStep' | 'advanceWithoutComplete' | 'resetWorkflow' | 'navigateToBranch' | 'goToNextSlide' | 'goToPreviousSlide' | 'closeWorkflow';
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
        } else if (action === 'showMenu') {
          actions.push({
            type: 'showMenu',
            payload: {}
          });
        } else if (action === 'completeStep' && branch.stepId) {
          actions.push({
            type: 'completeStep',
            payload: { stepId: branch.stepId }
          });
        } else if (action === 'enterStep' && branch.stepNumber !== undefined) {
          actions.push({
            type: 'enterStep',
            payload: { stepNumber: branch.stepNumber }
          });
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
    let clickedButton: DynamicChatButton | null = null;

    // Type guard: all subflows should be resolved in constructor, so we can safely cast
    const currentBranch = !isSubflowReference(currentBranchData) ? currentBranchData as DynamicChatBranch | null : null;

    if (currentBranch?.nextBranches) {
      nextBranchName = currentBranch.nextBranches[userInput] || null;
      isExactMatch = !!nextBranchName;

      if (!isExactMatch && currentBranch.buttons) {
        const matchedButton = currentBranch.buttons.find(
          btn => btn.label.toLowerCase() === userInput.toLowerCase() ||
                 btn.value.toLowerCase() === userInput.toLowerCase()
        );
        if (matchedButton) {
          clickedButton = matchedButton;
          nextBranchName = currentBranch.nextBranches[matchedButton.value] ||
                          currentBranch.nextBranches[matchedButton.label];
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
          clickedButton = matchedButton;
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
      const nextBranchData = this.flow.branches[nextBranchName];

      // Type guard: all subflows should be resolved in constructor, so we can safely cast
      if (isSubflowReference(nextBranchData)) {
        console.error('Unexpected subflow reference in processUserInput:', nextBranchName);
        return {
          text: "I'm sorry, there was an error processing your request. Please try again.",
          buttons: currentBranch?.buttons?.map(button => ({
            ...button,
            label: substituteVariablesWithMappings(button.label, this.variableContext)
          }))
        };
      }

      const nextBranch = nextBranchData as DynamicChatBranch;

      this.state.history.push({
        branch: nextBranchName,
        userInput,
        timestamp: new Date()
      });
      this.state.currentBranch = nextBranchName;

      const actions = this.processActions(nextBranch);

      // Check if the clicked button has a completeStep property
      if (clickedButton && (clickedButton as any).completeStep) {
        actions.push({
          type: 'completeStep',
          payload: { stepId: (clickedButton as any).completeStep }
        });
      }

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

    const defaultMessage = this.getCurrentDefaultMessage(currentBranch || undefined);

    return {
      text: defaultMessage,
      buttons: currentBranch?.buttons?.map(button => ({
        ...button,
        label: substituteVariablesWithMappings(button.label, this.variableContext)
      }))
    };
  }

  processBranch(branchId: string): ConversationResponse | null {
    console.log('ConversationEngine: Processing branch directly:', branchId);

    const branch = this.flow.branches[branchId];
    if (!branch) {
      console.error('ConversationEngine: Branch not found:', branchId);
      return null;
    }

    // Check if it's a subflow reference
    if (isSubflowReference(branch)) {
      const resolved = resolveSubflow(branch);
      if (!resolved) {
        console.error('ConversationEngine: Could not resolve subflow:', branch.subflow);
        return null;
      }
      // Add the additional branches from the subflow to the flow
      Object.assign(this.flow.branches, resolved.additionalBranches);
      return this.processBranch(branchId); // Recursively process the resolved branch
    }

    const nextBranch = branch as DynamicChatBranch;

    // Update state
    this.state.history.push({
      branch: branchId,
      userInput: '[direct-navigation]',
      timestamp: new Date()
    });
    this.state.currentBranch = branchId;

    const actions = this.processActions(nextBranch);

    // Process actions immediately if there's no delay
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
      nextBranch: branchId,
      delay: nextBranch.delay,
      predelay: nextBranch.predelay
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