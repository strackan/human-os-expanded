/**
 * Context Gathering Workload Slide - THE KEY INTEGRATION
 *
 * This slide is what makes the weekly planner magical:
 * - Automatically surfaces snoozed workflows
 * - Shows upcoming customer renewals
 * - Identifies high-priority customers (risk + opportunity)
 * - Lists incomplete workflow tasks
 * - Calculates estimated time needed
 *
 * User doesn't start from scratch - Renubu tells them what needs attention!
 */

import {
  SlideBuilder,
  SlideDefinition,
  SlideContext,
  createSlideBuilder,
  applyContextVariables,
} from '../baseSlide';

export const contextGatheringWorkloadSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'context-gathering-workload',
    name: 'Week Context & Workload',
    category: 'planner',
    description: 'Surface existing work commitments and analyze workload',
    estimatedMinutes: 3,
    requiredFields: [],
    optionalFields: ['week_start_date'],
    tags: ['planning', 'workload', 'context'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    // Configuration from context
    const renewalWindowDays = context?.variables?.renewalWindowDays || 60;
    const includeSnoozed = context?.variables?.includeSnoozed !== false;
    const includePriorities = context?.variables?.includePriorities !== false;
    const includeIncompleteTasks = context?.variables?.includeIncompleteTasks !== false;

    return {
      id: 'context-gathering-workload',
      title: 'Week Context & Workload',
      description: 'Let me pull your work commitments for the upcoming week',
      label: 'Context',
      stepMapping: 'context-gathering',

      chat: {
        initialMessage: {
          text: `Let me analyze your upcoming workload...

I'm checking:
${includeSnoozed ? '📋 Snoozed workflows and tasks' : ''}
${includePriorities ? '🚨 Customer priorities (renewals, risk, opportunities)' : ''}
${includeIncompleteTasks ? '📊 Incomplete workflow actions' : ''}
📅 Calendar analysis

One moment...`,
          buttons: [
            {
              label: 'Analyze Workload',
              value: 'analyze',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white'
            }
          ],
          nextBranches: {
            'analyze': 'show-workload',
          }
        },

        branches: {
          'show-workload': {
            // This will be populated by the frontend with actual workload data
            // The frontend calls WorkloadAnalysisService.getUpcomingWorkload()
            response: `Here's what I found:

📋 **SNOOZED TASKS** ({{workload.snoozed.length}})
{{#each workload.snoozed}}
• {{customer_name}} - {{workflow_name}}{{#if days_snoozed}} (snoozed {{days_snoozed}} days ago){{/if}}
{{/each}}
{{#if workload.snoozed.length 0}}No snoozed tasks{{/if}}

🚨 **CUSTOMER PRIORITIES** ({{workload.renewals.length}})
{{#each workload.renewals}}
• {{customer_name}} - Renewal in {{days_until_renewal}} days (${'{{current_arr}}'})
{{/each}}
{{#if workload.priorities.length}}
{{#each workload.priorities}}
• {{customer_name}} - {{reason}}
{{/each}}
{{/if}}
{{#if (and (eq workload.renewals.length 0) (eq workload.priorities.length 0))}}No urgent customer priorities{{/if}}

📊 **INCOMPLETE WORKFLOWS** ({{workload.incomplete.length}})
{{#each workload.incomplete}}
• {{#if customer_name}}{{customer_name}} - {{/if}}{{description}} ({{task_status}})
{{/each}}
{{#if (eq workload.incomplete.length 0)}}All workflows up to date!{{/if}}

📈 **WORKLOAD SUMMARY**
• Total items: {{workload.summary.total_items}}
• Estimated time: {{workload.summary.estimated_hours}} hours
• {{workload.summary.customer_count}} customers need attention

**Which items should we prioritize this week?**`,
            delay: 2, // Give time for workload to load
            actions: ['showArtifact'],
            artifactId: 'workload-breakdown',
            storeAs: 'selected_priorities',
            nextBranchOnText: 'selection-made',
          },

          'selection-made': {
            response: `Got it! I've noted your priorities:

{{#each selected_priorities}}
• {{this.title}}{{/each}}

Let's move on to planning the rest of your week.`,
            actions: ['goToNextSlide']
          },

          'skip-to-personal': {
            response: "No problem! Let's focus on your personal goals for the week.",
            actions: ['goToNextSlide']
          }
        }
      },

      artifacts: {
        sections: [
          {
            id: 'workload-breakdown',
            title: 'Workload Analysis',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'WorkloadDashboardArtifact',
              props: {
                title: 'Your Upcoming Week',
                showCategorization: true,
                showEstimates: true,
                showCustomerTimeline: true,
                allowSelection: true, // User can check items to include
              }
            }
          },
          {
            id: 'calendar-heat-map',
            title: 'Calendar Overview',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'CalendarHeatMapArtifact',
              props: {
                showAvailability: true,
                showFocusBlocks: true,
                highlightOverbooked: true,
              }
            }
          }
        ]
      },

      // Data fetching configuration (handled by frontend)
      dataFetch: {
        workload: {
          service: 'WorkloadAnalysisService',
          method: 'getUpcomingWorkload',
          params: {
            userId: '{{user.id}}',
            weekStart: '{{week_start_date}}',
            options: {
              renewalWindowDays,
              includeCompleted: false,
            }
          }
        },
        availability: {
          service: 'CalendarService',
          method: 'getWeeklyAvailability',
          params: {
            userId: '{{user.id}}',
            weekStart: '{{week_start_date}}',
          }
        }
      }
    };
  }
);
