/**
 * Draft Email Slide V2 (Template-based)
 *
 * Uses Handlebars templates for chat messages and component references for artifacts.
 */

import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const draftEmailSlideV2: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'draft-email-v2',
    title: 'Email Draft',
    description: 'Draft renewal discussion email',
    label: 'Email',
    stepMapping: 'compose-email',
    category: 'action',
    estimatedMinutes: 2,
    requiredFields: [
      'customer.name',
      'customer.primaryContact.firstName',
      'customer.primaryContact.lastName',
    ],
    optionalFields: [
      'customer.primaryContact.email',
    ],

    // Chat configuration using templates
    chat: {
      initialMessage: {
        text: {
          templateId: 'chat.email.initial',
          context: context?.variables,
        },
        buttons: [
          { label: 'Looks Good - Finish Up', value: 'continue', 'label-background': 'bg-blue-600 hover:bg-blue-700', 'label-text': 'text-white' },
        ],
        nextBranches: {
          'continue': 'continue',
        },
      },
      branches: {
        'continue': {
          response: {
            templateId: 'chat.email.continue',
          },
          delay: 1,
          actions: ['nextSlide'],
        },
      },
    },

    // Artifact configuration using component references
    artifacts: {
      sections: [
        {
          id: 'email-draft',
          title: 'Email to Marcus Chen',
          component: {
            componentId: 'artifact.email',
            props: context?.variables?.customer ? {
              to: context.variables.customer.primaryContact?.email || '',
              cc: '',
              subject: `${context.variables.customer.name} Renewal - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
              body: `Hi ${context.variables.customer.primaryContact?.firstName},

I hope you're doing well! I wanted to reach out proactively about ${context.variables.customer.name}'s upcoming renewal.

First, congratulations on the strong adoption - you're at ${context.variables.customer.utilization}% platform utilization with consistent growth. The team is clearly getting value from Renubu.

**Looking Ahead:**
As we approach renewal, I've prepared a quote that reflects market-standard pricing for your usage level. This brings ${context.variables.customer.name} to the ${context.variables.pricing?.proposedPercentile}th percentile - right at the industry average for companies with your profile.

The proposed renewal is $${context.variables.pricing?.proposedARR?.toLocaleString()} annually ($${context.variables.pricing?.proposedPricePerSeat?.toLocaleString()}/seat for ${context.variables.customer.seatCount} seats), which represents a ${context.variables.pricing?.increasePercent}% adjustment from your current rate.

**Next Steps:**
I'd love to schedule a 30-minute call to:
• Discuss your roadmap for 2025
• Review the pricing and answer any questions
• Explore additional features that could support your growth

I've attached the formal quote for your review. Let me know what works for your calendar!

Best,
<User.First>

---
*Quote attached: Q-${new Date().getFullYear()}-${(context.variables.customer.name || 'CUST').substring(0, 2).toUpperCase()}-001*`,
              attachments: [`Q-${new Date().getFullYear()}-${(context.variables.customer.name || 'CUST').substring(0, 2).toUpperCase()}-001.pdf`],
            } : {
              // Default values for testing
              to: 'marcus.chen@obsidianblack.com',
              cc: '',
              subject: 'Obsidian Black Renewal - April 2025',
              body: `Hi Marcus,\n\nI hope you're doing well! I wanted to reach out proactively about Obsidian Black's upcoming renewal in April.\n\nFirst, congratulations on the strong adoption - you're at 87% platform utilization with consistent growth. The team is clearly getting value from Renubu.\n\n**Looking Ahead:**\nAs we approach renewal, I've prepared a quote that reflects market-standard pricing for your usage level. This brings Obsidian Black to the 50th percentile - right at the industry average for companies with your profile.\n\nThe proposed renewal is $199,800 annually ($3,996/seat for 50 seats), which represents an 8% adjustment from your current rate.\n\n**Next Steps:**\nI'd love to schedule a 30-minute call to:\n• Discuss your roadmap for 2025\n• Review the pricing and answer any questions\n• Explore additional features that could support your growth\n\nI've attached the formal quote for your review. Let me know what works for your calendar!\n\nBest,\n<User.First>\n\n---\n*Quote attached: Q-2025-OB-001*`,
              attachments: ['Q-2025-OB-001.pdf'],
            },
          },
          visible: true,
        },
      ],
    },

    tags: ['renewal', 'email', 'communication'],
    version: '2.0.0',
  };
};
