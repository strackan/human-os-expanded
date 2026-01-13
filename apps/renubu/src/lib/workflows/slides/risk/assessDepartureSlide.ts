/**
 * Assess Executive Departure Slide - Risk-Specific Slide
 *
 * Used ONLY in risk workflows when a key executive contact departs.
 *
 * This is an example of a workflow-specific slide that is NOT reused across
 * other workflow types. Compare this to slides like 'prepare-quote' or 'draft-email'
 * which are used everywhere.
 *
 * Context customization:
 * - departedContact: Information about the departed executive
 * - impactLevel: Severity of the departure (critical, high, medium, low)
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Assess Executive Departure Slide Builder
 *
 * Risk-specific slide for assessing the impact of an executive departure.
 */
export const assessDepartureSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'assess-departure',
    name: 'Assess Executive Departure',
    category: 'risk',
    description: 'Assess impact of executive departure',
    estimatedMinutes: 4,
    requiredFields: [
      'customer.name',
      'departed_contact.name',
      'departed_contact.title',
    ],
  },
  (context?: SlideContext) => {
    const impactLevel = context?.variables?.impactLevel || 'high';
    const departureDate = context?.variables?.departureDate;
    const relationshipStrength = context?.variables?.relationshipStrength || 'unknown';

    return {
      id: 'assess-departure',
      title: 'Assess Executive Departure',
      description: 'Assess impact of executive departure',
      label: 'Assess Impact',
      stepMapping: 'assess-departure',
      chat: { initialMessage: undefined, branches: {} },
      artifacts: { sections: [] },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping assess the impact of an executive departure at a customer account.`,
        ``,
        `Situation:`,
        `- Customer: {{customer.name}}`,
        `- Departed Contact: {{departed_contact.name}} ({{departed_contact.title}})`,
        `- Impact Level: ${impactLevel}`,
        `- Relationship Strength: ${relationshipStrength}`,
        departureDate ? `- Departure Date: ${departureDate}` : '',
        ``,
        `Your role is to help the CSM:`,
        `1. Assess the impact of this departure on the customer relationship`,
        `2. Identify immediate risks to the account`,
        `3. Determine next steps for maintaining continuity`,
        ``,
        `Answer questions about:`,
        `- How this departure might affect the relationship`,
        `- What immediate actions should be taken`,
        `- Who the new decision-maker might be`,
        `- How to position yourself with new contacts`,
        `- Risk mitigation strategies`,
      ].filter(Boolean).join('\n'),

      artifactPanel: {
        title: 'Executive Departure Assessment',
        content: [
          {
            type: 'intro' as const,
            content: `{{departed_contact.name}}, who served as {{departed_contact.title}} at {{customer.name}}, has recently departed. Let's assess the impact on our relationship.`,
          },
          {
            type: 'section' as const,
            title: 'Departure Details',
            subsections: [
              {
                title: 'Contact Information',
                items: [
                  {
                    label: 'Name',
                    value: '{{departed_contact.name}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Title',
                    value: '{{departed_contact.title}}',
                    type: 'text' as const,
                  },
                  departureDate
                    ? {
                        label: 'Departure Date',
                        value: departureDate,
                        type: 'text' as const,
                      }
                    : null,
                  {
                    label: 'Relationship Strength',
                    value: relationshipStrength.charAt(0).toUpperCase() + relationshipStrength.slice(1),
                    type: 'badge' as const,
                    variant:
                      relationshipStrength === 'strong'
                        ? 'default'
                        : relationshipStrength === 'medium'
                          ? 'secondary'
                          : 'destructive',
                  },
                ].filter(Boolean) as Array<{
                  label: string;
                  value: string;
                  type: string;
                  variant?: string;
                }>,
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Impact Assessment',
            subsections: [
              {
                title: 'Risk Factors',
                items: [
                  {
                    label: 'Impact Level',
                    value: impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1),
                    type: 'badge' as const,
                    variant:
                      impactLevel === 'critical'
                        ? 'destructive'
                        : impactLevel === 'high'
                          ? 'destructive'
                          : impactLevel === 'medium'
                            ? 'secondary'
                            : 'default',
                  },
                  {
                    label: 'Primary Risk',
                    value: 'Loss of champion and decision-maker relationship',
                    type: 'text' as const,
                  },
                  {
                    label: 'Secondary Risks',
                    value: 'New contact may review vendors, unclear who has authority now',
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'Account Context',
                items: [
                  {
                    label: 'Current Health Score',
                    value: '{{customer.health_score}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Contract Status',
                    value: '{{customer.contract_status}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Renewal Date',
                    value: '{{customer.renewal_date}}',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'qa-section' as const,
            title: 'Impact Questions',
            questions: [
              {
                id: 'departure-champion-status',
                question: 'Was this person a strong champion for our solution?',
                required: true,
              },
              {
                id: 'departure-decision-authority',
                question: 'Did this person have budget/contract decision authority?',
                required: true,
              },
              {
                id: 'departure-replacement-known',
                question: 'Do we know who is replacing them or taking over their responsibilities?',
                required: true,
              },
              {
                id: 'departure-relationship-backup',
                question: 'Do we have other strong relationships at this account?',
                required: true,
              },
            ],
          },
        ],
      },

      flowControl: {
        nextSlideLabel: 'Continue to Next Steps',
        canSkip: false,
      },
    };
  }
);

/**
 * Usage Example:
 *
 * assessDepartureSlide({
 *   variables: {
 *     impactLevel: 'critical',
 *     departureDate: '2025-10-15',
 *     relationshipStrength: 'strong'
 *   }
 * })
 */
