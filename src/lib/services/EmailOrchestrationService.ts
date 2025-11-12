/**
 * Email Orchestration Service
 *
 * Coordinates AI-powered email generation by:
 * 1. Fetching customer context from database
 * 2. Building structured prompts
 * 3. Calling Anthropic Claude API
 * 4. Parsing and structuring email responses
 */

import { CustomerService } from './CustomerService';
import { AnthropicService } from './AnthropicService';
import { buildEmailPrompt, getEmailSystemPrompt } from '@/lib/prompts/emailTemplates';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailType,
  GeneratedEmail,
  EmailCustomerContext,
  EmailTone,
  GenerateEmailRequest,
} from '@/types/email';
import type { Customer, CustomerWithContact, Contact } from '@/types/customer';

export class EmailOrchestrationService {
  /**
   * Generate an AI-powered email for a customer
   *
   * @param params - Email generation parameters
   * @param supabaseClient - Optional Supabase client
   * @returns Generated email with metadata
   * @throws Error if customer not found or generation fails
   */
  static async generateEmail(
    params: GenerateEmailRequest,
    supabaseClient?: SupabaseClient
  ): Promise<GeneratedEmail> {
    const { customerId, emailType, recipientContactId, customInstructions } = params;

    try {
      // 1. Fetch customer context
      const context = await this.fetchCustomerContext(customerId, recipientContactId, supabaseClient);

      if (!context.customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // 2. Build prompt
      const prompt = buildEmailPrompt(emailType, context, customInstructions);
      const systemPrompt = getEmailSystemPrompt();

      // 3. Call Claude API
      const response = await AnthropicService.generateCompletion({
        prompt,
        systemPrompt,
        maxTokens: 1024,
        temperature: 0.7,
      });

      // 4. Parse email from response
      const parsedEmail = this.parseEmailResponse(response.content);

      // 5. Build final response
      const generatedEmail: GeneratedEmail = {
        subject: parsedEmail.subject,
        body: parsedEmail.body,
        tone: this.detectTone(parsedEmail.body, emailType),
        metadata: {
          emailType,
          customerId,
          recipientContactId,
          generatedAt: new Date(),
          aiModel: response.model,
          tokensUsed: response.tokensUsed.total,
        },
      };

      return generatedEmail;
    } catch (error) {
      console.error('EmailOrchestrationService.generateEmail error:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate email: ${error.message}`);
      }

      throw new Error('Unknown error generating email');
    }
  }

  /**
   * Fetch comprehensive customer context for email generation
   *
   * @param customerId - Customer ID
   * @param recipientContactId - Optional specific contact ID
   * @param supabaseClient - Optional Supabase client
   * @returns Customer context for email generation
   */
  static async fetchCustomerContext(
    customerId: string,
    recipientContactId?: string,
    supabaseClient?: SupabaseClient
  ): Promise<EmailCustomerContext> {
    try {
      // Fetch customer with primary contact
      const customer = await CustomerService.getCustomerById(customerId, supabaseClient);

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Calculate days until renewal
      const daysUntilRenewal = customer.renewal_date
        ? Math.ceil(
            (new Date(customer.renewal_date).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : undefined;

      // Determine health trend
      const healthTrend = this.determineHealthTrend(customer.health_score);

      // Fetch recipient contact if specified
      let recipientContact: Contact | undefined;
      if (recipientContactId && recipientContactId !== customer.primary_contact?.id) {
        // TODO: Fetch specific contact from database
        // For now, use primary contact as fallback
        recipientContact = customer.primary_contact;
      }

      // Build context object
      const context: EmailCustomerContext = {
        customer: customer as Customer,
        primaryContact: customer.primary_contact,
        recipientContact,
        daysUntilRenewal,
        healthTrend,
        // TODO: Fetch recent activity, risks, opportunities from database
        // For Phase 1, use basic data
        recentActivity: [],
        openRisks: this.identifyRisks(customer),
        opportunities: this.identifyOpportunities(customer),
      };

      return context;
    } catch (error) {
      console.error('EmailOrchestrationService.fetchCustomerContext error:', error);
      throw error;
    }
  }

  /**
   * Parse email response from Claude API
   *
   * Expected format:
   * SUBJECT: [subject line]
   *
   * BODY:
   * [email body]
   *
   * @param response - Raw Claude API response
   * @returns Parsed subject and body
   */
  private static parseEmailResponse(response: string): { subject: string; body: string } {
    try {
      // Extract subject
      const subjectMatch = response.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow-up';

      // Extract body (everything after "BODY:" label)
      const bodyMatch = response.match(/BODY:\s*\n([\s\S]+)/i);
      let body = bodyMatch ? bodyMatch[1].trim() : response;

      // Fallback: if no structured format, use entire response as body
      if (!subjectMatch && !bodyMatch) {
        body = response.trim();
      }

      // Clean up body (remove extra whitespace, normalize line breaks)
      body = body.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks

      return { subject, body };
    } catch (error) {
      console.error('Error parsing email response:', error);
      // Fallback to using response as-is
      return {
        subject: 'Follow-up',
        body: response.trim(),
      };
    }
  }

  /**
   * Detect tone from email content
   *
   * @param body - Email body text
   * @param emailType - Email type (provides hint)
   * @returns Detected tone
   */
  private static detectTone(body: string, emailType: EmailType): EmailTone {
    const lowerBody = body.toLowerCase();

    // Check for urgent indicators
    if (
      lowerBody.includes('urgent') ||
      lowerBody.includes('immediate') ||
      lowerBody.includes('asap') ||
      emailType === 'risk_mitigation'
    ) {
      return 'urgent';
    }

    // Check for casual indicators
    if (
      lowerBody.includes('hey') ||
      lowerBody.includes('hope you\'re doing well') ||
      lowerBody.includes('quick question') ||
      emailType === 'qbr_invitation' ||
      emailType === 'expansion_pitch'
    ) {
      return 'casual';
    }

    // Default to formal
    return 'formal';
  }

  /**
   * Determine health trend from health score
   *
   * @param healthScore - Current health score
   * @returns Health trend indicator
   */
  private static determineHealthTrend(
    healthScore?: number
  ): 'improving' | 'stable' | 'declining' | undefined {
    if (healthScore === undefined) return undefined;

    // Simplified logic (TODO: Compare to historical scores)
    if (healthScore >= 80) return 'stable';
    if (healthScore >= 60) return 'stable';
    if (healthScore >= 40) return 'declining';
    return 'declining';
  }

  /**
   * Identify risks from customer data
   *
   * @param customer - Customer data
   * @returns List of risk descriptions
   */
  private static identifyRisks(customer: CustomerWithContact): string[] {
    const risks: string[] = [];

    if (customer.health_score !== undefined && customer.health_score < 60) {
      risks.push(`Low health score: ${customer.health_score}/100`);
    }

    if (customer.renewal_date) {
      const daysUntil = Math.ceil(
        (new Date(customer.renewal_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntil < 30 && daysUntil > 0) {
        risks.push(`Renewal approaching in ${daysUntil} days`);
      }
    }

    if (customer.renewal_stage === 'at_risk') {
      risks.push('Renewal marked as at-risk');
    }

    return risks;
  }

  /**
   * Identify opportunities from customer data
   *
   * @param customer - Customer data
   * @returns List of opportunity descriptions
   */
  private static identifyOpportunities(customer: CustomerWithContact): string[] {
    const opportunities: string[] = [];

    if (customer.health_score !== undefined && customer.health_score >= 80) {
      opportunities.push('High health score indicates expansion opportunity');
    }

    if (customer.current_arr && customer.current_arr >= 100000) {
      opportunities.push('Enterprise-level customer with upsell potential');
    }

    if (customer.account_plan === 'expand') {
      opportunities.push('Account flagged for expansion focus');
    }

    return opportunities;
  }
}
