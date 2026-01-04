/**
 * Obsidian Black Renewal - V2 (Template-based)
 *
 * Clean composition using V2 slides with template and component references.
 * Reduced from 404 lines to 70 lines by eliminating override structures.
 *
 * Slides 1-2: Legacy V1 (greeting, review-account)
 * Slides 3-6: New V2 (pricing-analysis, prepare-quote, draft-email, workflow-summary)
 */

import { WorkflowComposition } from '../slides/baseSlide';

export const obsidianBlackRenewalComposition: WorkflowComposition = {
  id: 'obsidian-black-renewal',
  name: 'Obsidian Black Renewal',
  moduleId: 'customer-success',
  category: 'renewal',
  description: 'Renewal workflow using V2 template-based architecture',

  /**
   * 6 slides total - V2 slides for 3-6
   */
  slideSequence: [
    'greeting',              // 1. Start - with Planning Checklist
    'review-account',        // 2. Account Overview
    'pricing-analysis-v2',   // 3. Pricing Analysis (V2 - templates)
    'prepare-quote-v2',      // 4. Quote (V2 - templates)
    'draft-email-v2',        // 5. Email (V2 - templates)
    'workflow-summary-v2',   // 6. Summary (V2 - templates)
  ],

  /**
   * Minimal contexts - V2 slides handle structure via templates
   */
  slideContexts: {
    'greeting': {
      purpose: 'renewal_preparation',
      urgency: 'critical',
      variables: {
        showPlanningChecklist: true,
        checklistItems: [
          'Review account health and contract details',
          'Analyze current pricing vs. market benchmarks',
          'Generate optimized renewal quote',
          'Draft personalized outreach email',
          'Create action plan and next steps'
        ],
        checklistTitle: "Here's what we'll accomplish together:",
        greetingText: `Good afternoon, Justin. You've got one critical task for today:

**Renewal Planning for {{customer.name}}.**

We need to review contract terms, make sure we've got the right contacts, and put our initial forecast in.

The full plan is on the right. Ready to get started?`,
        buttons: [
          { label: 'Review Later', value: 'snooze', 'label-background': 'bg-gray-500 hover:bg-gray-600', 'label-text': 'text-white' },
          { label: "Let's Begin!", value: 'start', 'label-background': 'bg-blue-600 hover:bg-blue-700', 'label-text': 'text-white' }
        ]
      }
    },
    'review-account': {
      purpose: 'renewal',
      variables: {
        ask_for_assessment: false,
        focus_metrics: ['arr', 'price_per_seat', 'renewal_date', 'health_score', 'utilization', 'yoy_growth'],
        insightText: `Please review {{customer.name}}'s current status to the right:

**Key Insights:**
• 20% usage increase over prior month
• 4 months to renewal - time to engage
• Paying less per unit than 65% of customers - Room for expansion
• Recent negative comments in support - May need to investigate
• Key contract items - 5% limit on price increases. Consider amendment.

Make sure you've reviewed the contract and stakeholder. When you're ready, click to move onto pricing.`,
        buttonLabel: 'Analyze Pricing Strategy'
      }
    },
    // V2 slides - context (customer/pricing) will be merged at runtime from template context
  },

  settings: {
    layout: {
      modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
      dividerPosition: 50,
      chatWidth: 50,
      splitModeDefault: true,
    },
    chat: {
      placeholder: 'Ask me anything about this pricing opportunity...',
      aiGreeting: "Good morning! Your ONE critical task today: Optimize pricing for {{customer.name}}'s upcoming renewal. They're significantly underpriced and now is the perfect time to act.",
    }
  }
};
