// Placeholder for Initech-specific chat workflow logic
// This file will eventually store the chat steps, handlers, and workflow logic for the Initech renewal workflow.

export interface InitechChatStep {
  id: string;
  message: (customerName: string) => string;
  // Add more fields as needed for future steps
}

export const initechChatSteps: InitechChatStep[] = [
  {
    id: 'notify-customer',
    message: (customerName: string) =>
      `I will help you send a notification to ${customerName}. Previously we established a target price increase of 4%. Would you like to keep that amount or change it?`,
  },
  {
    id: 'confirm-strategy',
    message: (customerName: string) =>
      `Based on ${customerName}'s usage and engagement, I recommend proceeding with the renewal. Would you like to: 1) Proceed with the 4% price increase, or 2) Take a more conservative approach?`,
  },
  {
    id: 'check-contract',
    message: (customerName: string) =>
      `I've reviewed ${customerName}'s contract. There are no restrictions on price increases. Would you like to proceed with sending the renewal notice?`,
  },
  {
    id: 'confirm-contacts',
    message: (customerName: string) =>
      `I'll send the renewal notice to the primary contact and CC the executive sponsor. Would you like to review the message before sending?`,
  },
  {
    id: 'send-notice',
    message: (customerName: string) =>
      `Great! I'll send the renewal notice to ${customerName} now. The notice includes the 4% price increase and highlights their strong usage metrics.`,
  }
];

// TODO: Implement additional Initech chat workflow logic here, similar to renewalsChatSteps in Revenue-HQ. 