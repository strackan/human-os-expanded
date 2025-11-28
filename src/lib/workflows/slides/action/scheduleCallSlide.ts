/**
 * Schedule Call Slide - Reusable Action Slide
 *
 * Used across ALL workflow types for scheduling and preparing for calls.
 *
 * Reused in:
 * - Risk workflows (emergency calls, relationship-building calls)
 * - Opportunity workflows (expansion discussions, demo calls)
 * - Strategic workflows (QBRs, executive briefings, strategic planning sessions)
 * - Renewal workflows (renewal planning calls, contract reviews)
 *
 * Context customization:
 * - purpose: Determines call type (risk_assessment, expansion_discussion, qbr, renewal_planning, etc.)
 * - duration: Call length (15, 30, 60 minutes)
 * - urgency: How soon the call should be scheduled
 * - attendees: Who should attend
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Call intro messages by purpose
 */
const CALL_INTRO_MESSAGES: Record<string, string> = {
  // Risk workflow calls
  risk_assessment: "Let's schedule a call with {{primary_contact.name}} to assess the situation at {{customer.name}} and develop a mitigation plan.",
  emergency_outreach: "I recommend scheduling an urgent call with {{primary_contact.name}} to address the critical situation at {{customer.name}}.",
  relationship_building: "Let's set up an introductory call with {{primary_contact.name}} to establish a strong working relationship.",

  // Opportunity workflow calls
  expansion_discussion: "Let's schedule a call to discuss the expansion opportunity with {{primary_contact.name}} at {{customer.name}}.",
  demo_call: "I recommend scheduling a demo call to show {{primary_contact.name}} the additional capabilities that could benefit {{customer.name}}.",
  roi_review: "Let's set up a call to review the ROI analysis and expansion proposal with {{primary_contact.name}}.",

  // Strategic workflow calls
  qbr: "It's time to schedule {{customer.name}}'s Quarterly Business Review with {{primary_contact.name}}.",
  executive_briefing: "Let's schedule an executive briefing with {{primary_contact.name}} to discuss {{customer.name}}'s strategic priorities.",
  strategic_planning: "I recommend scheduling a strategic planning session with {{primary_contact.name}} and key stakeholders at {{customer.name}}.",
  annual_review: "Let's set up {{customer.name}}'s annual account review with {{primary_contact.name}}.",

  // Renewal workflow calls
  renewal_planning: "Let's schedule a renewal planning call with {{primary_contact.name}} to discuss {{customer.name}}'s upcoming contract renewal.",
  contract_review: "I recommend setting up a call to review contract terms and options with {{primary_contact.name}}.",
  renewal_kickoff: "Let's schedule a renewal kickoff call with {{primary_contact.name}} to begin the renewal process for {{customer.name}}.",

  // Generic
  default: "Let's schedule a call with {{primary_contact.name}} at {{customer.name}}.",
};

/**
 * Call agenda templates by purpose
 */
const AGENDA_TEMPLATES: Record<string, string[]> = {
  risk_assessment: [
    'Understand current situation and concerns',
    'Review account health and usage metrics',
    'Identify immediate action items',
    'Develop mitigation plan and timeline',
  ],
  emergency_outreach: [
    'Address critical issue or concern',
    'Discuss immediate remediation steps',
    'Establish communication plan going forward',
  ],
  relationship_building: [
    'Introductions and role overview',
    'Review current engagement and usage',
    'Understand goals and priorities',
    'Establish cadence for future check-ins',
  ],
  expansion_discussion: [
    'Review current utilization and success',
    'Discuss growth opportunities identified',
    'Present expansion options and pricing',
    'Outline next steps and timeline',
  ],
  demo_call: [
    'Review current use cases',
    'Demo relevant new capabilities',
    'Discuss potential applications',
    'Answer questions and address concerns',
  ],
  roi_review: [
    'Review ROI analysis and business case',
    'Discuss expansion proposal details',
    'Address questions and concerns',
    'Define decision timeline and process',
  ],
  qbr: [
    'Review previous quarter metrics and achievements',
    'Discuss current health score and utilization',
    'Address any challenges or concerns',
    'Set goals and priorities for next quarter',
    'Review strategic initiatives and timeline',
  ],
  executive_briefing: [
    'Account overview and current state',
    'Strategic priorities and alignment',
    'Key initiatives and timeline',
    'Executive asks and next steps',
  ],
  strategic_planning: [
    'Review annual goals and priorities',
    'Discuss strategic initiatives',
    'Develop joint success plan',
    'Define metrics and milestones',
  ],
  renewal_planning: [
    'Review current contract and usage',
    'Discuss renewal timeline and process',
    'Present renewal options',
    'Address questions and next steps',
  ],
  contract_review: [
    'Review current contract terms',
    'Discuss any needed changes or adjustments',
    'Present renewal pricing and options',
    'Outline approval and signature process',
  ],
  default: [
    'Review current state',
    'Discuss key topics',
    'Define next steps',
  ],
};

