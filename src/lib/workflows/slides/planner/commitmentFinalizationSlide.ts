/**
 * Commitment Finalization Slide
 *
 * Lock in the weekly plan:
 * - Review all commitments
 * - Force focus on top 3-5 priorities
 * - Generate calendar events
 * - Set up check-ins
 */

import {
  SlideBuilder,
  SlideDefinition,
  SlideContext,
  createSlideBuilder,
} from '../baseSlide';

export const commitmentFinalizationSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'commitment-finalization',
    name: 'Lock In Commitments',
    category: 'planner',
    description: 'Finalize your weekly commitments',
    estimatedMinutes: 2,
    requiredFields: ['scheduled_tasks'],
    optionalFields: [],
    tags: ['commitment', 'finalization'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const maxPriorities = context?.variables?.maxPriorities || 5;
    const generateCalendarEvents = context?.variables?.generateCalendarEvents !== false;
    const setupCheckIns = context?.variables?.setupCheckIns !== false;

    return {
      id: 'commitment-finalization',
      title: 'Final Commitments',
      description: 'Lock in your weekly plan',
      label: 'Commit',
      stepMapping: 'finalization',

      chat: {
        initialMessage: {
          text: `You have {{scheduled_tasks.length}} tasks scheduled for the week.

To stay focused, let's identify your **top ${maxPriorities} priorities**.

These are the must-dos - everything else is bonus.

**What are your top ${maxPriorities} priorities for the week?**

Review your schedule and pick the most important ones.`,
          buttons: [
            {
              label: 'Review Schedule',
              value: 'review',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white'
            }
          ],
          nextBranches: {
            'review': 'select-priorities',
          }
        },

        branches: {
          'select-priorities': {
            response: `Select your top ${maxPriorities} from the list, or tell me which ones matter most.`,
            storeAs: 'top_priorities',
            nextBranchOnText: 'confirm-commitments',
          },

          'confirm-commitments': {
            response: `Perfect! Your top ${maxPriorities} priorities:

{{#each top_priorities}}
{{inc @index}}. **{{this.title}}**${generateCalendarEvents ? ' - {{this.scheduled_time}}' : ''}
{{/each}}

${generateCalendarEvents ? `
I'll create calendar events for all scheduled tasks.
` : ''}

${setupCheckIns ? `
I'll check in with you:
• Daily: Quick morning prompt
• Mid-week: Progress check (Wednesday)
• End of week: Reflection reminder (Sunday)
` : ''}

**Ready to commit to this plan?**`,
            buttons: [
              {
                label: 'Commit to This Week',
                value: 'commit',
                'label-background': 'bg-green-600',
                'label-text': 'text-white'
              },
              {
                label: 'Make Changes',
                value: 'adjust',
                'label-background': 'bg-gray-600',
                'label-text': 'text-white'
              }
            ],
            nextBranches: {
              'commit': 'finalize',
              'adjust': 'back-to-planning',
            }
          },

          'back-to-planning': {
            response: 'No problem! Let\'s adjust your plan.',
            actions: ['previousSlide'],
          },

          'finalize': {
            response: `✅ **Committed!**

Your weekly plan is locked in.

${generateCalendarEvents ? `Calendar events created for all scheduled tasks.` : ''}
${setupCheckIns ? `Check-ins scheduled - I'll keep you on track!` : ''}

Let me show you the final plan...`,
            delay: 1,
            actions: [
              'saveCommitments',
              generateCalendarEvents ? 'createCalendarEvents' : null,
              setupCheckIns ? 'scheduleCheckIns' : null,
              'nextSlide'
            ].filter(Boolean),
          }
        }
      },

      artifacts: {
        sections: [
          {
            id: 'priority-selector',
            title: 'Select Top Priorities',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'PrioritySelectorArtifact',
              props: {
                maxSelections: maxPriorities,
                showScheduledTime: generateCalendarEvents,
                showEstimatedDuration: true,
              }
            }
          }
        ]
      }
    };
  }
);
