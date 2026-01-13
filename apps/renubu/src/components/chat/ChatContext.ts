export interface ChatStep {
  id: string;
  botMessage: string;
  inputType: 'text' | 'choice';
  choices?: string[];
  handleResponse?: (response: string) => string;
}

export class ChatContext {
  private steps: ChatStep[];
  private currentStepIndex: number;
  private userAnswers: Record<string, string>;

  constructor(steps: ChatStep[]) {
    this.steps = steps;
    this.currentStepIndex = 0;
    this.userAnswers = {};
  }

  initialize(): string {
    this.currentStepIndex = 0;
    this.userAnswers = {};
    return this.getCurrentStep().botMessage;
  }

  processUserInput(input: string): string | null {
    const currentStep = this.getCurrentStep();
    
    // Store the user's answer
    this.userAnswers[currentStep.id] = input;

    // Process the response if there's a handler
    const response = currentStep.handleResponse?.(input);

    // Move to the next step
    this.currentStepIndex++;

    // If we have more steps, return the next bot message
    if (this.currentStepIndex < this.steps.length) {
      return this.getCurrentStep().botMessage;
    }

    // If this was the last step, return the final response
    return response || null;
  }

  getCurrentStep(): ChatStep {
    return this.steps[this.currentStepIndex];
  }

  isComplete(): boolean {
    return this.currentStepIndex >= this.steps.length;
  }

  getUserAnswers(): Record<string, string> {
    return { ...this.userAnswers };
  }
} 