/**
 * Recommended duration by purpose (in minutes)
 */
const RECOMMENDED_DURATIONS: Record<string, number> = {
  risk_assessment: 30,
  emergency_outreach: 15,
  relationship_building: 30,
  expansion_discussion: 45,
  demo_call: 30,
  roi_review: 45,
  qbr: 60,
  executive_briefing: 30,
  strategic_planning: 60,
  annual_review: 90,
  renewal_planning: 45,
  contract_review: 30,
  renewal_kickoff: 30,
  default: 30,
};

/**
 * Schedule Call Slide Builder
 *
 * Reusable slide for scheduling and preparing for calls across all workflow types.
 */
export const scheduleCallSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'schedule-call',
    name: 'Schedule Call',
    category: 'action',
    description: 'Schedule and prepare for customer calls',
    estimatedMinutes: 15,
    requiredFields: [
      'customer.name',
      'primary_contact.name',
      'primary_contact.email',
      'csm.name',
    ],
  },
  (context?: SlideContext) => {
    const purpose = (context?.purpose as string) || 'default';
    const urgency = context?.urgency || 'normal'; // high, normal, low
    const duration = context?.variables?.duration || RECOMMENDED_DURATIONS[purpose] || 30;
    const includeExternalAttendees = context?.variables?.includeExternalAttendees || false;
    const requiresPreparation = context?.variables?.requiresPreparation !== false; // Default true

    const introMessage = CALL_INTRO_MESSAGES[purpose] || CALL_INTRO_MESSAGES.default;
    const agendaItems = AGENDA_TEMPLATES[purpose] || AGENDA_TEMPLATES.default;

    // Urgency-based scheduling suggestions
    const schedulingSuggestion =
      urgency === 'high'
        ? 'within the next 2-3 days'
        : urgency === 'low'
          ? 'within the next 2 weeks'
          : 'within the next week';

    return {
      id: 'schedule-call',
      title: 'Schedule Meeting',
      description: 'Schedule and prepare for customer calls',
      label: 'Meeting',
      stepMapping: 'schedule-call',
      showSideMenu: true,

      chat: {
        generateInitialMessage: true,
        llmPrompt: `You are helping schedule a meeting with {{customer.name}}.

Call type: ${purpose.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
Duration: ${duration} minutes
Urgency: ${urgency}
Suggested timing: ${schedulingSuggestion}

Provide a brief message (2-3 sentences) explaining that you're ready to help schedule this meeting. Mention the suggested timeframe and ask if they're ready to draft the calendar invite.`,
        initialMessage: {
          text: context?.variables?.message ||
            `Let's get this meeting on the books! Based on the renewal timeline, I recommend scheduling ${schedulingSuggestion}. I can help you draft the calendar invite and email to {{customer.primary_contact_name}}.`,
          buttons: [
            {
              label: 'Draft calendar invite',
              value: 'draft-invite',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white',
            },
            {
              label: 'I\'ll schedule it myself',
              value: 'self-schedule',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-700',
            },
          ],
          nextBranches: {
            'draft-invite': 'show-invite',
            'self-schedule': 'confirm-self',
          },
        },
        branches: {
          'show-invite': {
            response: `Here's a draft calendar invite for your ${duration}-minute meeting:\n\n**Subject:** {{customer.name}} - Renewal Discussion\n**Duration:** ${duration} minutes\n**Attendees:** {{customer.primary_contact_name}}, {{csm.name}}\n\n**Agenda:**\n${agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nWould you like me to help you send this?`,
            buttons: [
              {
                label: 'Looks good, continue',
                value: 'continue',
                'label-background': 'bg-green-600',
                'label-text': 'text-white',
              },
              {
                label: 'Edit the invite',
                value: 'edit-invite',
                'label-background': 'bg-gray-100',
                'label-text': 'text-gray-700',
              },
            ],
            nextBranches: {
              'continue': 'proceed',
              'edit-invite': 'editing',
            },
          },
          'confirm-self': {
            response: 'No problem! Make sure to schedule it ${schedulingSuggestion}. Ready to continue to the summary?',
            buttons: [
              {
                label: 'Continue to summary',
                value: 'continue',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'continue': 'proceed',
            },
          },
          'editing': {
            response: 'What would you like to change about the invite? You can adjust the duration, agenda items, or attendees.',
            buttons: [
              {
                label: 'Done editing',
                value: 'done-editing',
                'label-background': 'bg-blue-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'done-editing': 'proceed',
            },
          },
          'proceed': {
            response: 'Great! The meeting is ready to be scheduled. Let\'s move on to wrap up this workflow.',
            actions: ['nextSlide'],
          },
        },
        defaultMessage: 'Let me know if you have any questions about scheduling this meeting.',
        userTriggers: {},
      },

      artifacts: {
        sections: [
          {
            id: 'meeting-details',
            type: 'document' as const,
            title: 'Meeting Details',
            visible: true,
            content: `# Meeting: {{customer.name}} Renewal Discussion

## Overview
- **Type:** ${purpose.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
- **Duration:** ${duration} minutes
- **Urgency:** ${urgency.charAt(0).toUpperCase() + urgency.slice(1)}
- **Schedule by:** ${schedulingSuggestion}

## Attendees
- {{customer.primary_contact_name}} (Customer)
- {{csm.name}} (CSM)

## Agenda
${agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

## Preparation
- Review recent customer activity and usage metrics
- Prepare relevant slides and documents
- Review key messages and talking points
`,
            editable: true,
          },
        ],
      },

      layout: 'side-by-side',
      chatInstructions: [
        `You are helping schedule and prepare for a customer success call.`,
        ``,
        `Call details:`,
        `- Purpose: ${purpose}`,
        `- Duration: ${duration} minutes`,
        `- Urgency: ${urgency}`,
        `- Recommended timing: ${schedulingSuggestion}`,
        ``,
        `Answer questions about:`,
        `- Call agenda and objectives`,
        `- Who should attend from the customer side`,
        `- Pre-call preparation needed`,
        `- Best practices for this type of call`,
        `- Talking points and key messages`,
        `- Potential objections or concerns to address`,
        ``,
        `Available context:`,
        `- Customer: {{customer.name}}`,
        `- Primary Contact: {{primary_contact.name}} ({{primary_contact.email}})`,
        `- CSM: {{csm.name}}`,
      ].join('\n'),

      artifactPanel: {
        title: 'Call Details',
        content: [
          {
            type: 'intro' as const,
            content: introMessage,
          },
          {
            type: 'section' as const,
            title: 'Meeting Information',
            subsections: [
              {
                title: 'Details',
                items: [
                  {
                    label: 'Call Type',
                    value: purpose.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    type: 'text' as const,
                  },
                  {
                    label: 'Duration',
                    value: `${duration} minutes`,
                    type: 'text' as const,
                  },
                  {
                    label: 'Urgency',
                    value: urgency.charAt(0).toUpperCase() + urgency.slice(1),
                    type: 'badge' as const,
                    variant: urgency === 'high' ? 'destructive' : urgency === 'low' ? 'secondary' : 'default',
                  },
                  {
                    label: 'Schedule By',
                    value: schedulingSuggestion,
                    type: 'text' as const,
                    helpText: urgency === 'high' ? 'This is a high-priority call that should be scheduled ASAP' : undefined,
                  },
                ],
              },
              {
                title: 'Attendees',
                items: [
                  {
                    label: 'From Customer',
                    value: '{{primary_contact.name}} ({{primary_contact.email}})',
                    type: 'text' as const,
                  },
                  includeExternalAttendees
                    ? {
                        label: 'Additional Attendees',
                        value: context?.variables?.additionalAttendees || 'To be determined',
                        type: 'editable-text' as const,
                        helpText: 'Add any additional attendees needed for this call',
                      }
                    : null,
                  {
                    label: 'From Our Team',
                    value: '{{csm.name}}',
                    type: 'text' as const,
                  },
                ].filter(Boolean) as Array<{
                  label: string;
                  value: string;
                  type: string;
                  helpText?: string;
                  variant?: string;
                }>,
              },
            ],
          },
          {
            type: 'section' as const,
            title: 'Agenda',
            subsections: [
              {
                title: 'Topics to Cover',
                items: agendaItems.map((item, index) => ({
                  label: `${index + 1}`,
                  value: item,
                  type: 'text' as const,
                })),
              },
            ],
          },
          requiresPreparation
            ? {
                type: 'section' as const,
                title: 'Pre-Call Preparation',
                subsections: [
                  {
                    title: 'Action Items',
                    items: [
                      {
                        label: 'Research',
                        value: 'Review recent customer activity, usage metrics, and account health',
                        type: 'text' as const,
                      },
                      {
                        label: 'Materials',
                        value: context?.variables?.preparationMaterials || 'Prepare relevant slides, reports, or documents',
                        type: 'text' as const,
                      },
                      {
                        label: 'Talking Points',
                        value: 'Review key messages and prepare responses to potential questions',
                        type: 'text' as const,
                      },
                    ],
                  },
                ],
              }
            : null,
          {
            type: 'qa-section' as const,
            title: 'Call Readiness',
            questions: [
              {
                id: 'call-timing-check',
                question: `Is ${schedulingSuggestion} the right timeframe for this call?`,
                required: true,
              },
              {
                id: 'call-attendees-check',
                question: 'Are all the right people included in this meeting?',
                required: true,
              },
              {
                id: 'call-agenda-check',
                question: 'Does the agenda cover all necessary topics?',
                required: true,
              },
              requiresPreparation
                ? {
                    id: 'call-preparation-check',
                    question: 'Do you have everything you need to prepare for this call?',
                    required: true,
                  }
                : null,
            ].filter(Boolean) as Array<{ id: string; question: string; required: boolean }>,
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: 'Schedule Call',
        canSkip: context?.variables?.canSkip || false,
        skipLabel: 'Skip for Now',
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Risk workflow - emergency outreach
 * scheduleCallSlide({
 *   purpose: 'emergency_outreach',
 *   urgency: 'high',
 *   variables: {
 *     duration: 15,
 *     requiresPreparation: true
 *   }
 * })
 *
 * // Strategic workflow - QBR
 * scheduleCallSlide({
 *   purpose: 'qbr',
 *   urgency: 'normal',
 *   variables: {
 *     duration: 60,
 *     includeExternalAttendees: true,
 *     additionalAttendees: 'VP Engineering, Director of Operations',
 *     requiresPreparation: true,
 *     preparationMaterials: 'QBR deck, metrics dashboard, strategic roadmap'
 *   }
 * })
 *
 * // Renewal workflow - renewal planning
 * scheduleCallSlide({
 *   purpose: 'renewal_planning',
 *   urgency: 'normal',
 *   variables: {
 *     duration: 45,
 *     requiresPreparation: true
 *   }
 * })
 *
 * // Opportunity workflow - expansion discussion
 * scheduleCallSlide({
 *   purpose: 'expansion_discussion',
 *   urgency: 'normal',
 *   variables: {
 *     duration: 45,
 *     includeExternalAttendees: true,
 *     requiresPreparation: true,
 *     preparationMaterials: 'ROI analysis, expansion proposal, pricing options'
 *   }
 * })
 */
