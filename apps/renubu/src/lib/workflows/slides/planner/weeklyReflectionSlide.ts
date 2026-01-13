/**
 * Weekly Reflection Slide
 *
 * Reflect on last week before planning the next
 * - What felt good?
 * - What could be improved?
 * - What were the highlights?
 * - Pattern analysis from past weeks
 */

import {
  SlideBuilder,
  SlideDefinition,
  SlideContext,
  createSlideBuilder,
} from '../baseSlide';

export const weeklyReflectionSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'weekly-reflection',
    name: 'Weekly Reflection',
    category: 'planner',
    description: 'Reflect on the previous week',
    estimatedMinutes: 3,
    requiredFields: [],
    optionalFields: ['last_week_plan'],
    tags: ['reflection', 'retrospective'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const showPatternAnalysis = context?.variables?.showPatternAnalysis !== false;
    const compareToLastWeek = context?.variables?.compareToLastWeek !== false;

    return {
      id: 'weekly-reflection',
      title: 'Weekly Reflection',
      description: 'Let\'s reflect on last week before planning ahead',
      label: 'Reflect',
      stepMapping: 'reflection',

      chat: {
        initialMessage: {
          text: `Hi! Ready to plan your week?

First, let's do a quick reflection on last week.

${compareToLastWeek && context?.variables?.last_week_plan ? `
Last week you committed to {{last_week_plan.commitments.length}} priorities.
You completed {{last_week_plan.completed_count}} of them ({{last_week_plan.completion_rate}}%).
` : ''}

**What felt good this week?**
(What went well, what energized you, what are you proud of?)`,
          nextBranchOnText: 'answer-what-felt-good',
        },

        branches: {
          'answer-what-felt-good': {
            response: `Great to hear!

**What could you have improved?**
(What didn't go as planned, what drained energy, what would you change?)`,
            storeAs: 'what_felt_good',
            nextBranchOnText: 'answer-improvements',
          },

          'answer-improvements': {
            response: `Thanks for sharing.

**What were the highlights?**
(Wins, learnings, memorable moments)`,
            storeAs: 'what_could_improve',
            nextBranchOnText: 'answer-highlights',
          },

          'answer-highlights': {
            response: `Awesome!

${showPatternAnalysis ? `
I've analyzed your past few weeks:
{{#if patterns.over_committing}}
📊 You tend to commit to {{patterns.avg_commitments}} tasks but complete {{patterns.avg_completed}}. Consider committing to fewer priorities.
{{/if}}
{{#if patterns.best_day}}
⭐ Your most productive day is {{patterns.best_day}}.
{{/if}}
{{#if patterns.energy_insight}}
💡 {{patterns.energy_insight}}
{{/if}}
` : ''}

Ready to plan this week with these insights in mind?`,
            storeAs: 'highlights',
            buttons: [
              {
                label: 'Let\'s Plan',
                value: 'continue',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white'
              }
            ],
            actions: ['goToNextSlide'],
          }
        }
      },

      artifacts: {
        sections: showPatternAnalysis ? [
          {
            id: 'pattern-analysis',
            title: 'Your Patterns',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'PatternAnalysisArtifact',
              props: {
                showCompletionTrends: true,
                showEnergyPatterns: true,
                showRecommendations: true,
              }
            }
          }
        ] : []
      },

      // Data fetching for pattern analysis
      dataFetch: showPatternAnalysis ? {
        patterns: {
          service: 'PatternAnalysisService',
          method: 'analyzeCommitmentPatterns',
          params: {
            userId: '{{user.id}}',
            weeksToAnalyze: 8,
          }
        }
      } : undefined
    };
  }
);
