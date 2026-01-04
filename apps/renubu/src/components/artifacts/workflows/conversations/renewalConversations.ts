// Reusable conversation templates for different scenarios

export const earlyRenewalConversation = [
  {
    sender: 'ai' as const,
    text: 'I\'ve identified an early renewal opportunity. The customer shows strong growth signals and could benefit from locking in current rates. Should we proceed with outreach?',
    type: 'buttons' as const,
    buttons: [
      { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
      { label: 'Proceed', value: 'proceed', 'label-background': '#10b981', 'label-text': '#ffffff' }
    ]
  }
];

export const urgentRenewalConversation = [
  {
    sender: 'ai' as const,
    text: '🚨 URGENT: Renewal expires soon! We need immediate action to prevent churn.',
    type: 'buttons' as const,
    buttons: [
      { label: 'Call Now', value: 'call', 'label-background': '#dc2626', 'label-text': '#ffffff' },
      { label: 'Send Email', value: 'email', 'label-background': '#10b981', 'label-text': '#ffffff' }
    ]
  }
];

export const upsellConversation = [
  {
    sender: 'ai' as const,
    text: 'This customer has exceeded their usage limits and shows strong growth. Perfect opportunity for an enterprise upsell. Shall we prepare a proposal?',
    type: 'buttons' as const,
    buttons: [
      { label: 'Not Yet', value: 'wait', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
      { label: 'Yes, Prepare', value: 'prepare', 'label-background': '#10b981', 'label-text': '#ffffff' }
    ]
  }
];

export const atRiskConversation = [
  {
    sender: 'ai' as const,
    text: '⚠️ This account shows risk indicators: declining usage, unresolved tickets, and lack of engagement. We need a retention strategy. How should we proceed?',
    type: 'buttons' as const,
    buttons: [
      { label: 'Schedule Review', value: 'review', 'label-background': '#6366f1', 'label-text': '#ffffff' },
      { label: 'Immediate Outreach', value: 'outreach', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
      { label: 'Escalate', value: 'escalate', 'label-background': '#dc2626', 'label-text': '#ffffff' }
    ]
  }
];

// Function to generate dynamic conversations based on customer data
export const generateConversation = (customerName: string, arr: string, growth: string, stage: string) => [
  {
    sender: 'ai' as const,
    text: `Let's review ${customerName}. Current ARR: ${arr}, Growth: ${growth}. They're in the ${stage} stage. What action should we take?`,
    type: 'buttons' as const,
    buttons: [
      { label: 'Review Details', value: 'review', 'label-background': '#6366f1', 'label-text': '#ffffff' },
      { label: 'Take Action', value: 'action', 'label-background': '#10b981', 'label-text': '#ffffff' }
    ]
  }
];