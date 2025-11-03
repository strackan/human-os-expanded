/**
 * Email Prompt Templates
 *
 * Structured prompts for AI email generation.
 * Each template includes customer context and specific guidance for tone/content.
 */

import type { EmailType, EmailCustomerContext, EmailTone } from '@/types/email';

/**
 * Build email generation prompt
 *
 * @param emailType - Type of email to generate
 * @param context - Customer context data
 * @param customInstructions - Optional user-provided instructions
 * @returns Formatted prompt for Claude API
 */
export function buildEmailPrompt(
  emailType: EmailType,
  context: EmailCustomerContext,
  customInstructions?: string
): string {
  const baseContext = formatCustomerContext(context);
  const typeSpecific = getEmailTypeInstructions(emailType, context);

  return `${baseContext}

${typeSpecific}

${customInstructions ? `\nAdditional Instructions:\n${customInstructions}\n` : ''}

IMPORTANT OUTPUT FORMAT:
Return ONLY the email in this exact format (no other text):

SUBJECT: [subject line here]

BODY:
[email body here]

Requirements:
- Subject must be under 60 characters
- Body must be 150-250 words
- Include specific data points from customer context
- Be professional and personalized
- Include clear call-to-action
- Use ${getDefaultTone(emailType)} tone`;
}

/**
 * Format customer context for prompt
 */
function formatCustomerContext(context: EmailCustomerContext): string {
  const { customer, primaryContact, recipientContact, daysUntilRenewal } = context;

  const contact = recipientContact || primaryContact;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'the customer';
  const contactTitle = contact?.title || 'decision maker';

  return `You are a Customer Success Manager writing an email to ${contactName} (${contactTitle}) at ${customer.name}.

CUSTOMER CONTEXT:
- Company: ${customer.name}
- Industry: ${customer.industry || 'Not specified'}
- Annual Recurring Revenue (ARR): $${customer.current_arr?.toLocaleString() || 'N/A'}
- Health Score: ${customer.health_score || 'N/A'}/100 ${context.healthTrend ? `(${context.healthTrend})` : ''}
- Renewal Date: ${customer.renewal_date || 'Not set'}${daysUntilRenewal ? ` (${daysUntilRenewal} days from now)` : ''}
- Account Plan: ${customer.account_plan || 'Not set'}
${context.recentActivity?.length ? `\nRECENT ACTIVITY:\n${formatRecentActivity(context.recentActivity)}` : ''}
${context.openRisks?.length ? `\nOPEN RISKS:\n${context.openRisks.map(r => `- ${r}`).join('\n')}` : ''}
${context.opportunities?.length ? `\nOPPORTUNITIES:\n${context.opportunities.map(o => `- ${o}`).join('\n')}` : ''}`;
}

/**
 * Format recent activity for context
 */
function formatRecentActivity(activities: EmailCustomerContext['recentActivity']): string {
  if (!activities || activities.length === 0) return '';

  return activities
    .slice(0, 3) // Max 3 recent items
    .map(activity => {
      const impact = activity.impact ? ` [${activity.impact}]` : '';
      return `- ${activity.type}: ${activity.summary}${impact}`;
    })
    .join('\n');
}

/**
 * Get email-type-specific instructions
 */
function getEmailTypeInstructions(
  emailType: EmailType,
  context: EmailCustomerContext
): string {
  switch (emailType) {
    case 'renewal_kickoff':
      return getRenewalKickoffInstructions(context);

    case 'pricing_discussion':
      return getPricingDiscussionInstructions(context);

    case 'qbr_invitation':
      return getQBRInvitationInstructions(context);

    case 'risk_mitigation':
      return getRiskMitigationInstructions(context);

    case 'expansion_pitch':
      return getExpansionPitchInstructions(context);

    default:
      return 'Write a professional email addressing the customer\'s needs.';
  }
}

/**
 * Renewal Kickoff Email Instructions
 */
function getRenewalKickoffInstructions(context: EmailCustomerContext): string {
  const { daysUntilRenewal } = context;

  return `TASK: Write a renewal kickoff email

PURPOSE:
- Start renewal conversation early (${daysUntilRenewal || 90} days before renewal)
- Build confidence in continued partnership
- Set expectations for renewal process
- Schedule a renewal planning call

STRUCTURE:
1. Opening: Reference partnership duration and value delivered
2. Context: Mention renewal date and timeline
3. Process: Outline what happens next (review, planning, contract)
4. Call-to-action: Propose specific meeting times in next 2 weeks

TONE: Professional, partnership-focused, forward-looking

AVOID: Being too sales-y, creating urgency/pressure, focusing only on price`;
}

/**
 * Pricing Discussion Email Instructions
 */
