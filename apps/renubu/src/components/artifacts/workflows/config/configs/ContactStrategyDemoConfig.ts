import { WorkflowConfig } from '../WorkflowConfig';

// Fixed version using proven DynamicAiV2Baseline as foundation
export const contactStrategyDemoConfig: WorkflowConfig = {
  customer: {
    name: 'Innovation Dynamics Corp',
    nextCustomer: 'Growth Partners LLC'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$890,000',
        trend: 'up',
        trendValue: '+16.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$9.25',
        sublabel: '(85% value)',
        status: 'orange',
        trend: 'Below average pricing'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Sep 12, 2025',
        sublabel: '95 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Jennifer Walsh',
        role: 'Director of Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '5.2/10',
        status: 'orange',
        sublabel: 'Contact relationship needs attention'
      },
      growthScore: {
        label: 'Growth Score',
        value: '7.8/10',
        status: 'green',
        sublabel: 'Good expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+28%',
        status: 'green',
        sparkData: [4, 5, 6, 7, 8, 9, 10],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+12%',
        status: 'green',
        sparkData: [8, 8, 9, 9, 10, 10, 11],
        sublabel: 'Accelerating'
      }
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Relationship Building',
      confidence: 68,
      recommendedAction: 'Strengthen Contact Strategy',
      keyReasons: [
        { category: 'Contacts', detail: 'Limited executive relationships - need broader stakeholder engagement' },
        { category: 'Communication', detail: 'Primary contact last meeting was 4 months ago' },
        { category: 'Strategy', detail: 'Missing key decision makers in finance and operations' },
        { category: 'Timeline', detail: '95 days to renewal - critical relationship building period' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about contact strategy, stakeholder mapping, or outreach planning...',
    aiGreeting: "Welcome to the Contact Strategy Demo! I'll show you how our contact artifact helps map and manage stakeholder relationships.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about contact strategy features.",
      initialMessage: {
        text: "Welcome to the **Contact Strategy Demo**! 🎯\\n\\nThis demo showcases how our contact strategy artifact helps CSMs map stakeholders, track relationships, and plan strategic outreach. Innovation Dynamics Corp needs stronger executive relationships before their renewal.\\n\\nWhat would you like to explore?",
        buttons: [
          { label: 'Review current contacts', value: 'show-contacts', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Learn contact features', value: 'contact-features', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'show-contacts': 'display-contact-strategy',
          'contact-features': 'explain-features'
        }
      },
      branches: {
        'display-contact-strategy': {
          response: "Here's the **Contact Strategy Overview** for Innovation Dynamics Corp. Notice how contacts are categorized by type (business, executive, technical) with color coding and meeting status indicators.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'contact-strategy',
          buttons: [
            { label: 'Explore contact features', value: 'contact-interaction', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'contact-interaction': 'contact-interaction',
            'complete-demo': 'demo-complete'
          }
        },
        'contact-interaction': {
          response: "Excellent! You can see how the contact strategy artifact organizes stakeholder relationships with clear visual indicators. Each contact shows their role, last meeting status, and strategic importance to help CSMs prioritize relationship building efforts effectively.",
          delay: 1,
          buttons: [
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'complete-demo': 'demo-complete'
          }
        },
        'explain-features': {
          response: "**Contact Strategy Artifact Features:**\\n\\n👥 **Stakeholder Mapping** - Visual representation of key contacts\\n🎯 **Contact Type Classification** - Business, Executive, Technical categories\\n📅 **Meeting Status Tracking** - Last meeting dates and follow-up needs\\n💡 **Strategy Recommendations** - AI-powered outreach suggestions\\n✏️ **Inline Editing** - Easy contact updates and replacements\\n🔄 **Real-time Updates** - Strategy refreshes as you make changes\\n📊 **Coverage Analysis** - Identifies stakeholder gaps and opportunities",
          delay: 1,
          buttons: [
            { label: 'See it in action', value: 'show-contacts', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'show-contacts': 'display-contact-strategy'
          }
        },
        'demo-complete': {
          response: "🎉 **Contact Strategy Demo Complete!**\\n\\nYou've explored how the Contact Strategy artifact helps manage stakeholder relationships:\\n\\n• **Visual Contact Mapping** - Clear overview of all stakeholders\\n• **Strategic Recommendations** - AI-powered outreach guidance\\n• **Meeting Status Tracking** - Never miss important follow-ups\\n• **Coverage Analysis** - Identify and fill relationship gaps\\n• **Interactive Management** - Easy editing and contact updates\\n\\nThis artifact is essential for building the relationships that drive renewal success!",
          delay: 1,
          buttons: [
            { label: 'Restart demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ]
        },
        'skip': { subflow: 'common.skip' },
        'snooze': { subflow: 'common.snooze' },
        'exit-task-mode': {
          response: "Task mode closed. You can reopen it anytime from the dashboard.",
          actions: ['exitTaskMode']
        },
        'next-customer-action': {
          response: "Moving to the next customer...",
          actions: ['nextCustomer']
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
        title: 'Contact Strategy Review',
        type: 'contact-strategy',
        visible: false,
        editable: true,
        content: {
          title: 'Contact Strategy Review',
          subtitle: 'Current stakeholder map for Innovation Dynamics Corp',
          contacts: [
              {
                id: 'contact-1',
                name: 'Jennifer Walsh',
                role: 'Director of Engineering',
                email: 'jennifer.walsh@innovationdynamics.com',
                type: 'business',
                lastMeeting: '4 months ago',
                meetingStatus: 'overdue',
                strategy: 'Re-engage to understand current technical priorities and platform usage. Position upcoming features that align with their development roadmap.',
                updates: 'Strong technical advocate but relationship has gone stale - needs immediate re-engagement'
              },
              {
                id: 'contact-2',
                name: 'Marcus Chen',
                role: 'Senior Developer',
                email: 'marcus.chen@innovationdynamics.com',
                type: 'technical',
                lastMeeting: '6 weeks ago',
                meetingStatus: 'recent',
                strategy: 'Maintain technical relationship and gather feedback on platform performance. Use as gateway to other technical team members.',
                updates: 'Day-to-day user with positive sentiment - can provide usage insights and expansion opportunities'
              },
              {
                id: 'contact-3',
                name: 'Position Open',
                role: 'Chief Financial Officer',
                email: 'cfo@innovationdynamics.com',
                type: 'executive',
                lastMeeting: 'Never met',
                meetingStatus: 'none',
                strategy: 'Critical gap - need to identify and establish relationship with financial decision maker for budget discussions and pricing negotiations.',
                updates: 'Missing critical financial stakeholder - high priority to identify and engage'
              }
            ],
          showActions: true
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Contact Strategy Demo",
      subtitle: "Innovation Dynamics Corp",
      icon: "🎯"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of contact strategy capabilities",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "contact-analysis",
        title: "Contact Analysis",
        description: "Explore contact structure and relationship tracking",
        status: "in-progress",
        workflowBranch: "display-contact-strategy",
        icon: "👥"
      },
      {
        id: "strategy-demo",
        title: "Strategy Demo",
        description: "See outreach recommendations and relationship management",
        status: "pending",
        workflowBranch: "contact-interaction",
        icon: "🎯"
      },
      {
        id: "features-review",
        title: "Features Review",
        description: "Learn about contact strategy capabilities",
        status: "pending",
        workflowBranch: "explain-features",
        icon: "⚙️"
      }
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 4,
      progressPercentage: 50,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};