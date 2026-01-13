import { WorkflowConfig } from '../WorkflowConfig';

export const contactStrategyConfig: WorkflowConfig = {
  customer: {
    name: 'TechFlow Industries',
    nextCustomer: 'NextCorp'
  },
  layout: {
    modalDimensions: { width: 85, height: 90, top: 5, left: 7.5 },
    dividerPosition: 55,
    chatWidth: 45,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$485,000',
        trend: 'up',
        trendValue: '+12.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$6.76',
        sublabel: '(88% value)',
        status: 'orange',
        trend: 'Pays less than 88% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Apr 1, 2026',
        sublabel: '90 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Eric Estrada',
        role: 'VP Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '4.2/10',
        status: 'orange',
        sublabel: '1 open critical ticket'
      },
      growthScore: {
        label: 'Growth Score',
        value: '7.8/10',
        status: 'green',
        sublabel: 'Expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+18.2%',
        status: 'green',
        sparkData: [3, 4, 3, 5, 6, 7, 8],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5.3%',
        status: 'green',
        sparkData: [6, 6, 7, 7, 8, 8, 9],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9, 11, 13, 15, 14, 16, 18, 20, 22, 21, 23, 25],
      chartContextLabel: '↗ +45% uplift',
      chartContextColor: 'text-green-600',
      dataColors: {
        threshold: 15,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-green-500'
      }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: true,
      referenceLineLabel: 'License Cost',
      data: [8, 9, 8, 9, 10, 9, 8, 9, 10, 9, 8, 9, 10, 11, 12, 20, 21, 22, 21, 20, 22, 21, 23, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30, 29, 31, 30],
      chartContextLabel: '↗ +120% spike',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 15, belowColor: 'bg-purple-500', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Contact Planning',
      confidence: 75,
      recommendedAction: 'Review Contact Strategy',
      keyReasons: [
        { category: 'Contacts', detail: 'Primary contact may have changed' },
        { category: 'Outreach', detail: 'No recent engagement with executives' },
        { category: 'Strategy', detail: 'Need to establish decision-maker relationships' },
        { category: 'Timeline', detail: '90 days until renewal - time to engage' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about contact strategy or request changes...',
    aiGreeting: "I've reviewed TechFlow Industries' contact strategy. Let's make sure we're reaching out to the right people for the renewal.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      initialMessage: {
        text: "I've reviewed TechFlow Industries and pulled together our current contacts. Before we proceed with outreach, let's make sure we have the right strategy for reaching the decision makers.",
        buttons: [
          { label: 'Review contact strategy', value: 'review-contacts', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Update contacts first', value: 'update-contacts', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
          { label: 'Skip to email outreach', value: 'skip-to-email', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
        ],
        nextBranches: {
          'review-contacts': 'show-strategy',
          'update-contacts': 'update-mode',
          'skip-to-email': 'email-composer'
        }
      },
      branches: {
        'show-strategy': {
          response: "Perfect! I've loaded the contact strategy artifact. You can see our current contacts with their roles, last meeting dates, and recommended outreach strategies. Each contact card shows whether they're business, executive, or technical contacts with color coding.",
          delay: 1,
          actions: ['launch-artifact'],
          artifactId: 'contact-strategy',
          buttons: [
            { label: 'This looks good', value: 'accept-strategy', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'I want to make changes', value: 'edit-contacts', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' },
            { label: 'Generate new strategy', value: 'new-strategy', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'accept-strategy': 'strategy-accepted',
            'edit-contacts': 'edit-mode',
            'new-strategy': 'generating-strategy'
          }
        },
        'strategy-accepted': {
          response: "Excellent! I'll help you reach out to these contacts. Would you like me to draft personalized emails for each contact or start with a specific one?",
          delay: 1,
          buttons: [
            { label: 'Draft emails for all contacts', value: 'draft-all', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Start with executive contact', value: 'draft-executive', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Start with primary contact', value: 'draft-primary', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'draft-all': 'email-sequence',
            'draft-executive': 'email-executive',
            'draft-primary': 'email-primary'
          }
        },
        'edit-mode': {
          response: "You can edit any contact by clicking the edit icon on their card. You can change their details, replace them with a different contact, or remove them entirely. The strategy recommendations will update automatically based on your changes.",
          delay: 1,
          buttons: [
            { label: 'Done editing', value: 'editing-complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Need help with editing', value: 'edit-help', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'editing-complete': 'strategy-accepted',
            'edit-help': 'edit-instructions'
          }
        },
        'generating-strategy': {
          response: "I'm analyzing the account and generating a new contact strategy... This will take into account recent activity, org chart changes, and renewal best practices.",
          delay: 3,
          actions: ['launch-artifact'],
          artifactId: 'contact-strategy-new',
          buttons: [
            { label: 'This new strategy looks better', value: 'accept-new-strategy', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Go back to previous strategy', value: 'show-strategy', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'accept-new-strategy': 'strategy-accepted',
            'show-strategy': 'show-strategy'
          }
        },
        'email-executive': {
          response: "I'll draft a personalized email for the executive contact focusing on strategic value and renewal planning. This will include meeting scheduling options and key talking points.",
          delay: 2,
          actions: ['launch-artifact'],
          artifactId: 'email-composer-executive',
          buttons: [
            { label: 'Send this email', value: 'send-executive-email', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Edit before sending', value: 'edit-executive-email', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' },
            { label: 'Draft emails for other contacts too', value: 'draft-remaining', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' }
          ],
          nextBranches: {
            'send-executive-email': 'email-sent',
            'edit-executive-email': 'email-editing',
            'draft-remaining': 'email-sequence'
          }
        },
        'email-sent': {
          response: "Email sent! I've set up tracking and will notify you when there's a response. Would you like to continue with the other contacts or set up follow-up reminders?",
          delay: 1,
          buttons: [
            { label: 'Continue with other contacts', value: 'draft-remaining', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Set up follow-up reminders', value: 'setup-reminders', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' },
            { label: 'I\'m done for now', value: 'complete', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'draft-remaining': 'email-sequence',
            'setup-reminders': 'reminder-setup',
            'complete': 'workflow-complete'
          }
        },
        'workflow-complete': {
          response: "Great work! The contact strategy has been implemented and your outreach is underway. I'll keep you updated on responses and remind you about follow-ups. The account is well-positioned for the renewal process.",
          delay: 1,
          actions: ['showFinalSlide']
        }
      }
    },
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'contact-strategy',
        title: 'Contact Strategy',
        type: 'custom',
        visible: true,
        editable: true,
        content: {
          component: 'ContactStrategyArtifact',
          props: {
            title: 'Contact Strategy Review',
            subtitle: 'Review and update your primary contacts for TechFlow Industries',
            contacts: [
              {
                id: 'contact-1',
                name: 'Eric Estrada',
                role: 'VP Engineering',
                email: 'eric.estrada@techflowindustries.com',
                type: 'business',
                lastMeeting: '2 months ago',
                meetingStatus: 'overdue',
                strategy: 'Schedule technical roadmap discussion to understand upcoming needs and position renewal as enabler for growth.',
                updates: 'Primary technical decision maker - key for renewal approval'
              },
              {
                id: 'contact-2',
                name: 'Sarah Chen',
                role: 'Chief Technology Officer',
                email: 'sarah.chen@techflowindustries.com',
                type: 'executive',
                lastMeeting: '6 months ago',
                meetingStatus: 'overdue',
                strategy: 'Executive-level strategic discussion focusing on ROI, future vision, and how our platform supports their growth trajectory.',
                updates: 'Final budget decision maker - critical relationship'
              },
              {
                id: 'contact-3',
                name: 'Mike Rodriguez',
                role: 'Senior Developer',
                email: 'mike.rodriguez@techflowindustries.com',
                type: 'technical',
                lastMeeting: '3 weeks ago',
                meetingStatus: 'recent',
                strategy: 'Maintain technical relationship, gather feedback on current usage, identify any integration needs or pain points.',
                updates: 'Day-to-day user champion - can provide usage insights'
              }
            ],
            showActions: true
          }
        }
      }
    ]
  }
};