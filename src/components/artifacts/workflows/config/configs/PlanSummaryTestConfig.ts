import { WorkflowConfig } from '../WorkflowConfig';

export const planSummaryTestConfig: WorkflowConfig = {
  customer: {
    name: 'Enterprise Corp',
    nextCustomer: 'NextGen Industries'
  },
  layout: {
    modalDimensions: { width: 85, height: 90, top: 5, left: 7.5 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$850,000',
        trend: 'up',
        trendValue: '+22%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$7.50',
        sublabel: '(average)',
        status: 'green',
        trend: 'Standard pricing'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 28, 2025',
        sublabel: '45 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Sarah Johnson',
        role: 'VP of Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.5/10',
        status: 'green',
        sublabel: 'Low risk'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.2/10',
        status: 'green',
        sublabel: 'High growth'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+35%',
        status: 'green',
        sparkData: [4, 5, 6, 7, 8, 9, 10],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+8%',
        status: 'green',
        sparkData: [8, 8, 9, 9, 10, 10, 11],
        sublabel: 'Accelerating'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      data: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      chartContextLabel: '↗ +22% growth',
      chartContextColor: 'text-green-600',
      dataColors: {
        threshold: 12,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-green-500'
      }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
      chartContextLabel: '↗ Strong growth',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 22, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Summary',
      confidence: 95,
      recommendedAction: 'Complete Planning',
      keyReasons: [
        { category: 'Growth', detail: '35% YoY growth' },
        { category: 'Usage', detail: 'Strong usage metrics' },
        { category: 'Health', detail: 'Excellent health score' },
        { category: 'Planning', detail: 'All tasks completed' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask a question or describe what you need help with...',
    aiGreeting: "Planning is complete! Let me show you the summary of what we've accomplished.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?",
      initialMessage: {
        text: "Excellent work! We've completed the renewal planning for Enterprise Corp. Here's a comprehensive summary of everything we've accomplished and the next steps in the process.",
        buttons: [
          { label: 'Show Summary', value: 'show-summary' },
          { label: 'Review Details', value: 'review' },
          { label: 'Skip to Next', value: 'next' }
        ],
        nextBranches: {
          'show-summary': 'summary-branch',
          'review': 'review-branch',
          'next': 'next-branch'
        }
      },
      branches: {
        'summary-branch': {
          response: "Here's your complete renewal planning summary with all tasks, accomplishments, and next steps:",
          actions: ['showArtifact'],
          artifactId: 'plan-summary',
          buttons: [
            { label: 'Next Customer', value: 'next-customer' },
            { label: 'Back to Dashboard', value: 'dashboard' },
            { label: 'Review Account', value: 'review-account' }
          ],
          nextBranches: {
            'next-customer': 'next-customer-branch',
            'dashboard': 'dashboard-branch',
            'review-account': 'review-account-branch'
          }
        },
        'review-branch': {
          response: "Would you like to review any specific aspect of the planning process?",
          buttons: [
            { label: 'Contract Terms', value: 'contract' },
            { label: 'Pricing Strategy', value: 'pricing' },
            { label: 'Show Summary', value: 'show-summary' }
          ]
        },
        'next-branch': {
          response: "Moving to the next customer renewal...",
          buttons: [
            { label: 'Continue', value: 'continue' }
          ]
        },
        'next-customer-branch': {
          response: "Great! Let's move on to the next customer renewal in your queue.",
          buttons: [
            { label: 'Continue', value: 'continue' }
          ]
        },
        'dashboard-branch': {
          response: "Returning to your renewals dashboard where you can see all your active accounts.",
          buttons: [
            { label: 'Continue', value: 'continue' }
          ]
        },
        'review-account-branch': {
          response: "Opening detailed account view for Enterprise Corp where you can dive deeper into their metrics and history.",
          buttons: [
            { label: 'Continue', value: 'continue' }
          ]
        }
      }
    },
    features: {
      attachments: true,
      voiceRecording: true,
      designMode: true,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'plan-summary',
        title: 'Renewal Planning Summary',
        type: 'plan-summary',
        visible: false,
        content: {
          customerName: 'Enterprise Corp',
          tasksInitiated: [
            {
              id: '1',
              title: 'Contract terms reviewed and analyzed',
              completed: true,
              timestamp: 'Today 2:15 PM',
              assignee: 'You'
            },
            {
              id: '2',
              title: 'Target pricing strategy established',
              completed: true,
              timestamp: 'Today 2:30 PM',
              assignee: 'You'
            },
            {
              id: '3',
              title: 'Stakeholder contact validation completed',
              completed: true,
              timestamp: 'Today 2:45 PM',
              assignee: 'You'
            },
            {
              id: '4',
              title: 'Renewal timeline and milestones set',
              completed: true,
              timestamp: 'Today 3:00 PM',
              assignee: 'You'
            },
            {
              id: '5',
              title: 'Legal review requirements identified',
              completed: true,
              timestamp: 'Today 3:15 PM',
              assignee: 'You'
            }
          ],
          accomplishments: [
            'Confirmed 12% price increase strategy based on exceptional 35% YoY growth',
            'Identified Sarah Johnson (VP of Engineering) as primary renewal stakeholder',
            'Established 45-day renewal timeline with clear milestone checkpoints',
            'Documented contract terms requiring legal team review and approval',
            'Set proactive engagement schedule with weekly touchpoints',
            'Updated Salesforce with all planning decisions and next steps'
          ],
          nextSteps: [
            {
              id: '1',
              title: 'Send renewal notice with pricing proposal',
              description: 'Email detailed renewal notice with 12% increase justification',
              dueDate: 'Dec 18, 2024',
              assignee: 'You',
              priority: 'high'
            },
            {
              id: '2',
              title: 'Schedule stakeholder alignment call',
              description: 'Book 45-min renewal discussion with Sarah Johnson',
              dueDate: 'Dec 20, 2024',
              assignee: 'You',
              priority: 'high'
            },
            {
              id: '3',
              title: 'Submit contract terms for legal review',
              description: 'Forward non-standard terms to legal team for approval',
              dueDate: 'Dec 22, 2024',
              assignee: 'Legal Team',
              priority: 'medium'
            },
            {
              id: '4',
              title: 'Prepare negotiation scenarios',
              description: 'Develop response strategies for potential objections',
              dueDate: 'Dec 25, 2024',
              assignee: 'You',
              priority: 'medium'
            }
          ],
          followUpDate: 'January 5, 2025',
          salesforceUpdated: true,
          trackingEnabled: true
        }
      }
    ]
  }
};