import { WorkflowConfig } from '../WorkflowConfig';

// Fixed version using proven DynamicAiV2Baseline as foundation
export const planningChecklistDemoConfig: WorkflowConfig = {
  customer: {
    name: 'Showcase Corp',
    nextCustomer: 'Demo Industries'
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
        value: '$750,000',
        trend: 'up',
        trendValue: '+18%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$8.50',
        sublabel: '(92% value)',
        status: 'green',
        trend: 'Above market average'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'May 15, 2025',
        sublabel: '75 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Sarah Johnson',
        role: 'VP of Technology'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.8/10',
        status: 'green',
        sublabel: 'Low risk renewal'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.5/10',
        status: 'green',
        sublabel: 'High expansion potential'
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
      renewalStage: 'Planning Phase',
      confidence: 85,
      recommendedAction: 'Execute Planning Checklist',
      keyReasons: [
        { category: 'Growth', detail: '28% YoY growth indicates strong value realization' },
        { category: 'Usage', detail: 'Approaching license capacity - expansion opportunity' },
        { category: 'Relationship', detail: 'Strong relationship with technical leadership' },
        { category: 'Timeline', detail: '75 days to renewal - optimal planning window' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about the planning process or select an option...',
    aiGreeting: "Welcome to the Planning Checklist Demo! I'll walk you through how our planning artifacts help organize renewal workflows.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about the planning checklist features.",
      initialMessage: {
        text: "Welcome to the **Planning Checklist Demo**! 🎯\n\nThis demo showcases how our planning checklist artifact helps CSMs organize and track renewal workflows. Showcase Corp has 75 days until renewal with strong growth metrics.\n\nWhat would you like to explore?",
        buttons: [
          { label: 'Start renewal planning', value: 'start-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'View checklist features', value: 'features-tour', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'start-planning': 'show-renewal-checklist',
          'features-tour': 'features-explanation'
        }
      },
      branches: {
        'show-renewal-checklist': {
          response: "Perfect! Here's our **Renewal Planning Checklist** for Showcase Corp. Notice how it breaks down the renewal process into manageable, trackable steps with a visual progress indicator.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'renewal-planning-checklist',
          buttons: [
            { label: 'Check off some items', value: 'interact-checklist', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-workflow', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'interact-checklist': 'checklist-interaction',
            'complete-workflow': 'workflow-complete'
          }
        },
        'checklist-interaction': {
          response: "Excellent! You can see how the progress bar updates in real-time as you check off items. The artifact tracks completion status and provides visual feedback. This helps CSMs stay organized and ensures nothing falls through the cracks.",
          delay: 1,
          buttons: [
            { label: 'Complete this demo', value: 'complete-workflow', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'complete-workflow': 'workflow-complete'
          }
        },
        'features-explanation': {
          response: "**Key Planning Checklist Features:**\n\n✅ **Interactive Progress Tracking** - Visual progress bar updates in real-time\n✅ **Customizable Templates** - Pre-built templates for common workflows\n✅ **Action Buttons** - Integrated workflow actions (Let's Do It!, Not Yet, Go Back)\n✅ **State Management** - Persistent completion tracking\n✅ **Visual Feedback** - Strikethrough completed items, color-coded status\n\nReady to see these in action?",
          delay: 1,
          buttons: [
            { label: 'Show renewal checklist', value: 'show-renewal-checklist', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'show-renewal-checklist': 'show-renewal-checklist'
          }
        },
        'workflow-complete': {
          response: "🎉 **Demo Complete!** \n\nYou've seen how the Planning Checklist artifact helps organize and track workflows with:\n\n• Interactive progress tracking\n• Real-time visual feedback\n• Customizable action items\n• State management\n\nThis artifact is excellent for keeping renewal processes organized and ensuring nothing gets missed!",
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
        id: 'renewal-planning-checklist',
        title: 'Renewal Planning Checklist',
        type: 'planning-checklist',
        visible: false,
        content: {
          description: "Let's systematically prepare for Showcase Corp's renewal:",
          items: [
            { id: 'review-contract', label: 'Review current contract terms and conditions', completed: false },
            { id: 'analyze-usage', label: 'Analyze usage patterns and growth trends', completed: false },
            { id: 'set-target-price', label: 'Set renewal target price and expansion opportunities', completed: false },
            { id: 'confirm-contacts', label: 'Confirm decision makers and influencers', completed: false },
            { id: 'prepare-materials', label: 'Prepare renewal presentation materials', completed: false },
            { id: 'schedule-kickoff', label: 'Schedule renewal kickoff meeting', completed: false },
            { id: 'send-notice', label: 'Send formal renewal notice with timeline', completed: false }
          ],
          showActions: true
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Planning Checklist Demo",
      subtitle: "Showcase Corp Account",
      icon: "✅"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of planning checklist features",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "explore-checklists",
        title: "Explore Checklists",
        description: "Review different checklist templates",
        status: "in-progress",
        workflowBranch: "show-renewal-checklist",
        icon: "📋"
      },
      {
        id: "interactive-demo",
        title: "Interactive Demo",
        description: "Try checking off items and see progress tracking",
        status: "pending",
        workflowBranch: "checklist-interaction",
        icon: "✅"
      },
      {
        id: "features-review",
        title: "Features Review",
        description: "Learn about customization and advanced features",
        status: "pending",
        workflowBranch: "features-explanation",
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