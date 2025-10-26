/**
 * Update CRM Slide - Reusable Action Slide
 *
 * Used across ALL workflow types for updating customer records.
 *
 * Reused in:
 * - Risk workflows (update health score, log risk events)
 * - Opportunity workflows (update expansion status, log opportunity)
 * - Strategic workflows (update strategic initiatives, log QBR outcomes)
 * - Renewal workflows (update renewal stage, log renewal activities)
 *
 * Context customization:
 * - purpose: Type of CRM update (health_score, risk_event, opportunity_log, renewal_stage, etc.)
 * - updateFields: Specific fields to update
 * - autoUpdate: Whether to auto-update or require review
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * CRM update intro messages by purpose
 */
const CRM_UPDATE_INTRO_MESSAGES: Record<string, string> = {
  // Risk workflow updates
  health_score_update: "Let's update {{customer.name}}'s health score to reflect the current situation.",
  risk_event_log: "I'll log this risk event in {{customer.name}}'s account timeline.",
  contact_change: "Let's update the contact information for {{customer.name}} in the CRM.",

  // Opportunity workflow updates
  opportunity_log: "Let's log this expansion opportunity in {{customer.name}}'s account.",
  expansion_stage: "I'll update {{customer.name}}'s expansion opportunity stage.",
  upsell_tracking: "Let's track this upsell opportunity in the CRM.",

  // Strategic workflow updates
  qbr_completed: "Let's log the QBR completion and outcomes in {{customer.name}}'s account.",
  strategic_initiatives: "I'll update {{customer.name}}'s strategic initiatives in the CRM.",
  success_plan_update: "Let's update the success plan for {{customer.name}}.",

  // Renewal workflow updates
  renewal_stage: "Let's update {{customer.name}}'s renewal stage to reflect current progress.",
  contract_details: "I'll update the contract details for {{customer.name}}.",
  renewal_forecast: "Let's update the renewal forecast for {{customer.name}}.",

  // Generic
  general_update: "Let's update {{customer.name}}'s CRM record with the latest information.",
  default: "I'll update {{customer.name}}'s account information in the CRM.",
};

/**
 * Field groups by purpose
 */
const FIELD_GROUPS: Record<string, Array<{ category: string; fields: string[] }>> = {
  health_score_update: [
    {
      category: 'Health Metrics',
      fields: ['health_score', 'health_trend', 'last_health_check_date'],
    },
    {
      category: 'Risk Indicators',
      fields: ['churn_risk', 'engagement_level', 'product_adoption'],
    },
  ],
  risk_event_log: [
    {
      category: 'Event Details',
      fields: ['event_type', 'event_date', 'severity', 'description'],
    },
    {
      category: 'Impact Assessment',
      fields: ['impact_level', 'mitigation_plan', 'owner'],
    },
  ],
  contact_change: [
    {
      category: 'Contact Information',
      fields: ['primary_contact', 'contact_email', 'contact_phone', 'contact_title'],
    },
    {
      category: 'Relationship',
      fields: ['relationship_strength', 'last_contact_date'],
    },
  ],
  opportunity_log: [
    {
      category: 'Opportunity Details',
      fields: ['opportunity_type', 'estimated_value', 'probability', 'timeline'],
    },
    {
      category: 'Tracking',
      fields: ['stage', 'next_steps', 'owner'],
    },
  ],
  expansion_stage: [
    {
      category: 'Expansion Progress',
      fields: ['expansion_stage', 'estimated_arr', 'close_date', 'confidence'],
    },
  ],
  qbr_completed: [
    {
      category: 'QBR Summary',
      fields: ['qbr_date', 'attendees', 'key_outcomes', 'satisfaction_score'],
    },
    {
      category: 'Follow-up',
      fields: ['action_items', 'next_qbr_date'],
    },
  ],
  strategic_initiatives: [
    {
      category: 'Strategic Plan',
      fields: ['initiative_name', 'status', 'target_date', 'owner'],
    },
  ],
  renewal_stage: [
    {
      category: 'Renewal Progress',
      fields: ['renewal_stage', 'renewal_probability', 'expected_close_date'],
    },
    {
      category: 'Renewal Details',
      fields: ['renewal_arr', 'growth_percentage', 'contract_term'],
    },
  ],
  contract_details: [
    {
      category: 'Contract Information',
      fields: ['contract_start_date', 'contract_end_date', 'contract_value', 'payment_terms'],
    },
  ],
  default: [
    {
      category: 'Account Update',
      fields: ['last_updated', 'updated_by', 'notes'],
    },
  ],
};

