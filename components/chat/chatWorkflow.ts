// Chat step types and workflows for conversational chat

export interface ChatStep {
  bot: string | string[];
  inputType: 'numberOrSkip' | 'emailOrSkip' | 'choice' | 'choiceOrInput' | 'progress';
  choices?: string[];
  onUser: (answer: string, ctx?: { setPrice?: (price: number) => void }) => string;
}

// Renewals HQ workflow steps
export const renewalsChatSteps: ChatStep[] = [
  {
    bot: "Let's confirm the account details and renewal outlook. Acme Corp has 92% usage, $450k ARR, and a high likelihood of renewal. Do you agree with this assessment and want to proceed with an aggressive price increase strategy, or would you prefer a more conservative approach?",
    inputType: 'choice',
    choices: ["Aggressive (recommended)", "Conservative"],
    onUser: (answer, ctx) => {
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
    onUser: (answer, ctx) => {
      const trimmed = answer.trim();
      if (trimmed === '1') {
        return "I'll plan to include an amendment in our ongoing strategy. I recommend a 7% price increase as our target. Would you like to proceed with 7%, or enter a different percentage?";
      }
      if (trimmed === '2') {
        if (ctx && typeof ctx.setPrice === 'function') ctx.setPrice(3);
        return "Got it. We'll go with a 3% increase for this renewal. I'll make a note to revisit the amendment discussion as a future action.";
      }
      if (trimmed === '3') {
        return "No problem, we can revisit this later.";
      }
      return "Please enter 1, 2, or 3.";
    },
  },
  {
    bot: "", // Leave bot message empty, since the previous step's reply already contains the question
    inputType: 'numberOrSkip',
    onUser: (answer, ctx) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll revisit the price increase later.";
      const num = parseFloat(answer);
      if (!isNaN(num)) {
        if (ctx && typeof ctx.setPrice === 'function') ctx.setPrice(num);
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
    onUser: (answer, ctx) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll confirm recipients later.";
      if (answer.trim() === '1') return "Got it. The renewal notice will go to: Sarah Johnson (sarah@acme.com)";
      if (answer.trim() === '2') return "Got it. The renewal notice will go to: Michael Chen (michael@acme.com)";
      if (answer.trim() === '3') return "Got it. The renewal notice will go to: Sarah Johnson (sarah@acme.com), Michael Chen (michael@acme.com)";
      return `Got it. The renewal notice will go to: ${answer}`;
    },
  },
  {
    bot: "There's one risk: Feature X usage declined 15% last quarter. Should I set a reminder to schedule a meeting about this?",
    inputType: 'numberOrSkip',
    onUser: (answer, ctx) => {
      if (answer.trim() === '1') return "I'll help you schedule a usage review meeting before renewal outreach.";
      if (answer.trim() === '2') return "Understood. We'll proceed directly with the renewal notice.";
      if (/schedule/i.test(answer)) return "I'll help you schedule a usage review meeting before renewal outreach.";
      if (/proceed/i.test(answer)) return "Understood. We'll proceed directly with the renewal notice.";
      return "Please enter 1, 2, or type your answer.";
    },
  },
  {
    bot: "All set! You're ready to send the official renewal notice. Would you like to send it now?",
    inputType: 'choice',
    choices: ["Send Now", "Not Yet"],
    onUser: (answer, ctx) => {
      if (/send/i.test(answer)) return "Renewal notice sent! 🎉";
      return "No problem, you can send it whenever you're ready.";
    },
  },
]; 