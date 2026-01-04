/**
 * Email Composer Stage Configuration
 *
 * Generates a reusable email draft artifact for workflows
 */

export interface EmailComposerConfig {
  to: string;
  subject: string;
  body: string;
  editable?: boolean;
}

/**
 * Creates an email composer artifact section
 *
 * @param config - Email composer configuration
 * @returns Artifact section for email drafting
 */
export function createEmailComposerStage(config: EmailComposerConfig) {
  return {
    id: 'email-draft',
    title: 'Email Composer',
    type: 'email' as const,
    visible: false,
    editable: config.editable !== false,
    content: {
      to: config.to,
      subject: config.subject,
      body: config.body
    }
  };
}

/**
 * Default email configuration for Dynamic Corp renewal
 */
export const dynamicCorpEmailConfig: EmailComposerConfig = {
  to: 'michael.roberts@dynamiccorp.com',
  subject: 'Dynamic Corp - Expansion Opportunity & Strategic Renewal Discussion',
  body: `Hi Michael,

I hope this email finds you well! I've been reviewing Dynamic Corp's impressive performance metrics, and I'm excited about the 65% growth you've achieved this year. Your expansion into APAC and the recent Series C funding announcement clearly demonstrate Dynamic Corp's trajectory toward becoming a market leader.

Given your current usage patterns and the approaching renewal date, I'd love to discuss how we can support your continued growth with a strategic renewal package that aligns with your expansion goals.

I'm proposing a multi-year expansion deal that would:
• Provide capacity for your anticipated growth
• Include priority support for your APAC operations
• Offer significant cost savings through our enterprise pricing

Are you available for a brief call next week to explore how we can structure this to support Dynamic Corp's continued success?

Best regards,
{{user.first}}

P.S. I've also prepared some usage analytics that I think you'll find valuable for your planning discussions.`,
  editable: true
};
