/**
 * Prepare Quote Slide - Reusable across multiple workflow types
 *
 * Purpose: Generate and review a quote document
 *
 * Reusable across:
 * - Renewal workflows (renewal quote)
 * - Opportunity/Expansion workflows (expansion quote)
 * - Risk workflows (retention offer quote)
 * - Strategic workflows (multi-year deal quote)
 *
 * Context Variables:
 * - quote_type: 'renewal', 'expansion', 'retention', 'multi_year'
 * - proposed_arr: Number (if known)
 * - seats: Number (if known)
 * - allow_editing: true/false
 */

import {
  SlideBuilder,
  SlideContext,
  createSlideBuilder,
  applyContextVariables,
  COMMON_PLACEHOLDERS,
} from '../baseSlide';

const QUOTE_INTRO_MESSAGES = {
  renewal: "I've prepared a renewal quote for {{customer.name}} based on their current contract and market rates. Review it on the right and make any adjustments needed.",
  expansion: "Here's an expansion quote for {{customer.name}} to support their growth. The pricing reflects their current tier and projected usage.",
  retention: "I've drafted a retention offer for {{customer.name}}. This includes strategic pricing to address the churn risk.",
  multi_year: "This multi-year quote for {{customer.name}} includes volume discounts and locks in favorable terms.",
  default: "I've prepared a quote for {{customer.name}}. Please review and make any necessary adjustments.",
};

export const prepareQuoteSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'prepare-quote',
    name: 'Prepare Quote',
    category: 'action',
    description: 'Generate and review a quote document for the customer',
    estimatedMinutes: 3,
    requiredFields: [
      'customer.name',
      'customer.current_arr',
      'primary_contact.name',
      'primary_contact.email',
    ],
    optionalFields: [
      'quote.proposed_arr',
      'quote.seats',
      'quote.contract_length',
      'quote.discount_percent',
      'contract.current_seats',
      'contract.current_price_per_seat',
    ],
    tags: ['quote', 'pricing', 'proposal', 'document'],
    version: '1.0.0',
  },
  (context?: SlideContext) => {
    const quoteType = context?.purpose || 'default';
    const allowEditing = context?.variables?.allow_editing !== false;

    let introText = QUOTE_INTRO_MESSAGES[quoteType as keyof typeof QUOTE_INTRO_MESSAGES] || QUOTE_INTRO_MESSAGES.default;
    introText = applyContextVariables(introText, context);

    return {
      id: 'prepare-quote',
      title: 'Prepare Quote',
      description: 'Review and finalize quote document',
      label: 'Quote',
      stepMapping: 'prepare-quote',

      chat: {
        initialMessage: {
          text: introText + (allowEditing ? "\n\nYou can edit any field directly in the quote." : ""),
          buttons: [
            { label: 'Looks Good', value: 'approve', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
            ...(allowEditing ? [
              { label: 'Make Changes', value: 'edit', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
            ] : []),
          ],
          nextBranches: {
            'approve': 'quote-approved',
            ...(allowEditing && { 'edit': 'quote-edit' }),
          }
        },
        branches: {
          'quote-approved': {
            response: "Perfect! The quote is ready. Let's move to the next step.",
            storeAs: 'quote.status',
            actions: ['nextSlide']
          },
          'quote-edit': {
            response: "No problem. Make your edits directly in the quote on the right. Click Continue when ready.",
            buttons: [
              { label: 'Continue', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'continue': 'quote-approved'
            }
          }
        }
      },

      artifacts: {
        sections: [
          {
            id: 'quote-document',
            title: `Quote for ${COMMON_PLACEHOLDERS.CUSTOMER_NAME}`,
            type: 'quote',
            visible: true,
            editable: allowEditing,
            data: {
              componentType: 'QuoteArtifact',
              props: {
                // Will be populated at runtime
                quoteNumber: '{{quote.number}}',
                customerName: COMMON_PLACEHOLDERS.CUSTOMER_NAME,
                contactName: COMMON_PLACEHOLDERS.PRIMARY_CONTACT,
                contactEmail: COMMON_PLACEHOLDERS.PRIMARY_CONTACT_EMAIL,
                currentARR: COMMON_PLACEHOLDERS.CUSTOMER_ARR,
                proposedARR: '{{quote.proposed_arr}}',
                seats: '{{quote.seats}}',
                pricePerSeat: '{{quote.price_per_seat}}',
                contractLength: '{{quote.contract_length}}',
                validUntil: '{{quote.valid_until}}',
                terms: '{{quote.terms}}', // Array of terms
                lineItems: '{{quote.line_items}}', // Array of line items
              }
            }
          }
        ]
      }
    };
  }
);