function getPricingDiscussionInstructions(context: EmailCustomerContext): string {
  const { customer } = context;

  return `TASK: Write a pricing discussion email

PURPOSE:
- Discuss contract terms, ARR changes, or pricing adjustments
- Be transparent about pricing rationale
- Maintain trust while addressing business reality
- Find mutually beneficial solution

STRUCTURE:
1. Opening: Acknowledge the business relationship
2. Context: Reference current ARR (${customer.current_arr ? `$${customer.current_arr.toLocaleString()}` : 'contract value'})
3. Discussion: Present pricing considerations clearly
4. Collaboration: Invite discussion and questions
5. Call-to-action: Schedule call to discuss details

TONE: Formal, transparent, collaborative (not defensive)

AVOID: Hard sells, ultimatums, apologizing excessively, being vague about numbers`;
}

/**
 * QBR Invitation Email Instructions
 */
function getQBRInvitationInstructions(context: EmailCustomerContext): string {
  return `TASK: Write a Quarterly Business Review (QBR) invitation

PURPOSE:
- Invite customer to review quarterly progress
- Show investment in their success
- Align on goals for next quarter
- Strengthen relationship

STRUCTURE:
1. Opening: Friendly greeting, reference quarter ending
2. Value: Briefly mention what you'll review (wins, metrics, goals)
3. Format: Explain meeting structure (60 min, specific agenda)
4. Call-to-action: Propose 2-3 specific time slots

TONE: Casual but professional, enthusiastic, collaborative

AVOID: Making it feel like a chore, being too formal, vague meeting purpose`;
}

/**
 * Risk Mitigation Email Instructions
 */
function getRiskMitigationInstructions(context: EmailCustomerContext): string {
  const { customer, openRisks } = context;
  const healthScore = customer.health_score || 0;

  return `TASK: Write a risk mitigation email

PURPOSE:
- Address declining health score (${healthScore}/100) or escalation
- Demonstrate care and responsiveness
- Propose concrete action plan
- Rebuild confidence in partnership

STRUCTURE:
1. Opening: Acknowledge specific issue/concern directly
2. Empathy: Show understanding of impact on their business
3. Ownership: Take responsibility where appropriate
4. Action Plan: Outline specific steps to resolve
5. Timeline: Set clear expectations for resolution
6. Call-to-action: Immediate next step (call within 24-48 hours)

TONE: Urgent but calm, empathetic, action-oriented

SPECIFIC ISSUES TO ADDRESS:
${openRisks?.length ? openRisks.map(r => `- ${r}`).join('\n') : '- General health score concerns'}

AVOID: Making excuses, being defensive, overpromising, being vague about next steps`;
}

/**
 * Expansion Pitch Email Instructions
 */
function getExpansionPitchInstructions(context: EmailCustomerContext): string {
  const { customer, opportunities } = context;

  return `TASK: Write an expansion opportunity email

PURPOSE:
- Present upsell or expansion opportunity
- Connect expansion to their business goals
- Make value case compelling but not pushy
- Start conversation, not close deal

STRUCTURE:
1. Opening: Reference current success/wins
2. Insight: Share observation about their growth/needs
3. Opportunity: Present expansion as natural next step
4. Value: Connect to specific business outcomes
5. Call-to-action: Low-pressure exploratory conversation

TONE: Casual, consultative, opportunity-focused (not sales-y)

OPPORTUNITIES TO HIGHLIGHT:
${opportunities?.length ? opportunities.map(o => `- ${o}`).join('\n') : '- Potential for expansion based on usage trends'}

CURRENT ARR: $${customer.current_arr?.toLocaleString() || 'N/A'}
EXPANSION POTENTIAL: Consider 20-50% ARR increase if relevant

AVOID: Hard selling, pressure tactics, focusing on features vs outcomes, being too lengthy`;
}

/**
 * Get default tone for email type
 */
function getDefaultTone(emailType: EmailType): EmailTone {
  const toneMap: Record<EmailType, EmailTone> = {
    renewal_kickoff: 'formal',
    pricing_discussion: 'formal',
    qbr_invitation: 'casual',
    risk_mitigation: 'urgent',
    expansion_pitch: 'casual',
  };

  return toneMap[emailType];
}

/**
 * Get system prompt for email generation
 */
export function getEmailSystemPrompt(): string {
  return `You are an expert Customer Success Manager with 10+ years of experience. You write clear, personalized, effective emails that build customer relationships and drive business outcomes.

Your writing style:
- Professional but warm and human
- Concise and scannable (short paragraphs, bullet points when helpful)
- Data-informed (reference specific metrics and context)
- Action-oriented (always include clear next steps)
- Personalized (use customer's name, company, industry context)

You understand:
- Customer success best practices
- SaaS business models and renewal dynamics
- How to balance business goals with customer advocacy
- When to be formal vs casual based on context
- The importance of trust and transparency`;
}
