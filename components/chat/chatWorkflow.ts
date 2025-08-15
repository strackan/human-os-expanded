// Chat step types and workflows for conversational chat

import { ChatStep } from '../../src/types/chat';
import { createChatWorkflowConfig } from '../../src/config/chatWorkflow';

// Renewals HQ workflow steps
const renewalsChatSteps: ChatStep[] = [
  {
    bot: "Let's confirm the account details and renewal outlook. Acme Corp has 92% usage, $450k ARR, and a high likelihood of renewal. Do you agree with this assessment and want to proceed with an aggressive price increase strategy, or would you prefer a more conservative approach?",
    inputType: 'choice',
    choices: ["Aggressive (recommended)", "Conservative"],
    progressStep: 0, // Move from "Review account data" to "Confirm renewal strategy"
    onUser: (answer) => {
      if (/conservative/i.test(answer)) {
        return "Got it. I'll proceed with your standard increase of 3%.";
      }
      return "Great, we'll proceed with the recommended aggressive strategy.";
    },
  },
  {
    bot: [
      "Checking contract for price increase limits...",
      "The contract has language that does not allow price increases above 3%. Would you like to: 1) Draft an amendment to increase the price limit, 2) Revert to a 3% price increase, or 3) Come back to this later?"
    ],
    inputType: 'numberOrSkip',
    onUser: (answer) => {
      const trimmed = answer.trim();
      if (trimmed === '1') {
        return "I'll plan to include an amendment in our ongoing strategy. I recommend a 7% price increase as our target. Would you like to proceed with 7%, or enter a different percentage?";
      }
      if (trimmed === '2') {
        return "Got it. We'll go with a 3% increase for this renewal. I'll make a note to revisit the amendment discussion as a future action.";
      }
      if (trimmed === '3') {
        return "No problem, we can revisit this later.";
      }
      // Reprompt with the original question and error message
      return [
        "The contract has language that does not allow price increases above 3%. Would you like to: 1) Draft an amendment to increase the price limit, 2) Revert to a 3% price increase, or 3) Come back to this later?",
        "Please enter 1, 2, or 3."
      ];
    },
  },
  {
    bot: "", // Leave bot message empty, since the previous step's reply already contains the question
    inputType: 'numberOrSkip',
    progressStep: 1, // Move from "Confirm renewal strategy" to "Confirm contacts"
    pendingConfirmation: false,
    onUser: (answer, context) => {
      // Check if we're in a confirmation state
      if (context?.pendingConfirmation) {
        if (/yes|y|confirm/i.test(answer)) {
          const pendingValue = context.pendingValue;
          if (pendingValue < 3) {
            return `Understood. We'll proceed with a ${pendingValue}% increase for this renewal.`;
          } else if (pendingValue > 8) {
            return `Noted. We'll proceed with a ${pendingValue}% increase for this renewal.`;
          }
        } else if (/no|n|cancel/i.test(answer)) {
          // Re-ask the original question
          return ["Let's reconsider. I recommend a 7% price increase as our target. Would you like to proceed with 7%, or enter a different percentage?"];
        }
        // If neither yes nor no, re-ask confirmation
        return ["Please confirm: Enter 'Yes' to proceed or 'No' to enter a different percentage."];
      }

      if (!answer.trim()) {
        // Treat empty input as 7
        return `Great, 7% is a strong, data-backed choice for this renewal.`;
      }
      if (/skip|pass/i.test(answer)) return "No problem, we'll revisit the price increase later.";
      
      const num = parseFloat(answer);
      if (!isNaN(num)) {
        if (num < 3) {
          // Store the pending value and ask for confirmation
          if (context) {
            context.pendingConfirmation = true;
            context.pendingValue = num;
          }
          return [`You've entered ${num}%. Our analysis suggests this customer could likely accommodate a higher increase. Are you certain you'd like to proceed with ${num}%?`];
        }
        if (num >= 10) {
          // High numbers need manager approval (no confirmation dialog)
          return `You entered ${num}%. This amount needs manager approval. We'll let you know when we hear back (or you can edit the number).`;
        }
        if (num > 8) {
          // Numbers between 8 and 10 need confirmation
          if (context) {
            context.pendingConfirmation = true;
            context.pendingValue = num;
          }
          return [`You've entered ${num}%. This is a substantial increase that may create friction with the customer based on our data. Are you certain you'd like to proceed with ${num}%?`];
        }
        if (num === 7) {
          return `Great, 7% is a strong, data-backed choice for this renewal.`;
        }
        if (num >= 3 && num <= 8) {
          return `Noted, we'll propose a ${num}% increase for this renewal.`;
        }
      }
      // Invalid input - re-ask the question
      return ["I didn't understand that. Please enter a percentage number (e.g., 7), or type 'Skip' to revisit this later."];
    },
  },
  {
    bot: "Who should be involved in the renewal process? The primary contact is Sarah Johnson, and the executive sponsor is Michael Chen. Should I include anyone else in these upcoming discussions?",
    inputType: 'emailOrSkip',
    progressStep: 2, // Move from "Confirm contacts" to "Address risk"
    onUser: () => {
      return "Got it.";
    },
  },
  {
    bot: "There's one risk: Feature X usage declined 15% last quarter. Should I set a reminder to schedule a meeting about this?",
    inputType: 'choice',
    choices: ["Yes, schedule meeting", "No, proceed without"],
    progressStep: 3, // Move from "Address risk" to "Send renewal notice"
    onUser: (answer) => {
      if (answer.toLowerCase().includes('yes')) {
        return [
          "Okay, I'll remind you to schedule a meeting in a few days.",
          "You're all set. I'll check back later when it's time to send the renewal notice."
        ];
      }
      if (answer.toLowerCase().includes('no')) {
        return [
          "I'll skip the meeting.",
          "You're all set. I'll check back later when it's time to send the renewal notice."
        ];
      }
      return "Please select Yes or No.";
    },
  },
  {
    bot: "", // This step will show the Review/Proceed buttons
    inputType: 'finalStep',
    choices: ["Review", "Proceed to next customer"],
    progressStep: 4, // Final step - "Send renewal notice"
    onUser: (answer) => {
      if (answer.toLowerCase().includes("review")) {
        return { type: "review", showSummary: true };
      }
      return { type: "proceed", href: "/customers/initech" };
    },
  }
];

export const renewalsChatWorkflow = createChatWorkflowConfig(renewalsChatSteps); 