/**
 * Update CRM Slide Builder
 *
 * Reusable slide for CRM updates across all workflow types.
 */
export const updateCRMSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'update-crm',
    name: 'Update CRM',
    category: 'action',
    description: 'Update CRM records with latest information',
    estimatedMinutes: 5,
    requiredFields: ['customer.name', 'customer.id'],
  },
  (context?: SlideContext) => {
    const purpose = (context?.purpose as string) || 'default';
    const updateFields = context?.variables?.updateFields || {};
    const autoUpdate = context?.variables?.autoUpdate || false;
    const showPreview = context?.variables?.showPreview !== false; // Default true
    const requireConfirmation = context?.variables?.requireConfirmation !== false; // Default true

    const introMessage = CRM_UPDATE_INTRO_MESSAGES[purpose] || CRM_UPDATE_INTRO_MESSAGES.default;
    const fieldGroups = FIELD_GROUPS[purpose] || FIELD_GROUPS.default;

    return {
      id: 'update-crm',
      title: 'Update CRM',
      description: 'Update CRM records with latest information',
      label: 'Update CRM',
      stepMapping: 'update-crm',
      chat: { initialMessage: undefined, branches: {} },
      artifacts: { sections: [] },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping update CRM records for customer success workflows.`,
        ``,
        `Update type: ${purpose}`,
        `Auto-update: ${autoUpdate ? 'Yes (will update automatically)' : 'No (requires review)'}`,
        ``,
        `Answer questions about:`,
        `- What fields are being updated and why`,
        `- How this update impacts reporting and metrics`,
        `- Best practices for CRM data quality`,
        `- What this update means for the customer relationship`,
        `- How to review or modify the update if needed`,
        ``,
        `Available context:`,
        `- Customer: {{customer.name}}`,
        `- Update fields: ${Object.keys(updateFields).length} field(s)`,
      ].join('\n'),

      artifactPanel: {
        title: 'CRM Update',
        content: [
          {
            type: 'intro' as const,
            content: introMessage,
          },
          {
            type: 'section' as const,
            title: 'Update Summary',
            subsections: [
              {
                title: 'Customer',
                items: [
                  {
                    label: 'Account',
                    value: '{{customer.name}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Update Type',
                    value: purpose.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    type: 'badge' as const,
                  },
                  {
                    label: 'Timestamp',
                    value: '{{current_timestamp}}',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          showPreview
            ? {
                type: 'section' as const,
                title: 'Fields to Update',
                subsections: fieldGroups.map(group => ({
                  title: group.category,
                  items: group.fields.map(field => {
                    const fieldKey = field as keyof typeof updateFields;
                    const hasValue = updateFields[fieldKey] !== undefined;
                    const value = hasValue ? updateFields[fieldKey] : '{{' + field + '}}';

                    return {
                      label: field
                        .split('_')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' '),
                      value: String(value),
                      type: (autoUpdate || !hasValue ? 'text' : 'editable-text') as 'text' | 'editable-text',
                      helpText: hasValue ? undefined : 'Will be populated from workflow data',
                    };
                  }),
                })),
              }
            : null,
          autoUpdate
            ? {
                type: 'section' as const,
                title: 'Auto-Update',
                subsections: [
                  {
                    title: 'Status',
                    items: [
                      {
                        label: 'Mode',
                        value: 'Automatic update enabled',
                        type: 'text' as const,
                        icon: 'info' as const,
                      },
                      {
                        label: 'Note',
                        value: 'CRM will be updated automatically when you complete this workflow',
                        type: 'text' as const,
                      },
                    ],
                  },
                ],
              }
            : null,
          {
            type: 'section' as const,
            title: 'Impact',
            subsections: [
              {
                title: 'What This Affects',
                items: [
                  {
                    label: 'Reporting',
                    value: 'Updates will be reflected in customer health dashboards and reports',
                    type: 'text' as const,
                  },
                  {
                    label: 'Timeline',
                    value: 'Activity will be logged in {{customer.name}}\'s account timeline',
                    type: 'text' as const,
                  },
                  {
                    label: 'Notifications',
                    value: context?.variables?.triggerNotifications
                      ? 'Team members will be notified of this update'
                      : 'No notifications will be sent',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          requireConfirmation
            ? {
                type: 'qa-section' as const,
                title: 'Confirmation',
                questions: [
                  {
                    id: 'crm-accuracy-check',
                    question: 'Are all the field values accurate and up-to-date?',
                    required: true,
                  },
                  {
                    id: 'crm-completeness-check',
                    question: 'Have you reviewed all the fields that will be updated?',
                    required: true,
                  },
                  !autoUpdate
                    ? {
                        id: 'crm-ready-check',
                        question: 'Are you ready to update the CRM with this information?',
                        required: true,
                      }
                    : null,
                ].filter(Boolean) as Array<{ id: string; question: string; required: boolean }>,
              }
            : null,
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: autoUpdate ? 'Continue (Auto-Update)' : 'Update CRM',
        canSkip: context?.variables?.canSkip || false,
        skipLabel: 'Skip CRM Update',
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Risk workflow - update health score
 * updateCRMSlide({
 *   purpose: 'health_score_update',
 *   variables: {
 *     updateFields: {
 *       health_score: 65,
 *       health_trend: 'declining',
 *       churn_risk: 'high',
 *       last_health_check_date: '2025-10-21'
 *     },
 *     autoUpdate: false,
 *     requireConfirmation: true
 *   }
 * })
 *
 * // Risk workflow - log risk event
 * updateCRMSlide({
 *   purpose: 'risk_event_log',
 *   variables: {
 *     updateFields: {
 *       event_type: 'Executive Departure',
 *       event_date: '2025-10-15',
 *       severity: 'high',
 *       description: 'VP of Engineering departed',
 *       impact_level: 'critical',
 *       mitigation_plan: 'Establish relationship with new contact'
 *     },
 *     autoUpdate: true,
 *     triggerNotifications: true
 *   }
 * })
 *
 * // Opportunity workflow - log expansion opportunity
 * updateCRMSlide({
 *   purpose: 'opportunity_log',
 *   variables: {
 *     updateFields: {
 *       opportunity_type: 'expansion',
 *       estimated_value: 75000,
 *       probability: 0.7,
 *       timeline: 'Q1 2026',
 *       stage: 'proposal_sent'
 *     },
 *     autoUpdate: false
 *   }
 * })
 *
 * // Strategic workflow - log QBR
 * updateCRMSlide({
 *   purpose: 'qbr_completed',
 *   variables: {
 *     updateFields: {
 *       qbr_date: '2025-10-21',
 *       attendees: 'VP Engineering, CSM, Solutions Architect',
 *       key_outcomes: 'Aligned on Q4 goals, identified 2 strategic initiatives',
 *       satisfaction_score: 9,
 *       next_qbr_date: '2026-01-21'
 *     },
 *     autoUpdate: true
 *   }
 * })
 *
 * // Renewal workflow - update renewal stage
 * updateCRMSlide({
 *   purpose: 'renewal_stage',
 *   variables: {
 *     updateFields: {
 *       renewal_stage: 'proposal_sent',
 *       renewal_probability: 0.85,
 *       expected_close_date: '2025-11-30',
 *       renewal_arr: 185000,
 *       growth_percentage: 10,
 *       contract_term: 12
 *     },
 *     autoUpdate: false,
 *     requireConfirmation: true
 *   }
 * })
 */
