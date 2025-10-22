/**
 * Chat Message Templates
 *
 * Handlebars templates for workflow chat messages.
 * These templates are referenced by ID in slide definitions.
 */

import { registerTemplates } from './TemplateRegistry';

/**
 * All chat message templates
 */
export const chatTemplates = {
  // Pricing Analysis Slide
  'chat.pricing-analysis.initial': `**Pricing Analysis Complete!**

**My Recommendation: +{{pricing.increasePercent}}% increase to {{currency pricing.proposedARR}} ARR**

**Why this works:**
• Brings them to {{pricing.proposedPercentile}}th percentile (market average)
• Justifiable by strong usage ({{customer.utilization}}% utilization)
• Well within healthy relationship tolerance
• Perfectly timed at {{customer.monthsToRenewal}} months before renewal

**The math:**
• Current: {{currency pricing.currentARR}} ARR ({{currency pricing.currentPricePerSeat}}/seat × {{customer.seatCount}} seats)
• Proposed: {{currency pricing.proposedARR}} ARR ({{currency pricing.proposedPricePerSeat}}/seat × {{customer.seatCount}} seats)
• Increase: {{currency pricing.increaseAmount}} annually ({{currency pricing.increasePerSeat}}/seat)

Review the detailed analysis on the right, then we'll draft the quote.`,

  'chat.pricing-analysis.continue': `Perfect! Let me generate the renewal quote...`,

  'chat.pricing-analysis.adjust': `Sure! What would you like to adjust? I can help you model different scenarios.`,

  'chat.pricing-analysis.handle-adjustment': `Got it. Let me update the analysis with your input.`,

  // Quote Slide
  'chat.quote.initial': `**Quote Generated!**

I've prepared a renewal quote for {{customer.name}} on the right.

**Here's the magic:** This isn't a static PDF. You can:
• **Double-click any text** to edit it inline
• **Click the table rows** to change background colors
• Customize it for your customer's brand

Try editing the product description or changing the header color. When you're ready, we'll draft the email to {{customer.primaryContact.firstName}}.`,

  'chat.quote.continue': `Perfect! Let me draft a personalized email to {{customer.primaryContact.firstName}} {{customer.primaryContact.lastName}}...`,

  // Email Slide
  'chat.email.initial': `**Email Draft Ready!**

I've drafted a personalized email to {{customer.primaryContact.firstName}} {{customer.primaryContact.lastName}} about the renewal discussion. It:
• References their strong usage and growth
• Positions the pricing as market-aligned
• Suggests a call to discuss their roadmap
• Attaches the quote for transparency

Review it on the right, edit if needed, then we'll wrap up.`,

  'chat.email.continue': `Great! Let me summarize what we've accomplished...`,

  // Summary Slide
  'chat.summary.initial': `**Pricing Optimization Complete!**

Your renewal strategy for {{customer.name}} is ready. Review the summary on the right to see:
• What we accomplished together
• What I'll handle automatically (CRM updates, reminders)
• What you need to do (schedule the call with {{customer.primaryContact.firstName}})

This is how Renubu works - **ONE critical task, done in under 2 minutes**. No dashboards, no busywork, just the work that matters.`,

  'chat.summary.complete': `Perfect! I'll handle the follow-up and check back in 3 days. Great work!`,
};

/**
 * Register all chat templates on module load
 *
 * IMPORTANT: This function runs automatically when this module is imported.
 * Make sure to import this module in any entry point that uses V2 slides:
 * - db-composer.ts (for browser/Next.js)
 * - test scripts (for Node.js)
 */
export function registerChatTemplates(): void {
  registerTemplates(chatTemplates);
  console.log('[V2] Registered', Object.keys(chatTemplates).length, 'chat templates');
}

// Auto-register on import
registerChatTemplates();
