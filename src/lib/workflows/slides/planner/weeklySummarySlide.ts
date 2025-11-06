/**
 * Weekly Summary Slide
 *
 * Show the final plan with all artifacts:
 * - Weekly calendar view
 * - Focus document (top 3-5 priorities)
 * - Workload dashboard
 * - Schedule next planning session
 */

import {
  SlideBuilder,
  SlideDefinition,
  SlideContext,
  createSlideBuilder,
} from '../baseSlide';

export const weeklySummarySlide: SlideBuilder = createSlideBuilder(
  {
    id: 'weekly-summary',
    name: 'Weekly Plan Summary',
    category: 'planner',
    description: 'Display final weekly plan and artifacts',
    estimatedMinutes: 2,
    requiredFields: ['scheduled_tasks', 'top_priorities'],
    optionalFields: [],
    tags: ['summary', 'completion', 'artifacts'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const showArtifacts = context?.variables?.showArtifacts !== false;
    const artifactTypes = context?.variables?.artifactTypes || ['weekly-plan', 'focus-document'];
    const scheduleNextPlanning = context?.variables?.scheduleNextPlanning !== false;

    return {
      id: 'weekly-summary',
      title: 'Your Week is Planned!',
      description: 'Review your final weekly plan',
      label: 'Summary',
      stepMapping: 'summary',

      chat: {
        initialMessage: {
          text: `🎉 **Your week is planned!**

Here's your plan summary:

📊 **Commitments:**
• {{top_priorities.length}} top priorities
• {{scheduled_tasks.length}} total tasks scheduled
• {{total_scheduled_hours}} hours allocated

📅 **Schedule:**
• {{days_with_tasks}} days have scheduled work
• {{focus_blocks_used}} focus blocks utilized
• {{meetings_count}} meetings

⚡ **Energy Optimization:**
• Deep work scheduled in high-energy times
• Meetings grouped in afternoons
• Buffer time respected

${scheduleNextPlanning ? `
📆 **Next Planning:**
Sunday, {{next_planning_date}} at {{next_planning_time}}
` : ''}

${showArtifacts ? `
**Explore the artifacts on the right** →
• Weekly calendar view
• Focus document
• Workload dashboard
` : ''}

Ready to crush this week?`,
          buttons: [
            {
              label: 'Let\'s Do This!',
              value: 'complete',
              'label-background': 'bg-green-600',
              'label-text': 'text-white'
            },
            {
              label: 'Export to Excel',
              value: 'export',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white'
            }
          ],
          nextBranches: {
            'complete': 'workflow-complete',
            'export': 'generate-excel',
          }
        },

        branches: {
          'generate-excel': {
            response: `Generating Excel export...

Your weekly plan spreadsheet is ready!

It includes:
• Day-by-day breakdown
• Task list with times
• Priority matrix
• Goal progress tracking

Download started.`,
            actions: ['exportToExcel'],
            delay: 2,
            nextBranchOnText: 'workflow-complete',
          },

          'workflow-complete': {
            response: `Have a great week! I'll check in with you soon.

Remember:
• Focus on your top {{top_priorities.length}} priorities
• Be flexible if things change
• Celebrate progress, not just completion

See you at the mid-week check-in! 👋`,
            actions: ['completeWorkflow', 'showConfetti'],
          }
        }
      },

      artifacts: {
        sections: [
          artifactTypes.includes('weekly-plan') ? {
            id: 'weekly-plan-calendar',
            title: 'Weekly Plan',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'WeeklyPlanArtifact',
              props: {
                showDayByDay: true,
                showTimeBlocks: true,
                highlightPriorities: true,
                showProgressIndicators: false, // Not started yet
              }
            }
          } : null,
          artifactTypes.includes('focus-document') ? {
            id: 'focus-document',
            title: 'Focus Document',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'FocusDocumentArtifact',
              props: {
                priorities: '{{top_priorities}}',
                showSuccessCriteria: true,
                showContext: true,
              }
            }
          } : null,
          artifactTypes.includes('workload-dashboard') ? {
            id: 'workload-dashboard',
            title: 'Customer Timeline',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'WorkloadDashboardArtifact',
              props: {
                showCustomerTimeline: true,
                showRenewalDates: true,
                showRiskIndicators: true,
              }
            }
          } : null,
        ].filter(Boolean)
      },

      // Post-completion actions
      completion: {
        actions: [
          scheduleNextPlanning ? 'scheduleNextWeeklyPlanning' : null,
          'sendSummaryEmail',
          'updateRecurringWorkflow',
        ].filter(Boolean),
      }
    };
  }
);
