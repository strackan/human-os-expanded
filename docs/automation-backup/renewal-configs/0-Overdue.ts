/**
 * Overdue Renewal Workflow
 *
 * Triggered when: Renewal date has passed (< 0 days)
 * Urgency: MAXIMUM - Contract expired
 *
 * Purpose: Damage control and recovery for expired contracts
 * - Immediate escalation
 * - Service continuity assessment
 * - Recovery proposal
 * - Post-mortem analysis
 */

import { WorkflowDefinition } from '../workflow-types';

export const OverdueRenewalWorkflow: WorkflowDefinition = {
  id: 'overdue-renewal',
  type: 'renewal',
  stage: 'Overdue',
  name: 'Overdue Renewal Recovery',
  description: 'Renewal past due - immediate recovery action required',

  baseScore: 100,       // Maximum priority
  urgencyScore: 100,    // Maximum urgency

  trigger: {
    type: 'days_based',
    config: {
      daysMin: -365,    // Up to 1 year overdue
      daysMax: -1       // Past due by at least 1 day
    }
  },

  steps: [
    {
      id: 'assess-damage',
      name: 'Assess Damage & Service Status',
      type: 'data_analysis',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          OVERDUE RENEWAL DAMAGE ASSESSMENT

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Days overdue: {{math workflow.daysUntilRenewal * -1}}
          Contract expired: {{customer.renewalDate}}

          Current Status:
          - Service still active: {{data.serviceStatus.active}}
          - Last usage: {{data.usage.lastActivity}}
          - Payment status: {{data.financials.paymentStatus}}
          - Outstanding invoices: {{data.financials.outstandingInvoices}}

          URGENT ASSESSMENT:
          1. Service continuity risk (immediate service cut? grace period?)
          2. Customer's current usage/dependency level
          3. Reason for lapse (oversight, dissatisfaction, budget, competitor?)
          4. Likelihood of recovery (High/Medium/Low)
          5. Recommended recovery approach
          6. Escalation requirements (legal, executive, etc.)
        `,

        dataRequired: [
          'customer.arr',
          'customer.renewalDate',
          'data.usage.lastActivity',
          'data.serviceStatus',
          'data.financials.paymentStatus'
        ],

        processor: 'analyzers/overdueAssessment.js',

        outputs: [
          'damage_assessment',
          'recovery_likelihood',
          'recommended_approach'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '🔴 **CONTRACT EXPIRED**\n\n{{customer.name}} (ARR: ${{customer.arr}}) is **{{math workflow.daysUntilRenewal * -1}} days overdue**.\n\nContract expired: {{customer.renewalDate}}\n\nAssessing situation...',
            buttons: [
              { label: 'View Damage Assessment', value: 'view', action: 'show_artifact', artifactId: 'assessment' },
              { label: 'Escalate Immediately', value: 'escalate', action: 'trigger_escalation' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the situation assessment:',
              actions: ['show_artifact'],
              artifactId: 'assessment',
              nextButtons: [
                { label: 'Proceed with Recovery', value: 'proceed' },
                { label: 'Escalate to Leadership', value: 'escalate' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'assessment',
            title: 'Overdue Assessment - {{customer.name}}',
            type: 'report',
            icon: '🔴',
            visible: false,

            sections: [
              {
                id: 'status',
                title: 'Critical Status',
                type: 'alert',
                severity: 'critical',
                content: 'Contract expired {{math workflow.daysUntilRenewal * -1}} days ago. {{outputs.damage_assessment.serviceStatus}}'
              },
              {
                id: 'recovery',
                title: 'Recovery Likelihood',
                type: 'metric',
                content: {
                  value: '{{outputs.recovery_likelihood.percentage}}',
                  level: '{{outputs.recovery_likelihood.level}}'
                }
              },
              {
                id: 'approach',
                title: 'Recommended Recovery Approach',
                type: 'card',
                content: '{{outputs.recommended_approach}}'
              }
            ]
          }
        ]
      }
    },

    {
      id: 'recovery-action',
      name: 'Execute Recovery Plan',
      type: 'action',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          Create recovery plan for overdue renewal.

          Customer: {{customer.name}}
          Days overdue: {{math workflow.daysUntilRenewal * -1}}
          Recovery likelihood: {{outputs.recovery_likelihood.level}}
          Reason for lapse: {{outputs.damage_assessment.lapseReason}}

          Generate:
          1. Urgent outreach email (apologetic, solution-focused)
          2. Executive escalation email template
          3. Recovery proposal (pricing, terms, bridge contract)
          4. Service continuity plan
        `,

        dataRequired: [
          'outputs.damage_assessment',
          'outputs.recovery_likelihood'
        ],

        processor: 'generators/recoveryPlan.js',

        outputs: ['recovery_email', 'recovery_proposal']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'I\'ve prepared a recovery plan. Time is critical.\n\nWhat\'s your first move?',
            buttons: [
              { label: 'Send Recovery Email', value: 'email', action: 'show_artifact', artifactId: 'email' },
              { label: 'Review Recovery Proposal', value: 'proposal', action: 'show_artifact', artifactId: 'proposal' },
              { label: 'Escalate to Executive', value: 'exec', action: 'trigger_escalation' }
            ]
          },

          branches: {
            'email': {
              response: 'Here\'s the urgent recovery email:',
              actions: ['show_artifact'],
              artifactId: 'email',
              nextButtons: [
                { label: 'Send Now', value: 'send', action: 'send_email' },
                { label: 'Call First', value: 'call' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'email',
            title: 'Recovery Email',
            type: 'email',
            icon: '📧',
            visible: false,
            editable: true,

            content: {
              to: '{{data.salesforce.contacts[0].email}}',
              subject: '{{outputs.recovery_email.subject}}',
              body: '{{outputs.recovery_email.body}}',
              priority: 'urgent'
            }
          },

          {
            id: 'proposal',
            title: 'Recovery Proposal',
            type: 'document',
            icon: '📄',
            visible: false,

            content: {
              sections: '{{outputs.recovery_proposal}}'
            }
          }
        ]
      }
    },

    {
      id: 'post-mortem',
      name: 'Document Outcome',
      type: 'review',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          Document overdue renewal outcome.

          Result: {{user_input.outcome}}

          Capture:
          1. What happened (timeline of events)
          2. Root cause of lapse
          3. Recovery actions taken
          4. Lessons learned
          5. Process improvements needed
        `,

        processor: 'trackers/overduePostMortem.js',

        outputs: ['post_mortem']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Let\'s document what happened with {{customer.name}}.\n\nWhat was the outcome?',
            buttons: [
              { label: '✅ Recovered', value: 'recovered' },
              { label: '⏳ In Progress', value: 'progress' },
              { label: '❌ Lost', value: 'lost' }
            ]
          },

          branches: {
            'recovered': {
              response: 'Excellent! What was key to recovery?',
              nextButtons: [
                { label: 'Executive Intervention', value: 'key_exec' },
                { label: 'Pricing Concession', value: 'key_price' },
                { label: 'Service Continuity', value: 'key_service' }
              ]
            },
            'lost': {
              response: 'What was the primary reason?',
              nextButtons: [
                { label: 'Switched to Competitor', value: 'reason_competitor' },
                { label: 'Budget Eliminated', value: 'reason_budget' },
                { label: 'Dissatisfaction', value: 'reason_dissatisfied' }
              ]
            }
          }
        },

        artifacts: []
      }
    }
  ]
};

export default OverdueRenewalWorkflow;
