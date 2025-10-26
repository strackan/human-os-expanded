/**
 * Standard Renewal Workflow - Composition Example
 *
 * Notice how this REUSES the same slides as the risk workflow:
 * - greeting (common)
 * - review-account (common)
 * - prepare-quote (action) ← SAME slide, different context!
 *
 * Only 2 slides are renewal-specific:
 * - review-contract-terms
 * - pricing-strategy
 *
 * This is the power of the slide library approach!
 */

import { WorkflowComposition } from '../slides/baseSlide';

export const standardRenewalComposition: WorkflowComposition = {
  id: 'standard-renewal',
  name: 'Standard Renewal',
  category: 'renewal',
  description: 'Standard workflow for customer renewal planning',

  /**
   * Slide Sequence
   * Notice: greeting, review-account, prepare-quote are SHARED with other workflows!
   */
  slideSequence: [
    'greeting',                 // ← Same slide as risk workflow ✅
    'review-contract-terms',    // Renewal-specific ✅ CREATED
    'review-account',           // ← Same slide as risk workflow ✅
    'pricing-strategy',         // Renewal-specific ✅ CREATED
    'prepare-quote',            // ← Same slide as risk workflow (different context!) ✅
    'draft-email',              // ← Same slide as risk workflow ✅
    'schedule-call',            // ← Same slide as risk workflow ✅
    'update-crm',               // ← Same slide as risk workflow ✅
    'workflow-summary',         // ← Same slide as risk workflow ✅
  ],

  /**
   * Different contexts = different behavior of the SAME slides
   */
  slideContexts: {
    'greeting': {
      purpose: 'renewal_preparation',  // Different purpose than risk workflow
      urgency: 'medium',                // Different urgency than risk workflow
    },
    'review-contract-terms': {
      variables: {
        contractTerm: 12,
        paymentTerms: 'annual',
        includeChanges: true
      }
    },
    'review-account': {
      purpose: 'renewal',               // Different focus than risk workflow
      variables: {
        ask_for_assessment: false,      // Don't ask for assessment in renewals
        focus_metrics: ['health_score', 'utilization', 'renewal_likelihood']
      }
    },
    'pricing-strategy': {
      variables: {
        priceChangeStrategy: 'flat',
        multiYearOption: true
      }
    },
    'prepare-quote': {
      purpose: 'renewal',               // Different quote type than risk workflow!
      variables: {
        quote_type: 'renewal',
        allow_editing: true,
        calculate_from_current: true    // Base on current contract
      }
    },
    'draft-email': {
      purpose: 'renewal_reminder',
      variables: {
        tone: 'professional',
        allowEditing: true
      }
    },
    'schedule-call': {
      purpose: 'renewal_planning',
      urgency: 'medium',
      variables: {
        duration: 45,
        requiresPreparation: true
      }
    },
    'update-crm': {
      purpose: 'renewal_stage',
      variables: {
        updateFields: {
          renewal_stage: 'proposal_sent',
          renewal_probability: 0.85
        },
        autoUpdate: false,
        requireConfirmation: true
      }
    },
    'workflow-summary': {
      purpose: 'renewal',
      variables: {
        createTasks: true,
        showConfetti: true
      }
    },
  },

  settings: {
    layout: {
      modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
      dividerPosition: 50,
      chatWidth: 50,
      splitModeDefault: true,
    },
    chat: {
      placeholder: 'Ask me anything about this renewal...',
      aiGreeting: "{{customer.name}}'s renewal is coming up. Let's prepare a great renewal offer!",
    }
  }
};
