/**
 * Simple Renewal Planning Workflow
 *
 * A basic renewal workflow demonstrating config-driven approach.
 * This workflow guides CSMs through planning a customer renewal.
 *
 * Features:
 * - Variable injection for customer data
 * - Config-driven chat branches
 * - Config-driven artifacts
 * - Unified schema (backend + UI in one config)
 */

import { WorkflowConfig } from './types';

export const SimpleRenewal: WorkflowConfig = {
  // Backend metadata (from unified schema)
  id: 'simple-renewal',
  name: 'Simple Renewal Planning',
  version: '1.0',
  type: 'renewal',
  stage: 'prepare',
  baseScore: 50,

  // Workflow steps
  steps: [
    // STEP 1: Initial Planning
    {
      id: 'start-planning',
      title: 'Start Planning',

      // Backend execution properties
      type: 'planning',
      dataRequired: ['customer.name', 'customer.arr', 'customer.renewalDate'],

      // UI configuration: Chat flow
      chat: {
        initialMessage: {
          text: 'Hi! Ready to start renewal planning for {{customer.name}}? They have an ARR of {{customer.arr}}.',
          buttons: [
            { label: 'Start Planning', value: 'confirm' },
            { label: 'Not Yet', value: 'skip' }
          ]
        },

        branches: {
          confirm: {
            response: "Great! I've pulled up the contract details on the right.",
            actions: ['showArtifact'],
            artifactId: 'contract',
            buttons: [
              { label: 'Review Terms', value: 'review' },
              { label: 'Continue to Next Step', value: 'next' }
            ]
          },
          skip: {
            response: "No problem. Let me know when you're ready to start the renewal planning process.",
            buttons: [
              { label: 'Start Planning', value: 'confirm' }
            ]
          },
          review: {
            response: 'The contract has favorable terms with an 8% price cap and multi-year discount options. Ready to continue?',
            buttons: [
              { label: 'Continue to Next Step', value: 'next' }
            ]
          },
          next: {
            response: "Perfect! Let's move to contract analysis.",
            actions: ['nextStep'],
            buttons: []
          }
        }
      },

      // UI configuration: Artifacts
      artifacts: [
        {
          id: 'contract',
          title: 'Contract Details - {{customer.name}}',
          type: 'contract',
          visible: false,
          data: {
            customer: '{{customer.name}}',
            arr: '{{customer.arr}}',
            renewalDate: '{{customer.renewalDate}}',
            terms: [
              '8% price cap on annual increases',
              '60-day notice required for renewal',
              'Multi-year discounts available (10% for 2-year, 20% for 3-year)'
            ]
          }
        }
      ]
    },

    // STEP 2: Contract Analysis
    {
      id: 'analyze-contract',
      title: 'Analyze Contract',

      type: 'analysis',
      dataRequired: ['customer.name', 'customer.arr'],

      chat: {
        initialMessage: {
          text: "Let's analyze the contract for {{customer.name}}. I've loaded the details on the right.",
          buttons: [
            { label: 'Analyze Terms', value: 'analyze' },
            { label: 'Skip Analysis', value: 'skip' }
          ]
        },

        branches: {
          analyze: {
            response: 'The contract includes a favorable 8% price cap and multi-year discount options. This gives us flexibility for upselling.',
            actions: ['showArtifact'],
            artifactId: 'contract',
            buttons: [
              { label: 'Looks Good', value: 'approve' },
              { label: 'Continue to Email Draft', value: 'next' }
            ]
          },
          skip: {
            response: "Okay, we'll proceed without detailed analysis.",
            buttons: [
              { label: 'Continue to Email Draft', value: 'next' }
            ]
          },
          approve: {
            response: 'Great! These terms look solid for the renewal conversation.',
            buttons: [
              { label: 'Continue to Email Draft', value: 'next' }
            ]
          },
          next: {
            response: "Moving to email drafting...",
            actions: ['nextStep'],
            buttons: []
          }
        }
      },

      artifacts: [
        {
          id: 'contract',
          title: 'Contract Analysis - {{customer.name}}',
          type: 'contract',
          visible: false,
          data: {
            customer: '{{customer.name}}',
            arr: '{{customer.arr}}',
            renewalDate: '{{customer.renewalDate}}',
            terms: [
              '8% price cap on annual increases',
              '60-day notice required for renewal',
              'Multi-year discounts available (10% for 2-year, 20% for 3-year)'
            ]
          }
        }
      ]
    },

    // STEP 3: Draft Communication
    {
      id: 'draft-email',
      title: 'Draft Email',

      type: 'communication',
      dataRequired: ['customer.name', 'customer.contact.name'],

      chat: {
        initialMessage: {
          text: "Now let's draft a renewal email for {{customer.contact.name}} at {{customer.name}}.",
          buttons: [
            { label: 'Generate Draft', value: 'generate' },
            { label: 'Skip for Now', value: 'skip' }
          ]
        },

        branches: {
          generate: {
            response: "I've generated a draft renewal email. You can review it on the right.",
            actions: ['showArtifact'],
            artifactId: 'email-draft',
            buttons: [
              { label: 'Looks Good', value: 'approve' },
              { label: 'Needs Changes', value: 'edit' }
            ]
          },
          skip: {
            response: "No problem. You can draft the email manually later.",
            buttons: [
              { label: 'Complete Workflow', value: 'complete' }
            ]
          },
          approve: {
            response: 'Perfect! The draft is ready to send.',
            buttons: [
              { label: 'Complete Workflow', value: 'complete' }
            ]
          },
          edit: {
            response: 'You can edit the draft in your email client. Would you like to finalize?',
            buttons: [
              { label: 'Complete Workflow', value: 'complete' }
            ]
          },
          complete: {
            response: "Workflow complete! You've successfully planned the renewal for {{customer.name}}.",
            buttons: []
          }
        }
      },

      artifacts: [
        {
          id: 'email-draft',
          title: 'Email Draft - {{customer.name}}',
          type: 'email',
          visible: false,
          data: {
            to: '{{customer.contact.name}} <{{customer.contact.email}}>',
            subject: 'Renewal Discussion - {{customer.name}}',
            body: 'Hi {{customer.contact.name}},\n\nI hope this message finds you well. As your renewal date approaches on {{customer.renewalDate}}, I wanted to reach out to discuss continuing our partnership.\n\nYour current ARR of {{customer.arr}} reflects the value our solution brings to {{customer.name}}. I would love to explore how we can continue supporting your success.\n\nWould you be available for a brief call next week?\n\nBest regards'
          }
        }
      ]
    }
  ]
};
