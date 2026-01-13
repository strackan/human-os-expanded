/**
 * Align on Strategy Slide (Placeholder)
 *
 * Purpose: Interactive slide to confirm 90-day engagement strategy
 * Used in: Renewal workflows
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const alignStrategySlide: UniversalSlideBuilder = (context): any => ({
  id: 'align-strategy',
  version: '1',
  name: 'Align on Strategy',
  category: 'renewal',
  checklistTitle: 'Align on 90-day engagement strategy',

  structure: {
    id: 'align-strategy',
    title: 'Engagement Strategy',
    description: 'Confirm your 90-day renewal engagement strategy',
    label: 'Strategy',
    stepMapping: 'align-strategy',
    showSideMenu: true,

    chat: {
      generateInitialMessage: true,
      initialMessage: {
        text: context?.variables?.message ||
          `Based on what we've reviewed, let's confirm the engagement strategy for {{customer.name}}.\n\nWhat approach should we take for this renewal?`,
        buttons: [
          {
            label: 'Standard Renewal',
            value: 'standard',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
          {
            label: 'Expansion Play',
            value: 'expansion',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'At-Risk Recovery',
            value: 'at-risk',
            'label-background': 'bg-orange-600',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'standard': 'confirm-standard',
          'expansion': 'confirm-expansion',
          'at-risk': 'confirm-at-risk',
        },
      },
      branches: {
        'confirm-standard': {
          response: 'Great choice! A standard renewal approach focuses on maintaining the relationship and ensuring a smooth renewal process. Ready to prepare the meeting deck?',
          actions: ['nextSlide'],
        },
        'confirm-expansion': {
          response: 'Excellent! An expansion play will help us grow the account. We\'ll prepare materials highlighting the value of additional seats/features. Ready to build the deck?',
          actions: ['nextSlide'],
        },
        'confirm-at-risk': {
          response: 'Understood. We\'ll take a careful approach focusing on addressing concerns and demonstrating value. Let\'s prepare recovery-focused materials.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Please select a strategy to proceed.',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'strategy-options',
          type: 'document' as const,
          title: 'Strategy Options',
          visible: true,
          content: `# Renewal Strategy Options

## Standard Renewal
Focus on maintaining the relationship and ensuring a smooth renewal process.
- Highlight ongoing value delivery
- Review contract terms
- Confirm pricing

## Expansion Play
Position for account growth and additional value.
- Present usage trends showing potential for growth
- Propose additional seats or features
- Demonstrate ROI of expanded investment

## At-Risk Recovery
Address concerns and reinforce value proposition.
- Acknowledge any challenges
- Present remediation plan
- Offer concessions if needed
`,
          editable: false,
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
