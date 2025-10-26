/**
 * Draft Email Slide - Reusable Action Slide
 *
 * Used across ALL workflow types for composing and reviewing emails.
 *
 * Reused in:
 * - Risk workflows (outreach to new contacts, retention communications)
 * - Opportunity workflows (expansion proposals, business case emails)
 * - Strategic workflows (QBR follow-ups, strategic planning emails)
 * - Renewal workflows (renewal reminders, contract updates)
 *
 * Context customization:
 * - purpose: Determines email type (risk_outreach, expansion_proposal, renewal_reminder, etc.)
 * - recipient: Who should receive the email
 * - tone: Email tone (formal, casual, urgent)
 * - includeAttachment: Whether to reference attached materials
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Email intro messages by purpose
 */
const EMAIL_INTRO_MESSAGES: Record<string, string> = {
  // Risk workflow emails
  risk_outreach: "I've drafted an email to reach out to {{recipient.name}} at {{customer.name}} to establish a relationship and assess the current situation.",
  retention_offer: "I've prepared a retention email for {{recipient.name}} highlighting our value proposition and discussing renewal terms.",

  // Opportunity workflow emails
  expansion_proposal: "I've drafted an expansion proposal email for {{recipient.name}} outlining the business case for increasing their investment.",
  upsell_introduction: "Here's an email introducing additional capabilities that could benefit {{customer.name}}.",

  // Strategic workflow emails
  qbr_followup: "I've prepared a QBR follow-up email for {{recipient.name}} summarizing our discussion and next steps.",
  strategic_planning: "I've drafted an email to {{recipient.name}} proposing a strategic planning session.",

  // Renewal workflow emails
  renewal_reminder: "I've prepared a renewal reminder email for {{recipient.name}} about {{customer.name}}'s upcoming contract renewal.",
  contract_review: "Here's an email proposing a contract review meeting with {{recipient.name}}.",

  // Generic
  default: "I've drafted an email for {{recipient.name}} at {{customer.name}}.",
};

/**
 * Subject line templates by purpose
 */
const SUBJECT_TEMPLATES: Record<string, string> = {
  risk_outreach: "Connecting on {{customer.name}}'s Success",
  retention_offer: "Let's Discuss {{customer.name}}'s Renewal",
  expansion_proposal: "Opportunity: Expanding {{customer.name}}'s Investment",
  upsell_introduction: "New Capabilities for {{customer.name}}",
  qbr_followup: "QBR Follow-up: {{customer.name}} Next Steps",
  strategic_planning: "Strategic Planning Discussion - {{customer.name}}",
  renewal_reminder: "{{customer.name}} Contract Renewal - {{customer.renewal_date}}",
  contract_review: "Contract Review Discussion",
  default: "Following up on {{customer.name}}",
};

/**
 * Email body templates by purpose
 * These are starting points that can be customized by the CSM
 */
const EMAIL_BODY_TEMPLATES: Record<string, string> = {
  risk_outreach: `Hi {{recipient.name}},

I hope this email finds you well. I'm reaching out as {{customer.name}}'s Customer Success Manager.

I wanted to introduce myself and see if we could schedule a brief call to discuss how things are going with our platform and ensure you're getting maximum value from your investment.

Would you have 15-20 minutes this week or next for a quick conversation?

Best regards,
{{csm.name}}`,

  retention_offer: `Hi {{recipient.name}},

As we approach {{customer.name}}'s renewal date ({{customer.renewal_date}}), I wanted to reach out to discuss how we can continue to deliver value to your team.

I've prepared some options that I think will work well for your needs, and I'd love to schedule time to walk through them with you.

Are you available for a 30-minute call this week?

Best regards,
{{csm.name}}`,

  expansion_proposal: `Hi {{recipient.name}},

Based on our recent conversations and {{customer.name}}'s growth trajectory, I've identified an opportunity to expand your investment that could deliver significant ROI.

I've prepared a business case that outlines:
- Current utilization and success metrics
- Expansion options and pricing
- Projected ROI and timeline

Would you have time next week to review this together?

Best regards,
{{csm.name}}`,

  renewal_reminder: `Hi {{recipient.name}},

I wanted to reach out regarding {{customer.name}}'s upcoming renewal on {{customer.renewal_date}}.

I'd like to schedule time to:
- Review your current contract and usage
- Discuss any changes or adjustments needed
- Walk through renewal options and pricing

Could we schedule 30 minutes in the next few days?

Best regards,
{{csm.name}}`,

  qbr_followup: `Hi {{recipient.name}},

Thank you for taking the time to meet for our Quarterly Business Review. I wanted to follow up on the key action items we discussed:

{{action_items}}

I'll be tracking progress on these and will check in with you in {{followup_timeline}}.

Please let me know if you have any questions or if there's anything else I can help with.

Best regards,
{{csm.name}}`,

  default: `Hi {{recipient.name}},

I wanted to reach out regarding {{customer.name}}.

{{email_body_placeholder}}

Best regards,
{{csm.name}}`,
};

/**
 * Draft Email Slide Builder
 *
 * Reusable slide for composing and reviewing emails across all workflow types.
 */
