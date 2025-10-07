/**
 * Customer Health Check Workflow
 *
 * A proactive workflow for monitoring and addressing customer health issues.
 * Helps CSMs identify risks and take corrective action early.
 *
 * Features:
 * - Health score analysis
 * - Risk assessment
 * - Action planning
 */

import { WorkflowConfig } from './types';

export const HealthCheck: WorkflowConfig = {
  // Backend metadata
  id: 'health-check',
  name: 'Customer Health Check',
  version: '1.0',
  type: 'risk',
  baseScore: 40,

  // Workflow steps
  steps: [
    {
      id: 'assess-health',
      title: 'Assess Health',

      // Backend properties
      type: 'data_analysis',
      dataRequired: ['customer.name', 'customer.healthScore', 'customer.riskScore'],

      // UI configuration: Chat flow
      chat: {
        initialMessage: {
          text: "Time for a health check on {{customer.name}}. Their current health score is {{customer.healthScore}}/100. Let's review their status.",
          buttons: [
            { label: 'Review Health Status', value: 'review' },
            { label: 'Skip This Check', value: 'skip' }
          ]
        },

        branches: {
          review: {
            response: "Here's the detailed health analysis. I've highlighted key risk factors and opportunities for improvement.",
            actions: ['showArtifact'],
            artifactId: 'health-report',
            buttons: [
              { label: 'Create Action Plan', value: 'plan' },
              { label: 'Looks Good', value: 'okay' }
            ]
          },
          skip: {
            response: "Understood. We'll check back on {{customer.name}} later.",
            buttons: []
          },
          plan: {
            response: "Great proactive approach! Let's create an action plan to address the identified risks and improve the customer's health score.",
            buttons: [
              { label: 'Complete', value: 'complete' }
            ]
          },
          okay: {
            response: "Sounds good! We'll continue monitoring {{customer.name}} and alert you if their health score changes significantly.",
            buttons: []
          },
          complete: {
            response: "Action plan created! This workflow is complete. You'll receive reminders for follow-up actions.",
            buttons: []
          }
        }
      },

      // UI configuration: Artifacts
      artifacts: [
        {
          id: 'health-report',
          title: 'Health Analysis - {{customer.name}}',
          type: 'report',
          visible: false,
          data: {
            customer: '{{customer.name}}',
            healthScore: '{{customer.healthScore}}/100',
            riskScore: '{{customer.riskScore}}/100',
            keyRisks: [
              'Usage declining by 15% this quarter',
              'Support tickets increased 2x',
              'No executive engagement in 60 days'
            ],
            opportunities: [
              'Expand to new department',
              'Introduce advanced features',
              'Schedule strategic planning call'
            ]
          }
        }
      ]
    }
  ]
};
