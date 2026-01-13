/**
 * Identify Replacement Contact Slide - Risk-Specific Slide
 *
 * Used ONLY in risk workflows after an executive departure.
 *
 * Helps CSMs identify and plan outreach to the replacement contact or
 * new decision-maker at the account.
 *
 * Context customization:
 * - replacementKnown: Whether the replacement is already identified
 * - replacementContact: Information about the replacement (if known)
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Identify Replacement Contact Slide Builder
 *
 * Risk-specific slide for identifying who to contact after an executive departure.
 */
export const identifyReplacementSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'identify-replacement',
    name: 'Identify Replacement Contact',
    category: 'risk',
    description: 'Identify and plan outreach to replacement contact',
    estimatedMinutes: 4,
    requiredFields: ['customer.name', 'departed_contact.name'],
  },
  (context?: SlideContext) => {
    const replacementKnown = context?.variables?.replacementKnown || false;
    const urgency = context?.urgency || 'high';

    return {
      id: 'identify-replacement',
      title: 'Identify Replacement Contact',
      description: 'Identify and plan outreach to replacement contact',
      label: 'Identify Contact',
      stepMapping: 'identify-replacement',
      chat: { initialMessage: undefined, branches: {} },
      artifacts: { sections: [] },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping identify and plan outreach to a replacement contact after an executive departure.`,
        ``,
        `Situation:`,
        `- Customer: {{customer.name}}`,
        `- Departed Contact: {{departed_contact.name}}`,
        `- Replacement Known: ${replacementKnown ? 'Yes' : 'No'}`,
        `- Urgency: ${urgency}`,
        ``,
        `Your role is to help the CSM:`,
        `1. Identify who the replacement contact should be`,
        `2. Gather information about the new contact`,
        `3. Plan the outreach strategy`,
        `4. Prepare talking points for the first conversation`,
        ``,
        `Answer questions about:`,
        `- How to find the replacement contact information`,
        `- Best practices for reaching out to new contacts`,
        `- What to say in the initial outreach`,
        `- How to transition the relationship smoothly`,
        `- Red flags to watch for`,
      ].filter(Boolean).join('\n'),

      artifactPanel: {
        title: 'Replacement Contact Strategy',
        content: [
          {
            type: 'intro' as const,
            content: replacementKnown
              ? `Let's plan our outreach to {{replacement_contact.name}}, who is taking over from {{departed_contact.name}}.`
              : `Let's identify who should be our new primary contact at {{customer.name}} now that {{departed_contact.name}} has departed.`,
          },
          replacementKnown
            ? {
                type: 'section' as const,
                title: 'Replacement Contact',
                subsections: [
                  {
                    title: 'Contact Information',
                    items: [
                      {
                        label: 'Name',
                        value: '{{replacement_contact.name}}',
                        type: 'editable-text' as const,
                        helpText: 'Verify or update the replacement contact name',
                      },
                      {
                        label: 'Title',
                        value: '{{replacement_contact.title}}',
                        type: 'editable-text' as const,
                        helpText: 'Verify or update their title',
                      },
                      {
                        label: 'Email',
                        value: '{{replacement_contact.email}}',
                        type: 'editable-text' as const,
                        helpText: 'Verify or update their email',
                      },
                      {
                        label: 'LinkedIn',
                        value: '{{replacement_contact.linkedin}}',
                        type: 'editable-text' as const,
                        helpText: 'LinkedIn profile URL (optional)',
                      },
                    ],
                  },
                ],
              }
            : {
                type: 'section' as const,
                title: 'Identify New Contact',
                subsections: [
                  {
                    title: 'Research',
                    items: [
                      {
                        label: 'Action',
                        value: 'Research who is taking over the responsibilities',
                        type: 'text' as const,
                      },
                      {
                        label: 'Sources',
                        value: 'Check LinkedIn, company website, press releases, internal contacts',
                        type: 'text' as const,
                      },
                      {
                        label: 'Timeline',
                        value: urgency === 'high' ? 'Complete within 24-48 hours' : 'Complete within 1 week',
                        type: 'text' as const,
                      },
                    ],
                  },
                  {
                    title: 'Contact Details (Once Identified)',
                    items: [
                      {
                        label: 'Name',
                        value: '',
                        type: 'editable-text' as const,
                        helpText: 'Enter the replacement contact name',
                      },
                      {
                        label: 'Title',
                        value: '',
                        type: 'editable-text' as const,
                        helpText: 'Enter their title',
                      },
                      {
                        label: 'Email',
                        value: '',
                        type: 'editable-text' as const,
                        helpText: 'Enter their email address',
                      },
                    ],
                  },
                ],
              },
          {
            type: 'section' as const,
            title: 'Outreach Strategy',
            subsections: [
              {
                title: 'Approach',
                items: [
                  {
                    label: 'Timing',
                    value: urgency === 'high'
                      ? 'Reach out within 2-3 days of departure announcement'
                      : 'Reach out within 1 week',
                    type: 'text' as const,
                  },
                  {
                    label: 'Channel',
                    value: 'Email first, followed by LinkedIn connection request',
                    type: 'text' as const,
                  },
                  {
                    label: 'Goal',
                    value: 'Schedule introductory call to establish relationship',
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'Key Messages',
                items: [
                  {
                    label: 'Introduction',
                    value: 'Position yourself as trusted partner who worked closely with predecessor',
                    type: 'text' as const,
                  },
                  {
                    label: 'Value',
                    value: 'Highlight current success and value being delivered to {{customer.name}}',
                    type: 'text' as const,
                  },
                  {
                    label: 'Support',
                    value: 'Offer to provide context, answer questions, ensure smooth transition',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Preparation',
            subsections: [
              {
                title: 'Before First Contact',
                items: [
                  {
                    label: 'Research',
                    value: 'Review their background, previous companies, interests',
                    type: 'text' as const,
                  },
                  {
                    label: 'Account Review',
                    value: 'Prepare summary of account status, usage, recent wins',
                    type: 'text' as const,
                  },
                  {
                    label: 'Materials',
                    value: 'Have account overview, metrics dashboard, and success stories ready',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'qa-section' as const,
            title: 'Readiness Check',
            questions: [
              {
                id: 'replacement-identified',
                question: replacementKnown
                  ? 'Have you verified the replacement contact information is accurate?'
                  : 'Have you identified who the replacement contact should be?',
                required: true,
              },
              {
                id: 'replacement-research-done',
                question: 'Have you researched their background and prepared for the outreach?',
                required: true,
              },
              {
                id: 'replacement-timing-right',
                question: 'Is now the right time to reach out (not too soon, not too late)?',
                required: true,
              },
              {
                id: 'replacement-strategy-clear',
                question: 'Do you have a clear strategy for establishing this relationship?',
                required: true,
              },
            ],
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: 'Continue to Outreach',
        canSkip: false,
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Replacement is known
 * identifyReplacementSlide({
 *   urgency: 'high',
 *   variables: {
 *     replacementKnown: true
 *   }
 * })
 *
 * // Replacement needs to be identified
 * identifyReplacementSlide({
 *   urgency: 'high',
 *   variables: {
 *     replacementKnown: false
 *   }
 * })
 */
