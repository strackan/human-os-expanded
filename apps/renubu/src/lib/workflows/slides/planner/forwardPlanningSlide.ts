/**
 * Forward Planning Slide - AI-Powered Scheduling
 *
 * Uses findNextOpening() to automatically schedule all tasks
 *
 * Flow:
 * 1. User adds personal priorities (or confirms work priorities from previous slide)
 * 2. For each task, estimate duration and type
 * 3. Use findNextOpening() to find optimal time slots
 * 4. Show proposed schedule with scores/reasoning
 * 5. User can adjust or accept
 *
 * Magic: Turns a list of tasks into a scheduled week in seconds!
 */

import {
  SlideBuilder,
  SlideDefinition,
  SlideContext,
  createSlideBuilder,
  applyContextVariables,
} from '../baseSlide';

export const forwardPlanningSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'forward-planning',
    name: 'Week Design & Auto-Scheduling',
    category: 'planner',
    description: 'Design your week with AI-powered auto-scheduling',
    estimatedMinutes: 5,
    requiredFields: [],
    optionalFields: ['selected_priorities', 'personal_goals'],
    tags: ['planning', 'scheduling', 'findNextOpening'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const useFindNextOpening = context?.variables?.useFindNextOpening !== false;
    const windowDays = context?.variables?.windowDays || 7;
    const respectFocusBlocks = context?.variables?.respectFocusBlocks !== false;
    const allowManualAdjustments = context?.variables?.allowManualAdjustments !== false;
    const showCapacityWarning = context?.variables?.showCapacityWarning !== false;

    return {
      id: 'forward-planning',
      title: 'Design Your Week',
      description: 'Plan tasks and let AI find the best time slots',
      label: 'Plan',
      stepMapping: 'forward-planning',

      chat: {
        initialMessage: {
          text: `Great! We have {{selected_priorities.length}} work priorities.

**Now, what else do you want to accomplish this week?**

Think about:
• Personal projects or goals
• Learning or skill development
• Health and wellness
• Relationships and connections
• Any appointments or commitments

Tell me what you'd like to add, or say "Continue" if you're ready to schedule.`,
          buttons: [
            {
              label: 'Add Personal Priorities',
              value: 'add-personal',
              'label-background': 'bg-green-600',
              'label-text': 'text-white'
            },
            {
              label: 'Continue with Current List',
              value: 'continue',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white'
            }
          ],
          nextBranches: {
            'add-personal': 'collect-personal',
            'continue': 'estimate-durations',
          }
        },

        branches: {
          'collect-personal': {
            response: `Perfect! Tell me what you'd like to accomplish.

You can add them one by one, or list them all.

Examples:
• "Finish Q1 investor deck"
• "Exercise 3x this week"
• "Date night with partner"
• "Review team OKRs"`,
            storeAs: 'personal_priorities',
            nextBranchOnText: 'estimate-durations',
          },

          'estimate-durations': {
            response: `Now let's estimate how long each task will take.

I'll make some smart guesses based on the task type, but you can adjust:

{{#each all_priorities}}
• **{{this.title}}** - {{this.estimated_minutes}} min ({{this.task_type}})
{{/each}}

${useFindNextOpening ? `
I'll use your calendar, focus blocks, and energy levels to find the best times.

Ready to auto-schedule?` : `

How would you like to schedule these?`}`,
            buttons: useFindNextOpening ? [
              {
                label: 'Auto-Schedule with AI',
                value: 'auto-schedule',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white'
              },
              {
                label: 'Manual Scheduling',
                value: 'manual',
                'label-background': 'bg-gray-600',
                'label-text': 'text-white'
              }
            ] : [
              {
                label: 'Continue',
                value: 'manual',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white'
              }
            ],
            nextBranches: {
              'auto-schedule': 'run-auto-schedule',
              'manual': 'manual-schedule-ui',
            }
          },

          'run-auto-schedule': {
            response: `🤖 Running AI scheduler...

Analyzing your calendar...
Identifying focus blocks...
Scoring time slots...
Optimizing for energy levels...

Done! Here's your proposed schedule:

{{#each scheduled_tasks}}
**{{this.day}}, {{this.time}}** - {{this.task_name}} ({{this.duration}} min)
_Score: {{this.score}}/100 - {{this.reasoning}}_

{{/each}}

${showCapacityWarning ? `
{{#if is_overbooked}}
⚠️ **Capacity Warning:** You have {{total_scheduled_hours}} hours scheduled, but only {{available_hours}} hours available. Consider:
• Deferring lower-priority tasks
• Reducing time estimates
• Blocking focus time instead of individual tasks
{{/if}}
` : ''}

{{#if has_conflicts}}
⚠️ Some tasks couldn't be scheduled due to conflicts. Review manually.
{{/if}}

How does this look?`,
            delay: 3, // Simulate AI processing
            buttons: [
              {
                label: 'Looks Great!',
                value: 'accept',
                'label-background': 'bg-green-600',
                'label-text': 'text-white'
              },
              {
                label: 'Make Adjustments',
                value: 'adjust',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white'
              }
            ],
            actions: ['showArtifact'],
            artifactId: 'proposed-schedule',
            nextBranches: {
              'accept': 'schedule-accepted',
              'adjust': 'manual-adjustments',
            }
          },

          'manual-schedule-ui': {
            response: `You can drag tasks onto your calendar, or I can suggest times for specific tasks.

Just click on a task and I'll find the next best opening for it.`,
            actions: ['showArtifact'],
            artifactId: 'proposed-schedule',
            nextBranchOnText: 'schedule-accepted',
          },

          'manual-adjustments': {
            response: `No problem! Use the calendar view to:
• Drag tasks to different times
• Change task durations
• Remove tasks you want to defer

Click "Done" when ready.`,
            actions: ['showArtifact'],
            artifactId: 'proposed-schedule',
            nextBranchOnText: 'schedule-accepted',
          },

          'schedule-accepted': {
            response: `Excellent! Your week is taking shape.

Summary:
• {{total_tasks}} tasks scheduled
• {{total_hours}} hours allocated
• {{days_with_work}} days have work
• {{focus_blocks_used}} focus blocks utilized

Ready to finalize your commitments?`,
            actions: ['goToNextSlide'],
          }
        }
      },

      artifacts: {
        sections: [
          {
            id: 'proposed-schedule',
            title: 'Proposed Weekly Schedule',
            type: 'custom',
            visible: false, // Shown after auto-schedule
            data: {
              componentType: 'WeeklyCalendarViewArtifact',
              props: {
                showScores: true,
                showReasoning: true,
                allowDragDrop: allowManualAdjustments,
                highlightFocusBlocks: respectFocusBlocks,
                showCapacityIndicator: showCapacityWarning,
              }
            }
          },
          {
            id: 'task-list-with-estimates',
            title: 'Tasks to Schedule',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'TaskListWithEstimatesArtifact',
              props: {
                showDurationEstimates: true,
                showTaskTypeIcons: true,
                allowEditing: true,
                showPriorityIndicators: true,
              }
            }
          },
          {
            id: 'capacity-analysis',
            title: 'Capacity Check',
            type: 'custom',
            visible: showCapacityWarning,
            data: {
              componentType: 'CapacityAnalysisArtifact',
              props: {
                showUtilization: true,
                warnIfOverbooked: true,
                suggestAdjustments: true,
              }
            }
          }
        ]
      },

      // AI scheduling logic (handled by frontend)
      aiScheduling: {
        enabled: useFindNextOpening,
        algorithm: 'findNextOpening',
        params: {
          windowDays,
          respectFocusBlocks,
          respectBufferTime: true,
          optimizeForEnergy: true,
          minimizeContextSwitching: true,
        },
        // For each task, call:
        // CalendarService.findNextOpening({
        //   userId,
        //   durationMinutes: task.estimated_minutes,
        //   taskType: task.task_type,
        //   windowDays,
        //   preferences: { requireFocusBlock: task.requires_focus }
        // })
      }
    };
  }
);
