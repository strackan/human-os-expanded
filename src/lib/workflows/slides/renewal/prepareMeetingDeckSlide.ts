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
  // Check if we should show template setup mode (no templates available)
  // This will be determined by the artifact component at runtime
  const requiresTemplateSetup = context?.variables?.requiresTemplateSetup ?? true; // Default to true until templates exist

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
        initialMessage: requiresTemplateSetup
          ? {
              // No template available - prompt to create one
              text: `Before we can generate a meeting deck for {{customer.name}}, you'll need to set up a presentation template.\n\nTemplates are created from your company's existing PowerPoint decks, ensuring your presentations match your brand guidelines.\n\nWould you like to set up a template now?`,
              buttons: [
                {
                  label: 'Set Up Template',
                  value: 'setup-template',
                  'label-background': 'bg-purple-600',
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
                'setup-template': 'template-coming-soon',
                'skip': 'skip-deck',
              },
            }
          : {
              // Template exists - can generate deck
              text: `I'm ready to prepare a meeting deck for {{customer.name}} based on our analysis.\n\nThis will include:\n• Account overview and health metrics\n• Performance highlights\n• Renewal proposal\n• Discussion points\n\nWould you like me to generate the deck now?`,
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
          'template-coming-soon': {
            response: '**Coming Soon!**\n\nPresentation template creation is currently in development. Soon you\'ll be able to upload your company\'s PowerPoint decks and we\'ll automatically extract the styling, layouts, and branding to use for generating future presentations.\n\nFor now, let\'s continue with the workflow.',
            buttons: [
              {
                label: 'Continue',
                value: 'continue-after-template',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'continue-after-template': 'skip-deck',
            },
          },
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
