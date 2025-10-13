import { WorkflowConfig } from '../WorkflowConfig';

export const planSummaryDemoConfig: WorkflowConfig = {
  customer: {
    name: 'Strategic Systems LLC',
    nextCustomer: 'Forward Thinking Inc'
  },
  layout: {
    modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
    dividerPosition: 60,
    chatWidth: 40,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$675,000',
        trend: 'up',
        trendValue: '+14%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$7.80',
        sublabel: '(88% value)',
        status: 'green',
        trend: 'Competitive pricing'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Oct 22, 2025',
        sublabel: '110 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Amanda Foster',
        role: 'VP of Operations'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1.8/10',
        status: 'green',
        sublabel: 'Excellent renewal prospect'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.9/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+14%',
        status: 'green',
        sublabel: 'Strong annual growth'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+2.1%',
        status: 'green',
        sublabel: 'Steady increase'
      }
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Execution Phase',
      confidence: 92,
      recommendedAction: 'Execute Growth Strategy',
      keyReasons: [
        { category: 'Relationship', detail: 'Strong executive sponsorship and frequent communication' },
        { category: 'Usage', detail: 'Platform adoption exceeding license capacity - natural expansion opportunity' },
        { category: 'Value', detail: 'Documented business impact with 40% operational efficiency gains' },
        { category: 'Timeline', detail: '110 days to renewal with clear implementation roadmap' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about plan summaries, workflow tracking, or project management...',
    aiGreeting: "Welcome to the Plan Summary Demo! I'll show you how our plan summary artifact helps CSMs track and communicate workflow progress.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about plan summary features.",
      initialMessage: {
        text: "Welcome to the **Plan Summary Demo**! 📋\\n\\nThis demo showcases how our plan summary artifact helps CSMs track workflow progress, communicate status to stakeholders, and manage complex implementation projects. Strategic Systems LLC has an excellent renewal opportunity with clear expansion potential.\\n\\nWhat would you like to explore?",
        buttons: [
          { label: 'View workflow summary', value: 'show-summary', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Learn summary features', value: 'summary-features', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'show-summary': 'display-plan-summary',
          'summary-features': 'explain-features'
        }
      },
      branches: {
        'display-plan-summary': {
          response: "Here's the **Workflow Summary** for Strategic Systems LLC. Notice how it shows completed tasks, pending actions, and next steps with clear progress tracking and stakeholder communication.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'workflow-plan-summary',
          buttons: [
            { label: 'Show complex example', value: 'show-complex', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Explore summary features', value: 'summary-interaction', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ],
          nextBranches: {
            'show-complex': 'display-complex-summary',
            'summary-interaction': 'summary-interaction',
            'complete-demo': 'demo-complete'
          }
        },
        'display-complex-summary': {
          response: "Here's a **Complex Multi-Phase Implementation Summary** for Enterprise Corp. This shows how the artifact handles larger, more complex workflows with multiple phases and stakeholder groups.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'complex-plan-summary',
          buttons: [
            { label: 'Compare with simple example', value: 'show-summary', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Analyze complexity factors', value: 'complexity-analysis', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-summary': 'display-plan-summary',
            'complexity-analysis': 'analyze-complexity',
            'complete-demo': 'demo-complete'
          }
        },
        'analyze-complexity': {
          response: "**Complex Workflow Analysis:**\\n\\n🏗️ **Multi-Phase Structure** - Breaking large implementations into manageable phases\\n📊 **Progress Tracking** - Real-time visibility into completion rates and milestones\\n👥 **Stakeholder Management** - Coordinating across multiple business units and teams\\n⚡ **Risk Mitigation** - Early identification and resolution of blockers\\n📈 **Success Metrics** - Quantifiable outcomes and business impact measurement",
          delay: 1,
          buttons: [
            { label: 'View complex example', value: 'show-complex', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-complex': 'display-complex-summary',
            'complete-demo': 'demo-complete'
          }
        },
        'summary-interaction': {
          response: "Excellent! You can see how the plan summary artifact provides comprehensive workflow visibility. The summary includes progress tracking, task management, stakeholder updates, and strategic recommendations to help CSMs communicate value and maintain momentum.",
          delay: 1,
          buttons: [
            { label: 'Show complex example', value: 'show-complex', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete this demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-complex': 'display-complex-summary',
            'complete-demo': 'demo-complete'
          }
        },
        'explain-features': {
          response: "**Plan Summary Artifact Features:**\\n\\n📋 **Progress Tracking** - Visual progress indicators and completion percentages\\n✅ **Task Management** - Completed, pending, and next step organization\\n👥 **Stakeholder Updates** - Clear communication of status and blockers\\n📊 **Key Metrics** - ARR, growth rates, and success measurements\\n💡 **Recommendations** - AI-powered suggestions for next actions\\n🎯 **Project Phases** - Multi-stage workflow organization\\n📈 **Success Tracking** - Quantifiable outcomes and business impact",
          delay: 1,
          buttons: [
            { label: 'See it in action', value: 'show-summary', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'show-summary': 'display-plan-summary'
          }
        },
        'demo-complete': {
          response: "🎉 **Plan Summary Demo Complete!**\\n\\nYou've explored how the Plan Summary artifact helps manage complex workflows:\\n\\n• **Progress Visualization** - Clear tracking of completion and milestones\\n• **Task Organization** - Structured view of completed and pending work\\n• **Stakeholder Communication** - Professional summaries for executive updates\\n• **Strategic Planning** - Recommendations and next steps\\n• **Complex Project Support** - Multi-phase implementation tracking\\n• **Success Metrics** - Quantifiable business impact measurement\\n\\nThis artifact is essential for maintaining momentum and demonstrating value throughout the customer lifecycle!",
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
        id: 'workflow-plan-summary',
        title: 'Strategic Systems LLC - Renewal Planning Summary',
        type: 'plan-summary',
        visible: false,
        content: {
          customerName: 'Strategic Systems LLC',
          workflowType: 'Renewal Planning',
          currentStage: 'Planning Complete - Ready for Execution',
          progressPercentage: 85,
          startDate: 'November 15, 2024',
          lastUpdated: 'December 27, 2024',
          completedTasks: [
            {
              id: 'task-1',
              title: 'Stakeholder Discovery & Mapping',
              description: 'Identified all key decision makers across technical, financial, and executive teams',
              completedDate: 'November 22, 2024',
              owner: 'Sarah Chen, CSM',
              status: 'completed'
            },
            {
              id: 'task-2',
              title: 'Business Value Assessment',
              description: 'Documented 40% operational efficiency gains and ROI analysis with finance team',
              completedDate: 'December 5, 2024',
              owner: 'Michael Torres, Solutions Engineer',
              status: 'completed'
            },
            {
              id: 'task-3',
              title: 'Technical Readiness Review',
              description: 'Platform health check, usage analysis, and capacity planning for expansion',
              completedDate: 'December 18, 2024',
              owner: 'Alex Kim, Technical Success Manager',
              status: 'completed'
            }
          ],
          pendingTasks: [
            {
              id: 'task-4',
              title: 'Executive Presentation Preparation',
              description: 'Create board-ready success showcase highlighting business impact and future roadmap',
              dueDate: 'January 8, 2025',
              owner: 'Sarah Chen, CSM',
              status: 'in-progress',
              priority: 'high'
            },
            {
              id: 'task-5',
              title: 'Contract Terms Negotiation',
              description: 'Finalize pricing, SLA terms, and expansion seat allocation with legal and procurement',
              dueDate: 'January 15, 2025',
              owner: 'David Park, Account Executive',
              status: 'pending',
              priority: 'high'
            }
          ],
          nextSteps: [
            'Schedule executive presentation for January 10th board meeting',
            'Coordinate with legal team for expedited contract processing',
            'Plan technical onboarding for additional 120 seats',
            'Establish quarterly business review cadence for ongoing partnership'
          ],
          keyMetrics: {
            currentARR: '$675,000',
            projectedARR: '$945,000',
            growthRate: '+40%',
            riskScore: '1.8/10'
          },
          stakeholders: [
            { name: 'Amanda Foster', role: 'VP Operations', engagement: 'champion' },
            { name: 'Robert Kim', role: 'CTO', engagement: 'supporter' },
            { name: 'Lisa Chen', role: 'CFO', engagement: 'neutral' }
          ],
          recommendations: [
            'Prioritize executive presentation scheduling - high stakeholder availability in early January',
            'Consider expedited contract processing to meet Q1 expansion targets',
            'Plan technical capacity increase to support projected 40% growth',
            'Establish quarterly business review cadence for ongoing relationship management'
          ]
        }
      },
      {
        id: 'complex-plan-summary',
        title: 'Enterprise Corp - Multi-Phase Implementation Summary',
        type: 'plan-summary',
        visible: false,
        content: {
          customerName: 'Enterprise Corp',
          workflowType: 'Multi-Phase Enterprise Implementation',
          currentStage: 'Phase 2 - Integration & Expansion',
          progressPercentage: 68,
          startDate: 'September 1, 2024',
          lastUpdated: 'December 27, 2024',
          completedTasks: [
            {
              id: 'task-1',
              title: 'Phase 1: Foundation Setup Complete',
              description: 'Core platform deployment across 3 business units with full user onboarding',
              completedDate: 'October 15, 2024',
              owner: 'Jennifer Walsh, Implementation Manager',
              status: 'completed'
            },
            {
              id: 'task-2',
              title: 'Security & Compliance Certification',
              description: 'SOC2 Type II compliance validation and security audit completion',
              completedDate: 'November 8, 2024',
              owner: 'Marcus Chen, Security Specialist',
              status: 'completed'
            },
            {
              id: 'task-3',
              title: 'Initial Integration Wave (HR & Finance)',
              description: 'Successfully integrated platform with Workday and Salesforce systems',
              completedDate: 'December 3, 2024',
              owner: 'Sarah Johnson, Technical Lead',
              status: 'completed'
            }
          ],
          pendingTasks: [
            {
              id: 'task-4',
              title: 'Manufacturing Division Onboarding',
              description: 'Deploy platform to 1,200 manufacturing users across 12 facilities',
              dueDate: 'January 20, 2025',
              owner: 'David Liu, Implementation Specialist',
              status: 'in-progress',
              priority: 'high'
            },
            {
              id: 'task-5',
              title: 'API Gateway Implementation',
              description: 'Deploy enterprise API gateway for third-party system integrations',
              dueDate: 'February 5, 2025',
              owner: 'Marcus Chen, Technical Architect',
              status: 'pending',
              priority: 'medium'
            },
            {
              id: 'task-6',
              title: 'Global Rollout Planning (Phase 3)',
              description: 'Plan deployment across European and APAC operations',
              dueDate: 'February 15, 2025',
              owner: 'Jennifer Walsh, Program Manager',
              status: 'pending',
              priority: 'medium'
            }
          ],
          nextSteps: [
            'Complete manufacturing division change management workshops',
            'Execute API gateway pilot testing with IT infrastructure team',
            'Begin Phase 3 planning workshops for international expansion',
            'Establish center of excellence team for ongoing platform optimization'
          ],
          keyMetrics: {
            currentARR: '$2,400,000',
            projectedARR: '$4,200,000',
            growthRate: '+75%',
            riskScore: '3.2/10'
          },
          stakeholders: [
            { name: 'Patricia Williams', role: 'Chief Operating Officer', engagement: 'champion' },
            { name: 'James Rodriguez', role: 'CTO', engagement: 'champion' },
            { name: 'Angela Thompson', role: 'VP Manufacturing', engagement: 'supporter' },
            { name: 'Robert Chang', role: 'CFO', engagement: 'neutral' }
          ],
          recommendations: [
            'Consider additional investment in change management for manufacturing division onboarding',
            'Prioritize API gateway implementation to support planned third-party integrations',
            'Establish center of excellence to scale best practices across global operations',
            'Plan executive success showcase to demonstrate value to board and expand executive sponsorship'
          ]
        }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Plan Summary Demo",
      subtitle: "Strategic Systems LLC",
      icon: "📋"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of plan summary capabilities",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "summary-analysis",
        title: "Summary Analysis",
        description: "Explore workflow tracking and progress visualization",
        status: "in-progress",
        workflowBranch: "display-plan-summary",
        icon: "📊"
      },
      {
        id: "complex-demo",
        title: "Complex Implementation",
        description: "See multi-phase project management",
        status: "pending",
        workflowBranch: "display-complex-summary",
        icon: "🏗️"
      },
      {
        id: "features-review",
        title: "Features Review",
        description: "Learn about plan summary capabilities",
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