export interface ChatStep {
  bot: string | string[];
  inputType: 'choiceOrInput' | 'multiStep';
  choices?: string[];
  progressStep?: number; // Optional property to indicate which progress stepper step this corresponds to
  onUser: (answer: string) => string | string[];
}

// Example of how to use the progressStep property in the chat steps:
export const renewalsChatSteps: ChatStep[] = [
  {
    bot: "I'll help you prepare for the renewal. First, let's confirm the account details...",
    inputType: "choiceOrInput",
    choices: ["Yes, proceed", "No, let me check"],
    onUser: (answer) => {
      if (answer.toLowerCase().includes("yes")) {
        return "Great! Let's check the contract limits...";
      }
      return "Please review the account details and let me know when you're ready to proceed.";
    }
  },
  {
    bot: "Based on the account data, I recommend a moderate price increase strategy. Would you like to proceed with this approach?",
    inputType: "choiceOrInput",
    choices: ["Yes, proceed with moderate increase", "No, let's be more conservative"],
    progressStep: 0, // Move from "Review account data" to "Confirm renewal strategy"
    onUser: (answer) => {
      if (answer.toLowerCase().includes("yes")) {
        return "Great! Let's check the contract limits...";
      }
      return "Understood. We'll take a more conservative approach.";
    }
  },
  {
    bot: "Let's check the contract limits. Based on the data, we can increase the price by up to 5%...",
    inputType: "choiceOrInput",
    choices: ["Proceed with 5%", "Use a lower increase", "Check contract"],
    onUser: (answer) => {
      if (answer.includes("5%")) {
        return "Great! Let's confirm the contacts...";
      }
      return "Please review the contract terms and let me know your decision.";
    }
  },
  {
    bot: "What percentage increase would you like to apply?",
    inputType: "choiceOrInput",
    choices: ["3%", "4%", "5%", "Other"],
    progressStep: 1, // Move from "Confirm renewal strategy" to "Confirm contacts"
    onUser: () => {
      return "Perfect. Now, let's confirm who should be involved in the renewal process.";
    }
  },
  {
    bot: "Who should be involved in the renewal process?",
    inputType: "choiceOrInput",
    choices: ["Primary contact only", "Primary + Executive sponsor", "Full stakeholder list"],
    progressStep: 2, // Move from "Confirm contacts" to "Address risk"
    onUser: () => {
      return "Great! Now, let's review any potential risks or concerns...";
    }
  },
  {
    bot: "Are there any risks or concerns we should address before proceeding?",
    inputType: "choiceOrInput",
    choices: ["No risks identified", "Yes, let's review concerns"],
    progressStep: 3, // Move from "Address risk" to "Send renewal notice"
    onUser: (answer) => {
      if (answer.toLowerCase().includes("no")) {
        return "Perfect! We're ready to send the renewal notice.";
      }
      return "Let's address these concerns before proceeding with the renewal notice.";
    }
  },
  {
    bot: "Would you like to send the renewal notice now?",
    inputType: "choiceOrInput",
    choices: ["Yes, send now", "No, review first"],
    progressStep: 4, // Final step - "Send renewal notice"
    onUser: (answer) => {
      if (answer.toLowerCase().includes("yes")) {
        return "Great! The renewal notice has been sent.";
      }
      return "Understood. Let me know when you're ready to send the notice.";
    }
  }
]; 