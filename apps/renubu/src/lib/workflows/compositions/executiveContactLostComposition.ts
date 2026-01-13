/**
 * Executive Contact Lost Workflow - Composition Example
 *
 * This demonstrates how workflows are assembled from reusable slides.
 *
 * Notice:
 * - Uses 'greeting' slide (common to ALL workflows)
 * - Uses 'review-account' slide (common to ALL workflows)
 * - Uses 'prepare-quote' slide (common action used in renewal, expansion, risk workflows)
 * - Only 2 slides are specific to this workflow (assess-departure, identify-replacement)
 *
 * This composition would be stored in the database as:
 * workflow_definitions.slide_sequence = ['greeting', 'assess-departure', 'identify-replacement', 'review-account', 'prepare-quote', 'summary']
 * workflow_definitions.slide_contexts = {contexts for each slide}
 */

import { WorkflowComposition } from '../slides/baseSlide';

export const executiveContactLostComposition: WorkflowComposition = {
  id: 'exec-contact-lost',
  name: 'Executive Contact Lost',
  moduleId: 'customer-success',
  category: 'risk',
  description: 'Workflow for managing risk when a key executive contact departs',

  /**
   * Slide Sequence - Mix of common and workflow-specific slides
   */
  slideSequence: [
    'greeting',              // Common slide ✅
    'assess-departure',      // Risk-specific slide ✅ CREATED
    'identify-replacement',  // Risk-specific slide ✅ CREATED
    'review-account',        // Common slide ✅
    'prepare-quote',         // Action slide ✅ (reused in renewals, expansions, etc.)
    'draft-email',           // Action slide ✅
    'schedule-call',         // Action slide ✅
    'update-crm',            // Action slide ✅
    'workflow-summary',      // Common slide ✅
  ],

  /**
   * Slide Contexts - Customize how each slide behaves in THIS workflow
   */
  slideContexts: {
    'greeting': {
      purpose: 'executive_departure',
      urgency: 'high',
      variables: {
        // These will be populated from database at runtime
      }
    },
    'assess-departure': {
      variables: {
        impactLevel: 'critical',
        relationshipStrength: 'strong'
      }
    },
    'identify-replacement': {
      urgency: 'high',
      variables: {
        replacementKnown: false
      }
    },
    'review-account': {
      purpose: 'risk',
      variables: {
        ask_for_assessment: true,
        focus_metrics: ['health_score', 'churn_risk', 'relationship_strength']
      }
    },
    'prepare-quote': {
      purpose: 'retention',
      variables: {
        quote_type: 'retention_offer',
        allow_editing: true,
        include_discount: true
      }
    },
    'draft-email': {
      purpose: 'risk_outreach',
      variables: {
        tone: 'friendly',
        allowEditing: true
      }
    },
    'schedule-call': {
      purpose: 'relationship_building',
      urgency: 'high',
      variables: {
        duration: 30,
        requiresPreparation: true
      }
    },
    'update-crm': {
      purpose: 'risk_event_log',
      variables: {
        updateFields: {
          event_type: 'Executive Departure',
          severity: 'high',
          impact_level: 'critical'
        },
        autoUpdate: true,
        triggerNotifications: true
      }
    },
    'workflow-summary': {
      purpose: 'risk',
      variables: {
        createTasks: true,
        showConfetti: true
      }
    },
  },

  /**
   * Workflow Settings
   */
  settings: {
    layout: {
      modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
      dividerPosition: 50,
      chatWidth: 50,
      splitModeDefault: true,
    },
    chat: {
      placeholder: 'Ask me anything about this situation...',
      aiGreeting: "I noticed a key contact has left {{customer.name}}. Let's make sure we maintain our relationship.",
    }
  }
};