export const draftEmailSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'draft-email',
    name: 'Draft Email',
    category: 'action',
    description: 'Compose and review email communications',
    estimatedMinutes: 10,
    requiredFields: [
      'customer.name',
      'recipient.name',
      'recipient.email',
      'csm.name',
      'csm.email',
    ],
  },
  (context?: SlideContext) => {
    const purpose = (context?.purpose as string) || 'default';
    const tone = context?.variables?.tone || 'professional';
    const includeAttachment = context?.variables?.includeAttachment || false;
    const allowEditing = context?.variables?.allowEditing !== false; // Default true

    const introMessage = EMAIL_INTRO_MESSAGES[purpose] || EMAIL_INTRO_MESSAGES.default;
    const subjectTemplate = SUBJECT_TEMPLATES[purpose] || SUBJECT_TEMPLATES.default;
    const bodyTemplate = EMAIL_BODY_TEMPLATES[purpose] || EMAIL_BODY_TEMPLATES.default;

    return {
      id: 'draft-email',
      title: 'Draft Email',
      description: 'Compose and review email',
      label: 'Email',
      stepMapping: 'draft-email',
      chat: { initialMessage: undefined, branches: {} },
      artifacts: { sections: [] },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping draft an email for a customer success workflow.`,
        `Purpose: ${purpose}`,
        `Tone: ${tone}`,
        allowEditing ? `The CSM can edit the email content before sending.` : `This is a final review - no major changes should be needed.`,
        ``,
        `The email should be:`,
        `- Professional and concise`,
        `- Action-oriented (clear next steps)`,
        `- Personalized to the customer's situation`,
        `- Aligned with the ${tone} tone`,
        ``,
        `Available context:`,
        `- Customer: {{customer.name}}`,
        `- Recipient: {{recipient.name}} ({{recipient.email}})`,
        `- CSM: {{csm.name}} ({{csm.email}})`,
        includeAttachment ? `- Email includes attachment/materials` : '',
        ``,
        `Answer questions about:`,
        `- Email content and messaging`,
        `- Best practices for this type of communication`,
        `- Suggested edits or improvements`,
        `- Timing and follow-up strategy`,
      ].filter(Boolean).join('\n'),

      artifactPanel: {
        title: 'Email Draft',
        content: [
          {
            type: 'intro' as const,
            content: introMessage,
          },
          {
            type: 'section' as const,
            title: 'Email Details',
            subsections: [
              {
                title: 'From',
                items: [
                  {
                    label: 'Sender',
                    value: '{{csm.name}} ({{csm.email}})',
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'To',
                items: [
                  {
                    label: 'Recipient',
                    value: '{{recipient.name}} ({{recipient.email}})',
                    type: 'text' as const,
                  },
                ],
              },
              {
                title: 'Subject',
                items: [
                  {
                    label: 'Subject Line',
                    value: subjectTemplate,
                    type: allowEditing ? 'editable-text' as const : 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Email Body',
            subsections: [
              {
                title: 'Message',
                items: [
                  {
                    label: 'Body',
                    value: bodyTemplate,
                    type: allowEditing ? 'editable-textarea' as const : 'text' as const,
                    helpText: allowEditing
                      ? 'Edit the email content as needed before sending'
                      : 'Review the email content below',
                  },
                ],
              },
            ],
          },
          includeAttachment
            ? {
                type: 'section' as const,
                title: 'Attachments',
                subsections: [
                  {
                    title: 'Materials',
                    items: [
                      {
                        label: 'Attached',
                        value: context?.variables?.attachmentDescription || 'Supporting materials attached',
                        type: 'text' as const,
                      },
                    ],
                  },
                ],
              }
            : null,
          {
            type: 'qa-section' as const,
            title: 'Review Checklist',
            questions: [
              {
                id: 'email-tone-check',
                question: 'Does the email tone match the situation and relationship?',
                required: true,
              },
              {
                id: 'email-clarity-check',
                question: 'Is the call-to-action clear and specific?',
                required: true,
              },
              {
                id: 'email-personalization-check',
                question: 'Is the email personalized to the customer\'s context?',
                required: true,
              },
              allowEditing
                ? {
                    id: 'email-ready-check',
                    question: 'Is the email ready to send, or do you need to make edits?',
                    required: true,
                  }
                : null,
            ].filter(Boolean) as Array<{ id: string; question: string; required: boolean }>,
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: allowEditing ? 'Email Looks Good' : 'Continue',
        canSkip: context?.variables?.canSkip || false,
        skipLabel: 'Skip Email',
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Risk workflow - outreach to new contact
 * draftEmailSlide({
 *   purpose: 'risk_outreach',
 *   variables: {
 *     tone: 'friendly',
 *     allowEditing: true
 *   }
 * })
 *
 * // Renewal workflow - renewal reminder
 * draftEmailSlide({
 *   purpose: 'renewal_reminder',
 *   variables: {
 *     tone: 'professional',
 *     allowEditing: true
 *   }
 * })
 *
 * // Opportunity workflow - expansion proposal
 * draftEmailSlide({
 *   purpose: 'expansion_proposal',
 *   variables: {
 *     tone: 'professional',
 *     includeAttachment: true,
 *     attachmentDescription: 'Business case and ROI analysis',
 *     allowEditing: true
 *   }
 * })
 */
