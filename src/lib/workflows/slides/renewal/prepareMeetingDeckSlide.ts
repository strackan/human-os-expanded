/**
 * Prepare Meeting Deck Slide
 *
 * Purpose: Generate a meeting deck based on prior workflow conversation
 * Used in: Renewal workflows
 *
 * This slide:
 * - Checks if presentation templates exist for the customer/company
 * - If no templates: prompts user to create one first
 * - If templates exist: allows generating a deck from the template
 *
 * Template check is done via the artifact component which calls the API.
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const prepareMeetingDeckSlide: UniversalSlideBuilder = (context): any => {
  return {
    id: 'prepare-meeting-deck',
    version: '2',
    name: 'Prepare Meeting Deck',
    category: 'renewal',
    checklistTitle: 'Prepare meeting deck for customer',
    isPresentationSlide: true, // Flag for presentation-related slides

    structure: {
      id: 'prepare-meeting-deck',
      title: 'Meeting Deck Preparation',
      description: 'Generate a meeting deck based on our analysis',
      label: 'Deck',
      stepMapping: 'prepare-meeting-deck',
      showSideMenu: true,

      chat: {
        generateInitialMessage: false,
        initialMessage: {
          text: `Here's your meeting deck for **{{customer.name}}**. I've compiled the key insights from our analysis into a presentation you can use for the renewal conversation.\n\nReview the deck on the right and let me know when you're ready to continue.`,
          buttons: [
            {
              label: 'Looks Good →',
              value: 'continue',
              'label-background': 'bg-green-600 hover:bg-green-700',
              'label-text': 'text-white',
            },
            {
              label: 'Edit Deck',
              value: 'edit',
              'label-background': 'bg-gray-100 hover:bg-gray-200',
              'label-text': 'text-gray-700',
            },
          ],
          nextBranches: {
            continue: 'proceed',
            edit: 'edit-deck',
          },
        },
        branches: {
          proceed: {
            response: 'Great! Moving on to schedule the meeting.',
            actions: ['nextSlide'],
          },
          'edit-deck': {
            response: 'You can customize the deck using the editor on the right. Click Looks Good when ready.',
            actions: ['nextSlide'],
          },
        },
        defaultMessage: 'Review the meeting deck and continue when ready.',
        userTriggers: {},
      },

      artifacts: {
        sections: [
          {
            id: 'presentation-template-status',
            type: 'component:informative',
            title: 'Presentation Templates',
            visible: true,
            data: {
              componentType: 'PresentationTemplateStatusArtifact',
              props: {
                customerId: '{{customer.id}}',
                companyId: context?.variables?.companyId,
                onTemplateSetup: 'setup-template',
              },
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
  };
};
