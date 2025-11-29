/**
 * Signature Renewal Workflow
 *
 * Triggered when: 7-30 days until renewal
 * Urgency: HIGH - Final signature push
 *
 * Purpose: Drive contract to signature
 * - Contract review assistance
 * - Signature process facilitation
 * - Legal/procurement support
 * - Last-minute issue resolution
 */

import { WorkflowDefinition } from '../workflow-types';

export const SignatureRenewalWorkflow: WorkflowDefinition = {
  id: 'signature-renewal',
  type: 'renewal',
  stage: 'Signature',
  name: 'Signature Phase',
  description: '7-30 days until renewal - driving to signature',

  baseScore: 85,
  urgencyScore: 75,

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 7,
      daysMax: 30
    }
  },

  steps: [
    {
      id: 'signature-status',
      name: 'Signature Status Check',
      type: 'review',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          SIGNATURE STATUS CHECK

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days
          Contract sent: {{data.contractStatus.sentDate}}

          Check:
          1. Contract sent to customer? When?
          2. Who needs to sign? (customer side, our side)
          3. Any blockers or questions?
          4. Urgency level
          5. Escalation needed?
        `,

        dataRequired: ['data.contractStatus'],

        processor: 'analyzers/signatureStatus.js',

        outputs: ['signature_status', 'blockers', 'next_actions']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '✍️ **SIGNATURE PHASE**\n\n{{customer.name}} - {{workflow.daysUntilRenewal}} days to renewal\n\nChecking signature status...',
            buttons: [
              { label: 'View Status', value: 'status', action: 'show_artifact', artifactId: 'status' },
              { label: 'See Blockers', value: 'blockers', action: 'show_artifact', artifactId: 'blockers' }
            ]
          },

          branches: {
            'status': {
              response: 'Here\'s the current signature status:',
              actions: ['show_artifact'],
              artifactId: 'status',
              nextButtons: [
                { label: 'All Clear - Just Waiting', value: 'waiting' },
                { label: 'Issues to Address', value: 'issues' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'status',
            title: 'Signature Status - {{customer.name}}',
            type: 'report',
            icon: '✍️',
            visible: false,

            sections: [
              {
                id: 'overview',
                title: 'Status Overview',
                type: 'card',
                content: {
                  status: '{{outputs.signature_status.status}}',
                  urgency: '{{outputs.signature_status.urgency}}',
                  timeline: '{{outputs.signature_status.timeline}}'
                }
              },
              {
                id: 'signers',
                title: 'Signers',
                type: 'checklist',
                content: {
                  items: '{{outputs.signature_status.signers}}'
                }
              }
            ]
          },

          {
            id: 'blockers',
            title: 'Signature Blockers',
            type: 'list',
            icon: '⚠️',
            visible: false,

            content: '{{outputs.blockers}}'
          }
        ]
      }
    },

    {
      id: 'signature-follow-up',
      name: 'Signature Follow-Up',
      type: 'action',
      estimatedTime: '10min',

      execution: {
        llmPrompt: `
          Generate signature follow-up communications.

          Customer: {{customer.name}}
          Days until renewal: {{workflow.daysUntilRenewal}}
          Status: {{outputs.signature_status}}
          Blockers: {{outputs.blockers}}

          Create:
          1. Follow-up email (professional, gentle urgency)
          2. Internal escalation notice (if needed)
          3. Issue resolution talking points
        `,

        dataRequired: ['outputs.signature_status', 'outputs.blockers'],

        processor: 'generators/signatureFollowUp.js',

        outputs: ['followup_email', 'escalation_notice']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Time for signature follow-up. What action would you like to take?',
            buttons: [
              { label: 'Send Follow-Up Email', value: 'email', action: 'show_artifact', artifactId: 'email' },
              { label: 'Call Customer', value: 'call' },
              { label: 'Escalate Internally', value: 'escalate' }
            ]
          },

          branches: {
            'email': {
              response: 'Here\'s the follow-up email:',
              actions: ['show_artifact'],
              artifactId: 'email',
              nextButtons: [
                { label: 'Send Now', value: 'send', action: 'send_email' },
                { label: 'Edit First', value: 'edit', action: 'edit_artifact' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'email',
            title: 'Signature Follow-Up Email',
            type: 'email',
            icon: '📧',
            visible: false,
            editable: true,

            content: {
              to: '{{data.salesforce.contacts[0].email}}',
              subject: '{{outputs.followup_email.subject}}',
              body: '{{outputs.followup_email.body}}'
            }
          }
        ]
      }
    }
  ]
};

export default SignatureRenewalWorkflow;
