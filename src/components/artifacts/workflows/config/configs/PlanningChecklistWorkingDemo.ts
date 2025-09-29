import { WorkflowConfig, WorkflowSlide } from '../WorkflowConfig';

// Working Planning Checklist Demo - Based on DynamicChatAI
export const planningChecklistWorkingDemo: WorkflowConfig = {
  customer: {
    name: 'Showcase Corp',
    nextCustomer: 'Demo Industries'
  },
  layout: {
    modalDimensions: { width: 85, height: 90, top: 5, left: 7.5 },
    dividerPosition: 55,
    chatWidth: 45,
    splitModeDefault: true,
    statsHeight: 45.3
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
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      referenceLineHeight: 12,
      data: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      chartMin: 0,
      chartMax: 20,
      chartContextLabel: '↗ +33% growth trend',
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
      referenceLineLabel: 'Budget Limit',
      referenceLineHeight: 18,
      data: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      chartMin: 10,
      chartMax: 25,
      chartContextLabel: '↗ Steady expansion',
      chartContextColor: 'text-purple-600',
      dataColors: { threshold: 18, belowColor: 'bg-purple-500', aboveColor: 'bg-orange-500' }
    }
  },
  slides: [
    {
      id: 'initial-planning',
      slideNumber: 1,
      title: 'Planning Checklist Demo',
      description: 'Interactive planning checklist demonstration',
      label: 'Planning Demo',
      stepMapping: 'initial-planning',
      chat: {
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
            response: "Perfect! Here's our **Renewal Planning Checklist** for Showcase Corp. Notice how it breaks down the renewal process into manageable, trackable steps.",
            delay: 1,
            actions: ['showArtifact', 'showMenu'],
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
            response: "Excellent! You can see how the progress bar updates in real-time as you check off items. The artifact tracks completion status and provides visual feedback.",
            delay: 1,
            buttons: [
              { label: 'Complete this demo', value: 'complete-workflow', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
            ],
            nextBranches: {
              'complete-workflow': 'workflow-complete'
            }
          },
          'features-explanation': {
            response: "**Key Planning Checklist Features:**\n\n✅ **Interactive Progress Tracking** - Visual progress bar updates in real-time\n✅ **Customizable Templates** - Pre-built templates for common workflows\n✅ **Action Buttons** - Integrated workflow actions\n✅ **State Management** - Persistent completion tracking\n\nReady to see it in action?",
            delay: 1,
            buttons: [
              { label: 'Show renewal checklist', value: 'show-renewal-checklist', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
            ],
            nextBranches: {
              'show-renewal-checklist': 'show-renewal-checklist'
            }
          },
          'workflow-complete': {
            response: "🎉 **Demo Complete!** \n\nYou've seen how the Planning Checklist artifact helps organize and track workflows with interactive progress tracking and real-time visual feedback.",
            delay: 1,
            actions: ['showFinalSlide'],
            buttons: [
              { label: 'Restart demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
            ]
          }
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
                { id: 'schedule-kickoff', label: 'Schedule renewal kickoff meeting', completed: false }
              ],
              showActions: true
            }
          }
        ]
      },
      sidePanel: {
        enabled: true,
        title: {
          text: "Planning Demo",
          subtitle: "Showcase Corp",
          icon: "✅"
        },
        steps: [
          {
            id: "demo-intro",
            title: "Demo Introduction",
            description: "Overview of planning features",
            status: "completed",
            workflowBranch: "initial-planning",
            icon: "👋"
          },
          {
            id: "explore-checklist",
            title: "Explore Checklist",
            description: "Review checklist templates",
            status: "in-progress",
            workflowBranch: "show-renewal-checklist",
            icon: "📋"
          }
        ],
        progressMeter: {
          currentStep: 1,
          totalSteps: 2,
          progressPercentage: 50,
          showPercentage: true,
          showStepNumbers: true
        },
        showProgressMeter: true,
        showSteps: true
      }
    }
  ]
};