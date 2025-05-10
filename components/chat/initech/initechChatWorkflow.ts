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
];

// TODO: Implement additional Initech chat workflow logic here, similar to renewalsChatSteps in Revenue-HQ. 