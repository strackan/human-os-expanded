/**
 * Health Dashboard Slide
 *
 * Purpose: Display comprehensive customer health overview
 * Uses: HealthDashboard composite component
 *
 * This slide:
 * 1. Shows overall health score with visual indicator
 * 2. Displays key health metrics (usage, adoption, sentiment, etc.)
 * 3. Highlights risk factors and urgent actions
 * 4. Allows CSM to flag concerns before proceeding
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const healthDashboardSlide: UniversalSlideBuilder = (context): any => ({
  id: 'health-dashboard',
  version: '2',
  name: 'Customer Health Dashboard',
  category: 'renewal',
  checklistTitle: 'Review customer health metrics and risk factors',

  structure: {
    id: 'health-dashboard',
    title: 'Customer Health',
    description: 'Review customer health metrics and identify concerns',
    label: 'Health',
    stepMapping: 'health-dashboard',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Here's the health dashboard for **{{customer.name}}**.

Overall health score is **{{health.overallScore}}/100**. I've highlighted key metrics and any risk factors that need attention before the renewal conversation.`,
        buttons: [
          {
            label: 'Looks Good - Continue',
            value: 'continue',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'Flag Concerns',
            value: 'flag',
            'label-background': 'bg-yellow-500',
            'label-text': 'text-white',
          },
          {
            label: 'Request Deeper Analysis',
            value: 'analyze',
            'label-background': 'bg-blue-500',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'continue': 'continue',
          'flag': 'flag',
          'analyze': 'analyze',
        },
      },
      branches: {
        continue: {
          response: 'Great! The health metrics look stable. Moving to the next step.',
          actions: ['nextSlide'],
        },
        flag: {
          response: 'What concerns do you want to note about this customer\'s health? I\'ll factor these into our renewal strategy.',
          nextBranchOnText: 'store-concerns',
        },
        'store-concerns': {
          response: `I've noted your concerns: "{{user_input}}"

These will be considered in our pricing and renewal approach. Moving forward.`,
          storeAs: 'health.csmConcerns',
          actions: ['nextSlide'],
        },
        analyze: {
          response: `I can provide deeper analysis. What specific area would you like me to focus on?

• **Usage Trends** - Detailed usage patterns over time
• **Risk Factors** - Breakdown of churn risk indicators
• **Competitive Analysis** - How they compare to similar accounts`,
          nextBranchOnText: 'handle-analysis',
        },
        'handle-analysis': {
          response: 'I\'ll prepare that analysis. For now, let\'s continue with the workflow and I\'ll have that ready for our next conversation.',
          storeAs: 'health.analysisRequest',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Would you like to review any specific health metrics?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'health-dashboard',
          type: 'component',
          componentRef: 'artifact.health-dashboard',
          title: 'Health Dashboard',
          visible: true,
          data: {
            customerName: context?.variables?.customerName || '{{customer.name}}',
            overallHealth: context?.variables?.overallHealth || 0,
            metrics: context?.variables?.metrics || {
              usageGrowth: 0,
              featureAdoption: 0,
              userAdoption: { active: 0, total: 0 },
              supportTickets: { current: 0, trend: 'stable' },
              sentimentScore: 0,
              engagementTrend: 'stable',
            },
            riskFactors: context?.variables?.riskFactors || {
              churnRiskScore: 0,
              budgetPressure: 'none',
              competitiveThreat: 'none',
              contractDaysRemaining: 0,
            },
            usage: context?.variables?.usage || {
              lastLogin: '',
              activeFeatures: 0,
              totalFeatures: 0,
              userAdoptionRate: 0,
            },
            compact: false,
          },
        },
      ],
    },

    sidePanel: {
      enabled: true,
      title: {
        text: 'Workflow Progress',
        subtitle: 'Track your progress',
        icon: 'checklist',
      },
      steps: [],
      progressMeter: {
        currentStep: 0,
        totalSteps: 0,
        progressPercentage: 0,
        showPercentage: true,
        showStepNumbers: true,
      },
      showProgressMeter: true,
      showSteps: true,
    },

    onComplete: {
      nextSlide: undefined,
      updateProgress: true,
    },
  },
});
