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
        return "We'll proceed with a more conservative renewal strategy.";
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
    onUser: (answer) => {
      if (!answer.trim()) {
        // Treat empty input as 7
        return `Great, 7% is a strong, data-backed choice for this renewal.`;
      }
      if (/skip|pass/i.test(answer)) return "No problem, we'll revisit the price increase later.";
      const num = parseFloat(answer);
      if (!isNaN(num)) {
        if (num >= 10) {
          return `You entered ${num}%. This amount needs manager approval. We'll let you know when we hear back (or you can edit the number).`;
        }
        if (num === 7) {
          return `Great, 7% is a strong, data-backed choice for this renewal.`;
        }
        return `Noted, we'll propose a ${num}% increase for this renewal.`;
      }
      return "Please enter a number, or type 'Skip'.";
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
    inputType: 'numberOrSkip',
    progressStep: 3, // Move from "Address risk" to "Send renewal notice"
    onUser: (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed.includes('yes') || trimmed === '1' || trimmed === 'y' || trimmed === 'schedule') {
        return [
          "Okay, I'll remind you to schedule a meeting in a few days.",
          "You're all set. I'll check back later when it's time to send the notice.",
          { type: "link", text: "Go to next customer – Initech", href: "/customers/initech" }
        ];
      }
      if (trimmed.includes('no') || trimmed === '2' || trimmed === 'n' || trimmed === 'proceed') {
        return [
          "Understood. We'll proceed directly with the renewal notice.",
          "You're all set. I'll check back later when it's time to send the notice.",
          { type: "link", text: "Go to next customer – Initech", href: "/customers/initech" }
        ];
      }
      return "Please enter Yes, No, 1, 2, or type your answer.";
    },
  },
  {
    bot: "Would you like to send the renewal notice now?",
    inputType: 'choice',
    choices: ["Yes, send now", "No, review first"],
    progressStep: 4, // Final step - "Send renewal notice"
    onUser: (answer) => {
      if (answer.toLowerCase().includes("yes")) {
        return "Great! The renewal notice has been sent.";
      }
      return "Understood. Let me know when you're ready to send the notice.";
    },
  }
];

export const indexPageChatWorkflow = createChatWorkflowConfig(renewalsChatSteps); 