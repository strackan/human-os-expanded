/**
 * Finalize Renewal Workflow
 *
 * Triggered when: 30-59 days until renewal
 * Urgency: HIGH - Finalization phase
 *
 * Purpose: Lock in renewal terms and get internal approvals
 * - Pricing confirmation
 * - Contract terms review
 * - Internal approvals
 * - Legal/procurement coordination
 */

import { WorkflowDefinition } from '../workflow-types';

export const FinalizeRenewalWorkflow: WorkflowDefinition = {
  id: 'finalize-renewal',
  type: 'renewal',
  stage: 'Finalize',
  name: 'Renewal Finalization',
  description: '30-59 days until renewal - finalization phase',

  baseScore: 70,
  urgencyScore: 65,

  trigger: {
    type: 'days_based',
    config: {
      daysMin: 30,
      daysMax: 59
    }
  },

  steps: [
    {
      id: 'confirm-terms',
      name: 'Confirm Final Terms',
      type: 'review',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          RENEWAL FINALIZATION REVIEW

          Customer: {{customer.name}}
          ARR: ${{customer.arr}}
          Renewal in: {{workflow.daysUntilRenewal}} days

          Final terms review:
          1. Agreed pricing and terms
          2. Any pending items or contingencies
          3. Internal approval requirements
          4. Timeline to signature
          5. Risk of delay or issues
        `,

        dataRequired: ['customer.arr', 'workflow.daysUntilRenewal'],

        processor: 'analyzers/finalizationReview.js',

        outputs: ['final_terms', 'approval_requirements', 'timeline']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: '✅ **FINALIZING RENEWAL**\n\n{{customer.name}} - {{workflow.daysUntilRenewal}} days to renewal\n\nConfirming final terms...',
            buttons: [
              { label: 'Review Terms', value: 'terms', action: 'show_artifact', artifactId: 'terms' },
              { label: 'Check Approval Status', value: 'approvals', action: 'show_artifact', artifactId: 'approvals' }
            ]
          },

          branches: {
            'terms': {
              response: 'Here are the final agreed terms:',
              actions: ['show_artifact'],
              artifactId: 'terms',
              nextButtons: [
                { label: 'Terms Confirmed', value: 'confirmed' },
                { label: 'Issues Need Resolution', value: 'issues' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'terms',
            title: 'Final Renewal Terms',
            type: 'document',
            icon: '📋',
            visible: false,

            content: {
              pricing: '{{outputs.final_terms.pricing}}',
              term: '{{outputs.final_terms.contractTerm}}',
              specialTerms: '{{outputs.final_terms.specialTerms}}',
              pendingItems: '{{outputs.final_terms.pendingItems}}'
            }
          },

          {
            id: 'approvals',
            title: 'Approval Tracker',
            type: 'checklist',
            icon: '✓',
            visible: false,

            content: {
              items: '{{outputs.approval_requirements}}'
            }
          }
        ]
      }
    },

    {
      id: 'prepare-paperwork',
      name: 'Prepare Contract Paperwork',
      type: 'action',
      estimatedTime: '15min',

      execution: {
        llmPrompt: `
          Prepare renewal contract documentation.

          Customer: {{customer.name}}
          Final terms: {{outputs.final_terms}}

          Generate:
          1. Contract summary for legal review
          2. Renewal order form
          3. Signature checklist
          4. Timeline to execution
        `,

        dataRequired: ['outputs.final_terms'],

        processor: 'generators/contractPaperwork.js',

        outputs: ['contract_summary', 'order_form', 'signature_checklist']
      },

      ui: {
        chat: {
          initialMessage: {
            role: 'ai',
            text: 'Preparing contract paperwork for {{customer.name}}.',
            buttons: [
              { label: 'View Contract Summary', value: 'summary', action: 'show_artifact', artifactId: 'summary' },
              { label: 'See Signature Checklist', value: 'checklist', action: 'show_artifact', artifactId: 'checklist' }
            ]
          },

          branches: {
            'summary': {
              response: 'Here\'s the contract summary:',
              actions: ['show_artifact'],
              artifactId: 'summary',
              nextButtons: [
                { label: 'Send to Legal', value: 'legal', action: 'send_email' },
                { label: 'Send to Customer', value: 'customer', action: 'send_email' }
              ]
            }
          }
        },

        artifacts: [
          {
            id: 'summary',
            title: 'Contract Summary',
            type: 'document',
            icon: '📄',
            visible: false,

            content: '{{outputs.contract_summary}}'
          },

          {
            id: 'checklist',
            title: 'Signature Checklist',
            type: 'checklist',
            icon: '✓',
            visible: false,

            content: {
              items: '{{outputs.signature_checklist}}'
            }
          }
        ]
      }
    }
  ]
};

export default FinalizeRenewalWorkflow;
