/**
 * Critical Renewal Workflow
 *
 * Triggered when: 7-30 days until renewal
 * Urgency: HIGH - Prompt action needed
 *
 * Purpose: Execute structured renewal process with sense of urgency
 * - Comprehensive risk assessment
 * - Strategic stakeholder engagement
 * - Renewal proposal preparation
 * - Progress tracking and escalation
 */

import { WorkflowDefinition } from '../workflow-types';

export const CriticalRenewalWorkflow: WorkflowDefinition = {
  // ============================================================================
  // METADATA
  // ============================================================================
  id: 'critical-renewal',
  type: 'renewal',
  stage: 'Critical',
  name: 'Critical Renewal Process',
  description: '7-30 days until renewal - structured execution required',

  // ============================================================================
  // SCORING (for priority calculation)
  // ============================================================================
  baseScore: 80,        // High base score (critical timing)
  urgencyScore: 80,     // High urgency

  // ============================================================================
  // TRIGGER CONDITIONS
  // ============================================================================
  trigger: {
    type: 'days_based',
    config: {
      daysMin: 7,
      daysMax: 30
    }
  },

  // ============================================================================
  // WORKFLOW STEPS
  // ============================================================================
  steps: [

    // ========================================================================
    // STEP 1: COMPREHENSIVE RISK ASSESSMENT
    // ========================================================================
    {
      id: 'comprehensive-risk-assessment',
      name: 'Comprehensive Risk Assessment',
      type: 'data_analysis',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          CRITICAL RENEWAL RISK ASSESSMENT

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Days until renewal: {{workflow.daysUntilRenewal}}

          Current Scores:
          - Risk: {{intelligence.riskScore}}/100
          - Health: {{intelligence.healthScore}}/100
          - Sentiment: {{intelligence.sentiment}}

          Provide comprehensive renewal assessment:
          1. Overall renewal likelihood (High/Medium/Low) with confidence %
          2. Top 3 risk factors (prioritized)
          3. Top 3 success factors (what's going well)
          4. Stakeholder engagement plan
          5. Recommended renewal strategy
          6. Action plan timeline
        `,

        dataRequired: [
          'customer.arr',
          'intelligence.riskScore',
          'intelligence.healthScore',
          'data.usage.trend',
          'data.engagement.lastMeeting'
        ],

        processor: 'analyzers/criticalRiskAssessment.js',

        outputs: [
          'renewal_likelihood',
          'risk_factors',
          'stakeholder_plan',
          'renewal_strategy'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '⚠️ **CRITICAL RENEWAL WINDOW**\n\n{{customer.name}} (ARR: ${{customer.arr}}) renewal is in **{{workflow.daysUntilRenewal}} days**.\n\nRisk: {{intelligence.riskScore}}/100 | Health: {{intelligence.healthScore}}/100\n\nRunning assessment...',
            buttons: [
              { label: 'View Assessment', value: 'view', action: 'show_artifact', artifactId: 'assessment' },
              { label: 'See Action Plan', value: 'plan', action: 'show_artifact', artifactId: 'plan' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the complete renewal assessment:',
              actions: ['show_artifact'],
              artifactId: 'assessment',
              nextButtons: [
                { label: 'Review Action Plan', value: 'plan' },
                { label: 'Start Outreach', value: 'proceed' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'assessment',
            title: 'Renewal Assessment - {{customer.name}}',
            type: 'report',
            icon: '📊',
            visible: false,

            sections: [
              {
                id: 'likelihood',
                title: 'Renewal Likelihood',
                type: 'metric',
                content: {
                  value: '{{outputs.renewal_likelihood.percentage}}',
                  status: '{{outputs.renewal_likelihood.level}}'
                }
              },
              {
                id: 'risks',
                title: 'Risk Factors',
                type: 'list',
                content: '{{outputs.risk_factors}}'
              },
              {
                id: 'strategy',
                title: 'Recommended Strategy',
                type: 'card',
                content: '{{outputs.renewal_strategy}}'
              }
            ]
          }
        ]
      }
    },

    // ========================================================================
    // STEP 2: STAKEHOLDER ENGAGEMENT
    // ========================================================================
    {
      id: 'stakeholder-engagement',
      name: 'Stakeholder Engagement',
      type: 'action',
      estimatedTime: '20min',

      execution: {
        llmPrompt: `
          Generate stakeholder engagement content for critical renewal.

          Customer: {{customer.name}}
          Strategy: {{outputs.renewal_strategy.approach}}

          Create personalized outreach for top 3 stakeholders with:
          1. Email subject & body
          2. Call script with talking points
          3. Meeting agenda
          4. Value proposition for their role
        `,

        dataRequired: [
          'data.salesforce.contacts',
          'outputs.renewal_strategy',
          'outputs.stakeholder_plan'
        ],

        processor: 'generators/stakeholderEngagement.js',

        outputs: [
          'stakeholder_emails',
          'call_scripts'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'I\'ve prepared personalized outreach for your top 3 contacts. Who would you like to start with?',
            buttons: [
              { label: '{{data.salesforce.contacts[0].name}} (Primary)', value: 'contact_1', action: 'show_artifact', artifactId: 'email-1' },
              { label: '{{data.salesforce.contacts[1].name}}', value: 'contact_2', action: 'show_artifact', artifactId: 'email-2' }
            ]
          },

          branches: {
            'contact_1': {
              response: 'Here\'s personalized outreach for {{data.salesforce.contacts[0].name}}:',
              actions: ['show_artifact'],
              artifactId: 'email-1',
              nextButtons: [
                { label: 'Send Email', value: 'send_1', action: 'send_email' },
                { label: 'Next Contact', value: 'contact_2' }
              ]
            },
            'send_1': {
              response: '✅ Email sent to {{data.salesforce.contacts[0].email}}.',
              actions: ['send_email'],
              nextButtons: [
                { label: 'Contact Next', value: 'contact_2' },
                { label: 'Complete Step', value: 'complete', action: 'complete_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'email-1',
            title: 'Email: {{data.salesforce.contacts[0].name}}',
            type: 'email',
            icon: '📧',
            visible: false,
            editable: true,

            content: {
              to: '{{data.salesforce.contacts[0].email}}',
              subject: '{{outputs.stakeholder_emails[0].subject}}',
              body: '{{outputs.stakeholder_emails[0].body}}'
            }
          }
        ]
      }
    },

    // ========================================================================
    // STEP 3: RENEWAL PROPOSAL
    // ========================================================================
    {
      id: 'renewal-proposal',
      name: 'Renewal Proposal',
      type: 'planning',
      estimatedTime: '20min',

      execution: {
        llmPrompt: `
          Create renewal proposal for {{customer.name}}.

          Current ARR: ${{customer.arr}}
          Target ARR: ${{outputs.renewal_strategy.targetARR}}
          Strategy: {{outputs.renewal_strategy.approach}}

          Generate professional proposal with:
          1. Executive summary
          2. Current state analysis
          3. Renewal recommendation
          4. Investment details
          5. Success plan
          6. Next steps
        `,

        dataRequired: [
          'customer.arr',
          'outputs.renewal_strategy'
        ],

        processor: 'generators/renewalProposal.js',

        outputs: [
          'proposal_document',
          'pricing_options'
        ]
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'I\'ve drafted a renewal proposal for {{customer.name}}.\n\nTarget ARR: ${{outputs.renewal_strategy.targetARR}}\n\nReady to review?',
            buttons: [
              { label: 'View Proposal', value: 'view', action: 'show_artifact', artifactId: 'proposal' },
              { label: 'See Pricing', value: 'pricing', action: 'show_artifact', artifactId: 'pricing' }
            ]
          },

          branches: {
            'view': {
              response: 'Here\'s the complete proposal:',
              actions: ['show_artifact'],
              artifactId: 'proposal',
              nextButtons: [
                { label: 'Export PDF', value: 'export', action: 'export_pdf' },
                { label: 'Edit', value: 'edit', action: 'edit_artifact' }
              ]
            },
            'export': {
              response: '📄 Proposal exported. Ready to send?',
              actions: ['export_pdf'],
              nextButtons: [
                { label: 'Send to Customer', value: 'send', action: 'send_email' },
                { label: 'Complete Step', value: 'complete', action: 'complete_step' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'proposal',
            title: 'Renewal Proposal - {{customer.name}}',
            type: 'document',
            icon: '📄',
            visible: false,
            editable: true,

            content: {
              sections: '{{outputs.proposal_document.sections}}'
            }
          },

          {
            id: 'pricing',
            title: 'Pricing Options',
            type: 'comparison',
            icon: '💰',
            visible: false,

            content: {
              options: '{{outputs.pricing_options}}'
            }
          }
        ]
      }
    }
  ]
};

export default CriticalRenewalWorkflow;
