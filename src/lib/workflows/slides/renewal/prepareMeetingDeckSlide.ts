/**
 * Prepare Meeting Deck Slide (Placeholder)
 *
 * Purpose: Generate a meeting deck based on prior workflow conversation
 * Used in: Renewal workflows
 *
 * This slide should eventually:
 * - Compile insights from previous slides
 * - Generate a presentation deck autonomously
 * - Allow user to review/edit before finalizing
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const prepareMeetingDeckSlide: UniversalSlideBuilder = (context): any => ({
  id: 'prepare-meeting-deck',
  version: '1',
  name: 'Prepare Meeting Deck',
  category: 'renewal',
  checklistTitle: 'Prepare meeting deck for customer',

  structure: {
    id: 'prepare-meeting-deck',
    title: 'Meeting Deck Preparation',
    description: 'Generate a meeting deck based on our analysis',
    label: 'Deck',
    stepMapping: 'prepare-meeting-deck',
    showSideMenu: true,

    chat: {
      generateInitialMessage: true,
      initialMessage: {
        text: context?.variables?.message ||
          `I'm preparing a meeting deck for {{customer.name}} based on our analysis.\n\nThis will include:\n• Account overview and health metrics\n• Performance highlights\n• Renewal proposal\n• Discussion points\n\nWould you like me to generate the deck now?`,
        buttons: [
          {
            label: 'Generate Deck',
            value: 'generate',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
          {
            label: 'Skip for Now',
            value: 'skip',
            'label-background': 'bg-gray-500',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'generate': 'generating',
          'skip': 'skip-deck',
        },
      },
      branches: {
        'generating': {
          response: 'Generating your meeting deck... This feature is coming soon! For now, let\'s move on to scheduling the meeting.',
          actions: ['nextSlide'],
        },
        'skip-deck': {
          response: 'No problem! You can always create the deck later. Let\'s schedule the meeting.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Would you like to generate a meeting deck?',
      userTriggers: {},
    },

    artifacts: {
      sections: [],
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
