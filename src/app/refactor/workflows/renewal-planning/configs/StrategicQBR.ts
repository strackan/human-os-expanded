/**
 * Strategic QBR (Quarterly Business Review) Workflow
 *
 * Guides CSMs through preparing for and conducting strategic
 * quarterly business reviews with key customers.
 *
 * Features:
 * - QBR preparation checklist
 * - Customer metrics review
 * - Strategic planning discussion
 */

import { WorkflowConfig } from './types';

export const StrategicQBR: WorkflowConfig = {
  // Backend metadata
  id: 'strategic-qbr',
  name: 'Quarterly Business Review',
  version: '1.0',
  type: 'strategic',
  baseScore: 70,

  // Workflow steps
  steps: [
    {
      id: 'prepare-qbr',
      title: 'Prepare QBR',

      // Backend properties
      type: 'planning',
      dataRequired: ['customer.name', 'customer.arr', 'customer.healthScore'],

      // UI configuration: Chat flow
      chat: {
        initialMessage: {
          text: "Let's prepare for {{customer.name}}'s Quarterly Business Review. I've gathered key metrics and insights.",
          buttons: [
            { label: 'Review Metrics', value: 'metrics' },
            { label: 'Skip QBR', value: 'skip' }
          ]
        },

        branches: {
          metrics: {
            response: 'Here are the key performance metrics for this quarter. {{customer.name}} has a health score of {{customer.healthScore}}/100.',
            actions: ['showArtifact'],
            artifactId: 'metrics-report',
            buttons: [
              { label: 'Looks Good', value: 'continue' },
              { label: 'Need More Data', value: 'more' }
            ]
          },
          skip: {
            response: "No problem. We can schedule the QBR preparation for another time.",
            buttons: []
          },
          continue: {
            response: "Great! The metrics look strong. Ready to proceed with the QBR?",
            buttons: [
              { label: 'Schedule QBR', value: 'schedule' }
            ]
          },
          more: {
            response: "I can provide additional context on usage trends, engagement patterns, or financial data. What would help?",
            buttons: [
              { label: 'Continue Anyway', value: 'continue' }
            ]
          },
          schedule: {
            response: "Perfect! I'll help you schedule the QBR with {{customer.name}}. This workflow is complete.",
            buttons: []
          }
        }
      },

      // UI configuration: Artifacts
      artifacts: [
        {
          id: 'metrics-report',
          title: 'QBR Metrics - {{customer.name}}',
          type: 'metrics',
          visible: false,
          data: {
            customer: '{{customer.name}}',
            arr: '{{customer.arr}}',
            healthScore: '{{customer.healthScore}}/100',
            usage: 'Usage metrics would appear here',
            engagement: 'Engagement data would appear here',
            growth: 'Growth trends would appear here'
          }
        }
      ]
    }
  ]
};
