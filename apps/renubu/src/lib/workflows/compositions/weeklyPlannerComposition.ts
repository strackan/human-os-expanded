/**
 * Weekly Planner Workflow - Renubu Labs
 *
 * AI-powered "Chief of Staff" for weekly planning
 *
 * Unique Features:
 * - Integrates existing work commitments (snoozed workflows, renewals, priorities)
 * - Uses findNextOpening() to auto-schedule everything
 * - Pattern recognition from past weeks
 * - Work/life balance focus
 */

import { WorkflowComposition } from '../slides/baseSlide';

export const weeklyPlannerComposition: WorkflowComposition = {
  id: 'weekly-planning',
  name: 'Weekly Planning',
  moduleId: 'productivity',
  category: 'planner',
  description: 'AI-guided weekly planning with integrated work commitments',

  /**
   * Slide Sequence - 4-Phase Planning Process
   */
  slideSequence: [
    'weekly-reflection',          // Phase 1: Reflect on last week
    'context-gathering-workload', // Phase 2: Surface work commitments ⭐ KEY
    'forward-planning',           // Phase 3: Plan the week with AI scheduling
    'commitment-finalization',    // Phase 4: Lock in commitments
    'weekly-summary',             // Display artifacts and schedule
  ],

  /**
   * Slide Contexts - Configure behavior
   */
  slideContexts: {
    'weekly-reflection': {
      variables: {
        showPatternAnalysis: true,
        compareToLastWeek: true,
      }
    },
    'context-gathering-workload': {
      variables: {
        renewalWindowDays: 60,          // Surface renewals in next 60 days
        includeSnoozed: true,
        includePriorities: true,
        includeIncompleteTasks: true,
        autoEstimateDuration: true,      // Use AI to estimate task duration
      }
    },
    'forward-planning': {
      variables: {
        useFindNextOpening: true,        // Enable auto-scheduling ⭐
        windowDays: 7,                   // Schedule within the week
        respectFocusBlocks: true,
        respectEnergyMap: true,
        allowManualAdjustments: true,
        showCapacityWarning: true,       // Warn if over-committed
      }
    },
    'commitment-finalization': {
      variables: {
        maxPriorities: 5,                // Force focus on top 5
        requireConfirmation: true,
        generateCalendarEvents: true,    // Auto-create calendar events
        setupCheckIns: true,             // Daily/mid-week check-ins
      }
    },
    'weekly-summary': {
      variables: {
        showArtifacts: true,
        artifactTypes: [
          'weekly-plan',                 // Day-by-day breakdown
          'focus-document',              // Top 3 priorities
          'workload-dashboard',          // Customer timeline
        ],
        scheduleNextPlanning: true,      // Auto-schedule next week's planning
        sendSummaryEmail: false,         // Optional email summary
      }
    },
  },

  settings: {
    layout: {
      modalDimensions: { width: 95, height: 95, top: 2.5, left: 2.5 },
      dividerPosition: 50,
      chatWidth: 50,
      splitModeDefault: true,
    },
    chat: {
      placeholder: 'Tell me about your week...',
      aiGreeting: "Let's plan your week! I've pulled your work commitments and I'm ready to help you schedule everything.",
    },
    // TODO: Re-enable when recurring workflow type support is added
    // recurring: {
    //   enabled: true,
    //   pattern: 'weekly',
    //   defaultDay: 'sunday',
    //   defaultTime: '18:00',
    //   timezone: 'auto', // Use user's timezone
    // },
  }
};
