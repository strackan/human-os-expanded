/**
 * Prepare Quote Slide V2 (Template-based)
 *
 * Uses Handlebars templates for chat messages and component references for artifacts.
 */

import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const prepareQuoteSlideV2: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'prepare-quote-v2',
    title: 'Renewal Quote',
    description: 'Generate renewal quote document',
    label: 'Quote',
    previousButton: 'Draft The Quote',
    stepMapping: 'renewal-quote',
    category: 'renewal',
    estimatedMinutes: 2,
    requiredFields: [
      'customer.name',
      'customer.primaryContact.firstName',
      'customer.primaryContact.lastName',
    ],
    optionalFields: [
      'customer.primaryContact.email',
      'customer.primaryContact.title',
      'customer.address',
    ],

    // Chat configuration using templates
    chat: {
      initialMessage: {
        text: {
          templateId: 'chat.quote.initial',
          context: context?.variables,
        },
        buttons: [
          { label: 'Draft Email To Marcus', value: 'continue', 'label-background': 'bg-blue-600 hover:bg-blue-700', 'label-text': 'text-white' },
        ],
        nextBranches: {
          'continue': 'continue',
        },
      },
      branches: {
        'continue': {
          response: {
            templateId: 'chat.quote.continue',
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
          id: 'renewal-quote',
          title: 'Renewal Quote',
          component: {
            componentId: 'artifact.quote',
            props: context?.variables?.customer ? {
              quoteNumber: `Q-${new Date().getFullYear()}-${(context.variables.customer.name || 'CUST').substring(0, 2).toUpperCase()}-001`,
              quoteDate: new Date().toLocaleDateString(),
              customerName: context.variables.customer.name,
              customerContact: {
                name: context.variables.customer.primaryContact?.name || context.variables.customer.primaryContact?.firstName + ' ' + context.variables.customer.primaryContact?.lastName,
                title: context.variables.customer.primaryContact?.title || 'Contact',
                email: context.variables.customer.primaryContact?.email || '',
              },
              customerAddress: context.variables.customer.address || {
                street: '1234 Technology Drive',
                city: 'San Francisco',
                state: 'CA',
                zip: '94105',
              },
              lineItems: [
                {
                  product: 'Renubu Platform License',
                  description: `Current annual subscription (${context.variables.customer.seatCount || 50} seats)`,
                  period: '12 months',
                  rate: context.variables.pricing?.currentPricePerSeat || 3700,
                  quantity: context.variables.customer.seatCount || 50,
                },
                {
                  product: 'Market Alignment Adjustment',
                  description: `Price adjustment to market average (+${context.variables.pricing?.increasePercent || 8}%)`,
                  period: '12 months',
                  rate: context.variables.pricing?.increasePerSeat || 296,
                  quantity: context.variables.customer.seatCount || 50,
                },
              ],
              pricing: {
                subtotal: context.variables.pricing?.proposedARR || 199800,
                increase: {
                  percentage: context.variables.pricing?.increasePercent || 8,
                  amount: context.variables.pricing?.increaseAmount || 14800,
                },
                total: context.variables.pricing?.proposedARR || 199800,
              },
              terms: [
                'Net 30 payment terms',
                'Annual contract commitment',
                'Includes premium support and quarterly business reviews',
              ],
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              readOnly: false,
            } : {
              // Default values for testing
              quoteNumber: 'Q-2025-OB-001',
              quoteDate: new Date().toLocaleDateString(),
              customerName: 'Obsidian Black',
              customerContact: { name: 'Marcus Chen', title: 'VP Engineering', email: 'marcus.chen@obsidianblack.com' },
              customerAddress: { street: '1234 Technology Drive', city: 'San Francisco', state: 'CA', zip: '94105' },
              lineItems: [
                { product: 'Renubu Platform License', description: 'Current annual subscription (50 seats)', period: '12 months', rate: 3700, quantity: 50 },
                { product: 'Market Alignment Adjustment', description: 'Price adjustment to market average (+8%)', period: '12 months', rate: 296, quantity: 50 },
              ],
              pricing: { subtotal: 199800, increase: { percentage: 8, amount: 14800 }, total: 199800 },
              terms: ['Net 30 payment terms', 'Annual contract commitment', 'Includes premium support and quarterly business reviews'],
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              readOnly: false,
            },
          },
          visible: true,
        },
      ],
    },

    tags: ['renewal', 'quote', 'document'],
    version: '2.0.0',
  };
};
